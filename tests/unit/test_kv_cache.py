"""Cached execution compared against the unchanged full-prefix computation."""
from copy import deepcopy
import math
import unittest

from inside_inference.model import Model, ModelArchitecture, initialize
from inside_inference.tokenizer import Tokenizer


class KVCacheTests(unittest.TestCase):
    def setUp(self):
        self.model = Model(initialize(ModelArchitecture(), Tokenizer().manifest_sha256))

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
                nodes = {n['name']: n for n in reference['nodes']}
                self.assertEqual(result['state'].to_dict()['keys'], nodes['key']['values'])
                self.assertEqual(result['state'].to_dict()['values'], nodes['value']['values'])
                cached_nodes = {n['name']: n for n in result['nodes']}
                self.assertEqual(cached_nodes['query']['positions'], list(range(end-length, end)))
                self.assertEqual(cached_nodes['scores']['shape'], [length, end])
                self.assertEqual(cached_nodes['causal_mask']['values'],
                                 [[j <= i for j in range(end)] for i in range(end-length, end)])
                old = state.to_dict() if state else None
                state = result['state']
                if old: self.assertEqual(state.to_dict()['keys'][:end-length], old['keys'])

    def test_identity_shape_context_and_nonfinite_rejected(self):
        state = self.model.forward_cached([0, 3, 42])['state'].to_dict()
        for mutate in (lambda s: s.update(checkpoint_sha256='0'*64),
                       lambda s: s.update(tokenizer_sha256='0'*64),
                       lambda s: s['keys'].pop(),
                       lambda s: s['values'][0].append(0),
                       lambda s: s['keys'][0].__setitem__(0, float('nan'))):
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
        serialized['keys'][0][0] = 999
        self.assertNotEqual(result['state'].keys[0][0], 999)
        self.assertEqual(len(original.token_ids), 3)
        reset = self.model.forward_cached([52])
        self.assertEqual(reset['state'].token_ids, (52,))
        self.assertEqual(reset['logits'], self.model.forward([52])['logits'])
