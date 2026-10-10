"""Fetch or verify one pinned upstream source checkout; never install or run it."""
import argparse
from pathlib import Path
import re
import subprocess
from scripts import ROOT


def git(path, *args):
    return subprocess.check_output(['git', '-C', str(path), *args], text=True).strip()


def checkout(name, url, revision):
    if not re.fullmatch(r'[a-z0-9-]+', name) or not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('Expected a simple reference name and full commit identity')
    parent = ROOT / 'references'
    if parent.is_symlink():
        raise ValueError('Reference directory must not be a symlink')
    parent.mkdir(exist_ok=True)
    path = parent / name
    if path.is_symlink():
        raise ValueError('Reference checkout must not be a symlink')
    if not path.exists():
        path.mkdir()
        git(path, 'init', '-q')
        git(path, 'remote', 'add', 'origin', url)
        git(path, 'fetch', '--depth=1', 'origin', revision)
        git(path, 'checkout', '--detach', 'FETCH_HEAD')
    if (not (path / '.git').is_dir() or git(path, 'remote', 'get-url', 'origin') != url
            or git(path, 'rev-parse', 'HEAD') != revision or git(path, 'status', '--porcelain')):
        raise ValueError(f'{path}: checkout differs from its pin or has local changes; inspect manually')
    print(f'{name}: {revision} (source reference only)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('name')
    parser.add_argument('url')
    parser.add_argument('revision')
    args = parser.parse_args()
    checkout(args.name, args.url, args.revision)
