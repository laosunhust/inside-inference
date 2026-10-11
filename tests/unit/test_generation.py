import copy
import json
import unittest

from inside_inference.generation import DEFAULT_REQUEST, select_greedy, replay, run_request
from inside_inference.model import ModelArchitecture, initialize, default_checkpoint, identity
from unittest.mock import patch
from inside_inference.declarations_generated import LAB_BINDINGS
from inside_inference.tokenizer import ContextOverflow, Tokenizer


def request_with(**changes):
    request = copy.deepcopy(DEFAULT_REQUEST)
    if 'max_new_tokens' in changes:
        request['generation']['max_new_tokens'] = changes.pop('max_new_tokens')
    request.update(changes)
    return request


class GenerationTests(unittest.TestCase):
    def test_actual_selection_prefix_growth_and_replay(self):
        run = run_request()
        self.assertEqual(run, replay(json.loads(json.dumps(run))))
        prefix = list(run['tokenizer']['ids'])
        for number, step in enumerate(run['passes']):
            self.assertEqual(step['input_ids'], prefix)
            self.assertEqual(step['phase'], 'decode' if number else 'prefill')
            selection = step['selection']
            raw = next(n['values'] for n in step['nodes'] if n['operation']['name'] == 'logits')[-1]
            self.assertEqual(selection['raw_logits'], raw)
            candidate = sorted(((-raw[i], i) for i in range(len(raw))))[0][1]
            self.assertEqual(selection['selected_id'], candidate)
            self.assertAlmostEqual(sum(selection['probabilities']), 1.0)
            self.assertTrue(all(p > 0 for p in selection['probabilities']))
            prefix.append(candidate)
        self.assertEqual(prefix, run['sequence_ids'])
        self.assertEqual(run['output_ids'], run_request(capture=False)['output_ids'])
        self.assertEqual(run['outcome']['stop_reason'], 'turn_end')

    def test_shipped_checkpoint_identity_and_no_fallback(self):
        checkpoint = default_checkpoint()
        self.assertEqual(identity(checkpoint),
            'e19dea8d9a1e1b4b8c5e975bb615002138bf0990d132364fdda9932a00c0fc18')
        self.assertEqual(checkpoint['provenance']['kind'], 'trained')
        with patch('inside_inference.model.DEFAULT_CHECKPOINT') as path:
            path.read_bytes.side_effect = FileNotFoundError('missing checkpoint')
            with self.assertRaises(FileNotFoundError):
                run_request(capture=False)
            path.read_bytes.side_effect = None
            path.read_bytes.return_value = b'corrupt'
            with self.assertRaises(OSError):
                run_request(capture=False)

    def test_every_id_is_eligible_and_ties_choose_lowest_id(self):
        self.assertEqual(select_greedy([0.]*384)['selected_id'],0)
        for winner in range(384):
            logits=[-1.]*384;logits[winner]=1.
            self.assertEqual(select_greedy(logits)['selected_id'],winner)

    def test_output_and_context_budget_are_explicit(self):
        run = run_request(request_with(max_new_tokens=1))
        self.assertFalse(run['outcome']['complete'])
        self.assertEqual(run['outcome']['stop_reason'], 'output_budget')
        tokenizer = Tokenizer()
        checkpoint = initialize(ModelArchitecture(context=4), tokenizer.manifest_sha256)
        # Empty prompt has BOS USER TURN_END ASSISTANT, exactly four tokens.
        run = run_request(request_with(text='',max_new_tokens=1), checkpoint=checkpoint)
        self.assertEqual(len(run['passes']), 1)
        self.assertEqual(run['outcome']['stop_reason'], 'output_budget')
        self.assertFalse(run['outcome']['complete'])
        with self.assertRaisesRegex(ValueError,'token budget'):
            run_request(request_with(text='',max_new_tokens=2), checkpoint=checkpoint)
        with self.assertRaises(ContextOverflow):
            run_request(request_with(text='cat'), checkpoint=checkpoint)

    def test_counterfactual_and_invalid_requests(self):
        a = run_request(request_with(text='cat'))
        b = run_request(request_with(text='dog'))
        self.assertEqual(a['declaration']['model']['checkpoint_sha256'], b['declaration']['model']['checkpoint_sha256'])
        self.assertNotEqual(a['id'], b['id'])
        self.assertNotEqual(a['passes'][0]['selection']['raw_logits'], b['passes'][0]['selection']['raw_logits'])
        for patch in ({'max_new_tokens': 0}, {'max_new_tokens': True}, {'seed': -1}, {'text': 3}, {'other': 1}):
            with self.assertRaises(ValueError): run_request(request_with(**patch))
        checkpoint = copy.deepcopy(a['checkpoint'])
        checkpoint['manifest_sha256'] = 'wrong'
        with self.assertRaises(ValueError): run_request(checkpoint=checkpoint)
        broken = copy.deepcopy(a)
        broken['checkpoint']['parameters']['lm_bias'][0] += 1
        with self.assertRaises(ValueError): replay(broken)
        broken = copy.deepcopy(a)
        broken['passes'][0]['nodes'][-1]['values'][0][0] += 1
        with self.assertRaises(ValueError): replay(broken)
        broken = copy.deepcopy(a)
        broken['provenance']['source_sha256'] = 'wrong'
        with self.assertRaises(ValueError): replay(broken)


if __name__ == '__main__':
    unittest.main()


class TokenStepTests(unittest.TestCase):
    def test_exact_prefix_continuation_and_replay(self):
        from inside_inference.generation import run_token_step, replay_token_step
        from inside_inference.model import Model
        checkpoint=default_checkpoint()
        request={'checkpoint_sha256':identity(checkpoint),'prefix_ids':[0,3,7,14],
                 'output_ids':[],'ontology_binding':LAB_BINDINGS['naive-gpt'],'generation':dict(DEFAULT_REQUEST['generation'],max_new_tokens=2)}
        first=run_token_step(request)
        self.assertEqual(first['computation']['input_ids'],request['prefix_ids'])
        expected=Model(checkpoint).forward(request['prefix_ids'],capture=False)['logits'][-1]
        self.assertEqual(first['computation']['selection']['raw_logits'],expected)
        self.assertEqual(first,replay_token_step(first))
        # A partial byte encoding is valid numerical input, not reconstructed text.
        second=run_token_step(dict(request,output_ids=first['output_ids']))
        self.assertEqual(second['computation']['input_ids'],first['sequence_ids'])
        self.assertEqual(second['remaining_tokens'],0)
        self.assertIn(second['stop_reason'],('turn_end','output_budget'))
        with self.assertRaisesRegex(ValueError,'budget|TURN_END'):
            run_token_step(dict(request,output_ids=second['output_ids']))
        bad=copy.deepcopy(first);bad['computation']['selection']['raw_logits'][0]+=1
        with self.assertRaisesRegex(ValueError,'differs'):replay_token_step(bad)

    def test_admission_and_terminal_prefix_boundary(self):
        from inside_inference.generation import run_token_step
        request={'checkpoint_sha256':identity(default_checkpoint()),'prefix_ids':[0,3,5],
                 'output_ids':[],'ontology_binding':LAB_BINDINGS['naive-gpt'],'generation':DEFAULT_REQUEST['generation']}
        # A framing TURN_END in the prompt is different from a generated terminal.
        run_token_step(request)
        for patch in ({'checkpoint_sha256':'0'*64},{'prefix_ids':[]},
                      {'prefix_ids':[384]},{'prefix_ids':[0]*129},{'output_ids':[5]}):
            with self.subTest(patch=patch),self.assertRaises(ValueError):
                run_token_step(dict(request,**patch))
