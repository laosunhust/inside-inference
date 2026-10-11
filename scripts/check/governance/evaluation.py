"""Preserve evaluation commitments; structural admission is not scientific validity."""
import hashlib
import re
import subprocess

from scripts.build.structured import read_yaml, _parse_yaml
from scripts.check.governance.locks import regular_file, safe_path

INDEX = 'governance/evaluations.yaml'
RECORDS = 'governance/evaluations/records/'
RESULTS = 'governance/evaluations/results/'
# Owner-approved migration anchor. Missing ancestry must not silently reset history.
ANCHOR = '323b0c113eb4119ff083a90ddea3509ba3385441'


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args], capture_output=True)
    if result.returncode:
        raise ValueError('Evaluation preservation requires intact Git history: ' + result.stderr.decode().strip())
    return result.stdout


def committed_evaluations(root):
    if git(root, 'rev-parse', '--is-shallow-repository').strip() != b'false':
        raise ValueError('Evaluation preservation requires complete, non-shallow Git history')
    git(root, 'merge-base', '--is-ancestor', ANCHOR, 'HEAD')
    revisions = git(root, 'log', '--format=%H', 'HEAD', '--', INDEX, RECORDS, RESULTS).decode().splitlines()
    preserved = {}
    for revision in revisions:
        paths = git(root, 'diff-tree', '--root', '--no-commit-id', '--name-only', '-r',
                    '--no-renames', '-m', '--diff-filter=AM', revision, '--', INDEX, RECORDS, RESULTS).decode().splitlines()
        for path in paths:
            content = git(root, 'show', f'{revision}:{path}')
            if path == INDEX:
                legacy = _parse_yaml(content.decode())
                if legacy.get('version') != 1:
                    continue
                path = f"{RECORDS}legacy/{revision[:12]}-{legacy['work_item']}.yaml"
            if path in preserved and preserved[path] != content:
                raise ValueError(f'{path}: committed evaluation was rewritten; restore history and use a new superseding record')
            preserved[path] = content
    return preserved


def record_fields(record):
    fields = {'version','work_item','question','necessity','baseline','reuse','criteria','counterexamples','checks'}
    if (not isinstance(record, dict) or set(record) not in (fields, fields | {'supersedes'})
            or type(record['version']) is not int or record['version'] != 1):
        raise ValueError('Evaluation requires question, necessity, baseline, reuse, criteria, counterexamples, and checks')
    for name in ('work_item','question','necessity','baseline'):
        if not isinstance(record[name], str) or not record[name].strip():
            raise ValueError(f'Evaluation missing {name}')
    for name in ('criteria','counterexamples','checks'):
        strings(record[name], f'Evaluation missing {name}')
    if not isinstance(record['reuse'], list) or not record['reuse']:
        raise ValueError('Evaluation requires a reuse assessment')
    for item in record['reuse']:
        if (not isinstance(item, dict) or set(item) != {'source','decision'}
                or not all(isinstance(v, str) and v.strip() for v in item.values())):
            raise ValueError('Reuse assessment needs source and decision')


def strings(value, message):
    if not isinstance(value, list) or not value or not all(isinstance(v, str) and v.strip() for v in value):
        raise ValueError(message)


def reference(root, path, prefix=''):
    if not safe_path(path) or not path.startswith(prefix) or not regular_file(root, path):
        raise ValueError(f'Invalid or missing evaluation reference: {path!r}')


def evidence_reference(root, path):
    # Deletion must not force rewriting historical evaluation results. Missing
    # source evidence must remain recoverable as a regular blob in Git history.
    if regular_file(root,path):
        reference(root,path)
        return
    if not safe_path(path) or (root/path).exists() or (root/path).is_symlink():
        raise ValueError('Invalid evaluation evidence: '+str(path))
    if not (root/'.git').exists(): raise ValueError('Missing historical evaluation evidence: '+path)
    revision=git(root,'log','-1','--format=%H','--diff-filter=AM','HEAD','--',path).decode().strip()
    if not revision or git(root,'cat-file','-t',f'{revision}:{path}').strip()!=b'blob':
        raise ValueError('Missing historical evaluation evidence: '+path)


def audit_evaluation(root):
    for path, content in committed_evaluations(root).items():
        reference(root, path)
        if (root/path).read_bytes() != content:
            raise ValueError(f'{path}: immutable evaluation changed; restore it and add a superseding record')
    reference(root, INDEX)
    index = read_yaml(root/INDEX)
    if not isinstance(index, dict) or set(index) != {'version','active'} or type(index['version']) is not int or index['version'] != 2:
        raise ValueError('Evaluation index requires version 2 and an active criteria reference')
    reference(root, index['active'], RECORDS)
    records = {}
    for directory in (RECORDS, RESULTS):
        for path in sorted((root/directory).rglob('*')):
            name = path.relative_to(root).as_posix()
            if path.is_symlink():
                raise ValueError(f'{name}: evaluation symlinks are forbidden')
            if path.is_dir():
                continue
            reference(root, name, directory)
            if path.suffix != '.yaml':
                raise ValueError(f'{name}: evaluation entries must be YAML')
            value = read_yaml(path)
            if directory == RECORDS:
                record_fields(value)
            records[name] = value
    if index['active'] not in records:
        raise ValueError('Active evaluation is not an admitted criteria record')
    roots = set()
    for path, value in records.items():
        if path.startswith(RECORDS) and 'supersedes' not in value:
            if value['work_item'] in roots:
                raise ValueError(f'{path}: repeated work item requires an explicit supersedes reference')
            roots.add(value['work_item'])
    for path, value in records.items():
        if path.startswith(RECORDS):
            seen = {path}
            current = value
            while 'supersedes' in current:
                previous = current['supersedes']
                if not isinstance(previous, str) or previous not in records or not previous.startswith(RECORDS):
                    raise ValueError(f'{path}: missing superseded evaluation')
                if previous in seen:
                    raise ValueError(f'{path}: cyclic evaluation supersession')
                if records[previous]['work_item'] != value['work_item']:
                    raise ValueError(f'{path}: supersession must retain work-item identity')
                seen.add(previous)
                current = records[previous]
            continue
        fields = {'version','evaluation','evaluation_sha256','outcome','summary','evidence'}
        if not isinstance(value, dict) or set(value) != fields or type(value['version']) is not int or value['version'] != 1:
            raise ValueError(f'{path}: malformed evaluation result')
        target = value['evaluation']
        reference(root, target, RECORDS)
        if target not in records:
            raise ValueError(f'{path}: result points to unadmitted criteria')
        digest = value['evaluation_sha256']
        if not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest) or digest != hashlib.sha256((root/target).read_bytes()).hexdigest():
            raise ValueError(f'{path}: result criteria digest differs')
        if value['outcome'] not in ('passed','failed','incomplete') or not isinstance(value['summary'], str) or not value['summary'].strip():
            raise ValueError(f'{path}: result needs an explicit outcome and summary')
        strings(value['evidence'], f'{path}: result requires evidence')
        for evidence in value['evidence']:
            evidence_reference(root, evidence)
            if evidence.startswith(('out/', 'references/')):
                raise ValueError(f'{path}: results require maintained evidence, not disposable artifacts')
    return []
