"""Admit only registered machine-readable ontology, plus the root README."""
import re
from scripts.build.structured import read_yaml
from scripts import ROOT


def load_declarations(root=ROOT):
    directory = root / 'docs/ontology'
    manifest = read_yaml(directory / 'declarations.yaml')
    if set(manifest) != {'purpose', 'modules'} or not manifest['purpose']:
        raise ValueError('Malformed ontology manifest')
    modules = manifest['modules']
    if not isinstance(modules, list) or not modules or not all(isinstance(m, str) for m in modules):
        raise ValueError('Ontology modules must be a nonempty path list')
    if len(set(modules)) != len(modules):
        raise ValueError('Duplicate ontology module')
    if any(not re.fullmatch(r'[a-z][a-z-]*\.yaml', m) or m == 'declarations.yaml' for m in modules):
        raise ValueError('Ontology modules must be top-level domain YAML files')
    available = {p.name for p in directory.glob('*.yaml') if p.name != 'declarations.yaml'}
    if set(modules) != available:
        raise ValueError('Missing or unlisted ontology module')
    allowed = {'README.md', 'declarations.yaml', *modules}
    for path in directory.rglob('*'):
        name = path.relative_to(directory).as_posix()
        if path.is_symlink() or path.is_dir() or name not in allowed:
            raise ValueError(f'{name}: ontology permits only registered YAML and the root README.md; prose-only documents are forbidden')
    terms = {}
    for module in modules:
        document = read_yaml(directory / module)
        if set(document) != {'terms'} or not isinstance(document['terms'], dict) or not document['terms']:
            raise ValueError(f'{module}: malformed ontology module')
        for term, entry in document['terms'].items():
            if term in terms:
                raise ValueError(f'{term}: competing semantic owners across ontology modules')
            terms[term] = entry
    return {'purpose': manifest['purpose'], 'terms': terms}
