"""Visibility is enforced from the Makefile, not a second list of commands."""
import unittest
from scripts.check.make_interface import ROOT, inventory


class MakeInterfaceTests(unittest.TestCase):
    def test_repository_help_is_derived_from_rules(self):
        public = inventory((ROOT / 'Makefile').read_text())
        self.assertTrue(public)
        self.assertTrue(all(not name.startswith('_') for name in public))

    def test_new_workflow_requires_an_explicit_visibility_choice(self):
        for text in ('surprise:\n.PHONY: surprise',
                     '_hidden: ## Should not be public\n.PHONY: _hidden',
                     'run: ## Run it\n',
                     '.PHONY: missing\n', 'hidden alias:\n', 'Hidden:\n'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                inventory(text)
        self.assertEqual(inventory('run: ## Run it\n_internal:\n.PHONY: run _internal'), {'run':'Run it'})

    def test_help_changes_with_its_owning_recipe(self):
        self.assertEqual(inventory('new-command: ## New behavior\n.PHONY: new-command'),
                         {'new-command':'New behavior'})
