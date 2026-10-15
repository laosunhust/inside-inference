"""Prepared settings are immutable; only admitted session token inputs can execute."""
import copy
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import numpy as np
from inside_inference.declarations_generated import EXPERIMENTS, GenerationAdvance
from inside_inference.delivery.models import ModelService
from inside_inference.delivery.service import execute_model
from inside_inference.runtimes.engine import Trace


class PreparedTests(unittest.IsolatedAsyncioTestCase):
    def fixture(self):
        source = copy.deepcopy(EXPERIMENTS['kv-browser-timing']['variants'][1]['input'])
        service = ModelService('file:///', None)
        service.catalog = {}
        model_id = next(x['value'] for x in source['execution']['experiments'] if x['control'] == 'model')
        service.model = {'id': model_id, 'architecture': {'context': 8, 'vocabulary': 4},
                         'inspection': 'logits', 'weights': {'sha256': 'a'*64},
                         'tokenizer': {'sha256': 'b'*64}, 'stop_ids': [0]}
        service.tokenizer = SimpleNamespace(encode=lambda text: [1, 2], piece=lambda i: str(i), decode=lambda ids, previous: 'x')
        service.decoder = SimpleNamespace(prefix=[], run=lambda ids, reuse, capture: {
            'logits': np.array([0., 0., 1., 0.]), 'trace': Trace(False),
            'work': {'processed_positions': len(ids), 'reused_positions': 0, 'matmul_flops': 0.}})
        return service, source

    async def test_immutable_settings_and_no_control_readmission(self):
        service, source = self.fixture()
        prepared = await execute_model(service, 'prepareGeneration', source)
        advance = {'session_id': prepared['session_id'], 'prefix_ids': [1, 2], 'output_ids': []}
        source['execution']['experiments'][0]['value'] = 'mutated'
        with patch('inside_inference.delivery.models.resolve_execution', side_effect=AssertionError('Hot-path control resolution')):
            result = await execute_model(service, 'generateToken', advance)
        self.assertNotEqual(result['request']['execution'], source['execution'])
        self.assertEqual(result['selected_id'], 2)
        self.assertIsInstance(result['logits'], np.ndarray)
        self.assertIsInstance(result['probabilities'], np.ndarray)
        advance['prefix_ids'][0] = 3
        self.assertEqual(result['request']['prefix_ids'], [1, 2], 'Input mutation cannot rewrite retained evidence')

    async def test_stale_and_invalid_steps(self):
        service, source = self.fixture()
        old = await execute_model(service, 'prepareGeneration', source)
        new = await execute_model(service, 'prepareGeneration', source)
        self.assertNotEqual(old['session_id'], new['session_id'])
        for advance in [
            {'session_id': old['session_id'], 'prefix_ids': [1], 'output_ids': []},
            {'session_id': new['session_id'], 'prefix_ids': [4], 'output_ids': []},
            {'session_id': new['session_id'], 'prefix_ids': [1]*9, 'output_ids': []},
            {'session_id': new['session_id'], 'prefix_ids': [1], 'output_ids': [0]},
            {'session_id': new['session_id'], 'prefix_ids': [], 'output_ids': []},
            {'session_id': new['session_id'], 'prefix_ids': [True], 'output_ids': []},
            {'session_id': new['session_id'], 'prefix_ids': [1], 'output_ids': [], 'execution': source['execution']},
        ]:
            with self.subTest(advance=advance), self.assertRaises(ValueError):
                await execute_model(service, 'generateToken', advance)
        service.prepared = None
        with self.assertRaisesRegex(ValueError, 'Stale or missing'):
            await execute_model(service, 'generateToken', {'session_id': new['session_id'], 'prefix_ids': [1], 'output_ids': []})
