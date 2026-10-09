"""Repository-owned file budgets; ignored source is still inspected."""
from collections import Counter
import os
from fnmatch import fnmatchcase
from pathlib import Path
from scripts.build.structured import read_yaml


def inventory(root, policy):
    paths = []
    for directory, folders, files in os.walk(root, followlinks=False):
        relative = Path(directory).relative_to(root)
        folders[:] = [name for name in folders if not any(fnmatchcase((relative/name).as_posix(), pattern) for pattern in policy['excluded_directories'])]
        paths.extend(relative/name for name in folders if (Path(directory)/name).is_symlink())
        for name in files:
            if Path(name).suffix in policy['excluded_file_suffixes']: continue
            paths.append(relative/name)
    return sorted(paths)


def load_limits(root):
    policy = read_yaml(root/'governance/limits.yaml')
    keys = {'version','files_per_folder','authored_file_bytes','generated_file_bytes','fixture_file_bytes','fixture_roots','excluded_directories','excluded_file_suffixes','fixture_extensions'}
    if not isinstance(policy,dict) or set(policy) != keys or policy['version'] != 1:
        raise ValueError('Malformed repository limits')
    for name in keys-{'version','fixture_roots','excluded_directories','excluded_file_suffixes','fixture_extensions'}:
        if type(policy[name]) is not int or policy[name] <= 0:
            raise ValueError(f'{name}: positive integer limit required')
    for key in ('fixture_roots','excluded_directories','excluded_file_suffixes','fixture_extensions'):
        if not isinstance(policy[key],list) or not all(isinstance(v,str) and v for v in policy[key]) or len(set(policy[key])) != len(policy[key]):
            raise ValueError(f'{key}: unique path list required')
    return policy


def audit_structure(root, policy, generated):
    failures = []
    paths = inventory(root, policy)
    for folder,count in Counter(str(p.parent) for p in paths).items():
        if count > policy['files_per_folder']:
            failures.append(f'{folder}: {count} files exceeds {policy["files_per_folder"]}')
    for path in paths:
        absolute = root/path
        if absolute.is_symlink():
            failures.append(f'{path}: repository-owned files cannot be symlinks'); continue
        name = path.as_posix()
        verified = name in generated and absolute.read_bytes() == generated[name].encode()
        fixture = path.suffix in policy['fixture_extensions'] and any(name.startswith(prefix) for prefix in policy['fixture_roots'])
        limit = policy['generated_file_bytes'] if verified else policy['fixture_file_bytes'] if fixture else policy['authored_file_bytes']
        if absolute.stat().st_size > limit:
            failures.append(f'{path}: file exceeds {limit} bytes')
        if name in generated and not verified:
            failures.append(f'{path}: stale generated authority; no generated-size allowance')
    return failures
