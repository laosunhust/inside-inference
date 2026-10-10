"""Reject misleading scenario identities and chronology without claiming execution."""
from copy import deepcopy
import unittest

from inside_inference.declarations_generated import CacheEvent, InferenceRequest, InferenceSystem
from inside_inference.scenarios import validate_customer_interaction, validate_resource_graph
from inside_inference.cache_lab import default_experiment, run_cache_experiment


def graph():
    return dict(basis='hypothetical', nodes=[dict(id=name, memory_capacity_bytes=1024,
        compute_flops_per_us=1000, memory_bytes_per_us=100) for name in ('prefill', 'decode')],
        links=[dict(id='handoff', source='prefill', target='decode',
                    bandwidth_bytes_per_us=100, startup_us=10)])


def interaction():
    return dict(clock='scenario-virtual-us', actions=[
        dict(kind='submit', at_us=0, request_id='r1', request=InferenceRequest().to_dict()),
        dict(kind='consume', at_us=10, request_id='r1', output_bytes=4),
        dict(kind='cancel', at_us=11, request_id='r1'),
        dict(kind='consume', at_us=12, request_id='r1', output_bytes=8)])


class ScenarioTests(unittest.TestCase):
    def test_cache_event_fields_identify_mechanism_without_parsing_detail(self):
        event = dict(event_id='e1', request_id='r1', time_us=0, kind='compute-start',
            state_id=None, bytes=0, device_reserved_bytes=0, host_retained_bytes=0,
            detail='', causes=[], phase='prefill', transfer_direction=None)
        CacheEvent.from_dict(event)
        for field, value in [('phase', None), ('transfer_direction', 'host-to-device')]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                CacheEvent.from_dict(dict(event, **{field:value}))
        event.update(kind='transfer-start', phase=None, transfer_direction='host-to-device')
        CacheEvent.from_dict(event)

    def test_graph_preserves_direction_units_and_rejects_bad_identity(self):
        self.assertEqual(validate_resource_graph(graph()).to_dict(), graph())
        for change in ('duplicate-node', 'duplicate-link', 'missing-endpoint', 'self-link', 'zero-rate'):
            value = graph()
            if change == 'duplicate-node': value['nodes'].append(deepcopy(value['nodes'][0]))
            if change == 'duplicate-link': value['links'].append(deepcopy(value['links'][0]))
            if change == 'missing-endpoint': value['links'][0]['target'] = 'missing'
            if change == 'self-link': value['links'][0]['target'] = 'prefill'
            if change == 'zero-rate': value['links'][0]['bandwidth_bytes_per_us'] = 0
            with self.subTest(change=change), self.assertRaises(ValueError): validate_resource_graph(value)
        value = graph(); value['links'] = []
        # Disconnected locations are legal; no route or placement feasibility is invented.
        validate_resource_graph(value)

    def test_actions_preserve_cancel_intent_and_allow_buffered_consumption(self):
        self.assertEqual(validate_customer_interaction(interaction()).to_dict(), interaction())
        for change in ('unknown-request', 'duplicate-submit', 'backward-time', 'decreasing-consumption'):
            value = interaction()
            if change == 'unknown-request': value['actions'][1]['request_id'] = 'missing'
            if change == 'duplicate-submit': value['actions'].insert(1, deepcopy(value['actions'][0]))
            if change == 'backward-time': value['actions'][2]['at_us'] = 1
            if change == 'decreasing-consumption': value['actions'][3]['output_bytes'] = 1
            with self.subTest(change=change), self.assertRaises(ValueError): validate_customer_interaction(value)

    def test_existing_engines_do_not_silently_accept_new_scenarios(self):
        for key, value in [('resource_graph', graph()), ('customer_interaction', interaction())]:
            spec = default_experiment(); spec['system'][key] = value
            with self.assertRaises(ValueError): run_cache_experiment(spec)
        legacy = InferenceSystem().to_dict(); legacy['arrival_policy'] = 'single-at-zero'
        with self.assertRaises(ValueError): InferenceSystem.from_dict(legacy)
