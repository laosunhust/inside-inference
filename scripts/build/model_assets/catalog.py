"""Derive model metadata from the actual artifacts; emit one validated catalog."""
import gzip
import hashlib
import json
from pathlib import Path
import shutil
import struct
from scripts import ROOT
from scripts.build.structured import read_yaml
from inside_inference.declarations_generated import ModelCatalog, ModelSources
from inside_inference.model import Model
from scripts.build.model_assets.runtime import build as runtime


def describe(config, root):
    ModelSources.validate_shape(config)
    models=[]
    for entry in config['models']:
        item=dict(entry)
        for field in ['weights','tokenizer']:
            path=root/entry[field]
            raw=path.read_bytes()
            item[field]=dict(path=path.name,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
        if item['runtime']=='naive-python':
            checkpoint=json.loads(gzip.decompress((root/entry['weights']).read_bytes()))
            model=Model(checkpoint)
            def count(x):return sum(map(count,x)) if isinstance(x,list) else 1
            parameters=sum(map(count,checkpoint['parameters'].values()))
            item.update(architecture=checkpoint['config'],parameters=parameters,inspection='tensors',stop_ids=[1],normalization='exact')
            if checkpoint['manifest_sha256']!=item['tokenizer']['sha256']:raise ValueError('Tiny tokenizer mismatch')
        elif item['runtime']=='llama2c-wasm':
            raw=(root/entry['weights']).read_bytes()
            d,f,l,h,k,v,n=struct.unpack('<7i',raw[:28])
            if v!=4096 or k!=h or d%h:raise ValueError('Unsupported llama2.c architecture')
            parameters=v*d+l*(2*d+4*d*d+3*d*f)+d
            expected=28+4*(parameters+n*(d//h))
            if len(raw)!=expected:raise ValueError('Weight payload length differs from architecture')
            item.update(architecture=dict(vocabulary=v,width=d,ffn=f,context=n,layers=l,heads=h,position='rope',normalization='rmsnorm',activation='silu-gated',precision='binary32'),parameters=parameters,inspection='logits',stop_ids=[1,2],normalization='sentencepiece-identity-collapse-spaces')
        else:raise ValueError('Unsupported runtime')
        p=item['parameters']
        item['label']='TinyLLM-'+(f'{p/1e6:.1f}'.rstrip('0').rstrip('.')+'M' if p>=100000 else f'{p/1000:.0f}K')
        models.append(item)
    catalog=dict(storage=config['storage'],models=models)
    ModelCatalog.validate_shape(catalog)
    if len({m['id'] for m in models})!=len(models):raise ValueError('Duplicate model identity')
    return catalog


def package(output, model_storage=None):
    root=ROOT/'data/models/artifacts'
    source=read_yaml(ROOT/'data/models/models.yaml')
    if model_storage is not None: source['storage']=model_storage
    catalog=describe(source,root)
    destination=output/'models';destination.mkdir(parents=True,exist_ok=True)
    (destination/'catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
    for model in catalog['models']:
        for field in ['weights','tokenizer']:
            name=model[field]['path'];shutil.copyfile(root/name,destination/name)
    rt=runtime()
    destination=output/'execution/llama';destination.mkdir(parents=True,exist_ok=True)
    for name in ['llama.mjs','llama.wasm']:shutil.copyfile(rt/name,destination/name)
    shutil.copyfile(ROOT/'data/models/LICENSE-llama2c.txt',destination/'LICENSE.txt')
    return catalog
