"""Compose authored YAML contracts; JSON bundles are generated transport artifacts."""
import re
from scripts import ROOT
from scripts.build.structured import read_yaml


def load_schema(root=ROOT):
    directory = root/'data-model'
    manifest = read_yaml(directory/'declarations.yaml')
    if set(manifest) != {'$schema','title','version','modules'} or manifest['version'] != 1:
        raise ValueError('Malformed data-model manifest')
    modules = manifest['modules']
    if not isinstance(modules,list) or not modules or not all(isinstance(p,str) and re.fullmatch(r'domains/[a-z][a-z-]*\.yaml',p) for p in modules) or len(set(modules)) != len(modules):
        raise ValueError('Invalid data-model modules')
    present = {p.relative_to(directory).as_posix() for p in (directory/'domains').rglob('*') if p.is_file()}
    if set(modules) != present:
        raise ValueError('Missing or unregistered data-model module')
    definitions = {}
    for name in modules:
        if (directory/name).is_symlink(): raise ValueError('Symlinks cannot own schemas')
        document = read_yaml(directory/name)
        if set(document) != {'$defs'} or not isinstance(document['$defs'],dict) or not document['$defs']:
            raise ValueError('Malformed data-model module')
        for key,value in document['$defs'].items():
            if key in definitions: raise ValueError(f'{key}: duplicate declaration')
            definitions[key] = value
    return {k:v for k,v in manifest.items() if k!='modules'} | {'$defs':definitions}
