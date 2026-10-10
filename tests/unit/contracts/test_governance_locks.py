"""Negative probes of approval-locked governance; no authority is rewritten."""
import hashlib
from pathlib import Path
import shutil
import tempfile
import unittest
import yaml
from scripts import ROOT
from scripts.build.structured import read_yaml
from scripts.check.governance.locks import MANIFEST, audit_locks
from scripts.check.governance.__main__ import audit


class ApprovalLockTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.manifest = read_yaml(ROOT/MANIFEST)
        for name in [MANIFEST, *self.manifest['files']]:
            target = self.root/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)

    def write_manifest(self):
        (self.root/MANIFEST).write_text(yaml.safe_dump(self.manifest, sort_keys=False))

    def test_unchanged_approved_files_pass(self):
        self.assertEqual(audit_locks(self.root), [])

    def test_makefile_and_ontology_are_not_approval_locked(self):
        for name in ('Makefile', 'docs/ontology/declarations.yaml',
                     'data-model/declarations.yaml', 'docs/ontology/model.yaml'):
            self.assertNotIn(name, self.manifest['files'])
            path = self.root/name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('Editable content; separate structural checks apply.\n')
        self.assertEqual(audit_locks(self.root), [])

    def test_workflows_must_retain_governance_dependencies(self):
        from scripts.check.make_interface import check_governance_workflows
        source = (ROOT/'Makefile').read_text()
        check_governance_workflows(source + '\n# An ordinary Makefile edit\n')
        for broken in (
            source.replace('test: _governance-check', 'test:'),
            source.replace('test-integration: check test', 'test-integration:'),
            source.replace('@$(PYTHON) -m scripts.check.governance', '@true'),
        ):
            with self.assertRaises(ValueError): check_governance_workflows(broken)

    def test_mutating_any_protected_file_blocks_without_repair(self):
        for name in self.manifest['files']:
            with self.subTest(name=name):
                path = self.root/name
                original = path.read_bytes()
                path.write_bytes(original+b'\n# unauthorized change\n')
                self.assertTrue(any(name in f for f in audit_locks(self.root)))
                self.assertNotEqual(path.read_bytes(), original)
                path.write_bytes(original)
        # Normal governance admission checks the locks before trusting altered limits.
        path = self.root/'governance/limits.yaml'
        path.write_text(path.read_text().replace('files_per_folder: 18', 'files_per_folder: 999'))
        self.assertTrue(any('approval-locked' in f for f in audit(self.root)))

    def test_missing_grants_and_new_enforcement_files_fail(self):
        self.manifest['files'].pop('AGENTS.md')
        self.write_manifest()
        self.assertTrue(any('inventory' in f for f in audit_locks(self.root)))
        self.manifest = read_yaml(ROOT/MANIFEST)
        self.write_manifest()
        (self.root/'scripts/check/governance/new_gate.py').write_text('')
        self.assertTrue(any('inventory' in f for f in audit_locks(self.root)))

    def test_missing_files_symlinks_and_malformed_entries_fail(self):
        path = self.root/'AGENTS.md'
        original = path.read_bytes()
        path.unlink()
        self.assertTrue(audit_locks(self.root))
        target = self.root/'other.md'; target.write_bytes(original)
        path.symlink_to(target)
        self.assertTrue(audit_locks(self.root))
        path.unlink(); path.write_bytes(original)
        for name, digest in [('../outside', 'a'*64), ('/absolute', 'a'*64),
                             ('./AGENTS.md', 'a'*64), ('AGENTS.md', 'not-a-hash')]:
            with self.subTest(name=name):
                self.manifest = read_yaml(ROOT/MANIFEST)
                self.manifest['files'][name] = digest
                self.write_manifest()
                self.assertTrue(audit_locks(self.root))

    def test_lock_requires_approval_record_and_accepts_explicit_new_baseline(self):
        self.manifest['approval']['scope'] = ''
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'approval'): audit_locks(self.root)
        self.manifest = read_yaml(ROOT/MANIFEST)
        path = self.root/'AGENTS.md'; path.write_text('Approved replacement fixture\n')
        self.manifest['approval'] = {'source':'test fixture only', 'scope':'Replace fixture constitution'}
        self.manifest['files']['AGENTS.md'] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.write_manifest()
        self.assertEqual(audit_locks(self.root), [])
        # This verifies consistency, not authenticity of the approval source.
