"""One explicit, uncached decoder block. Observations capture executed values."""
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
    return shapes


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
    return {'format': 'naive-gpt-checkpoint-v1', 'config': asdict(config),
            'manifest_sha256': manifest_sha256,
            'provenance': {'kind': 'untrained', 'seed': seed, 'initializer': 'python-random-uniform-v1'},
            'parameters': {k: make(k, dims) for k, dims in parameter_shapes(config).items()}}


def softmax(row):
    peak = max(row)
    exponentials = [math.exp(x - peak) for x in row]
    total = sum(exponentials)
    return [x / total for x in exponentials]


def linear(x, weight, bias):
    return [[sum(a * b for a, b in zip(row, column)) + offset
             for column, offset in zip(zip(*weight), bias)] for row in x]


def add(a, b):
    return [[x + y for x, y in zip(ar, br)] for ar, br in zip(a, b)]


class Model:
    def __init__(self, checkpoint):
        # Detach from the caller so changing an input dictionary cannot mutate a run.
        self.checkpoint = json.loads(canonical(checkpoint))
        if set(checkpoint) != {'format', 'config', 'manifest_sha256', 'provenance', 'parameters'}:
            raise ValueError('Invalid checkpoint fields')
        if checkpoint['format'] != 'naive-gpt-checkpoint-v1':
            raise ValueError('Unsupported checkpoint format')
        provenance = checkpoint['provenance']
        if not isinstance(provenance, dict) or provenance.get('kind') not in ('untrained', 'trained'):
            raise ValueError('Unsupported checkpoint provenance')
        provenance_type = InitializationProvenance if provenance['kind'] == 'untrained' else TrainingProvenance
        provenance_type.from_dict(provenance)
        self.config = ModelArchitecture.from_dict(checkpoint['config'])
        implemented = {'layers':1, 'heads':1, 'position':'learned-absolute',
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
                tokenizer_sha256=self.checkpoint['manifest_sha256'], token_ids=(), keys=(), values=())
        elif not isinstance(state, KVState):
            state = KVState.from_dict(state)
        state.validate_bound(state.to_dict())
        if (state.checkpoint_sha256 != self.sha256
                or state.tokenizer_sha256 != self.checkpoint['manifest_sha256']):
            raise ValueError('KV state computation identity differs')
        if any(not validate_array(rows, [len(state.token_ids), self.config.width])
               for rows in (state.to_dict()['keys'], state.to_dict()['values'])):
            raise ValueError('KV state shape or finiteness differs')
        return self._forward(ids, state=state, capture=capture, request_id=request_id, run_id=run_id, step=step, work_id=work_id)

    def _forward(self, ids, *, state=None, capture=True, request_id='request-0', run_id='standalone', step=0, work_id=None):
        ids = list(ids)
        c, p = self.config, self.parameters
        offset = len(state.token_ids) if state is not None else 0
        total = offset + len(ids)
        if not ids or total > c.context or any(type(i) is not int or not 0 <= i < c.vocabulary for i in ids):
            raise ValueError('Forward requires 1..context valid token IDs')
        nodes = []
        prefix = (work_id or f'{run_id}/step-{step}') + '/'
        def observe(name, value, inputs, formula, layer=0, axes=None, positions=None):
            operation=operation_for(name)
            if capture:
                nodes.append(dict(id=prefix + name, operation=operation, layer=layer,
                    request_id=request_id, run_id=run_id, step=step,
                    positions=list(range(offset, total)) if positions is None else positions, shape=shape(value),
                    dtype='bool' if name == 'causal_mask' else 'int' if name == 'input_ids' else 'binary64',
                    inputs=[i if i.startswith(('parameter:', 'state:')) else prefix + i for i in inputs],
                    formula=formula, axes=axes or ['position', 'channel'], values=value))
            return value
        def dense(name, x, source, weight, layer=0):
            return observe(name, linear(x, p[weight], p[weight + '_bias']),
                [source, 'parameter:' + weight, 'parameter:' + weight + '_bias'],
                'X @ W + bias', layer=layer)
        def norm(name, x, source):
            means = [[sum(row) / c.width] for row in x]
            variances = [[sum((a - mean[0]) ** 2 for a in row) / c.width]
                         for row, mean in zip(x, means)]
            layer = None if name == 'ln_final' else 0
            observe(name + '_mean', means, [source], 'mean(X, channels)', layer=layer)
            observe(name + '_variance', variances, [source, name + '_mean'], 'mean((X - mean)^2, channels)', layer=layer)
            normalized = [[(a - mean[0]) / math.sqrt(var[0] + c.epsilon) * scale + bias
                for a, scale, bias in zip(row, p[name + '_scale'], p[name + '_bias'])]
                for row, mean, var in zip(x, means, variances)]
            return observe(name, normalized,
                [source, name + '_mean', name + '_variance', 'parameter:' + name + '_scale',
                 'parameter:' + name + '_bias'], '(X - mean) / sqrt(variance + epsilon) * scale + bias', layer=layer)
        observe('input_ids', ids, [], 'IDs supplied to this forward pass', layer=None, axes=['position'])
        token = observe('token_embedding', [p['token_embedding'][i][:] for i in ids],
                        ['input_ids', 'parameter:token_embedding'], 'E[token_id]', layer=None)
        position = observe('position_embedding', [row[:] for row in p['position_embedding'][offset:total]],
                           ['parameter:position_embedding'], 'P[absolute_position]', layer=None)
        x = observe('embedding', add(token, position), ['token_embedding', 'position_embedding'],
                    'token embedding + position embedding', layer=None)
        normalized = norm('ln1', x, 'embedding')
        q, k, v = [dense(name, normalized, 'ln1', name) for name in ('query', 'key', 'value')]
        key_source, value_source = 'key', 'value'
        if state is not None:
            source = 'state:' + identity(state.to_dict())
            k = observe('retained_keys', [list(row) for row in state.keys] + k,
                [source, 'key'], 'concatenate(cached K, new K)',
                positions=list(range(total)))
            v = observe('retained_values', [list(row) for row in state.values] + v,
                [source, 'value'], 'concatenate(cached V, new V)',
                positions=list(range(total)))
            key_source, value_source = 'retained_keys', 'retained_values'
        scores = observe('scores', [[sum(a * b for a, b in zip(qr, kr)) / math.sqrt(c.width)
                         for kr in k] for qr in q], ['query', key_source], 'Q @ K^T / sqrt(width)',
                         axes=['query position', 'key position'])
        mask = observe('causal_mask', [[j <= i for j in range(total)] for i in range(offset, total)],
                       ['input_ids'], 'key_position <= query_position', axes=['query position', 'key position'])
        probabilities = []
        for row, allowed in zip(scores, mask):
            visible = softmax([s for s, ok in zip(row, allowed) if ok])
            probabilities.append(visible + [0.0] * (total - len(visible)))
        probabilities = observe('attention', probabilities, ['scores', 'causal_mask'],
                                'softmax(scores where allowed; -infinity elsewhere)',
                                axes=['query position', 'key position'])
        weighted = observe('weighted_values', [[sum(probabilities[i][j] * v[j][a] for j in range(total))
                            for a in range(c.width)] for i in range(len(ids))],
                            ['attention', value_source], 'attention @ V')
        projected = dense('attention_output', weighted, 'weighted_values', 'attention_output')
        residual = observe('attention_residual', add(x, projected), ['embedding', 'attention_output'], 'X + attention output')
        hidden = norm('ln2', residual, 'attention_residual')
        up = dense('ff_up', hidden, 'ln2', 'ff_up')
        activated = observe('gelu', [[0.5 * a * (1 + math.tanh(math.sqrt(2 / math.pi) * (a + 0.044715 * a**3)))
                                    for a in row] for row in up], ['ff_up'],
                            '0.5*x*(1+tanh(sqrt(2/pi)*(x+0.044715*x^3)))')
        down = dense('ff_down', activated, 'gelu', 'ff_down')
        residual = observe('ff_residual', add(residual, down), ['attention_residual', 'ff_down'], 'residual + feed-forward output')
        final = norm('ln_final', residual, 'ff_residual')
        logits = observe('logits', linear(final, p['lm_head'], p['lm_bias']),
                         ['ln_final', 'parameter:lm_head', 'parameter:lm_bias'],
                         'final hidden @ output weights + bias', layer=None,
                         axes=['position', 'vocabulary ID'])
        if not all(math.isfinite(x) for row in logits for x in row):
            raise ValueError('Nonfinite model output')
        result = {'logits': logits, 'nodes': nodes}
        if state is not None:
            result['state'] = KVState(checkpoint_sha256=self.sha256,
                tokenizer_sha256=self.checkpoint['manifest_sha256'],
                token_ids=tuple(state.token_ids) + tuple(ids),
                keys=tuple(tuple(row) for row in k), values=tuple(tuple(row) for row in v))
        return result
