"""Seal an already-tested static site using the standard SHA256SUMS format."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
from scripts import ROOT


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def safe_name(name):
    path = PurePosixPath(name)
    if (not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]*', name)
            or '..' in path.parts or str(path) != name):
        raise ValueError('Unsafe release path: ' + name)
    return name


def checksums(site):
    lines = []
    for path in sorted(site.rglob('*')):
        if path.is_symlink(): raise ValueError('Release symlinks are forbidden')
        if not path.is_file() or path == site/'SHA256SUMS': continue
        name = safe_name(path.relative_to(site).as_posix())
        lines.append(digest(path.read_bytes()) + '  ' + name + '\n')
    if not lines or not (site/'index.html').is_file(): raise ValueError('Incomplete static release')
    return ''.join(lines).encode()


def entries(raw):
    result = {}
    for line in raw.decode().splitlines():
        checksum, separator, name = line.partition('  ')
        if not separator or not re.fullmatch('[0-9a-f]{64}', checksum):
            raise ValueError('Malformed SHA256SUMS')
        safe_name(name)
        if name in result or name == 'SHA256SUMS': raise ValueError('Duplicate or recursive checksum')
        result[name] = checksum
    if 'index.html' not in result: raise ValueError('Manifest lacks entry document')
    return result


def verify(site, release):
    if not re.fullmatch('[0-9a-f]{64}', release): raise ValueError('Invalid release identity')
    raw = (site/'SHA256SUMS').read_bytes()
    entries(raw)
    if digest(raw) != release or checksums(site) != raw:
        raise ValueError('Release bytes differ from sealed identity')
    return raw


def package(site, qualification, destination):
    result = json.loads(qualification.read_text())
    raw = checksums(site)
    release = digest(raw)
    if result.get('passed') is not True or result.get('site_sha256') != release:
        raise ValueError('Release requires passing browser qualification of these exact bytes')
    target = destination/release/'site'
    if target.exists():
        verify(target, release)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(site, target)
        (target/'SHA256SUMS').write_bytes(raw)
        verify(target, release)
    shutil.copyfile(qualification, target.parent/'local-qualification.json')
    return release


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', type=Path, default=ROOT/'out/experiments/integration/site')
    parser.add_argument('--qualification', type=Path, default=ROOT/'out/experiments/integration/result.json')
    parser.add_argument('--verify', help='Verify an existing packaged release without rebuilding')
    args = parser.parse_args()
    if args.verify:
        verify(ROOT/'out/releases'/args.verify/'site', args.verify)
        print(args.verify)
        return
    release = package(args.site, args.qualification, ROOT/'out/releases')
    print(release)


if __name__ == '__main__': main()
