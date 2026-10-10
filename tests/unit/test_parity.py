import copy
import unittest
from tests.fixtures.execution import small_workload
from scripts.check.parity import assert_same
from scripts.check.selection_contract import assert_unrestricted_generation


class ParityHarnessTests(unittest.TestCase):
    def test_parity_checks_the_evidence_not_just_ids_and_outcomes(self):
        expected=small_workload()
        bad=copy.deepcopy(expected)
        next(n for n in bad['traces'][0]['passes'][0]['nodes'] if n['operation']['name']=='logits')['values'][0][0]+=0.001
        with self.assertRaisesRegex(AssertionError,'complete run differs'):
            assert_same(expected,bad,'corrupt tensor')
        assert_same(expected,copy.deepcopy(expected),'unchanged')

    def test_oracle_rejects_fabricated_stop_and_filtered_winner(self):
        run=small_workload()
        early=copy.deepcopy(run)
        early['traces'][0]['passes'].pop()
        early['traces'][0]['output_ids'].pop()
        with self.assertRaises(AssertionError): assert_unrestricted_generation(early)
        filtered=copy.deepcopy(run)
        filtered['traces'][0]['passes'][0]['selection']['selected_id']=5
        with self.assertRaises(AssertionError): assert_unrestricted_generation(filtered)
