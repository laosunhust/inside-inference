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
    from scripts.build.ontology import load_declarations
    spec = {k:v for k,v in manifest.items() if k!='modules'} | {'$defs':definitions}
    return expand_ontology_references(spec, load_declarations(root))


def expand_ontology_references(spec, ontology):
    """Compile ontology references to ordinary JSON Schema for every consumer."""
    terms = sorted(ontology['terms'])
    def visit(value):
        if isinstance(value, dict):
            if value.get('x-ontology-reference') is True:
                if value.get('type') != 'string' or 'enum' in value:
                    raise ValueError('Ontology reference must be a string without an authored enum')
                value['enum'] = terms
            if value.get('x-ontology-binding') is True:
                if 'allOf' in value:
                    raise ValueError('Ontology binding constraints are generated; do not author allOf')
                if set(value.get('properties', {})) != {'primary', 'related'}:
                    raise ValueError('Ontology binding requires primary and related fields')
                value['allOf'] = binding_constraints(terms)
            for child in list(value.values()): visit(child)
        elif isinstance(value, list):
            for child in value: visit(child)
    visit(spec)
    return spec


def operation_owners(spec):
    owners = {}
    for name, declaration in spec['$defs'].items():
        if not declaration.get('x-operation'): continue
        choices = declaration.get('properties', {}).get('name', {}).get('enum')
        if not choices or len(set(choices)) != len(choices) or not all(isinstance(v,str) and v for v in choices):
            raise ValueError(f'{name}: operation declaration needs unique explicit names')
        for operation in choices:
            if operation in owners:
                raise ValueError(f'{name}.name: operation {operation!r} already belongs to {owners[operation]}; each operation needs exactly one owner')
            owners[operation] = declaration['x-owner']
    return owners


def lab_bindings(root, ontology, spec, *, catalog=None):
    from inside_inference.contract_runtime import decode_json
    from jsonschema import Draft202012Validator
    import difflib
    entries = (decode_json((root/'catalog/stack.json').read_text()) if catalog is None else catalog)['innovations']
    result = {}
    for entry in entries:
        path = f"catalog/stack.json innovations[{entry['id']}].ontology_binding"
        binding = entry.get('ontology_binding')
        if not isinstance(binding, dict): raise ValueError(f'{path}: missing binding; declare primary and related ontology concepts')
        for field, values in (('primary', [binding.get('primary')]), ('related', binding.get('related', []))):
            if not isinstance(values,list): raise ValueError(f'{path}.{field}: expected a list')
            for value in values:
                if not isinstance(value,str) or value not in ontology['terms']:
                    hints = difflib.get_close_matches(str(value), ontology['terms'], n=3)
                    raise ValueError(f'{path}.{field}: unknown ontology concept {value!r}; declare an owner in docs/ontology or use an existing concept. Suggestions: {hints}')
        validator = Draft202012Validator({'$defs':spec['$defs'], **spec['$defs']['OntologyBinding']})
        errors = list(validator.iter_errors(binding))
        if errors: raise ValueError(f'{path}{errors[0].json_path[1:]}: {errors[0].message}; primary must be declared once and related concepts must be unique and exclude primary')
        if entry['id'] in result: raise ValueError(f'{path}: duplicate experiment ID')
        result[entry['id']] = binding
    return result


def binding_constraints(terms):
    return [{'if': {'properties': {'primary': {'const': term}}},
             'then': {'properties': {'related': {'type': 'array', 'not': {'contains': {'const': term}}}}}}
            for term in sorted(terms)]
