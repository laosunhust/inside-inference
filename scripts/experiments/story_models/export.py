"""Export retained seed1337 checkpoints and original FP32 numerical references."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys

import numpy as np
import sentencepiece as spm
from sentencepiece import sentencepiece_model_pb2
import torch

ROOT=Path(__file__).resolve().parents[3]
REVISION='350e04fe35433e6d2941dce5a1f53308f87058eb'
PROMPTS=['Once upon a time, a little rabbit found a red ball.', 'a  cat\n sat', 'hello café 你好']


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--study',type=Path,required=True)
    study=parser.parse_args().study
    if subprocess.check_output(['git','-C',str(study/'upstream'),'rev-parse','HEAD'],text=True).strip()!=REVISION:raise ValueError('Wrong upstream revision')
    sys.path.insert(0,str(study/'upstream'))
    from model import Transformer,ModelArgs
    from export import legacy_export
    torch.set_num_threads(4)
    artifacts=ROOT/'data/models/artifacts';artifacts.mkdir(parents=True,exist_ok=True)
    evidence=ROOT/'data/preparation/story-models'
    sp=spm.SentencePieceProcessor(model_file=str(study/'data/tok4096.model'))
    proto=sentencepiece_model_pb2.ModelProto();proto.ParseFromString((study/'data/tok4096.model').read_bytes())
    normalizer=proto.normalizer_spec
    if normalizer.name!='identity' or normalizer.precompiled_charsmap or not all([normalizer.add_dummy_prefix,normalizer.remove_extra_whitespaces,normalizer.escape_whitespaces]):raise ValueError('Unsupported tokenizer normalization')
    rows=[sp.id_to_piece(i).replace('▁',' ').encode() for i in range(sp.vocab_size())]
    with (artifacts/'tokenizer-4096.bin').open('wb') as f:
        f.write(struct.pack('<I',max(map(len,rows))))
        for i,b in enumerate(rows):f.write(struct.pack('<fI',sp.get_score(i),len(b)));f.write(b)
    numerical=[];metadata=[];sources={}
    for variant,name in [('tiny','tinyllm-500k'),('baseline','tinyllm-4m')]:
        path=study/'artifacts'/f'{variant}-1337/latest.pt'
        sources[name]=hashlib.sha256(path.read_bytes()).hexdigest()
        ck=torch.load(path,map_location='cpu',weights_only=False)
        if ck['step']!=65536:raise ValueError('Incomplete source checkpoint')
        m=Transformer(ModelArgs(**ck['model_args']));m.load_state_dict(ck['model']);m.eval()
        filename='tinyllm-0.5m.bin' if variant=='tiny' else 'tinyllm-4m.bin'
        legacy_export(m,str(artifacts/filename))
        for prompt in PROMPTS:
            ids=sp.encode(prompt,add_bos=True)
            with torch.inference_mode():logits=m(torch.tensor([ids]))[0,-1].numpy().astype('<f4')
            metadata.append(dict(model_id=name,prompt=prompt,ids=ids,logit_offset=sum(len(x) for x in numerical),logit_count=len(logits)))
            numerical.append(logits)
    np.concatenate(numerical).astype('<f4').tofile(evidence/'logits.bin')
    edge_cases=['',' ', '  a  ', 'a\tb', '\n  a','a\u00a0 b','<s>hello</s>','▁cat','é🙂', 'a\r\nb']
    metadata=dict(cases=metadata, tokenizer_cases=[dict(text=t,ids=sp.encode(t,add_bos=True)) for t in edge_cases],upstream_revision=REVISION,source_checkpoints=sources,tokenizer_sha256=hashlib.sha256((study/'data/tok4096.model').read_bytes()).hexdigest(),normalizer=dict(name=normalizer.name,add_dummy_prefix=normalizer.add_dummy_prefix,remove_extra_whitespaces=normalizer.remove_extra_whitespaces,escape_whitespaces=normalizer.escape_whitespaces))
    (evidence/'export.json').write_text(json.dumps(metadata,indent=2)+'\n')


if __name__=='__main__':main()
