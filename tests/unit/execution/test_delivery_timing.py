"""Timing metadata travels alongside structured responses; invalid operations still fail."""
import unittest
from unittest.mock import patch

from inside_inference.delivery import service
from inside_inference.declarations_generated import PythonExecutionTiming


class DeliveryTimingTests(unittest.IsolatedAsyncioTestCase):
    async def test_serialization_and_invalid_input(self):
        value = {'text': 'café', 'values': [1, 0.25]}

        class Catalog:
            calls = 0

            async def load_catalog(self):
                self.calls += 1
                return value

        catalog = Catalog()
        with patch.object(service, '_service', catalog):
            result, timing = await service.execute_browser('modelCatalog', None)
            self.assertEqual(result, value)
            self.assertGreaterEqual(timing['operation_ms'], timing['operation_validation_ms'])
            PythonExecutionTiming.validate_shape(timing)
            for name, raw in [('modelCatalog', {}), ('generateToken', {}), ('unknown', None)]:
                with self.assertRaises(ValueError):
                    await service.execute_browser(name, raw)
            self.assertEqual(catalog.calls, 1, 'Failed admission cannot execute the operation')
