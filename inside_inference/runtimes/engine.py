"""One NumPy decoder for every declared model architecture.

Each step implements an ontology principle (docs/ontology/operations.yaml). The
architecture's position, normalization and activation fields select its variant;
artifact formats only select a weight reader. RoPE, RMSNorm and SiLU gating follow
pinned llama2.c run.c (MIT; data/models/LICENSE-llama2c.txt).
"""
import numpy as np
from inside_inference.declarations_generated import operation_for

DTYPES = {'binary64': np.float64, 'binary32': np.float32}
LAYERED = ('ln1_scale', 'ln1_bias', 'query', 'query_bias', 'key', 'key_bias', 'value', 'value_bias',
           'attention_output', 'attention_output_bias', 'ln2_scale', 'ln2_bias',
           'ff_up', 'ff_up_bias', 'ff_gate', 'ff_down', 'ff_down_bias')


def checkpoint_weights(checkpoint):
    """Inspectable JSON checkpoint: projections are already stored (inputs, outputs)."""
    dtype = DTYPES[checkpoint['config']['precision']]
    return {name: np.asarray(value, dtype=dtype) for name, value in checkpoint['parameters'].items()}


def llama2c_weights(raw, architecture):
    """Legacy llama2.c binary: int32 header, then float32 tensors stored (outputs, inputs)."""
    a = architecture
    d, f, layers, vocabulary = a['width'], a['ffn'], a['layers'], a['vocabulary']
    header = np.frombuffer(raw, dtype='<i4', count=7).tolist()
    if header != [d, f, layers, a['heads'], a['heads'], vocabulary, a['context']]:
        raise ValueError('Model header differs from declaration')
    floats = np.frombuffer(raw, dtype='<f4', offset=28)
    offset = 0
    def take(*shape):
        nonlocal offset
        count = int(np.prod(shape))
        tensor = floats[offset:offset + count].reshape(shape)
        offset += count
        return tensor
    w = {'token_embedding': take(vocabulary, d), 'ln1_scale': take(layers, d)}
    for name in ('query', 'key', 'value', 'attention_output'):
        w[name] = take(layers, d, d).transpose(0, 2, 1)
    w['ln2_scale'] = take(layers, d)
    w['ff_up'] = take(layers, f, d).transpose(0, 2, 1)
    w['ff_down'] = take(layers, d, f).transpose(0, 2, 1)
    w['ff_gate'] = take(layers, f, d).transpose(0, 2, 1)
    w['ln_final_scale'] = take(d)
    # Unused RoPE tables remain in the format; the decoder computes rotations itself.
    if floats.size != offset + a['context'] * (d // a['heads']):
        raise ValueError('Weight payload length differs from architecture')
    w['lm_head'] = w['token_embedding'].T
    return {name: np.ascontiguousarray(value) for name, value in w.items()}


class Decoder:
    """Causal decoder with per-layer K/V rows retained for an exact token prefix."""

    def __init__(self, architecture, weights):
        self.a = architecture
        self.dtype = DTYPES[architecture['precision']]
        self.w = weights
        a = architecture
        self.head = a['width'] // a['heads']
        self.keys = np.zeros((a['layers'], a['context'], a['width']), dtype=self.dtype)
        self.values = np.zeros_like(self.keys)
        self.prefix = []

    def run(self, ids, reuse, capture=False):
        """Execute positions not covered by a reusable prefix; return logits and evidence."""
        ids = list(ids)
        if not ids or len(ids) > self.a['context'] or any(type(i) is not int or not 0 <= i < self.a['vocabulary'] for i in ids):
            raise ValueError('Forward requires 1..context valid token IDs')
        same = 0
        while same < min(len(ids), len(self.prefix)) and ids[same] == self.prefix[same]:
            same += 1
        if not reuse or same != len(self.prefix) or same == len(ids):
            same = 0
        trace = Trace(capture)
        logits = self._forward(ids, same, trace)
        self.prefix = ids
        if not np.all(np.isfinite(logits)):
            raise ValueError('Nonfinite model output')
        work = {'matmul_flops': trace.flops, 'processed_positions': len(ids) - same, 'reused_positions': same}
        return {'logits_rows': logits, 'logits': logits[-1], 'trace': trace, 'work': work}

    def load_state(self, token_ids, keys, values):
        """Install retained K/V rows for an identified prefix (KV residency experiments)."""
        count = len(token_ids)
        self.keys[:, :count] = np.asarray(keys, dtype=self.dtype).reshape(self.a['layers'], count, self.a['width'])
        self.values[:, :count] = np.asarray(values, dtype=self.dtype).reshape(self.a['layers'], count, self.a['width'])
        self.prefix = list(token_ids)

    def _linear(self, trace, x, name, layer=None):
        weight = self.w[name] if layer is None else self.w[name][layer]
        trace.flops += 2.0 * x.shape[0] * weight.shape[0] * weight.shape[1]
        y = x @ weight
        bias = self.w.get('lm_bias' if name == 'lm_head' else name + '_bias')
        if bias is not None:
            y = y + (bias if layer is None else bias[layer])
        return y

    def _norm(self, trace, x, name, layer):
        scale = self.w[name + '_scale'] if layer < 0 else self.w[name + '_scale'][layer]
        eps = self.dtype(self.a['epsilon'])
        if self.a['normalization'] == 'pre-layernorm':
            bias = self.w[name + '_bias'] if layer < 0 else self.w[name + '_bias'][layer]
            # principle layer-normalization
            mean = x.mean(axis=1, keepdims=True)
            variance = ((x - mean) ** 2).mean(axis=1, keepdims=True)
            y = (x - mean) / np.sqrt(variance + eps) * scale + bias
            # end principle layer-normalization
            trace.record(layer, name + '_mean', mean)
            trace.record(layer, name + '_variance', variance)
        else:
            # principle rms-normalization
            y = scale * (x / np.sqrt((x * x).mean(axis=1, keepdims=True) + eps))
            # end principle rms-normalization
        trace.record(layer, name, y)
        return y

    def _embed(self, trace, ids, start, end):
        if self.a['position'] == 'learned-absolute':
            # principle embedding-with-learned-positions
            e = self.w['token_embedding'][ids[start:end]]
            p = self._learned_positions(start, end)
            x = e + p
            # end principle embedding-with-learned-positions
            trace.record(-1, 'token_embedding', e)
            trace.record(-1, 'position_embedding', p)
            trace.record(-1, 'embedding', x)
        else:
            # principle embedding-without-position-vector
            x = self.w['token_embedding'][ids[start:end]]
            # end principle embedding-without-position-vector
            trace.record(-1, 'token_embedding', x)
        return x

    def _learned_positions(self, start, end):
        # principle learned-absolute-position
        return self.w['position_embedding'][start:end]
        # end principle learned-absolute-position

    def _rotate(self, x, positions):
        # principle rotary-position
        channel = np.arange(0, self.a['width'], 2)
        frequency = self.dtype(1) / np.power(self.dtype(10000), (channel % self.head).astype(self.dtype) / self.dtype(self.head))
        angle = positions[:, None].astype(self.dtype) * frequency
        cos, sin = np.cos(angle), np.sin(angle)
        even, odd = x[:, 0::2], x[:, 1::2]
        rotated = np.empty_like(x)
        rotated[:, 0::2] = even * cos - odd * sin
        rotated[:, 1::2] = even * sin + odd * cos
        return rotated
        # end principle rotary-position

    def _attention(self, trace, q, layer, start, end):
        """Each head scores visible keys, normalizes the scores, then mixes values."""
        scale = np.sqrt(self.dtype(self.head))
        mixed = []
        for h in range(self.a['heads']):
            cols = slice(h * self.head, (h + 1) * self.head)
            keys, values = self.keys[layer, :end, cols], self.values[layer, :end, cols]
            # principle causal-attention
            visible = np.arange(end)[None, :] <= np.arange(start, end)[:, None]
            scores = np.where(visible, (q[:, cols] @ keys.T) / scale, -np.inf)
            # end principle causal-attention
            # principle stable-softmax
            weights = np.exp(scores - scores.max(axis=1, keepdims=True))
            weights = weights / weights.sum(axis=1, keepdims=True)
            # end principle stable-softmax
            mixed.append(weights @ values)
            if h == 0:
                trace.mask(layer, visible)
            if self.a['heads'] == 1:
                for row, position in enumerate(range(start, end)):
                    trace.record_row(layer, 'scores', position, scores[row, :position + 1])
                    trace.record_row(layer, 'attention', position, weights[row, :position + 1])
        trace.flops += 4.0 * self.a['width'] * sum(p + 1 for p in range(start, end))
        # principle value-mixing
        u = np.concatenate(mixed, axis=1)
        o = self._linear(trace, u, 'attention_output', layer)
        # end principle value-mixing
        trace.record(layer, 'weighted_values', u)
        trace.record(layer, 'attention_output', o)
        return o

    def _feed_forward(self, trace, y, layer):
        if self.a['activation'] == 'gelu-tanh':
            # principle gelu-feed-forward
            z = self._linear(trace, y, 'ff_up', layer)
            g = self.dtype(0.5) * z * (1 + np.tanh(np.sqrt(self.dtype(2) / self.dtype(np.pi)) * (z + self.dtype(0.044715) * z ** 3)))
            f = self._linear(trace, g, 'ff_down', layer)
            # end principle gelu-feed-forward
            trace.record(layer, 'ff_up', z)
            trace.record(layer, 'gelu', g)
        else:
            # principle silu-gated-feed-forward
            z = self._linear(trace, y, 'ff_up', layer)
            r = self._linear(trace, y, 'ff_gate', layer)
            with np.errstate(over='ignore'):
                f = self._linear(trace, z / (1 + np.exp(-z)) * r, 'ff_down', layer)
            # end principle silu-gated-feed-forward
            trace.record(layer, 'ff_up', z)
        trace.record(layer, 'ff_down', f)
        return f

    @staticmethod
    def _residual(x, branch):
        # principle residual-addition
        return x + branch
        # end principle residual-addition

    def _forward(self, ids, start, trace):
        a, end = self.a, len(ids)
        positions = np.arange(start, end)
        x = self._embed(trace, ids, start, end)
        for layer in range(a['layers']):
            y = self._norm(trace, x, 'ln1', layer)
            # principle qkv-projection
            q, k, v = (self._linear(trace, y, name, layer) for name in ('query', 'key', 'value'))
            # end principle qkv-projection
            trace.record(layer, 'query', q)
            trace.record(layer, 'key', k)
            trace.record(layer, 'value', v)
            if a['position'] == 'rope':
                q, k = self._rotate(q, positions), self._rotate(k, positions)
            # principle kv-append
            self.keys[layer, start:end], self.values[layer, start:end] = k, v
            # end principle kv-append
            trace.retained(layer, self.keys[layer, :end], self.values[layer, :end])
            x = self._residual(x, self._attention(trace, q, layer, start, end))
            trace.record(layer, 'attention_residual', x)
            y = self._norm(trace, x, 'ln2', layer)
            x = self._residual(x, self._feed_forward(trace, y, layer))
            trace.record(layer, 'ff_residual', x)
        y = self._norm(trace, x, 'ln_final', -1)
        # principle vocabulary-logits
        logits = self._linear(trace, y, 'lm_head')
        # end principle vocabulary-logits
        trace.record(-1, 'logits', logits)
        return logits


class Trace:
    """Captured executed values in first-recorded order; recording is off for logits-only models."""

    def __init__(self, enabled):
        self.enabled, self.flops = enabled, 0.0
        self.groups, self.rows, self.state = {}, {}, {}

    def record(self, layer, name, values):
        if self.enabled:
            self.groups[layer, name] = np.array(values, dtype=np.float64)

    def record_row(self, layer, name, position, values):
        if self.enabled:
            self.groups.setdefault((layer, name), None)
            self.rows.setdefault((layer, name), []).append((position, np.array(values, dtype=np.float64)))

    def mask(self, layer, visible):
        if self.enabled:
            self.state[layer, 'causal_mask'] = visible.tolist()

    def retained(self, layer, keys, values):
        if self.enabled:
            self.state[layer] = (np.array(keys, dtype=np.float64), np.array(values, dtype=np.float64))


SOURCES = {'query': 'ln1', 'key': 'ln1', 'value': 'ln1', 'attention_output': 'weighted_values',
           'ff_up': 'ln2', 'ff_down': 'gelu'}


def observations(trace, ids, work, architecture, root, *, run_id, request_id='request-0', step=0):
    """Project captured values into declared TensorObservation records with explicit inputs."""
    if not trace.enabled:
        return []
    nodes, seen = [], {}
    reused = work['reused_positions']
    positions = list(range(reused, reused + work['processed_positions']))
    def key(layer, name): return f'{layer}/{name}'
    def add(name, layer, values, at, inputs, axes=('position', 'channel'), dtype='binary64', suffix=''):
        node_id = root + key(layer, name) + suffix
        resolved = [source if source.startswith(('parameter:', 'state:')) else seen.get(source) for source in inputs]
        if not all(resolved):
            raise ValueError('Unresolved captured tensor dependency: ' + name)
        values = values.tolist() if isinstance(values, np.ndarray) else values
        shape = [len(values), len(values[0])] if values and isinstance(values[0], list) else [len(values)]
        nodes.append({'id': node_id, 'operation': operation_for(name), 'layer': None if layer < 0 else layer,
                      'request_id': request_id, 'run_id': run_id, 'step': step, 'positions': list(at),
                      'shape': shape, 'dtype': dtype, 'inputs': resolved, 'axes': list(axes), 'values': values})
        seen[key(layer, name) + suffix] = node_id
    add('input_ids', -1, ids[reused:], positions, [], axes=('position',), dtype='int')
    last = architecture['layers'] - 1
    for (layer, name), values in trace.groups.items():
        p = lambda n: 'parameter:' + n
        local = lambda n: key(layer, n)
        previous = key(-1, 'embedding') if layer == 0 else key(layer - 1, 'ff_residual')
        if name == 'token_embedding':
            add(name, layer, values, positions, [key(-1, 'input_ids'), p(name)])
        elif name == 'position_embedding':
            add(name, layer, values, positions, [p(name)])
        elif name == 'embedding':
            add(name, layer, values, positions, [key(-1, 'token_embedding'), key(-1, 'position_embedding')])
        elif name.startswith('ln'):
            base = name.removesuffix('_mean').removesuffix('_variance')
            source = previous if base == 'ln1' else local('attention_residual') if base == 'ln2' else key(last, 'ff_residual')
            if name.endswith('_mean'): inputs = [source]
            elif name.endswith('_variance'): inputs = [source, local(base + '_mean')]
            else: inputs = [source, local(base + '_mean'), local(base + '_variance'), p(base + '_scale'), p(base + '_bias')]
            add(name, layer, values, positions, inputs)
        elif name in SOURCES:
            add(name, layer, values, positions, [local(SOURCES[name]), p(name), p(name + '_bias')])
        elif name == 'scores':
            keys, kv_values = trace.state[layer]
            for operation, rows, source in (('retained_keys', keys, 'key'), ('retained_values', kv_values, 'value')):
                add(operation, layer, rows, range(len(ids)), [local(source)] + (['state:retained-prefix'] if reused else []))
            for position, row in trace.rows[layer, name]:
                add(name, layer, [row.tolist()], [position], [local('query'), local('retained_keys')],
                    axes=('query position', 'key position'), suffix=f'/p{position}')
            add('causal_mask', layer, trace.state[layer, 'causal_mask'], positions, [key(-1, 'input_ids')],
                axes=('query position', 'key position'), dtype='bool')
        elif name == 'attention':
            for position, row in trace.rows[layer, name]:
                add(name, layer, [row.tolist()], [position], [local('scores') + f'/p{position}'],
                    axes=('query position', 'key position'), suffix=f'/p{position}')
        elif name == 'weighted_values':
            inputs = [local('attention') + f'/p{position}' for position, _ in trace.rows[layer, 'attention']]
            add(name, layer, values, positions, inputs + [local('retained_values')])
        elif name == 'attention_residual':
            add(name, layer, values, positions, [previous, local('attention_output')])
        elif name == 'gelu':
            add(name, layer, values, positions, [local('ff_up')])
        elif name == 'ff_residual':
            add(name, layer, values, positions, [local('attention_residual'), local('ff_down')])
        elif name == 'logits':
            add(name, layer, values, positions, [key(-1, 'ln_final'), p('lm_head'), p('lm_bias')], axes=('position', 'vocabulary ID'))
    return nodes
