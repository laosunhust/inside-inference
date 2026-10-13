"""Package the same Python engine for static browser execution; reuse spike assets."""
import gzip
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from urllib.request import urlopen
import zipfile
from scripts import ROOT
from scripts.build.model_assets.catalog import package as package_models

VERSION = '0.27.7'
CACHE = ROOT/'out/browser-runtime'


def package(output, checkpoint=None, *, download=False, model_storage=None):
    runtime=output/'execution/runtime';runtime.mkdir(parents=True,exist_ok=True)
    package_models(output, model_storage)
    CACHE.mkdir(parents=True,exist_ok=True)
    def asset(name, expected=None):
        path=CACHE/name
        if not path.exists():
            if not download:raise FileNotFoundError('Browser runtime is missing; run make setup')
            with urlopen(f'https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/{name}',timeout=60) as response:
                path.write_bytes(response.read())
        if expected and hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
            raise ValueError('Runtime asset digest mismatch: '+name)
        shutil.copyfile(path,runtime/name)
        return path
    lock=json.loads(asset('pyodide-lock.json').read_text())
    for name in ('pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip'):asset(name)
    seen=set()
    def dependency(name):
        name=name.replace('_','-')
        if name in seen:return
        seen.add(name);entry=lock['packages'][name]
        for child in entry['depends']:dependency(child)
        asset(entry['file_name'],entry['sha256'])
    dependency('jsonschema')
    revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    with zipfile.ZipFile(output/'execution/engine.zip','w',zipfile.ZIP_DEFLATED) as archive:
        def write(name,raw):
            info=zipfile.ZipInfo(name,(2020,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,raw)
        for path in sorted((ROOT/'inside_inference').rglob('*.py')):
            write(path.relative_to(ROOT).as_posix(),path.read_bytes())
        write('data/tokenizer/vocabulary.json',(ROOT/'data/tokenizer/vocabulary.json').read_bytes())
        raw=(ROOT/'data/model/checkpoint.bin').read_bytes() if checkpoint is None else gzip.compress(json.dumps(checkpoint).encode(),mtime=0)
        write('data/model/checkpoint.bin',raw)
        write('build-revision.txt',(revision+'\n').encode())


if __name__=='__main__':
    package(ROOT/'out/browser-setup',download=True)
