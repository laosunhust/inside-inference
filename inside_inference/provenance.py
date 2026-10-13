"""Shared implementation identity and observed backend evidence for replay."""
import hashlib
from pathlib import Path
import platform
import subprocess
import sys
from inside_inference.declarations_generated import ExecutionBackend, ExecutionProvenance
from inside_inference.model import identity

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ('model.py', 'generation.py', 'tokenizer.py',
           'declarations_generated.py', 'contract_runtime.py',
           'cache_lab.py', 'kv_runtime.py', 'provenance.py', 'runtimes/component.py')


def source_inventory():
    paths=['inside_inference/'+name for name in SOURCES]
    paths += (['inside_inference/runtimes/engine.c','inside_inference/runtimes/decoder.h',
               'web/execution/component-engine.js','web/execution/decoder.js','web/execution/observations.js',
               'execution/llama/llama.wasm'] if sys.platform == 'emscripten' else ['inside_inference/runtimes/reference.py'])
    return {name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in paths}


def packaged_revision(root):
    # Release packaging supplies the label; source_inventory still hashes actual code.
    value = (root/'build-revision.txt').read_text().strip()
    if not value: raise ValueError('Packaged revision label is empty')
    return value


def revision():
    if (ROOT/'.git').exists():
        return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    return packaged_revision(ROOT)


def execution_provenance(backend):
    sources = source_inventory()
    return ExecutionProvenance(revision=revision(),
        sources=sources, source_sha256=identity(sources), python=platform.python_version(),
        backend=ExecutionBackend.from_dict(backend)).to_dict()


def stable_provenance(value):
    # Git commit labels may change without changing any executing source bytes.
    return {k:v for k,v in value.items() if k != 'revision'}


def validate_provenance(value, *, replay=False, backend=None):
    ExecutionProvenance.validate_shape(value)
    if identity(value['sources']) != value['source_sha256']:
        raise ValueError('Provenance source inventory does not match its digest')
    if replay:
        if value['sources'] != source_inventory() or value['python'] != platform.python_version():
            raise ValueError('Replay requires the recorded execution sources and Python version')
        if backend is not None and value['backend'] != backend:
            raise ValueError('Replay backend differs from recorded execution')
