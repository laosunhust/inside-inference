"""Matched sentence-filtering spike; never modifies website model artifacts."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import time

from inside_inference.model import Model, initialize, canonical
from inside_inference.tokenizer import Tokenizer

ROOT = Path(__file__).resolve().parents[3]
HOME = ROOT / 'data/preparation/lexical-training'
PROMPTS = {
    'familiar': ['a little cat had a red ball.', 'the cat was', 'the dog had a',
                 'ben went to the', 'ann had a', 'the sun was',
                 'the ball is in the', 'i want to play', 'she was happy', 'he had a big'],
    'unfamiliar': ['a giraffe had a', 'the robot was', '你好', 'un éléphant',
                   'the cat met Zorvik.', 'a little cat had a red ball. ありがとう'],
}


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def sentences(text):
    # Retain exact source substrings; quotes/abbreviations can keep spans together.
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


def covered(tokenizer, text):
    return all(tokenizer.tokens[i].kind not in ('byte', 'hex') for i in tokenizer.encode(text).ids)


def write(name, value):
    (HOME/name).write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')


def prepare(source, config, tokenizer):
    import pyarrow.parquet as pq
    rows = []
    for batch in pq.ParquetFile(source).iter_batches(batch_size=4096):
        rows.extend(batch.column('text').to_pylist())
        if len(rows) >= config['train_rows'][1]: break
    corpora, audit = {}, {}
    for split, field in [('train','train_rows'), ('development','development_rows')]:
        lo, hi = config[field]
        originals = rows[lo:hi]
        parts = [s for text in originals for s in sentences(text)]
        lowered = [s.lower() for s in parts]
        chosen = [s for s in lowered if covered(tokenizer, s)]
        ids = [i for text in originals for i in tokenizer.encode(text).ids]
        fallback = sum(tokenizer.tokens[i].kind in ('byte','hex') for i in ids)
        audit[split] = dict(rows=len(originals), positions=len(ids), fallback_positions=fallback,
            fallback_fraction=fallback/len(ids), sentences=len(parts),
            exact_covered=sum(covered(tokenizer,s) for s in parts),
            lowercase_covered=len(chosen), distinct_covered=len(set(chosen)),
            covered_examples=list(dict.fromkeys(chosen))[:12])
        corpora[split] = {'all':lowered, 'covered':chosen}
    dev = set(corpora['development']['all'])
    for arm in ['all','covered']:
        corpora['train'][arm] = [s for s in corpora['train'][arm] if s not in dev]
    audit['distinct_train_after_dedup'] = len(set(corpora['train']['covered']))
    audit['corpus_sha256'] = {split:{arm:hashlib.sha256(canonical(values)).hexdigest()
        for arm,values in arms.items()} for split,arms in corpora.items()}
    return corpora, audit


def main():
    import numpy as np
    import torch
    import yaml
    from inside_inference.tensor_model import TensorModel
    from inside_inference.declarations_generated import ModelArchitecture
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--train', action='store_true')
    args = parser.parse_args()
    started = time.monotonic()
    HOME.mkdir(parents=True, exist_ok=True)
    if (HOME/'admission.json').exists(): raise ValueError('Do not overwrite experiment evidence')
    config = yaml.safe_load((ROOT/'data/preparation/story-models/training.yaml').read_text())
    tokenizer = Tokenizer()
    corpora, audit = prepare(args.source, config, tokenizer)
    for text in PROMPTS['familiar']:
        if not covered(tokenizer,text): raise ValueError('Familiar prompt uses fallback: '+text)
    admission = dict(config=config, prompts=PROMPTS, source_sha256=sha(args.source),
        tokenizer_sha256=tokenizer.manifest_sha256,
        source_code_sha256={str(p.relative_to(ROOT)):sha(p) for p in [Path(__file__),
            ROOT/'inside_inference/tensor_model.py',ROOT/'inside_inference/model.py',ROOT/'inside_inference/tokenizer.py']},
        framing='BOS + lowercased intact sentence + EOS; no word deletion', audit=audit)
    write('admission.json',admission)
    print(json.dumps(audit,indent=2),flush=True)
    if not args.train or audit['distinct_train_after_dedup']<200 or audit['development']['distinct_covered']<20:
        write('result.json',dict(status='audit-only',reason='Training not requested or corpus admission failed'))
        return
    torch.set_num_threads(4)
    all_results = {}
    for arm in ['all','covered']:
        torch.manual_seed(config['seed'])
        model = TensorModel(initialize(ModelArchitecture(**config['architecture']),tokenizer.manifest_sha256,config['seed'])).cuda()
        optimizer = torch.optim.AdamW(model.parameters(),lr=config['learning_rate'],weight_decay=config['weight_decay'])
        streams = [torch.tensor([i for s in corpora[split][arm] for i in [0,*tokenizer.encode(s).ids,1]],
                    dtype=torch.long,device='cuda') for split in ['train','development']]
        length=config['sequence_length']; offsets=torch.arange(length+1,device='cuda')
        rng=np.random.default_rng(config['seed'])
        def batch(stream, positions):
            window=stream[torch.as_tensor(positions,device='cuda')[:,None]+offsets]
            return window[:,:-1],window[:,1:]
        def loss(x,y): return torch.nn.functional.cross_entropy(model(x).reshape(-1,384),y.reshape(-1))
        dx,dy=batch(streams[1],np.linspace(0,len(streams[1])-length-1,config['validation_windows'],dtype=np.int64))
        best=float('inf'); weights=None; best_step=0; metrics=[]
        for step in range(1,config['steps']+1):
            if time.monotonic()-started>1200: raise TimeoutError('20 minute experiment cap')
            x,y=batch(streams[0],rng.integers(0,len(streams[0])-length,size=config['batch']))
            optimizer.zero_grad(set_to_none=True); value=loss(x,y)
            if not torch.isfinite(value): raise ValueError('Nonfinite loss')
            value.backward();norm=torch.nn.utils.clip_grad_norm_(model.parameters(),config['clip_gradient'])
            if not torch.isfinite(norm): raise ValueError('Nonfinite gradient')
            optimizer.step()
            if step%config['validation_interval']==0:
                with torch.no_grad(): validation=loss(dx,dy).item()
                metrics.append(dict(step=step,development_loss=validation))
                print(arm,step,validation,flush=True)
                if validation<best:
                    best,best_step=validation,step
                    weights={k:v.detach().clone() for k,v in model.state_dict().items()}
        model.load_state_dict(weights)
        checkpoint=model.export(dict(kind='trained',seed=config['seed'],step=best_step,
            selection='minimum-development-token-loss',development_loss=best,
            preparation_run_sha256=hashlib.sha256(canonical(admission)).hexdigest(),
            data_sha256=admission['source_sha256'],source_sha256=admission['source_code_sha256']))
        ids=[0,*tokenizer.encode(PROMPTS['familiar'][0]).ids]
        with torch.no_grad(): expected=model(torch.tensor([ids],device='cuda'))[0].cpu().numpy()
        actual=np.asarray(Model(checkpoint).forward(ids)['logits'])
        if not np.allclose(expected,actual,rtol=1e-9,atol=1e-10): raise ValueError('Export parity failed')
        path=HOME/(arm+'.bin');path.write_bytes(gzip.compress(canonical(checkpoint),mtime=0))
        generations=[]
        for group,prompts in PROMPTS.items():
            for prompt in prompts:
                prefix=[0,*tokenizer.encode(prompt).ids]; output=[]
                with torch.no_grad():
                    while len(output)<64 and len(prefix+output)<=config['architecture']['context']:
                        output.append(int(model(torch.tensor([prefix+output],device='cuda'))[0,-1].argmax()))
                        if output[-1]==1:break
                text,note=tokenizer.decode_prefix(output[:-1] if output and output[-1]==1 else output,final=True)
                generations.append(dict(group=group,prompt=prompt,ids=output,text=text,note=note,
                    byte_tokens=sum(tokenizer.tokens[i].kind=='byte' for i in output),
                    repeated_trigrams=len(output)-2-len(set(zip(output,output[1:],output[2:]))) if len(output)>2 else 0))
        result=dict(arm=arm,checkpoint_sha256=sha(path),source_positions=list(map(len,streams)),
            selected_step=best_step,development_loss=best,metrics=metrics,generations=generations,
            export_max_error=float(np.max(np.abs(expected-actual))))
        write(arm+'.json',result);all_results[arm]=result
    write('result.json',dict(status='complete',seconds=time.monotonic()-started,
        summary={arm:{group:dict(cases=len(rows),malformed=sum(r['note'] is not None for r in rows),
            nonempty=sum(bool(r['text'].strip()) for r in rows),byte_tokens=sum(r['byte_tokens'] for r in rows))
            for group in PROMPTS for rows in [[r for r in result['generations'] if r['group']==group]]}
            for arm,result in all_results.items()}))


if __name__=='__main__': main()
