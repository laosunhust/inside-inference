"""384-ID artifact reader and tokenizer; numerical execution lives in the shared WASM decoder."""
import gzip
import json
from pathlib import Path
from inside_inference.tokenizer import Tokenizer
from inside_inference.model import Model
_tokenizer = None

def load(raw):
    global _tokenizer
    descriptor=json.loads(raw)
    checkpoint=Model(json.loads(gzip.decompress(Path('/story-weights.bin').read_bytes()))).checkpoint
    tokenizer=Tokenizer(Path('/story-tokenizer.json'))
    if checkpoint['manifest_sha256']!=tokenizer.manifest_sha256:
        raise ValueError('Model/tokenizer mismatch')
    if checkpoint['config']!=descriptor['architecture']:
        raise ValueError('Model architecture differs from catalog')
    _tokenizer=tokenizer
    return json.dumps(checkpoint)

def pieces(raw):
    ids=json.loads(raw)
    return json.dumps([_tokenizer.tokens[i].piece if _tokenizer.tokens[i].kind in ('word','space','punctuation') else '<'+_tokenizer.tokens[i].piece+'>' for i in ids])

def encode(text):
    encoding=_tokenizer.encode(text)
    return json.dumps(dict(ids=[0,*encoding.ids],encoding=encoding.to_dict()))

def decode(raw,final):
    return json.dumps(_tokenizer.decode_prefix(json.loads(raw),final=final))
