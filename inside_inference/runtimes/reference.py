"""Independent scalar reference for native component tests and checkpoint preparation.

Not packaged in the website. Browser lab orchestration uses the shared WASM decoder.
"""
import math
from inside_inference.model import softmax, shape, identity, SHARED_PARAMETERS
from inside_inference.declarations_generated import KVState, operation_for

def linear(x, weight, bias):
    return [[sum(a * b for a, b in zip(row, column)) + offset
             for column, offset in zip(zip(*weight), bias)] for row in x]


def add(a, b):
    return [[x + y for x, y in zip(ar, br)] for ar, br in zip(a, b)]


def forward(self, ids, *, state=None, capture=True, request_id='request-0', run_id='standalone', step=0, work_id=None):
    ids = list(ids)
    c, p = self.config, self.parameters
    offset = len(state.token_ids) if state is not None else 0
    total = offset + len(ids)
    if not ids or total > c.context or any(type(i) is not int or not 0 <= i < c.vocabulary for i in ids):
        raise ValueError('Forward requires 1..context valid token IDs')
    nodes, observed = [], {}
    current_layer = None
    prefix = (work_id or f'{run_id}/step-{step}') + '/'
    def observe(name, value, inputs, formula, layer='current', axes=None, positions=None):
        operation=operation_for(name)
        layer = current_layer if layer == 'current' else layer
        node_id = prefix + (f'layer-{layer}/' if layer is not None else '') + name
        if capture:
            nodes.append(dict(id=node_id, operation=operation, layer=layer,
                request_id=request_id, run_id=run_id, step=step,
                positions=list(range(offset, total)) if positions is None else positions, shape=shape(value),
                dtype='bool' if name == 'causal_mask' else 'int' if name == 'input_ids' else 'binary64',
                inputs=[i if i.startswith(('parameter:', 'state:')) else observed[i] for i in inputs],
                formula=formula, axes=axes or ['position', 'channel'], values=value))
        observed[name] = node_id
        return value
    def dense(name, x, source, weight, layer='current'):
        return observe(name, linear(x, p[weight], p[weight + '_bias']),
            [source, 'parameter:' + weight, 'parameter:' + weight + '_bias'],
            'X @ W + bias', layer=layer)
    def norm(name, x, source):
        means = [[sum(row) / c.width] for row in x]
        variances = [[sum((a - mean[0]) ** 2 for a in row) / c.width]
                     for row, mean in zip(x, means)]
        layer = None if name == 'ln_final' else current_layer
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
    all_keys, all_values = [], []
    source = 'embedding'
    for current_layer in range(c.layers):
        p = {name: value if name in SHARED_PARAMETERS else value[current_layer]
             for name, value in self.parameters.items()}
        normalized = norm('ln1', x, source)
        q, k, v = [dense(name, normalized, 'ln1', name) for name in ('query', 'key', 'value')]
        key_source, value_source = 'key', 'value'
        if state is not None:
            state_source = 'state:' + identity(state.to_dict())
            k = observe('retained_keys', [list(row) for row in state.keys[current_layer]] + k,
                [state_source, 'key'], 'concatenate(cached K, new K)',
                positions=list(range(total)))
            v = observe('retained_values', [list(row) for row in state.values[current_layer]] + v,
                [state_source, 'value'], 'concatenate(cached V, new V)',
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
        residual = observe('attention_residual', add(x, projected), [source, 'attention_output'], 'X + attention output')
        hidden = norm('ln2', residual, 'attention_residual')
        up = dense('ff_up', hidden, 'ln2', 'ff_up')
        activated = observe('gelu', [[0.5 * a * (1 + math.tanh(math.sqrt(2 / math.pi) * (a + 0.044715 * a**3)))
                                    for a in row] for row in up], ['ff_up'],
                            '0.5*x*(1+tanh(sqrt(2/pi)*(x+0.044715*x^3)))')
        down = dense('ff_down', activated, 'gelu', 'ff_down')
        residual = observe('ff_residual', add(residual, down), ['attention_residual', 'ff_down'], 'residual + feed-forward output')
        all_keys.append(tuple(tuple(row) for row in k))
        all_values.append(tuple(tuple(row) for row in v))
        x, source = residual, 'ff_residual'
    p = self.parameters
    current_layer = None
    final = norm('ln_final', residual, 'ff_residual')
    logits = observe('logits', linear(final, p['lm_head'], p['lm_bias']),
                     ['ln_final', 'parameter:lm_head', 'parameter:lm_bias'],
                     'final hidden @ output weights + bias', layer=None,
                     axes=['position', 'vocabulary ID'])
    if not all(math.isfinite(x) for row in logits for x in row):
        raise ValueError('Nonfinite model output')
    result = {'logits': logits, 'nodes': nodes,
              'matmul_flops': 2*len(ids)*(c.layers*(4*c.width*c.width+2*c.width*c.ffn)+c.width*c.vocabulary) + 4*c.layers*len(ids)*total*c.width}
    if state is not None:
        result['state'] = KVState(checkpoint_sha256=self.sha256,
            tokenizer_sha256=self.checkpoint['manifest_sha256'],
            token_ids=tuple(state.token_ids) + tuple(ids),
            keys=tuple(all_keys), values=tuple(all_values))
    return result
