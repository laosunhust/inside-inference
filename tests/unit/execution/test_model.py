"""Independent Decimal equations check every tensor, not a copy of engine helpers."""
import copy
from decimal import Decimal, localcontext
import math
import unittest

from inside_inference.model import identity, ModelArchitecture, Model, initialize, softmax, SHARED_PARAMETERS
from inside_inference.tokenizer import Tokenizer

D = lambda v: Decimal(str(v))


def reference(checkpoint, ids):
    """Row-by-row high precision specification; no model arithmetic helpers."""
    with localcontext() as ctx:
        ctx.prec = 50
        c = checkpoint['config']
        def convert(x):
            return [convert(v) for v in x] if isinstance(x, list) else D(x)
        parameters = {k: convert(v) for k, v in checkpoint['parameters'].items()}
        p = parameters
        d = c['width']
        result = {'input_ids': ids[:], 'token_embedding': [p['token_embedding'][i] for i in ids],
                  'position_embedding': p['position_embedding'][:len(ids)]}
        def plus(a, b):
            return [[x + y for x, y in zip(ar, br)] for ar, br in zip(a, b)]
        def normalize(name, source):
            result[name + '_mean'], result[name + '_variance'], result[name] = [], [], []
            for row in result[source]:
                mean = sum(row) / d
                variance = sum((x - mean)**2 for x in row) / d
                result[name + '_mean'].append([mean])
                result[name + '_variance'].append([variance])
                result[name].append([(row[i] - mean) * p[name + '_scale'][i] /
                                     (variance + D(c['epsilon'])).sqrt() + p[name + '_bias'][i] for i in range(d)])
        def project(name, source, weight, bias):
            result[name] = []
            for row in result[source]:
                target = []
                for j in range(len(p[bias])):
                    value = p[bias][j]
                    for i in range(len(row)):
                        value += row[i] * p[weight][i][j]
                    target.append(value)
                result[name].append(target)
        result['embedding'] = plus(result['token_embedding'], result['position_embedding'])
        shared = set(result)
        all_results = {(None, name): value for name, value in result.items()}
        source = 'embedding'
        for layer in range(c['layers']):
            p = {k: v if k in SHARED_PARAMETERS else v[layer] for k,v in parameters.items()}
            normalize('ln1', source)
            for name in ('query', 'key', 'value'):
                project(name, 'ln1', name, name + '_bias')
            result['scores'], result['causal_mask'], result['attention'] = [], [], []
            for i in range(len(ids)):
                scores = [sum(result['query'][i][k] * result['key'][j][k] for k in range(d)) / D(d).sqrt() for j in range(len(ids))]
                # High precision exp needs no max-subtraction on these bounded fixtures.
                numerators = [scores[j].exp() if j <= i else D(0) for j in range(len(ids))]
                result['scores'].append(scores)
                result['causal_mask'].append([j <= i for j in range(len(ids))])
                result['attention'].append([x / sum(numerators) for x in numerators])
            result['weighted_values'] = [[sum(result['attention'][i][j] * result['value'][j][k] for j in range(len(ids))) for k in range(d)] for i in range(len(ids))]
            project('attention_output', 'weighted_values', 'attention_output', 'attention_output_bias')
            result['attention_residual'] = plus(result[source], result['attention_output'])
            normalize('ln2', 'attention_residual')
            project('ff_up', 'ln2', 'ff_up', 'ff_up_bias')
            pi = D('3.1415926535897932384626433832795028841971693993751')
            result['gelu'] = []
            for row in result['ff_up']:
                activated = []
                for x in row:
                    z = (D(2) / pi).sqrt() * (x + D('0.044715') * x**3)
                    e = (D(2) * z).exp()
                    activated.append(x / 2 * (1 + (e - 1) / (e + 1)))
                result['gelu'].append(activated)
            project('ff_down', 'gelu', 'ff_down', 'ff_down_bias')
            result['ff_residual'] = plus(result['attention_residual'], result['ff_down'])
            all_results.update({(layer,name):value for name,value in result.items() if name not in shared})
            source = 'ff_residual'
        p = parameters
        normalize('ln_final', 'ff_residual')
        project('logits', 'ln_final', 'lm_head', 'lm_bias')
        all_results.update({(None,name):result[name] for name in ('ln_final_mean','ln_final_variance','ln_final','logits')})
        return all_results


def collect(nodes):
    """Merge per-position attention rows; retained K/V rows are checked separately."""
    rows = {}
    for node in nodes:
        name = node['operation']['name']
        if name in ('retained_keys', 'retained_values'): continue
        if name == 'input_ids':
            rows[node['layer'], name] = node['values']; continue
        for position, row in zip(node['positions'], node['values']):
            rows.setdefault((node['layer'], name), []).append(row)
    return rows


class ModelTests(unittest.TestCase):
    def checkpoint(self, width=2, seed=7, layers=1):
        return initialize(ModelArchitecture(width=width, ffn=width*2,layers=layers), Tokenizer().manifest_sha256, seed)

    def assert_values(self, actual, expected):
        if isinstance(expected, list):
            self.assertEqual(len(actual), len(expected))
            for a, b in zip(actual, expected):
                self.assert_values(a, b)
        else:
            self.assertTrue(math.isclose(float(actual), float(expected), rel_tol=1e-10, abs_tol=1e-10), (actual, expected))

    def test_all_intermediates_against_decimal(self):
        for width, layers, ids in [(2, 1, [32]), (2, 2, [32, 79, 0]), (8, 1, [0, 3, 79, 6, 383])]:
            checkpoint = self.checkpoint(width,layers=layers)
            # Nontrivial norm scales/biases exercise more than the initializer.
            for name, values in checkpoint['parameters'].items():
                groups = [values] if name in SHARED_PARAMETERS else values
                for group in groups:
                    if name.endswith('_bias'): group[:] = [(i % 7 - 3) / 20 for i in range(len(group))]
                    if name.endswith('_scale'): group[:] = [0.5 + i / 10 for i in range(len(group))]
            expected = reference(checkpoint, ids)
            actual = Model(checkpoint).forward(ids)
            observed = collect(actual['nodes'])
            # Each attention row holds visible keys only; the mask records the full key range.
            self.assertEqual(set(expected), set(observed))
            for (layer, name), values in observed.items():
                reference_values = expected[layer, name]
                if name in ('scores', 'attention'):
                    reference_values = [row[:i + 1] for i, row in enumerate(reference_values)]
                self.assert_values(values, reference_values)
            for node in actual['nodes']:
                if node['operation']['name'] in ('retained_keys', 'retained_values'):
                    source = 'key' if node['operation']['name'] == 'retained_keys' else 'value'
                    self.assert_values(node['values'], expected[node['layer'], source])

    def test_hand_calculated_uniform_attention_and_residual(self):
        checkpoint = self.checkpoint()
        p = checkpoint['parameters']
        p['position_embedding'] = [[0., 0.] for _ in p['position_embedding']]
        p['token_embedding'][32], p['token_embedding'][33] = [1., -1.], [-1., 1.]
        p['query'][0] = p['key'][0] = [[0., 0.], [0., 0.]]
        p['value'][0] = p['attention_output'][0] = [[1., 0.], [0., 1.]]
        p['ff_down'][0] = [[0., 0.] for _ in p['ff_down'][0]]
        nodes = {name: values for (_, name), values in collect(Model(checkpoint).forward([32, 33])['nodes']).items()}
        self.assertEqual(nodes['attention'], [[1.], [.5, .5]])
        a = 1 / math.sqrt(1 + 1e-5)
        self.assert_values(nodes['weighted_values'], [[a, -a], [0., 0.]])
        self.assert_values(nodes['ff_residual'], [[1 + a, -1 - a], [-1., 1.]])

    def test_causality_every_position_and_trace_on_off(self):
        model = Model(self.checkpoint(8,layers=2))
        ids = [0, 3, 32, 6, 79, 5]
        full = model.forward(ids)
        self.assertEqual(full['logits'], model.forward(ids, capture=False)['logits'])
        self.assertEqual(model.forward(ids, capture=False)['nodes'], [])
        for position in range(len(ids)):
            changed = ids[:position + 1] + [383] * (len(ids) - position - 1)
            # Same batch shape: changing later tokens cannot change earlier logits at all.
            self.assertEqual(full['logits'][:position + 1], model.forward(changed)['logits'][:position + 1])
            # A shorter batch changes matrix-product summation order, not visible information.
            self.assert_values(model.forward(ids[:position + 1])['logits'], full['logits'][:position + 1])

    def test_mutating_a_returned_trace_cannot_change_model_parameters(self):
        model=Model(self.checkpoint())
        before=model.forward([32,33])
        expected=copy.deepcopy(before['logits'])
        position=next(n for n in before['nodes'] if n['operation']['name']=='position_embedding')
        position['values'][0][0]+=1000
        self.assertEqual(model.forward([32,33])['logits'],expected)
        self.assertEqual(model.sha256,identity(model.checkpoint))

    def test_trace_dependencies_identity_and_input_isolation(self):
        checkpoint = self.checkpoint()
        model = Model(checkpoint)
        checkpoint['parameters']['lm_bias'][0] = 999
        self.assertNotEqual(model.parameters['lm_bias'][0], 999)
        result = model.forward([32, 79], request_id='r', run_id='u', step=2)
        seen = set('parameter:' + name for name in model.parameters)
        for node in result['nodes']:
            self.assertEqual((node['request_id'], node['run_id'], node['step']), ('r', 'u', 2))
            per_query = node['operation']['name'] in ('scores', 'attention')
            self.assertTrue(len(node['positions']) == 1 if per_query else node['positions'] == [0, 1], node['id'])
            self.assertTrue(set(node['inputs']) <= seen, node['operation']['name'])
            seen.add(node['id'])
        self.assertEqual(result['nodes'][-1]['values'], result['logits'])

    def test_numerical_edges_and_rejected_configuration(self):
        self.assertEqual(softmax([10000., 10000.]), [.5, .5])
        self.assertEqual(softmax([10000., -10000.]), [1., 0.])
        model = Model(self.checkpoint())
        model.forward([32] * model.config.context, capture=False)
        for ids in ([], [True], [-1], [384], [32] * 129):
            with self.assertRaises(ValueError): model.forward(ids)
        for kwargs in ({'heads': 2}, {'width': True}, {'precision': 'float32'}, {'context': 129}):
            with self.assertRaises(ValueError): ModelArchitecture(**kwargs)
        for invalid in (float('nan'), float('inf'), True):
            checkpoint = self.checkpoint()
            checkpoint['parameters']['lm_bias'][0] = invalid
            with self.assertRaises(ValueError): Model(checkpoint)
        checkpoint = self.checkpoint()
        checkpoint['parameters']['query'][0].pop()
        with self.assertRaises(ValueError): Model(checkpoint)


if __name__ == '__main__':
    unittest.main()
