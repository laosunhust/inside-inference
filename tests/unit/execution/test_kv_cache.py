"""Cached execution compared against the unchanged full-prefix computation."""
from copy import deepcopy
import math
import unittest

from inside_inference.model import Model, ModelArchitecture, initialize
from inside_inference.tokenizer import Tokenizer


class KVCacheTests(unittest.TestCase):
    def setUp(self):
        self.model = Model(initialize(ModelArchitecture(layers=2), Tokenizer().manifest_sha256))

    def test_chunked_and_single_token_continuation_matches_full_prefix(self):
        ids = [0, 3, 42, 52, 61, 5, 4, 77, 18, 29]
        for chunks in ([7, 1, 1, 1], [2, 3, 5], [10]):
            state, end = None, 0
            for length in chunks:
                result = self.model.forward_cached(ids[end:end+length], state)
                end += length
                reference = self.model.forward(ids[:end])
                for a, b in zip(result['logits'], reference['logits'][-length:]):
                    for x, y in zip(a, b):
                        self.assertTrue(math.isclose(x, y, abs_tol=1e-10, rel_tol=1e-9))
                nodes = {(n['layer'],n['operation']['name']): n for n in reference['nodes']}
                self.assertEqual(result['state'].to_dict()['keys'], [nodes[i,'key']['values'] for i in range(2)])
                self.assertEqual(result['state'].to_dict()['values'], [nodes[i,'value']['values'] for i in range(2)])
                cached_nodes = {n['operation']['name']: n for n in result['nodes']}
                self.assertEqual(cached_nodes['query']['positions'], list(range(end-length, end)))
                self.assertEqual(cached_nodes['scores']['shape'], [length, end])
                self.assertEqual(cached_nodes['causal_mask']['values'],
                                 [[j <= i for j in range(end)] for i in range(end-length, end)])
                old = state.to_dict() if state else None
                state = result['state']
                if old: self.assertEqual([layer[:end-length] for layer in state.to_dict()['keys']], old['keys'])

    def test_cache_costs_count_executed_layers_and_real_payload(self):
        from inside_inference.cache_lab import default_experiment, run_cache_experiment
        from inside_inference.kv_runtime import state_bytes
        from inside_inference.declarations_generated import KVState
        model=Model(initialize(ModelArchitecture(layers=2,width=2,ffn=4),Tokenizer().manifest_sha256))
        spec=default_experiment()
        spec['workload']['requests']=spec['workload']['requests'][:1]
        spec['workload']['requests'][0]['request']['generation']['max_new_tokens']=2
        spec['workload']['requests'][0]['request']['text']='ball'
        record=run_cache_experiment(spec,checkpoint=model.checkpoint)
        def scalar_count(value):
            return sum(scalar_count(x) for x in value) if isinstance(value,list) else 1
        weight_bytes=8*sum(scalar_count(v) for v in model.parameters.values())
        for work in record['computations']:
            nodes={n['id']:n for n in work['nodes']}
            flops=0
            for node in nodes.values():
                name=node['operation']['name']
                if name in ('query','key','value','attention_output','ff_up','ff_down','logits'):
                    inputs=nodes[node['inputs'][0]]['shape']
                    flops+=2*inputs[0]*inputs[1]*node['shape'][1]
                elif name in ('scores','weighted_values'):
                    left,right=(nodes[i]['shape'] for i in node['inputs'][:2])
                    flops+=2*left[0]*left[1]*(right[0] if name=='scores' else right[1])
            self.assertEqual(flops,work['matmul_flops'])
            before=state_bytes(KVState.from_dict(work['state_before']))
            after=state_bytes(KVState.from_dict(work['state_after']))
            self.assertEqual(work['logical_memory_bytes'],weight_bytes+after+(after-before))
            self.assertEqual(after,len(work['state_after']['token_ids'])*2*2*2*8)
        # Admission must include both layers; it cannot silently use one-layer capacity.
        spec['system']['kv_cache']['device_kv_bytes']=128
        with self.assertRaisesRegex(ValueError,'exceeds device KV capacity'):
            run_cache_experiment(spec,checkpoint=model.checkpoint)

    def test_identity_shape_context_and_nonfinite_rejected(self):
        state = self.model.forward_cached([0, 3, 42])['state'].to_dict()
        for mutate in (lambda s: s.update(checkpoint_sha256='0'*64),
                       lambda s: s.update(tokenizer_sha256='0'*64),
                       lambda s: s['keys'].pop(),
                       lambda s: s['values'][0][0].append(0),
                       lambda s: s['keys'][0][0].__setitem__(0, float('nan'))):
            bad = deepcopy(state); mutate(bad)
            with self.assertRaises((ValueError, TypeError)):
                self.model.forward_cached([52], bad)
        with self.assertRaises(ValueError): self.model.forward_cached([52]*126, state)
        with self.assertRaises(ValueError): self.model.forward_cached([], state)
        full = self.model.forward_cached([42]*128)
        with self.assertRaises(ValueError): self.model.forward_cached([42], full['state'])

    def test_state_is_detached_and_reset_is_explicit(self):
        original = self.model.forward_cached([0, 3, 42])['state']
        serialized = original.to_dict()
        result = self.model.forward_cached([52], serialized)
        serialized['keys'][0][0][0] = 999
        self.assertNotEqual(result['state'].keys[0][0][0], 999)
        self.assertEqual(len(original.token_ids), 3)
        reset = self.model.forward_cached([52])
        self.assertEqual(reset['state'].token_ids, (52,))
        self.assertEqual(reset['logits'], self.model.forward([52])['logits'])
