"""Compile the shared decoder and pinned upstream SentencePiece tokenizer."""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
from urllib.request import urlopen
from scripts import ROOT

REVISION = '350e04fe35433e6d2941dce5a1f53308f87058eb'
EMSDK_VERSION = '4.0.20'
CACHE = ROOT/'out/model-runtime'
SDK = ROOT/'references/emsdk'


def build(*, setup=False):
    CACHE.mkdir(parents=True, exist_ok=True)
    source = CACHE/'run.c'
    url = f'https://raw.githubusercontent.com/karpathy/llama2.c/{REVISION}/run.c'
    if not source.exists():
        if not setup: raise FileNotFoundError('Model runtime source unavailable; run make setup')
        with urlopen(url, timeout=60) as response: source.write_bytes(response.read())
    expected = '9c4f2d5c6ae01b71726d1cc37530d71e60bff0ec7cc012565f16a43c1ca658bd'
    if hashlib.sha256(source.read_bytes()).hexdigest() != expected:
        raise ValueError('Upstream llama2.c source digest mismatch')
    bridge = ROOT/'inside_inference/runtimes/engine.c'
    decoder = ROOT/'inside_inference/runtimes/decoder.h'
    fingerprint = hashlib.sha256(source.read_bytes()+bridge.read_bytes()+decoder.read_bytes()+EMSDK_VERSION.encode()+Path(__file__).read_bytes()).hexdigest()
    stamp = CACHE/'fingerprint.txt'
    if stamp.exists() and stamp.read_text()==fingerprint and all((CACHE/n).exists() for n in ['llama.mjs','llama.wasm']):return CACHE
    compiler = SDK/'upstream/emscripten/emcc'
    if setup:
        if not SDK.exists():subprocess.run(['git','clone','--depth','1','https://github.com/emscripten-core/emsdk.git',str(SDK)],check=True)
        subprocess.run([str(SDK/'emsdk'),'install',EMSDK_VERSION],check=True)
        subprocess.run([str(SDK/'emsdk'),'activate',EMSDK_VERSION],check=True)
    if not compiler.exists():raise FileNotFoundError('Model runtime compiler unavailable; run make setup')
    shutil.copyfile(bridge,CACHE/'bridge.c')
    shutil.copyfile(decoder,CACHE/'decoder.h')
    text=source.read_text()
    tokenizer=text[text.index('typedef struct {',text.index('// The Byte Pair Encoding')):text.index('// The Sampler')]
    (CACHE/'tokenizer.c').write_text(tokenizer)
    subprocess.run([str(compiler),str(CACHE/'bridge.c'),'-O3','-msimd128','-sMODULARIZE=1','-sEXPORT_ES6=1',
        '-sALLOW_MEMORY_GROWTH=1','-sENVIRONMENT=web,worker,node',
        '-sEXPORTED_FUNCTIONS=["_configure","_tie_head","_allocate_weight","_load_tokenizer","_step_flops","_key_rows","_value_rows","_trace_count","_trace_name","_trace_layer","_trace_length","_trace_data","_tokenize","_step","_piece","_vocab_piece","_malloc","_free"]',
        '-sEXPORTED_RUNTIME_METHODS=["FS","ccall","UTF8ToString","HEAPF64","HEAPF32","HEAP32","HEAPU8"]',
        '-o',str(CACHE/'llama.mjs')],check=True)
    stamp.write_text(fingerprint)
    return CACHE


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--setup',action='store_true')
    print(build(setup=parser.parse_args().setup))
