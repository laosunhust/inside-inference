"""Check approved governance bytes; human authorization remains a review boundary.

Adapted from CNCRover's file-lock.js; provenance is in governance/reuse.yaml.
No checker writes or refreshes its own approval manifest.
"""
import hashlib
from pathlib import PurePosixPath
import re
from scripts.build.structured import read_yaml


MANIFEST = 'governance/approval-lock.yaml'
PROTECTED = (
    'AGENTS.md', 'governance/limits.yaml',
    'scripts/__init__.py', 'scripts/build/contracts.py', 'scripts/build/ontology.py',
    'scripts/build/structured.py', 'scripts/build/generate_data_models.py',
    'scripts/build/compile_validators.mjs', 'scripts/check/layout.py',
    'scripts/check/make_interface.py',
    'scripts/check/governance/__init__.py', 'scripts/check/governance/__main__.py',
    'scripts/check/governance/structure.py', 'scripts/check/governance/interfaces.py',
    'scripts/check/governance/evaluation.py', 'scripts/check/governance/locks.py',
    'tests/unit/contracts/test_governance.py',
    'tests/unit/contracts/test_governance_locks.py',
)


def protected_paths(root):
    # New enforcement modules cannot silently escape the locked inventory.
    return set(PROTECTED) | {
        p.relative_to(root).as_posix()
        for p in (root/'scripts/check/governance').glob('*.py')
    }


def safe_path(name):
    return (isinstance(name, str) and bool(name) and '\\' not in name and '\0' not in name
            and not PurePosixPath(name).is_absolute() and '..' not in PurePosixPath(name).parts
            and name != '.' and PurePosixPath(name).as_posix() == name)


def regular_file(root, name):
    path = root/name
    return path.is_file() and not any(p.is_symlink() for p in (path, *path.parents) if p != root and root in p.parents)


def audit_locks(root):
    if not regular_file(root, MANIFEST):
        return [f'{MANIFEST}: missing or non-regular approval manifest']
    manifest = read_yaml(root/MANIFEST)
    if not isinstance(manifest, dict) or set(manifest) != {'version', 'approval', 'files'} or manifest['version'] != 1:
        raise ValueError('Malformed governance approval manifest')
    approval = manifest['approval']
    if (not isinstance(approval, dict) or set(approval) != {'source', 'scope'}
            or not all(isinstance(v, str) and v.strip() for v in approval.values())):
        raise ValueError('Governance lock requires recorded approval source and scope')
    files = manifest['files']
    if not isinstance(files, dict) or not files:
        raise ValueError('Governance lock requires a nonempty file/hash map')
    failures = []
    if set(files) != protected_paths(root):
        failures.append('Approval lock inventory differs from protected authorities; missing or stale grants')
    for name, expected in files.items():
        if not safe_path(name):
            failures.append('Approval lock contains an unsafe relative path'); continue
        if not isinstance(expected, str) or not re.fullmatch('[a-f0-9]{64}', expected):
            failures.append(f'{name}: invalid approval hash'); continue
        if not regular_file(root, name):
            failures.append(f'{name}: missing or non-regular protected file'); continue
        actual = hashlib.sha256((root/name).read_bytes()).hexdigest()
        if actual != expected:
            failures.append(f'{name}: approval-locked content changed (expected {expected}, actual {actual}); explicit owner authorization is required to update the lock')
    return failures
