import copy
import unittest
from unittest.mock import patch

from inside_inference.declarations_generated import Workload
from inside_inference.workload import default_workload, deliveries, run_workload, replay_workload, validate_run


class WorkloadTests(unittest.TestCase):
    def test_arrivals_are_structural_but_unsupported_scheduling_is_rejected_before_compute(self):
        original = default_workload().to_dict()
        cases = []
        delayed = copy.deepcopy(original); delayed['requests'][0]['arrival_us'] = 1; cases.append(delayed)
        multiple = copy.deepcopy(original)
        multiple['requests'].append(dict(multiple['requests'][0],request_id='r2')); cases.append(multiple)
        duplicate = copy.deepcopy(multiple); duplicate['requests'][1]['request_id']='r1'; cases.append(duplicate)
        backwards = copy.deepcopy(multiple); backwards['requests'][0]['arrival_us']=10; cases.append(backwards)
        for value in cases:
            Workload.validate_shape(value)
            with self.subTest(value=value), patch('inside_inference.workload.Model') as model:
                with self.assertRaises(ValueError): run_workload(value)
                model.assert_not_called()

    def test_actual_execution_emits_events_and_deliveries_replay(self):
        result=run_workload()
        kinds=[event['payload']['kind'] for event in result['events']]
        count=result['declaration']['workload']['requests'][0]['request']['generation']['max_new_tokens']
        self.assertEqual(kinds,['request-arrived','input-encoded']+
            ['work-completed','token-selected','token-committed','token-delivered']*count+['request-finished'])
        self.assertEqual(result['clock'],{'kind':'execution-order'})
        output=deliveries(result,'r1')
        self.assertEqual([e['payload']['output_start'] for e in output],list(range(count)))
        self.assertEqual([i for e in output for i in e['payload']['token_ids']],result['traces'][0]['output_ids'])
        self.assertEqual(replay_workload(result),result)

    def test_causal_links_do_not_confuse_delivery_with_compute(self):
        run=run_workload();events=run['events']
        # arrival(0), encoding(1), work(2), selection(3), commit(4), delivery(5), work(6)
        self.assertEqual(events[5]['causes'],[events[4]['event_id']])
        self.assertEqual(events[6]['causes'],[events[4]['event_id']])
        self.assertNotIn(events[5]['event_id'],events[6]['causes'])
        self.assertEqual(events[-1]['causes'],[events[-4]['event_id'],events[-2]['event_id']])

    def test_tampered_causality_delivery_and_boundaries_fail(self):
        run=run_workload()
        mutations=[lambda r:r['events'][2].update(causes=[]),
                   lambda r:r['events'][0].update(request_id='r2'),
                   lambda r:r['events'][5]['payload'].update(display_delta='wrong'),
                   lambda r:r['events'][5]['payload'].update(output_start=3),
                   lambda r:r['events'].pop(4),
                   lambda r:r['clock'].update(kind='simulated'),
                   lambda r:r['traces'][0]['declaration']['request'].update(text='other')]
        for mutate in mutations:
            bad=copy.deepcopy(run);mutate(bad)
            with self.assertRaises(ValueError):validate_run(bad)

    def test_schema_has_no_stub_speculative_event(self):
        bad=run_workload();bad['events'][3]['payload']['kind']='token-proposed'
        with self.assertRaises(ValueError): validate_run(bad)
