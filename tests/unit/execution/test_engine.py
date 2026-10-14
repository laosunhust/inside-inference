"""The shared NumPy decoder against recorded oracles for every model family."""
import gzip
import json
import unittest
import numpy as np
from scripts import ROOT
from inside_inference.model import Model, ModelArchitecture, initialize
from inside_inference.tokenizer import Tokenizer
from inside_inference.runtimes.bpe import BytePairTokenizer, normalize
from inside_inference.runtimes.engine import Decoder, checkpoint_weights, llama2c_weights

STORIES = ROOT/'data/preparation/story-models'
ARTIFACTS = ROOT/'data/models/artifacts'
LLAMA = {'tinyllm-500k': ('tinyllm-0.5m.bin', 64, 192, 2), 'tinyllm-4m': ('tinyllm-4m.bin', 256, 704, 8)}


def llama(model_id):
    name, width, ffn, heads = LLAMA[model_id]
    a = dict(vocabulary=4096, width=width, ffn=ffn, context=512, layers=4, heads=heads, position='rope',
             normalization='rmsnorm', activation='silu-gated', precision='binary32', epsilon=1e-5)
    return a, llama2c_weights((ARTIFACTS/name).read_bytes(), a)


class EngineTests(unittest.TestCase):
    def test_every_tensor_matches_the_recorded_scalar_reference(self):
        fixture = json.loads((ROOT/'tests/fixtures/integration/scalar-reference.json').read_text())
        for case in fixture['cases']:
            config = ModelArchitecture(width=case['width'], ffn=case['ffn'], layers=case['layers'], context=case['context'])
            result = Model(initialize(config, Tokenizer().manifest_sha256, seed=case['seed'])).forward(case['ids'])
            self.assertLessEqual(np.abs(np.array(result['logits']) - case['logits']).max(), 1e-11)
            expected = {(n['layer'], n['operation']['name']): n for n in case['nodes']}
            checked = set()
            for node in result['nodes']:
                name = node['operation']['name']
                if name in ('retained_keys', 'retained_values', 'input_ids'): continue
                reference = expected[node['layer'], name]['values']
                for position, row in zip(node['positions'], node['values']):
                    if name == 'causal_mask': self.assertEqual(row, reference[position]); continue
                    self.assertLessEqual(np.abs(np.array(row) - reference[position][:len(row)]).max(), 1e-11, node['id'])
                checked.add(name)
            self.assertEqual(checked, {n for _, n in expected} - {'input_ids'})

    def test_covered_8k_checkpoint_matches_recorded_selection_logits(self):
        fixture = json.loads((ROOT/'tests/fixtures/integration/tiny-covered.json').read_text())
        checkpoint = json.loads(gzip.decompress((ARTIFACTS/'tinyllm-8k.bin').read_bytes()))
        decoder = Decoder(checkpoint['config'], checkpoint_weights(checkpoint))
        run = decoder.run(fixture['prefix'] + fixture['output'][:23], reuse=False)
        self.assertLessEqual(np.abs(run['logits'] - fixture['logits_at_selection_24']).max(), 1e-12)
        self.assertEqual(int(np.argmax(run['logits'])), fixture['output'][23])

    def test_llama_family_matches_upstream_tokens_and_logits(self):
        references = json.loads((STORIES/'export.json').read_text())
        logits = np.fromfile(STORIES/'logits.bin', dtype='<f4').astype(np.float64)
        tokenizer = BytePairTokenizer((ARTIFACTS/'tokenizer-4096.bin').read_bytes(), 4096)
        for case in references['tokenizer_cases']:
            self.assertEqual(tokenizer.encode(normalize(case['text'])), case['ids'], case['text'])
        for model_id in LLAMA:
            architecture, weights = llama(model_id)
            for case in (c for c in references['cases'] if c['model_id'] == model_id):
                self.assertEqual(tokenizer.encode(normalize(case['prompt'])), case['ids'])
                expected = logits[case['logit_offset']:case['logit_offset'] + case['logit_count']]
                actual = Decoder(architecture, weights).run(case['ids'], reuse=False)['logits'].astype(np.float64)
                self.assertTrue(np.all(np.abs(actual - expected) <= 1e-3 + 1e-3 * np.abs(expected)), (model_id, case['prompt']))
                ranked = np.sort(expected)[::-1]
                if int(np.argmax(actual)) != int(np.argmax(expected)):
                    self.assertLessEqual(ranked[0] - ranked[1], 2 * np.abs(actual - expected).max(), 'Unexplained token flip')

    def test_incremental_decode_reuses_rows_and_branches_recompute(self):
        architecture, weights = llama('tinyllm-500k')
        ids = [1, 403, 2667, 10, 263, 1777]
        full = Decoder(architecture, weights).run(ids, reuse=False)
        decoder = Decoder(architecture, weights)
        for end in range(1, len(ids) + 1):
            step = decoder.run(ids[:end], reuse=True)
            self.assertEqual((step['work']['processed_positions'], step['work']['reused_positions']), (1, end - 1) if end > 1 else (1, 0))
        self.assertLessEqual(np.abs(step['logits'] - full['logits']).max(), 1e-4)
        branch = decoder.run(ids[:2], reuse=True)
        self.assertEqual(branch['work']['reused_positions'], 0, 'A branch cannot read the discarded suffix')
        d, f, layers, vocabulary, n = 64, 192, 4, 4096, len(ids)
        self.assertEqual(full['work']['matmul_flops'], 2*n*(layers*(4*d*d + 3*d*f) + d*vocabulary) + 4*layers*d*n*(n+1)//2)

    def test_byte_fallback_and_post_bos_space_decode(self):
        tokenizer = BytePairTokenizer((ARTIFACTS/'tokenizer-4096.bin').read_bytes(), 4096)
        for text in ('Once upon a time', 'café 你好 🙂', 'a\tb'):
            ids = tokenizer.encode(normalize(text))
            self.assertEqual(tokenizer.decode(ids[1:], ids[0]), normalize(text))
        with self.assertRaises(ValueError): normalize('a\0b')


if __name__ == '__main__':
    unittest.main()
