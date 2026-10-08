from pathlib import Path
import unittest
from scripts.check.layout import check_source


class WorkflowLayoutTests(unittest.TestCase):
    def test_wrong_owners_and_reverse_dependencies_fail(self):
        for path, source in [('scripts/misc.py',''),
                             ('inside_inference/example.py','from scripts.dev import serve_intro'),
                             ('scripts/build/example.py','import scripts.check.layout'),
                             ('scripts/build/example.py','from scripts import check'),
                             ('scripts/build/example.py','from ..check import layout'),
                             ('scripts/experiments/example.py','from scripts.dev import serve_intro')]:
            with self.subTest(path=path), self.assertRaises(ValueError):
                check_source(Path(path),source)

    def test_adapters_can_consume_core_and_checks_can_exercise_adapters(self):
        check_source(Path('scripts/build/example.py'),'from inside_inference import workload')
        check_source(Path('scripts/check/example.py'),'from scripts.dev import serve_intro')
