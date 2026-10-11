import copy
import unittest

from inside_inference.delivery.codec import publish, restore
from inside_inference.delivery.store import MemoryStore, get, put
from inside_inference.declarations_generated import MODELS
from inside_inference.model import canonical
from tests.fixtures.execution import small_workload


class DeliveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.record = small_workload()

    def test_storage_projection_round_trip_and_exact_row_sharing(self):
        store = MemoryStore()
        receipt = publish(self.record, store)
        self.assertEqual(canonical(restore(receipt, store)), canonical(self.record))
        archive = get(store, receipt['archive'])
        for p in archive['record']['traces'][0]['passes']:
            projection = next(n for n in p['nodes'] if n['operation']['name'] == 'logits')
            self.assertEqual(p['selection']['raw_logits'], projection['values'][-1])
        detached = get(store, receipt['archive'])
        detached['record']['id'] = 'mutated caller copy'
        self.assertEqual(get(store, receipt['archive'])['record']['id'], self.record['id'])
        before = dict(store.objects)
        self.assertEqual(publish(self.record, store), receipt)
        self.assertEqual(store.objects, before)
        self.assertLess(len(canonical(receipt)), 1024)

    def test_missing_corrupt_and_invalid_row_references_fail(self):
        store = MemoryStore(); receipt = publish(self.record, store)
        key = receipt['archive']['sha256']; original = store.objects.pop(key)
        with self.assertRaises(FileNotFoundError): restore(receipt, store)
        store.objects[key] = original + b' '
        with self.assertRaisesRegex(ValueError, 'digest'): restore(receipt, store)
        store.objects[key] = original
        archive = get(store, receipt['archive'])
        archive['record']['traces'][0]['passes'][0]['selection']['raw_logits'] = 999999
        bad = dict(receipt, archive=put(store, 'ExecutionArchive', archive))
        with self.assertRaisesRegex(ValueError, 'row'): restore(bad, store)
        archive = get(store, receipt['archive'])
        table = get(store, archive['tensors'])
        index = archive['record']['traces'][0]['passes'][0]['selection']['raw_logits']
        table['rows'][index][0] = True  # Valid table cell, invalid selection score.
        archive['tensors'] = put(store, 'TensorTable', table)
        invalid = dict(receipt, archive=put(store, 'ExecutionArchive', archive))
        with self.assertRaises(ValueError): restore(invalid, store)
        with self.assertRaises(ValueError): get(store, {'schema':'TensorTable','sha256':'../escape'})
        from unittest.mock import patch
        with patch.object(store,'write',side_effect=OSError('storage unavailable')):
            with self.assertRaises(OSError): publish(self.record,store)

    def test_storage_projections_cannot_silently_diverge_from_numerical_records(self):
        # Only the listed edges change representation; all other fields, owners,
        # requirements and constraints must remain identical to their originals.
        fields = {'TensorObservation':('values',), 'TokenSelection':('raw_logits','probabilities'),
                  'NumericalPass':('nodes','selection'), 'NumericalTrace':('checkpoint','vocabulary','passes'),
                  'RunRecord':('traces',), 'TokenStepResult':('checkpoint','computation')}
        definitions = MODELS['RunRecord']._definitions
        for name, changed in fields.items():
            a, b = copy.deepcopy(definitions[name]), copy.deepcopy(definitions['Stored'+name])
            for field in changed: b['properties'][field] = a['properties'][field]
            self.assertEqual(a, b, name)
