"""Content-addressed JSON objects. Host storage is not simulated KV residency."""
import hashlib
import copy
from functools import lru_cache

from inside_inference.contract_runtime import decode_json
from inside_inference.declarations_generated import ArtifactReference, ArtifactResponse, MODELS
from inside_inference.model import canonical


@lru_cache(maxsize=32)
def _decoded(schema, raw):
    # Cache successful validation by exact bytes, never by a claimed digest.
    value = decode_json(raw.decode('utf-8'))
    MODELS[schema].validate_shape(value)
    return value


def verify(reference, raw):
    ArtifactReference.validate_shape(reference)
    if hashlib.sha256(raw).hexdigest() != reference['sha256']:
        raise ValueError('Artifact digest mismatch')
    return copy.deepcopy(_decoded(reference['schema'], raw))


def put(store, schema, value):
    raw = canonical(value)
    _decoded(schema, raw)
    reference = {'schema': schema, 'sha256': hashlib.sha256(raw).hexdigest()}
    ArtifactReference.validate_shape(reference)
    store.write(reference['sha256'], raw)
    return reference


def get(store, reference):
    ArtifactReference.validate_shape(reference)
    raw = store.read(reference['sha256'], reference['schema'])
    return verify(reference, raw)


def response(store, reference):
    value = get(store, reference)
    result = {'reference': reference, 'content': canonical(value).decode()}
    ArtifactResponse.validate_shape(result)
    return result


class MemoryStore:
    def __init__(self): self.objects = {}
    def write(self, key, raw): self.objects.setdefault(key, raw)
    def read(self, key, schema=None):
        try: return self.objects[key]
        except KeyError: raise FileNotFoundError('Artifact not found') from None
