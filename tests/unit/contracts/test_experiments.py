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
        self.assertEqual(executable, {'reference-execution', 'kv-residency'})
        self.assertIn('constrained-fleet', {e['id'] for e in experiments})

    def test_executable_settings_form_a_valid_execution(self):
        # The composition rule lives in the execution service; reuse it rather than copying it.
        from inside_inference.delivery.models import resolve_execution
        from inside_inference.declarations_generated import ExecutionSpec, EXPERIMENTS
        for experiment in self.admit(self.catalog):
            self.assertEqual(EXPERIMENTS[experiment['id']], experiment, 'generated registry is stale')
            if experiment['missing_controls']: continue
            spec = {'experiments': experiment['settings']}
            ExecutionSpec.validate_shape(spec)
            resolved = resolve_execution(spec)
            self.assertEqual(bool(resolved['resources']), experiment['id'] == 'kv-residency')

    def test_rejects_invalid_experiments(self):
        def first(c): return c['experiments'][0]
        cases = [
            (lambda c: c['experiments'].append(copy.deepcopy(first(c))), 'duplicate experiment id'),
            (lambda c: first(c)['settings'].append(copy.deepcopy(first(c)['settings'][0])), 'assigned once'),
            (lambda c: first(c).update(missing_controls=['kv_reuse']), 'declared controls'),
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
