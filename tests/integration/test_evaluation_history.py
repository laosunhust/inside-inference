"""Real Git adapter coverage; structural counterexamples live in unit tests."""
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from scripts.check.governance.evaluation import committed_evaluations, evidence_reference


class EvaluationHistoryTests(unittest.TestCase):
    def test_committed_rewrite_is_detected_and_missing_history_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            def git(*args):
                return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL).decode().strip()
            git('init');git('config','user.name','Evaluation fixture');git('config','user.email','fixture@example.invalid')
            old=root/'governance/evaluations.yaml';old.parent.mkdir()
            old.write_text('version: 1\nwork_item: legacy\n')
            git('add','.');git('commit','-m','Legacy criteria')
            anchor=git('rev-parse','HEAD')
            evidence=root/'engine.py';evidence.write_text('original computation')
            git('add','.');git('commit','-m','Evidence')
            evidence.unlink();git('add','-u');git('commit','-m','Retire superseded implementation')
            evidence_reference(root,'engine.py')
            with self.assertRaisesRegex(ValueError,'Missing historical'):
                evidence_reference(root,'never-existed.py')
            (root/'engine.py').symlink_to(root/'absent')
            with self.assertRaisesRegex(ValueError,'Invalid evaluation'):
                evidence_reference(root,'engine.py')
            (root/'engine.py').unlink()
            target='governance/evaluations/records/test/new.yaml'
            path=root/target;path.parent.mkdir(parents=True);path.write_text('version: 1\nwork_item: new\n')
            git('add','.');git('commit','-m','New criteria')
            with patch('scripts.check.governance.evaluation.ANCHOR',anchor):
                expected=committed_evaluations(root)
                self.assertEqual(expected[target],path.read_bytes())
                self.assertEqual(expected[f'governance/evaluations/records/legacy/{anchor[:12]}-legacy.yaml'],old.read_bytes())
                path.write_text('version: 1\nwork_item: replaced\n')
                git('add','.');git('commit','-m','Invalid overwrite')
                with self.assertRaisesRegex(ValueError,'committed evaluation was rewritten'):
                    committed_evaluations(root)
            with patch('scripts.check.governance.evaluation.ANCHOR','0'*40):
                with self.assertRaisesRegex(ValueError,'intact Git history'):
                    committed_evaluations(root)
