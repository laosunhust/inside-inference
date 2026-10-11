"""Prepare a self-contained static spike; downloads are pinned and recorded."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from urllib.request import urlopen
import zipfile
from scripts import ROOT
from scripts.experiments.browser_spike.cases import native

VERSION='0.27.7'  # CPython 3.12 line, closest to the existing native reference runtime.
OUTPUT=ROOT/'out/experiments/browser-spike'


def prepare():
    site=OUTPUT/'site';runtime=site/'runtime';runtime.mkdir(parents=True,exist_ok=True)
    base=f'https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/'
    def download(name, expected=None):
        path=runtime/name
        if not path.exists():
            with urlopen(base+name,timeout=60) as response:path.write_bytes(response.read())
        if expected and hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
            raise ValueError(f'Pinned package digest mismatch: {name}')
        return path
    lock=json.loads(download('pyodide-lock.json').read_text())
    for name in ('pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip'):
        download(name)
    visited=set()
    def package(name):
        name=name.replace("_","-")
        if name in visited:return
        visited.add(name);entry=lock['packages'][name]
        for dependency in entry['depends']:package(dependency)
        download(entry['file_name'],entry['sha256'])
    package('jsonschema')
    revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    with zipfile.ZipFile(site/'engine.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted((ROOT/'inside_inference').rglob('*.py')):
            archive.write(path,path.relative_to(ROOT))
        for name in ('data/model/checkpoint.bin','data/tokenizer/vocabulary.json'):
            archive.write(ROOT/name,name)
        archive.writestr('build-revision.txt',revision+'\n')
        archive.write(Path(__file__).with_name('cases.py'),'spike_cases.py')
    for name in ('worker.mjs','page.mjs'):
        shutil.copyfile(Path(__file__).with_name(name),site/name)
    (site/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Browser execution spike</title><p id="status">Starting feasibility checks</p><script type="module" src="page.mjs"></script>')
    inventory={str(p.relative_to(site)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
               for p in sorted(site.rglob('*')) if p.is_file()}
    (OUTPUT/'assets.json').write_text(json.dumps({'pyodide':VERSION,'packages':{n:lock['packages'][n]['version'] for n in sorted(visited)},'files':inventory},indent=2))
    native(OUTPUT/'native')
    print(f'Prepared {site}; {sum(v["bytes"] for v in inventory.values())} static asset bytes',flush=True)


if __name__=='__main__':prepare()
