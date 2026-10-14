"""384-ID artifact reader and tokenizer adapter for the shared decoder."""
import gzip
import json
from inside_inference.tokenizer import Tokenizer
from inside_inference.model import Model


def load(descriptor, weights, manifest):
    checkpoint = Model(json.loads(gzip.decompress(weights))).checkpoint
    tokenizer = Tokenizer(raw=manifest)
    if checkpoint['manifest_sha256'] != tokenizer.manifest_sha256:
        raise ValueError('Model/tokenizer mismatch')
    if checkpoint['config'] != descriptor['architecture']:
        raise ValueError('Model architecture differs from catalog')
    return checkpoint, tokenizer


def pieces(tokenizer, ids):
    return [tokenizer.tokens[i].piece if tokenizer.tokens[i].kind in ('word', 'space', 'punctuation')
            else '<' + tokenizer.tokens[i].piece + '>' for i in ids]


def encode(tokenizer, text):
    encoding = tokenizer.encode(text)
    return [0, *encoding.ids], encoding.to_dict()
