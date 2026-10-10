"""Shared implementation identity and observed backend evidence for replay."""
import hashlib
from pathlib import Path
import platform
import subprocess
from inside_inference.declarations_generated import ExecutionBackend, ExecutionProvenance
from inside_inference.model import identity

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ('model.py', 'generation.py', 'tokenizer.py', 'declarations.py',
           'declarations_generated.py', 'contract_runtime.py', 'workload.py',
           'cache_lab.py', 'kv_runtime.py', 'cuda_runtime.py', 'tensor_model.py', 'provenance.py')


def source_inventory():
    return {'inside_inference/'+name: hashlib.sha256((ROOT/'inside_inference'/name).read_bytes()).hexdigest()
            for name in SOURCES}


def source_identity():
    return identity(source_inventory())


def reference_backend():
    return ExecutionBackend(compute_device='CPU scalar reference',
        device_state_storage='No retained KV state; full-prefix recomputation',
        host_state_storage='Python objects in system DRAM',
        library='Python '+platform.python_version(), precision='binary64').to_dict()


def revision():
    return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()


def execution_provenance(backend=None):
    sources = source_inventory()
    return ExecutionProvenance(revision=revision(),
        sources=sources, source_sha256=identity(sources), python=platform.python_version(),
        backend=ExecutionBackend.from_dict(reference_backend() if backend is None else backend)).to_dict()


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
