"""Model-service composition and stopping rules, independent of browser transport."""
import unittest
from inside_inference.delivery.models import finish_selection, resolve_execution


class DeliveryTests(unittest.TestCase):
    def test_execution_composition_rejects_conflicts_and_partial_resources(self):
        base = {'experiments': [{'control': 'model', 'value': 'tinyllm-8k'}, {'control': 'kv_reuse', 'value': True}]}
        self.assertEqual(resolve_execution(base), {'model_id': 'tinyllm-8k', 'kv_reuse': True, 'resources': None})
        duplicate = {'experiments': base['experiments'] + [base['experiments'][0]]}
        with self.assertRaisesRegex(ValueError, 'Conflicting'): resolve_execution(duplicate)
        with self.assertRaisesRegex(ValueError, 'requires exactly'): resolve_execution({'experiments': []})
        partial = {'experiments': base['experiments'] + [{'control': 'kv_cache', 'value': {}}]}
        with self.assertRaisesRegex(ValueError, 'together'): resolve_execution(partial)

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
