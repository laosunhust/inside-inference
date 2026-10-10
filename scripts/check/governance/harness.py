"""Enforce in-process unit scope and retain per-test timing evidence."""
import ast
from contextlib import contextmanager
import json
from pathlib import Path
import sys
import time
import unittest
from unittest.mock import patch

from scripts import ROOT

_unit_active = False


def _audit(event, args):
    if _unit_active and (event in ('subprocess.Popen', 'os.system', 'os.posix_spawn')
                         or event in ('socket.bind', 'socket.connect', 'socket.getaddrinfo')):
        raise RuntimeError(f'Unit scope forbids {event}; move cross-boundary coverage to tests/integration')


sys.addaudithook(_audit)


@contextmanager
def unit_scope():
    global _unit_active
    previous = _unit_active
    _unit_active = True
    try:
        yield
    finally:
        _unit_active = previous


def check_unit_source(source, label):
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            names = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            names = [(node.module or '') + '.' + a.name for a in node.names]
        else:
            continue
        for name in names:
            if name == 'scripts.build.intro_page' or name.startswith('scripts.build.intro_page.'):
                raise ValueError(f'{label}: website assembly belongs in tests/integration')
            if name.startswith(('inside_inference.corpus', 'inside_inference.language_data',
                                'inside_inference.preparation', 'scripts.experiments.prepare_',
                                'scripts.experiments.vocabulary_study')):
                raise ValueError(f'{label}: dataset/training preparation belongs in tests/preparation')


def audit_scope(root):
    failures = []
    for path in (root/'tests/unit').rglob('*.py'):
        try: check_unit_source(path.read_text(), path.relative_to(root))
        except ValueError as exc: failures.append(str(exc))
    return failures


class TimedResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.timings = []

    def startTest(self, test):
        self.started = time.perf_counter()
        super().startTest(test)

    def stopTest(self, test):
        self.timings.append({'test': test.id(), 'seconds': time.perf_counter()-self.started})
        super().stopTest(test)


def run_suite(suite, report):
    start = time.perf_counter()
    result = unittest.TextTestRunner(verbosity=2, resultclass=TimedResult).run(suite)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({'passed': result.wasSuccessful(),
        'seconds': time.perf_counter()-start, 'tests': result.timings}, indent=2))
    return result.wasSuccessful()


def main():
    failures = audit_scope(ROOT)
    if failures: raise SystemExit('\n'.join(failures))
    # Git is an external provenance input, not a numerical component. Integration
    # exercises its real adapter; unit tests use an explicit revision-label fixture.
    with unit_scope(), patch('inside_inference.provenance.revision', return_value='unit-test-revision'):
        suite = unittest.defaultTestLoader.discover(str(ROOT/'tests/unit'))
        passed = run_suite(suite, ROOT/'out/experiments/integration/unit-timing.json')
    if not passed: raise SystemExit(1)


if __name__ == '__main__': main()
