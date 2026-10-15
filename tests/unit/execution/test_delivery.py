"""Model-service composition and stopping rules, independent of browser transport."""
import unittest
import copy
import json
from scripts import ROOT
from inside_inference.declarations_generated import EXPERIMENTS
from inside_inference.delivery.models import finish_selection, resolve_execution


class DeliveryTests(unittest.TestCase):
    def test_execution_composition_rejects_conflicts_and_partial_resources(self):
        assignments = {e['control']: e for e in EXPERIMENTS['kv-residency']['variants'][0]['input']['execution']['experiments']}
        cases = json.loads((ROOT/'tests/fixtures/execution-composition.json').read_text())
        for case in cases:
            spec = {'experiments': [copy.deepcopy(assignments[c]) for c in case['controls']]}
            if 'change_last' in case: spec['experiments'][-1].update(case['change_last'])
            with self.subTest(case=case):
                if not case['valid']:
                    with self.assertRaises(ValueError): resolve_execution(spec)
                else:
                    result = resolve_execution(spec)
                    self.assertEqual(result['model_id'], assignments['model']['value'])
                    self.assertEqual(result['kv_reuse'], assignments['kv_reuse']['value'])
                    expected = {c: assignments[c]['value'] for c in case['controls'] if c not in ('model', 'kv_reuse')}
                    self.assertEqual(result['resources'], expected or None)

    def test_stopping_reasons_and_visible_output(self):
        model = {'stop_ids': [1], 'architecture': {'context': 4}}
        base = {'prefix_ids': [0], 'output_ids': [], 'generation': {'max_new_tokens': 3}}
        self.assertIsNone(finish_selection(base, 7, model)[2])
        for step, selected, reason in [({**base, 'generation': {'max_new_tokens': 1}}, 7, 'output_budget'),
                                       ({**base, 'prefix_ids': [0, 2, 3, 4]}, 7, 'context_capacity'),
                                       ({**base, 'output_ids': [7]}, 1, 'end_token')]:
            output, _, stop, visible = finish_selection(step, selected, model)
            self.assertEqual((stop, output), (reason, [*step['output_ids'], selected]))
            self.assertEqual(visible, step['output_ids'] if selected == 1 else output)
        # Every nonterminal ID, including byte/control IDs, continues until the budget.
        for token in range(384):
            self.assertEqual(finish_selection(base, token, model)[2], 'end_token' if token == 1 else None)
            at_budget = {**base, 'output_ids': [7, 7]}
            self.assertEqual(finish_selection(at_budget, token, model)[2], 'end_token' if token == 1 else 'output_budget')


if __name__ == '__main__':
    unittest.main()
