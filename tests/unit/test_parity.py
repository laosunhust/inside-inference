import copy
import unittest
from inside_inference.workload import run_workload
from scripts.check.parity import assert_same


class ParityHarnessTests(unittest.TestCase):
    def test_parity_checks_the_evidence_not_just_ids_and_outcomes(self):
        expected=run_workload()
        bad=copy.deepcopy(expected)
        next(n for n in bad['traces'][0]['passes'][0]['nodes'] if n['name']=='logits')['values'][0][0]+=0.001
        with self.assertRaisesRegex(AssertionError,'complete run differs'):
            assert_same(expected,bad,'corrupt tensor')
        assert_same(expected,copy.deepcopy(expected),'unchanged')
