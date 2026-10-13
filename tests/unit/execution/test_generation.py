import unittest
from inside_inference.generation import select_greedy


class GenerationTests(unittest.TestCase):
    def test_every_id_is_eligible_and_ties_choose_lowest_id(self):
        self.assertEqual(select_greedy([0.]*384)['selected_id'],0)
        for winner in range(384):
            logits=[-1.]*384;logits[winner]=1.
            self.assertEqual(select_greedy(logits)['selected_id'],winner)
