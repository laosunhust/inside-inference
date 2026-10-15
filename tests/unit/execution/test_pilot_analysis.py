"""The pilot's descriptive resolution rule, independent of runtime measurements."""
import unittest
from scripts.experiments.kv_timing.analyze import resolution


class PilotAnalysisTests(unittest.TestCase):
    def test_resolution_requires_effect_size_consistency_and_complete_pairs(self):
        p={'minimum_absolute_difference_ms':.2,'minimum_relative_difference':.1,
           'minimum_agreeing_pairs':5,'measured_pairs':6}
        self.assertEqual(resolution([2]*6,[1]*6,p)['direction'],'reuse-faster')
        self.assertEqual(resolution([1]*6,[2]*6,p)['direction'],'reuse-slower')
        self.assertFalse(resolution([2]*6,[1.95]*6,p)['resolved'])
        self.assertFalse(resolution([2]*5,[1]*5,p)['resolved'])
        self.assertFalse(resolution([2]*6,[1,3,1,3,1,3],p)['resolved'])
        self.assertFalse(resolution([2]*6,[2]*6,p)['resolved'])
