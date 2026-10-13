"""Bounded story preparation for the existing inspectable model; no quality gate."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import sys
import time

import numpy as np
import pyarrow.parquet as pq
import torch
import yaml

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from inside_inference.model import Model, initialize, canonical
from inside_inference.tensor_model import TensorModel
from inside_inference.tokenizer import Tokenizer
from inside_inference.declarations_generated import ModelArchitecture


def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--study', type=Path, required=True)
    args = parser.parse_args()
    home = ROOT / 'data/preparation/story-models'
    output = home / 'tiny-story.bin'
    if output.exists():
        raise ValueError('Retain existing evidence; do not overwrite a completed training run')
    config = yaml.safe_load((home / 'training.yaml').read_text())
    parquet = args.study / 'data/stories.parquet'
    source_digest = sha(parquet)
    tokenizer = Tokenizer()
    started = time.time()
    sources = {str(p.relative_to(ROOT)): sha(p) for p in [Path(__file__), ROOT/'inside_inference/tensor_model.py', ROOT/'inside_inference/model.py', ROOT/'inside_inference/tokenizer.py']}
    admission = dict(config=config, source_sha256=sources, parquet_sha256=source_digest,
                     tokenizer_sha256=tokenizer.manifest_sha256, started_unix=started)
    (home/'admission.json').write_text(json.dumps(admission, indent=2)+'\n')
    rows = []
    for batch in pq.ParquetFile(parquet).iter_batches(batch_size=4096):
        rows.extend(batch.column('text').to_pylist())
        if len(rows) >= config['train_rows'][1]:
            break
    streams = []
    for field in ['train_rows', 'development_rows']:
        lo, hi = config[field]
        ids = []
        for text in rows[lo:hi]:
            ids.extend([0, *tokenizer.encode(text).ids, 1])
        streams.append(torch.tensor(ids, dtype=torch.long, device='cuda'))
    torch.manual_seed(config['seed']); torch.set_num_threads(4)
    model = TensorModel(initialize(ModelArchitecture(**config['architecture']), tokenizer.manifest_sha256, config['seed'])).cuda()
    optimizer = torch.optim.AdamW(model.parameters(), lr=config['learning_rate'], weight_decay=config['weight_decay'])
    rng = np.random.default_rng(config['seed'])
    length = config['sequence_length']
    offsets = torch.arange(length+1, device='cuda')
    def batch(stream, positions):
        window = stream[torch.as_tensor(positions, device='cuda')[:,None]+offsets]
        return window[:,:-1], window[:,1:]
    dev_positions = np.linspace(0, len(streams[1])-length-1, config['validation_windows'], dtype=np.int64)
    dev_x, dev_y = batch(streams[1], dev_positions)
    def loss(x,y):
        return torch.nn.functional.cross_entropy(model(x).reshape(-1,384), y.reshape(-1))
    best, best_step, weights = float('inf'), 0, None
    metrics = []
    with torch.no_grad(): initial = loss(dev_x,dev_y).item()
    for step in range(1, config['steps']+1):
        if time.time() > 1791861514: raise TimeoutError('Four-hour goal deadline reached')
        x,y = batch(streams[0], rng.integers(0, len(streams[0])-length, size=config['batch']))
        optimizer.zero_grad(set_to_none=True)
        value = loss(x,y)
        if not torch.isfinite(value): raise ValueError('Nonfinite training loss')
        value.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), config['clip_gradient'])
        if not torch.isfinite(norm): raise ValueError('Nonfinite gradient')
        optimizer.step()
        if step % config['validation_interval'] == 0:
            with torch.no_grad(): validation = loss(dev_x,dev_y).item()
            metrics.append(dict(step=step, train_loss=value.item(), development_loss=validation, seconds=time.time()-started))
            print(json.dumps(metrics[-1]), flush=True)
            if validation < best:
                best,best_step = validation,step
                weights = {k:v.detach().clone() for k,v in model.state_dict().items()}
    model.load_state_dict(weights)
    provenance = dict(kind='trained', seed=config['seed'], preparation_run_sha256=hashlib.sha256(canonical(admission)).hexdigest(),
        step=best_step, selection=config['selection'], development_loss=best, data_sha256=source_digest, source_sha256=sources)
    checkpoint = model.export(provenance)
    # Export validation independently executes the existing scalar reference model.
    ids = [0,*tokenizer.encode('the cat sat on the bed.').ids]
    with torch.no_grad(): expected = model(torch.tensor([ids],device='cuda'))[0].cpu().numpy()
    reference = Model(checkpoint)
    actual = np.asarray(reference.forward(ids)['logits'])
    error = float(np.max(np.abs(expected-actual)))
    if not np.allclose(expected,actual,rtol=1e-9,atol=1e-10): raise ValueError(f'Export mismatch {error}')
    output.write_bytes(gzip.compress(canonical(checkpoint),mtime=0))
    result = dict(initial_development_loss=initial, selected_development_loss=best, selected_step=best_step,
        steps=config['steps'], training_tokens=config['steps']*config['batch']*length,
        source_tokens=list(map(len,streams)), seconds=time.time()-started, export_max_error=error,
        parameter_count=sum(p.numel() for p in model.parameters()), checkpoint_sha256=sha(output), metrics=metrics,
        quality='Not evaluated; inspection fixture, not an intelligence claim')
    (home/'result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='metrics'}),flush=True)


if __name__ == '__main__':
    main()
