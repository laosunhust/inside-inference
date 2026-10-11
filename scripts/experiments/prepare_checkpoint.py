"""Bounded, reproducible checkpoint preparation; no held-out test evaluation."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import random
import resource
import signal
import subprocess
import time

import torch

from scripts import ROOT
from inside_inference.model import canonical, identity, initialize, ModelArchitecture
from inside_inference.preparation import (PreparationModel, prepare_examples, make_optimizer,
    train_step, evaluate, readability_report, save_state, load_state)
from inside_inference.tokenizer import Tokenizer

CONFIG = ROOT / 'data/preparation/pilot.json'


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_bytes(canonical(value) + b'\n')
    temporary.replace(path)


def sources():
    paths = ['inside_inference/preparation.py', 'inside_inference/tensor_model.py', 'inside_inference/model.py',
             'inside_inference/tokenizer.py', 'inside_inference/corpus.py',
             'inside_inference/generation.py', 'inside_inference/declarations_generated.py',
             'scripts/experiments/prepare_checkpoint.py', 'data/corpus/recipe.json',
             'data/tokenizer/vocabulary.json', 'requirements-preparation.txt',
             'docs/implementation/checkpoint-pilot.md', 'docs/implementation/checkpoint-multiword.md',
             'governance/evaluations/records/2026-10/readable-multiword-checkpoint.yaml']
    return {path: hashlib.sha256((ROOT/path).read_bytes()).hexdigest() for path in paths}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=CONFIG)
    parser.add_argument('--output', type=Path, default=ROOT/'out/experiments/model-preparation/pilot')
    parser.add_argument('--resume', type=Path, help='Resume a trusted local preparation state')
    parser.add_argument('--deadline', required=True, help='UTC ISO timestamp; stop before this absolute deadline')
    args = parser.parse_args()
    deadline = datetime.fromisoformat(args.deadline.replace('Z', '+00:00'))
    if deadline.tzinfo is None:
        parser.error('Deadline needs an explicit timezone')
    if deadline.timestamp() - time.time() < 120:
        parser.error('Less than two minutes remain before deadline')
    config = json.loads(args.config.read_text())
    if config['device'] != 'cpu' or config['dtype'] != 'float64':
        raise ValueError('Pilot supports deterministic CPU binary64 only')
    torch.set_num_threads(config['threads'])
    torch.use_deterministic_algorithms(True)
    torch.manual_seed(config['seed'])
    sampler = random.Random(config['seed'])
    tokenizer = Tokenizer()
    budget = config.get('evaluation_budget', 8)
    examples = prepare_examples(config.get('target_policy', 'original'), budget)
    checkpoint = initialize(ModelArchitecture(), tokenizer.manifest_sha256, config['seed'])
    model = PreparationModel(checkpoint)
    optimizer = make_optimizer(model, config)
    metadata = {'config':config, 'architecture':checkpoint['config'],
        'tokenizer_sha256':tokenizer.manifest_sha256, 'data_sha256':identity(examples),
        'source_sha256':sources(), 'python':platform.python_version(), 'torch':str(torch.__version__)}
    run_identity = identity(metadata)
    output = args.output.resolve()
    if not output.is_relative_to((ROOT/'out/experiments').resolve()):
        parser.error('Preparation artifacts must stay under out/experiments')
    if output.exists() and any(output.iterdir()) and not args.resume:
        parser.error('Output is not empty; choose a new output or explicitly resume')
    output.mkdir(parents=True, exist_ok=True)
    step, best_loss = 0, float('inf')
    if args.resume:
        step = load_state(args.resume, model, optimizer, sampler, run_identity)
        if (output/'best.json').exists():
            best_loss = json.loads((output/'best.json').read_text())['development_loss']
    write_json(output/'run.json', dict(metadata, run_identity=run_identity,
        started_at=datetime.now(timezone.utc).isoformat(), deadline=deadline.isoformat(),
        git_revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        git_dirty=bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True)),
        resume_from=str(args.resume) if args.resume else None))
    write_json(output/'examples.json', examples)
    # Keep exact uncommitted preparation sources alongside their identities.
    for name, expected in metadata['source_sha256'].items():
        raw = (ROOT/name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != expected:
            raise ValueError('Source changed while establishing the run')
        target = output/'sources'/name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    write_json(output/'sources/pilot.json', config)
    stop_requested = []
    def stop(signum, _frame): stop_requested.append(signum)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    began, initial_step, presented = time.monotonic(), step, 0
    pad = tokenizer.token_id('control','PAD')
    def checkpoint_and_evaluate():
        nonlocal best_loss
        report = evaluate(model, examples['development'], tokenizer, budget)
        if 'readability_criteria' in config:
            report = readability_report(report, examples['development'], tokenizer, config['readability_criteria'])
        report.update(step=step, elapsed_seconds=time.monotonic()-began,
            peak_rss_bytes=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
            token_presentations_this_segment=presented)
        write_json(output/f'development-{step:06d}.json',report)
        with (output/'metrics.jsonl').open('a') as handle:
            handle.write(json.dumps({k:v for k,v in report.items() if k!='records'})+'\n')
        save_state(output/'latest.pt',model,optimizer,sampler,step,run_identity)
        if report['loss'] < best_loss:
            best_loss = report['loss']
            save_state(output/'best.pt',model,optimizer,sampler,step,run_identity)
            provenance = {'kind':'trained', 'seed':config['seed'],
                'preparation_run_sha256':run_identity, 'step':step,
                'selection':'minimum-development-response-loss', 'development_loss':best_loss,
                'data_sha256':metadata['data_sha256'], 'source_sha256':metadata['source_sha256']}
            if step == 0:
                provenance = checkpoint['provenance']
            write_json(output/'checkpoint.json',model.export(provenance))
            write_json(output/'best.json',{'step':step,'development_loss':best_loss,
                'checkpoint_sha256':identity(model.export(provenance))})
        print(json.dumps({k:v for k,v in report.items() if k!='records'}),flush=True)
        return report
    report = checkpoint_and_evaluate()
    last_evaluation = step
    reason = 'max_steps'
    while step < config['max_steps']:
        if stop_requested:
            reason = 'signal'; break
        if time.time() >= deadline.timestamp()-60:
            reason = 'absolute_deadline'; break
        if time.monotonic()-began >= config['max_seconds']:
            reason = 'wall_budget'; break
        batch = [examples['train'][sampler.randrange(len(examples['train']))]
                 for _ in range(config['batch_size'])]
        loss = train_step(model,optimizer,batch,pad)
        presented += sum(len(e['prompt_ids'])+len(e['response_ids'])-1 for e in batch)
        step += 1
        if step % config['evaluation_interval'] == 0:
            report = checkpoint_and_evaluate()
            last_evaluation = step
    if step != last_evaluation:
        report = checkpoint_and_evaluate()
    write_json(output/'completion.json',{'status':'finished','reason':reason,'step':step,
        'segment_steps':step-initial_step,'elapsed_seconds':time.monotonic()-began,
        'token_presentations':presented,'peak_rss_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
        'best':json.loads((output/'best.json').read_text()),'test_split_evaluated':False})


if __name__ == '__main__': main()
