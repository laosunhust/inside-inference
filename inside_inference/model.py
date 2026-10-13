"""Explicit decoder blocks with layer-owned parameters and KV state. Observations capture executed values."""
from inside_inference.declarations_generated import operation_for
from dataclasses import asdict
from inside_inference.declarations_generated import ModelArchitecture, InitializationProvenance, TrainingProvenance, KVState
import gzip
from pathlib import Path
import hashlib
import json
import math
import random


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
                      allow_nan=False).encode('utf-8')


def identity(value):
    return hashlib.sha256(canonical(value)).hexdigest()


DEFAULT_CHECKPOINT = Path(__file__).resolve().parents[1] / 'data/model/checkpoint.bin'


def default_checkpoint():
    """Load the shipped checkpoint (gzip JSON); never initialize replacement weights."""
    checkpoint = json.loads(gzip.decompress(DEFAULT_CHECKPOINT.read_bytes()))
    Model(checkpoint)
    return checkpoint


SHARED_PARAMETERS = frozenset(('token_embedding', 'position_embedding', 'lm_head',
                               'lm_bias', 'ln_final_scale', 'ln_final_bias'))


def parameter_shapes(c):
    d, f = c.width, c.ffn
    shapes = {'token_embedding': [c.vocabulary, d], 'position_embedding': [c.context, d],
              'ff_up': [d, f], 'ff_up_bias': [f], 'ff_down': [f, d],
              'ff_down_bias': [d], 'lm_head': [d, c.vocabulary], 'lm_bias': [c.vocabulary]}
    for name in ('query', 'key', 'value', 'attention_output'):
        shapes[name] = [d, d]
        shapes[name + '_bias'] = [d]
    for name in ('ln1', 'ln2', 'ln_final'):
        shapes[name + '_scale'] = [d]
        shapes[name + '_bias'] = [d]
    return {name: ([c.layers] + dims if name not in SHARED_PARAMETERS else dims)
            for name, dims in shapes.items()}


def shape(value):
    if not isinstance(value, list):
        return []
    return [len(value)] + (shape(value[0]) if value else [])


def validate_array(value, expected):
    if expected:
        return (isinstance(value, list) and len(value) == expected[0]
                and all(validate_array(v, expected[1:]) for v in value))
    return type(value) in (int, float) and math.isfinite(value)


def initialize(config, manifest_sha256, seed=7):
    if type(seed) is not int or not 0 <= seed <= 2**32 - 1:
        raise ValueError('seed must be an integer in [0, 2**32 - 1]')
    rng = random.Random(seed)
    def make(name, dims):
        if dims:
            return [make(name, dims[1:]) for _ in range(dims[0])]
        if name.endswith('_scale'):
            return 1.0
        if name.endswith('_bias'):
            return 0.0
        return rng.uniform(-0.2, 0.2)
    return {'format': 'naive-gpt-checkpoint-v2', 'config': asdict(config),
            'manifest_sha256': manifest_sha256,
            'provenance': {'kind': 'untrained', 'seed': seed, 'initializer': 'python-random-uniform-v1'},
            'parameters': {k: make(k, dims) for k, dims in parameter_shapes(config).items()}}


def softmax(row):
    peak = max(row)
    exponentials = [math.exp(x - peak) for x in row]
    total = sum(exponentials)
    return [x / total for x in exponentials]




class Model:
    def __init__(self, checkpoint):
        # Detach from the caller so changing an input dictionary cannot mutate a run.
        self.checkpoint = json.loads(canonical(checkpoint))
        if set(checkpoint) != {'format', 'config', 'manifest_sha256', 'provenance', 'parameters'}:
            raise ValueError('Invalid checkpoint fields')
        if checkpoint['format'] != 'naive-gpt-checkpoint-v2':
            raise ValueError('Unsupported checkpoint format')
        provenance = checkpoint['provenance']
        if not isinstance(provenance, dict) or provenance.get('kind') not in ('untrained', 'trained'):
            raise ValueError('Unsupported checkpoint provenance')
        provenance_type = InitializationProvenance if provenance['kind'] == 'untrained' else TrainingProvenance
        provenance_type.from_dict(provenance)
        self.config = ModelArchitecture.from_dict(checkpoint['config'])
        implemented = {'heads':1, 'position':'learned-absolute',
                       'normalization':'pre-layernorm', 'activation':'gelu-tanh', 'precision':'binary64'}
        if any(getattr(self.config,k) != value for k,value in implemented.items()):
            raise ValueError('Declared architecture has no execution implementation')
        self.parameters = self.checkpoint['parameters']
        expected = parameter_shapes(self.config)
        if set(self.parameters) != set(expected) or any(
                not validate_array(self.parameters[k], dims) for k, dims in expected.items()):
            raise ValueError('Invalid parameter shapes or nonfinite values')
        self.sha256 = identity(self.checkpoint)

    def forward(self, ids, *, capture=True, request_id='request-0', run_id='standalone', step=0):
        return self._forward(ids, capture=capture, request_id=request_id, run_id=run_id, step=step)

    def forward_cached(self, ids, state=None, *, capture=True, request_id='request-0', run_id='standalone', step=0, work_id=None):
        """Execute only new positions against an immutable, identified K/V prefix."""
        if state is None:
            state = KVState(checkpoint_sha256=self.sha256,
                tokenizer_sha256=self.checkpoint['manifest_sha256'], token_ids=(),
                keys=tuple(() for _ in range(self.config.layers)),
                values=tuple(() for _ in range(self.config.layers)))
        elif not isinstance(state, KVState):
            state = KVState.from_dict(state)
        state.validate_bound(state.to_dict())
        if (state.checkpoint_sha256 != self.sha256
                or state.tokenizer_sha256 != self.checkpoint['manifest_sha256']):
            raise ValueError('KV state computation identity differs')
        if any(not validate_array(rows, [self.config.layers, len(state.token_ids), self.config.width])
               for rows in (state.to_dict()['keys'], state.to_dict()['values'])):
            raise ValueError('KV state shape or finiteness differs')
        return self._forward(ids, state=state, capture=capture, request_id=request_id, run_id=run_id, step=step, work_id=work_id)

    def _forward(self, ids, **options):
        from inside_inference.runtimes.component import forward
        return forward(self, ids, **options)
