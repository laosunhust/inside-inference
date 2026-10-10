"""Gate complete Make workflows on approval-locked wall-time budgets."""
import argparse
import json
import subprocess
import time

from scripts import ROOT


WORKFLOWS = {'test': 'unit_test_wall_seconds',
             'test-integration': 'integration_test_wall_seconds'}


def outcome(workflow, elapsed, limit, returncode):
    return {'workflow': workflow, 'seconds': elapsed, 'limit_seconds': limit,
            'command_returncode': returncode, 'passed': returncode == 0 and elapsed <= limit}


def run(workflow):
    started = time.monotonic()
    # Include policy loading, governance, generation checks and all test phases.
    from scripts.check.governance.structure import load_limits
    limit = load_limits(ROOT)[WORKFLOWS[workflow]]
    command = subprocess.run(['make', '--no-print-directory', '_' + workflow], cwd=ROOT)
    result = outcome(workflow, time.monotonic() - started, limit, command.returncode)
    path = ROOT/'out/experiments/test-budgets'/f'{workflow}.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2) + '\n')
    print(f'{workflow}: {result["seconds"]:.2f}s / {limit}s wall-time budget', flush=True)
    if result['seconds'] > limit:
        print('Budget exceeded. Profile efficiency, redundancy and evaluation ROI before '
              'requesting owner approval to relax the limit.', flush=True)
    return 0 if result['passed'] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workflow', choices=WORKFLOWS)
    raise SystemExit(run(parser.parse_args().workflow))


if __name__ == '__main__':
    main()
