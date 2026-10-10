import copy
import unittest
from tests.fixtures.execution import small_workload
from unittest.mock import patch

from inside_inference.model import Model
from inside_inference.declarations_generated import Workload, RunEvent
from inside_inference.workload import default_workload, publications, run_workload, validate_run


class WorkloadTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline = small_workload()

    def setUp(self):
        self.record = copy.deepcopy(self.baseline)

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

    def test_actual_execution_emits_events_and_publications(self):
        result=self.record
        kinds=[event['payload']['kind'] for event in result['events']]
        count=result['declaration']['workload']['requests'][0]['request']['generation']['max_new_tokens']
        self.assertEqual(kinds,['request-arrived','input-encoded']+
            ['model-forward-completed','token-selected','token-published']*count+['request-finished'])
        self.assertEqual(result['clock'],{'kind':'execution-order'})
        output=publications(result,'r1')
        self.assertEqual([e['payload']['output_start'] for e in output],list(range(count)))
        self.assertEqual([i for e in output for i in e['payload']['token_ids']],result['traces'][0]['output_ids'])

    def test_causal_links_do_not_confuse_publication_with_compute(self):
        run=self.record;events=run['events']
        # arrival(0), encoding(1), forward(2), selection(3), publication(4), forward(5)
        self.assertEqual(events[4]['causes'],[events[3]['event_id']])
        self.assertEqual(events[5]['causes'],[events[3]['event_id']])
        self.assertNotIn(events[4]['event_id'],events[5]['causes'])
        self.assertEqual(events[-1]['causes'],[events[-3]['event_id'],events[-2]['event_id']])

    def test_tampered_causality_publication_and_boundaries_fail(self):
        run=self.record
        mutations=[lambda r:r['events'][2].update(causes=[]),
                   lambda r:r['events'][0].update(request_id='r2'),
                   lambda r:r['events'][4]['payload'].update(display_delta='wrong'),
                   lambda r:r['events'][4]['payload'].update(output_start=3),
                   lambda r:r['events'].pop(4),
                   lambda r:r['clock'].update(kind='simulated'),
                   lambda r:r['traces'][0]['declaration']['request'].update(text='other')]
        for mutate in mutations:
            bad=copy.deepcopy(run);mutate(bad)
            with self.assertRaises(ValueError):validate_run(bad)

    def test_schema_has_no_duplicate_commitment_or_stub_speculative_event(self):
        run = self.record
        for kind in ('token-proposed', 'token-committed'):
            bad = copy.deepcopy(run['events'][3]); bad['payload']['kind'] = kind
            with self.assertRaises(ValueError): RunEvent.from_dict(bad)

    def test_context_capacity_is_admission_error_not_silent_early_stop(self):
        workload=default_workload().to_dict()
        workload['requests'][0]['request']['text']='cat '*62
        with patch.object(Model,'forward') as forward:
            with self.assertRaisesRegex(ValueError,'token budget'):run_workload(workload)
            forward.assert_not_called()
