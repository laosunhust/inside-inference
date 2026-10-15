"""Declared experiments: admission counterexamples and the real execution composition rule."""
import copy
import unittest
from scripts import ROOT
from scripts.build.contracts import experiment_catalog, CATALOG
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema
from scripts.build.structured import read_yaml


class ExperimentCatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ontology, cls.spec = load_declarations(), load_schema()
        cls.catalog = read_yaml(ROOT / CATALOG)

    def admit(self, catalog):
        return experiment_catalog(ROOT, self.ontology, self.spec, catalog=catalog)

    def test_admitted_catalog_and_derived_status(self):
        experiments = self.admit(self.catalog)
        executable = {e['id'] for e in experiments if not e['missing_controls']}
        self.assertEqual(executable, {'kv-residency', 'kv-browser-timing', 'speculative-decoding'})
        self.assertIn('constrained-fleet', {e['id'] for e in experiments})

    def test_executable_settings_form_a_valid_execution(self):
        # The composition rule lives in the execution service; reuse it rather than copying it.
        from inside_inference.delivery.models import resolve_execution
        from inside_inference.declarations_generated import ExecutionSpec, EXPERIMENTS
        for experiment in self.admit(self.catalog):
            self.assertEqual(EXPERIMENTS[experiment['id']], experiment, 'generated registry is stale')
            if experiment['missing_controls']: continue
            for variant in experiment['variants']:
                spec = variant['input']['execution']
                ExecutionSpec.validate_shape(spec)
                resolved = resolve_execution(spec)
                self.assertEqual(bool(resolved['resources']), experiment['id'] == 'kv-residency')

    def test_kv_variants_change_only_reuse(self):
        variants=next(e for e in self.catalog['experiments'] if e['id']=='kv-browser-timing')['variants']
        left,right=[copy.deepcopy(v['input']) for v in variants]
        control=next(c for c in left['execution']['experiments'] if c['control']=='kv_reuse')
        self.assertFalse(control['value'])
        control['value']=True
        self.assertEqual(left,right)

    def test_rejects_invalid_experiments(self):
        def first(c): return next(e for e in c['experiments'] if e['id']=='kv-browser-timing')
        def setup(c): return first(c)['variants'][0]['input']
        cases = [
            (lambda c: c['experiments'].append(copy.deepcopy(first(c))), 'duplicate experiment id'),
            (lambda c: setup(c)['execution']['experiments'].append(copy.deepcopy(setup(c)['execution']['experiments'][0])), 'at most 1'),
            (lambda c: setup(c)['workload']['requests'][0]['request']['generation'].update(max_new_tokens=0), 'minimum'),
            (lambda c: setup(c).pop('workload'), 'workload'),
            (lambda c: setup(c)['execution']['experiments'].pop(), 'too short'),
            (lambda c: setup(c)['execution']['experiments'].append(copy.deepcopy(next(e for e in c['experiments'] if e['id']=='kv-residency')['variants'][0]['input']['execution']['experiments'][2])), 'contain'),
            (lambda c: first(c).update(variants=[]), 'variants'),
            (lambda c: first(c).update(missing_controls=['future_control']), 'variants'),
            (lambda c: first(c).update(missing_controls=['kv_reuse'],variants=[]), 'declared controls'),
            (lambda c: first(c).update(evidence=['docs/missing.md']), 'missing file'),
            (lambda c: first(c)['ontology_binding'].update(primary='Invented'), 'ontology_binding'),
            (lambda c: first(c)['contract'].pop('omissions'), 'omissions'),
            (lambda c: first(c).update(status='planned'), 'status'),
            (lambda c: first(c)['sources'].append({'title': 'x', 'url': 'http://insecure'}), 'url'),
        ]
        for mutation, message in cases:
            with self.subTest(message=message):
                changed = copy.deepcopy(self.catalog)
                mutation(changed)
                with self.assertRaisesRegex(ValueError, message):
                    self.admit(changed)


if __name__ == '__main__':
    unittest.main()
