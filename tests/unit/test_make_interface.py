"""Help comes from Makefile rules; public names are approval-locked."""
import unittest
from scripts.check.make_interface import ROOT, inventory


class MakeInterfaceTests(unittest.TestCase):
    def test_repository_help_is_derived_from_rules(self):
        public = inventory((ROOT / 'Makefile').read_text())
        self.assertEqual(set(public), {'setup', 'serve-intro', 'test', 'test-integration'})

    def test_internal_workflows_remain_extensible(self):
        source = (ROOT/'Makefile').read_text()
        self.assertEqual(inventory(source), inventory(source+'\n_internal:\n.PHONY: _internal\n'))
        with self.assertRaises(ValueError): inventory(source+'\n_hidden: ## Exposed\n.PHONY: _hidden\n')

    def test_help_changes_with_its_owning_recipe(self):
        source = (ROOT/'Makefile').read_text().replace('## Install locked Python and build-tool dependencies locally.', '## Prepare local dependencies.')
        self.assertEqual(inventory(source)['setup'], 'Prepare local dependencies.')
