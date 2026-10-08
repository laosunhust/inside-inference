import unittest
from unittest.mock import patch
from scripts.journey import simulate, scenarios


class JourneyTests(unittest.TestCase):
    def test_hand_calculated_baseline(self):
        run=simulate()
        # Delivery .5 + eight input work units / 2 + four 1-tick outputs.
        self.assertEqual(run['end'],8.5)
        self.assertEqual(run['first_token'],5.5)
        self.assertEqual([e['end'] for e in run['events']],[.5,4.5,5.5,6.5,7.5,8.5,8.5])

    def test_retrieval_cost_crossover(self):
        self.assertEqual(simulate(True)['end'],8.)
        self.assertEqual(simulate(True,2,.5)['end'],18.)
        self.assertEqual(simulate(True,2,12)['end'],6.5)
        self.assertEqual(simulate(False,4)['end'],6.5)

    def test_recorded_state_is_atomic_and_explicit(self):
        run=simulate(True)
        ingress,transfer,prefill,*_=run['events']
        self.assertEqual(ingress['before'],dict(ready=0,reserved=0,emitted=0))
        self.assertEqual(ingress['after']['reserved'],12)
        self.assertEqual(transfer['before']['ready'],0)
        self.assertEqual(transfer['after']['ready'],6)
        self.assertEqual(prefill['after']['ready'],8)
        self.assertEqual(run['events'][-2]['after'],dict(ready=12,reserved=12,emitted=4))
        self.assertEqual(run['events'][-1]['after'],dict(ready=0,reserved=0,emitted=4))
        self.assertIsNot(transfer['after'],prefill['before'])

    def test_all_scenarios_have_dependencies_and_conserved_accounting(self):
        self.assertEqual(scenarios(),scenarios())
        self.assertEqual(len(scenarios()),18)
        for run in scenarios().values():
            events=run['events']
            self.assertAlmostEqual(sum(e['duration'] for e in events),run['end'])
            for previous,current in zip(events,events[1:]):
                self.assertEqual(previous['end'],current['start'])
                self.assertEqual(previous['after'],current['before'])
                self.assertEqual(current['depends_on'],previous['id'])
            for event in events:
                for state in (event['before'],event['after']):
                    self.assertLessEqual(state['ready'],state['reserved'])
                    self.assertLessEqual(state['reserved'],run['worker_capacity'])
                self.assertTrue(event['rule'])
                self.assertTrue(event['explanation'])
                if event['kind']=='decode':
                    self.assertEqual(event['after']['emitted'],event['before']['emitted']+1)
                    self.assertEqual(event['duration'],1)

    def test_fail_explicitly_on_invalid_resources(self):
        for args in ((False,0,3),(True,2,-1)):
            with self.assertRaises(ValueError):simulate(*args)
        with patch('scripts.journey.CAPACITY',11):
            with self.assertRaises(ValueError):simulate()
