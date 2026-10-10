import socket
import subprocess
import sys
import unittest

from scripts.check.governance.harness import check_unit_source, unit_scope


class HarnessTests(unittest.TestCase):
    def test_indirect_process_and_network_work_are_rejected(self):
        with unit_scope():
            with self.assertRaisesRegex(RuntimeError, 'tests/integration'):
                subprocess.run([sys.executable, '-c', 'raise SystemExit(99)'], check=True)
            with socket.socket() as connection:
                with self.assertRaisesRegex(RuntimeError, 'socket.bind'):
                    connection.bind(('127.0.0.1', 0))
                with self.assertRaisesRegex(RuntimeError, 'socket.connect'):
                    connection.connect(('127.0.0.1', 1))

    def test_build_and_preparation_imports_are_rejected(self):
        for source in ('from scripts.build.intro_page import build as render',
                       'from scripts.build import intro_page',
                       'import inside_inference.corpus',
                       'from inside_inference import preparation'):
            with self.subTest(source=source), self.assertRaises(ValueError):
                check_unit_source(source, 'tests/unit/bad.py')
        check_unit_source('from inside_inference.model import Model', 'tests/unit/good.py')

    def test_workflows_cannot_bypass_scope(self):
        from scripts import ROOT
        from scripts.check.make_interface import check_governance_workflows
        source = (ROOT/'Makefile').read_text()
        for altered in (source.replace('-m scripts.check.governance.harness', '-m unittest discover'),
                        source.replace('--integration-tests', '')):
            with self.assertRaises(ValueError): check_governance_workflows(altered)

    def test_wall_budget_boundaries_and_command_failure(self):
        import io
        import json
        from contextlib import redirect_stdout
        from pathlib import Path
        import tempfile
        from types import SimpleNamespace
        from unittest.mock import patch
        from scripts.check.governance import budget
        limits = {'unit_test_wall_seconds': 10, 'integration_test_wall_seconds': 100}
        for workflow, limit in (('test', 10), ('test-integration', 100)):
            for elapsed, code, passed in ((limit, 0, True), (limit + .001, 0, False), (0, 1, False)):
                with self.subTest(workflow=workflow, elapsed=elapsed, code=code), tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    with patch.object(budget, 'ROOT', root), patch.object(budget.time, 'monotonic', side_effect=[0, elapsed]), \
                            patch('scripts.check.governance.structure.load_limits', return_value=limits), \
                            patch.object(budget.subprocess, 'run', return_value=SimpleNamespace(returncode=code)) as command, \
                            redirect_stdout(io.StringIO()) as output:
                        self.assertEqual(budget.run(workflow), 0 if passed else 1)
                    command.assert_called_once_with(['make', '--no-print-directory', '_' + workflow], cwd=root)
                    record = json.loads((root/'out/experiments/test-budgets'/f'{workflow}.json').read_text())
                    self.assertEqual(record['passed'], passed)
                    self.assertEqual(record['seconds'], elapsed)
                    if elapsed > limit:
                        self.assertIn('efficiency, redundancy and evaluation ROI', output.getvalue())

    def test_public_workflows_cannot_bypass_budget(self):
        from scripts import ROOT
        from scripts.check.make_interface import check_governance_workflows
        source = (ROOT/'Makefile').read_text()
        for workflow in ('test', 'test-integration'):
            bad = source.replace('scripts.check.governance.budget ' + workflow,
                                 'scripts.check.governance.harness')
            with self.assertRaisesRegex(ValueError, 'wall-time gate'):
                check_governance_workflows(bad)
