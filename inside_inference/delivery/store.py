"""Content-addressed JSON objects. Host storage is not simulated KV residency."""
import hashlib
import copy
from functools import lru_cache
import os
from pathlib import Path
import tempfile

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


class FileStore:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def path(self, key):
        if len(key) != 64 or any(c not in '0123456789abcdef' for c in key):
            raise ValueError('Invalid artifact key')
        path = self.root / (key + '.json')
        if path.is_symlink(): raise ValueError('Artifact path cannot be a symlink')
        return path

    def write(self, key, raw):
        path = self.path(key)
        if path.exists():
            if path.read_bytes() != raw: raise ValueError('Immutable artifact conflict')
            return
        fd, temporary = tempfile.mkstemp(dir=self.root)
        try:
            with os.fdopen(fd, 'wb') as handle: handle.write(raw)
            os.replace(temporary, path)
        finally:
            Path(temporary).unlink(missing_ok=True)

    def read(self, key, schema=None): return self.path(key).read_bytes()


class S3Store:
    """An injected boto3-compatible client; no SDK dependency in numerical code."""
    def __init__(self, client, bucket, prefix='evidence/'):
        self.client, self.bucket, self.prefix = client, bucket, prefix

    def key(self, digest):
        if len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
            raise ValueError('Invalid artifact key')
        return self.prefix + digest + '.json'

    def write(self, key, raw):
        self.client.put_object(Bucket=self.bucket, Key=self.key(key), Body=raw,
                               ContentType='application/json')

    def read(self, key, schema=None):
        try:
            return self.client.get_object(Bucket=self.bucket, Key=self.key(key))['Body'].read()
        except self.client.exceptions.NoSuchKey:
            raise FileNotFoundError('Artifact not found') from None
