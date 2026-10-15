"""Generate declaration consumers only after semantic ownership admission."""
import argparse
import copy
import hashlib
from functools import lru_cache
import json
from pathlib import Path
import pprint
import re
import subprocess
from jsonschema import Draft202012Validator
from inside_inference.contract_runtime import validate, decode_json

from scripts import ROOT
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema, operation_owners, experiment_catalog, binding_constraints, admit_principles
from scripts.build.structured import read_yaml


def read(path):
    return decode_json(path.read_text())


@lru_cache(maxsize=512)
def _check_schema_content(serialized):
    # Memoize only successful standard meta-schema checks, never semantic admission.
    # Content keys notice in-place edits; bounded storage cannot retain entire runs.
    Draft202012Validator.check_schema(json.loads(serialized))


def admit(ontology, spec):
    if set(ontology) != {'purpose','terms'} or set(spec) != {'$schema','title','version','$defs'} or spec['version'] != 1:
        raise ValueError('Unsupported contract document')
    owners = {}
    terms, definitions = ontology['terms'], spec['$defs']
    for term, entry in terms.items():
        if set(entry) - {'principles'} != {'meaning', 'lifetime', 'owns', 'excludes', 'schemas', 'capability_reads', 'projections'}:
            raise ValueError(f'{term}: malformed semantic owner')
        if not re.fullmatch('[A-Z][A-Za-z0-9]*', term):
            raise ValueError(f'{term}: invalid semantic owner name')
        if not all(isinstance(entry[k], str) and entry[k].strip() for k in ('meaning', 'lifetime')):
            raise ValueError(f'{term}: incomplete semantic boundary')
        for key in ('owns', 'excludes', 'capability_reads'):
            value = entry[key]
            if not isinstance(value, list) or not all(isinstance(v, str) and v.strip() for v in value) or len(set(value)) != len(value):
                raise ValueError(f'{term}: invalid {key}')
            if key in ('owns', 'excludes') and not value:
                raise ValueError(f'{term}: {key} cannot be empty; no declaration-free ontology owners')
        names = entry['schemas']
        if not isinstance(names, list) or not names or not all(isinstance(n, str) and re.fullmatch('[A-Z][A-Za-z0-9]*', n) for n in names) or len(set(names)) != len(names):
            raise ValueError(f'{term}: schemas must be a nonempty unique list of declaration names')
        for name in names:
            if name in owners:
                raise ValueError(f'{name}: competing semantic owners')
            owners[name] = term
    if set(owners) != set(definitions):
        raise ValueError('Unowned schemas or stale semantic grants')
    projections = set()
    for term, entry in terms.items():
        if not isinstance(entry['projections'], dict):
            raise ValueError(f'{term}: projections must map labels to declared fields')
        for label, projection in entry['projections'].items():
            if not isinstance(label, str) or not re.fullmatch(r'[A-Za-z]+(?: [A-Za-z]+)*', label) or label.lower() in projections:
                raise ValueError(f'{term}: invalid or competing visual projection')
            projections.add(label.lower())
            if not isinstance(projection, dict) or set(projection) != {'meaning', 'fields'} or not isinstance(projection['meaning'], str) or not projection['meaning'].strip():
                raise ValueError(f'{label}: malformed visual projection')
            fields = projection['fields']
            if not isinstance(fields, dict) or not fields:
                raise ValueError(f'{label}: projection must bind declared fields')
            for schema_name, names in fields.items():
                if owners.get(schema_name) != term:
                    raise ValueError(f'{label}: projection cannot borrow another semantic owner')
                if not isinstance(names, list) or not names or not all(isinstance(n, str) for n in names) or len(set(names)) != len(names) or not set(names) <= set(definitions[schema_name]['properties']):
                    raise ValueError(f'{label}: projection references missing or invalid fields')
    binding = definitions['OntologyBinding']
    props = binding['properties']
    if (not binding.get('x-ontology-binding') or set(props) != {'primary','related'}
            or not props['primary'].get('x-ontology-reference')
            or not props['related'].get('uniqueItems')
            or not props['related']['items'].get('x-ontology-reference')
            or binding.get('allOf') != binding_constraints(terms)):
        raise ValueError('OntologyBinding must enforce admitted subjects, unique related concepts, and primary exclusion')
    operation_owners(spec)
    principles = admit_principles(terms, definitions)
    if principles:
        raise ValueError('First-principles admission failed:\n' + '\n'.join(principles))
    operation_schemas = {name for name, definition in definitions.items() if definition.get('x-operation')}
    referenced = definitions['TensorObservation']['properties']['operation'].get('anyOf', [])
    if {r.get('$ref') for r in referenced} != {'#/$defs/' + name for name in operation_schemas} or len(referenced) != len(operation_schemas):
        raise ValueError('TensorObservation.operation must reference every admitted operation declaration exactly once')
    dependencies = {name: set() for name in definitions}
    # $defs children are independent schemas under the fixed 2020-12 dialect.
    # Keep root validation, and avoid rechecking every unchanged declaration when
    # one declaration changes. References/owners/cycles still run on every call.
    _check_schema_content(json.dumps({**spec, '$defs': {}}, sort_keys=True, allow_nan=False))
    for definition in definitions.values():
        _check_schema_content(json.dumps(definition, sort_keys=True, allow_nan=False))
    keywords = {'type','title','description','const','default','minimum','maximum','enum','pattern',
                'x-maximum-from','x-owner','properties','required','additionalProperties',
                '$ref','items','minItems','maxItems','uniqueItems','oneOf','anyOf','allOf','if','then','not','contains','maxContains','x-ontology-reference','x-ontology-binding','x-operation'}
    def contains_predicate(child, item):
        # A contains predicate refines an already owned item record; it does not
        # declare a new anonymous record or introduce fields.
        target = definitions.get((item or {}).get('$ref', '').removeprefix('#/$defs/'))
        if not target or set(child) - {'type', 'properties', 'required'}:
            return False
        properties = child.get('properties', {})
        if not properties or not set(properties) <= set(target.get('properties', {})):
            return False
        if not set(child.get('required', [])) <= set(properties):
            return False
        for key, restriction in properties.items():
            if set(restriction) not in ({'const'}, {'enum'}):
                return False
            values = [restriction['const']] if 'const' in restriction else restriction['enum']
            for value in values:
                validate(target['properties'][key], value, definitions)
        return True

    def walk(name, child, array_item=None, predicate=False):
        if child.get('x-ontology-reference') and child.get('enum') != sorted(terms):
            raise ValueError(f'{name}: ontology reference choices differ from admitted concepts; regenerate from docs/ontology')
        if set(child) - keywords:
            raise ValueError(f'{name}: unsupported schema vocabulary')
        if child.get('type') == 'object' and child is not definitions[name]:
            if not (predicate and contains_predicate(child, array_item)) and ('properties' in child or not isinstance(child.get('additionalProperties'),dict)):
                raise ValueError(f'{name}: nested records require a named ontology-owned declaration')
        if '$ref' in child:
            if set(child) != {'$ref'} or not child['$ref'].startswith('#/$defs/'):
                raise ValueError('Unsupported reference')
            target = child['$ref'].split('/')[-1]
            if target not in definitions: raise ValueError('Dangling schema reference')
            dependencies[name].add(target)
        for key in ('default','const'):
            if key in child: validate(child,child[key],definitions)
        if 'x-maximum-from' in child:
            if child['x-maximum-from'] not in terms[owners[name]]['capability_reads']:
                raise ValueError('Unowned capability read')
            root_name, *parts = child['x-maximum-from'].split('.')
            if root_name not in definitions: raise ValueError('Dangling capability root')
            target = definitions[root_name]
            for part in parts:
                target = target.get('properties', {}).get(part)
                if target is None: raise ValueError('Dangling capability reference')
                if '$ref' in target: target = definitions[target['$ref'].split('/')[-1]]
            if 'default' in child and 'const' in target and child['default'] > target['const']:
                raise ValueError('Default request exceeds capability')
            if target.get('type') != child['type']: raise ValueError('Capability type mismatch')
        for value in child.get('properties',{}).values(): walk(name,value)
        for key in ('items','additionalProperties'):
            if isinstance(child.get(key),dict): walk(name,child[key])
        item = child.get('items', array_item)
        for key in ('oneOf','anyOf','allOf'):
            for value in child.get(key,[]): walk(name,value,item)
        for key in ('if','then','not','contains'):
            if key in child: walk(name,child[key],item,predicate=key == 'contains')
    for name, schema in definitions.items():
        if not re.fullmatch('[A-Z][A-Za-z0-9]*', name): raise ValueError('Invalid schema name')
        if schema['type'] != 'object' or schema['additionalProperties'] is not False:
            raise ValueError(f'{name}: declarations must be closed objects')
        if schema['x-owner'] != owners[name] or schema['required'] != list(schema['properties']):
            raise ValueError(f'{name}: owner or required fields differ')
        walk(name,schema)
    order = []
    def visit(name, active):
        if name in active: raise ValueError('Cyclic declarations are unsupported')
        if name in order: return
        for target in sorted(dependencies[name]): visit(target, active | {name})
        order.append(name)
    for name in definitions: visit(name, set())
    return order


def python_type(schema):
    if '$ref' in schema: return schema['$ref'].split('/')[-1]
    for key in ('oneOf','anyOf'):
        if key in schema: return ' | '.join(python_type(v) for v in schema[key])
    typ=schema.get('type')
    if isinstance(typ,list): return ' | '.join(python_type({'type':t}) for t in typ)
    if typ=='array': return f"tuple[{python_type(schema['items'])}, ...]"
    if typ=='object': return 'dict[str, Any]'
    return {'string':'str','integer':'int','number':'float','boolean':'bool','null':'None'}[typ]


def outputs(root=ROOT):
    ontology = load_declarations(root)
    spec = load_schema(root)
    api = read_yaml(root / 'data-model/execution.yaml')
    if set(api) != {'version','operations'} or api['version'] != 1:
        raise ValueError('Malformed execution operations')
    for name, operation in api['operations'].items():
        if not re.fullmatch('[a-z][A-Za-z]+',name) or set(operation) != {'request','response'}:
            raise ValueError('Malformed execution operation')
        if not isinstance(operation['response'],str) or operation['response'] not in spec['$defs'] or (operation['request'] is not None and operation['request'] not in spec['$defs']):
            raise ValueError('Unknown execution schema')
    order = admit(ontology, spec)
    definitions = spec['$defs']
    experiments = {e['id']: e for e in experiment_catalog(root, ontology, spec)}
    operations = operation_owners(spec)
    digest = hashlib.sha256(json.dumps([ontology, spec, api, experiments], sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    header = '# Generated by scripts/build/generate_data_models.py; DO NOT EDIT.\n'
    py = header + 'from dataclasses import dataclass, field\nfrom typing import Any\nfrom inside_inference.contract_runtime import Declaration\n\n'
    py += f'EXECUTION_OPERATIONS = {api['operations']!r}\nCONTRACT_SHA256 = {digest!r}\nSCHEMAS = {pprint.pformat(definitions, sort_dicts=False)}\n\n'
    defaultable = {}
    for name in order:
        props = definitions[name]['properties']
        defaultable[name] = all('default' in v or ('$ref' in v and defaultable[v['$ref'].split('/')[-1]]) for v in props.values())
        py += f'@dataclass(frozen=True, kw_only=True)\nclass {name}(Declaration):\n'
        for field_name, child in props.items():
            if '$ref' in child:
                typ = child['$ref'].split('/')[-1]
                default = f' = field(default_factory={typ})' if defaultable[typ] else ''
            else:
                typ = python_type(child)
                default = f" = {child['default']!r}" if 'default' in child else ''
            py += f'    {field_name}: {typ}{default}\n'
        py += '\n\n'
    py += 'MODELS = {' + ', '.join(f'{n!r}: {n}' for n in order) + '}\n'
    py += f'OPERATION_OWNERS = {operations!r}\nEXPERIMENTS = {pprint.pformat(experiments, sort_dicts=False)}\n'
    py += 'for model in MODELS.values():\n    model._definitions = SCHEMAS\n    model._registry = MODELS\n'
    operation_models = {operation:name for name,d in definitions.items() if d.get('x-operation') for operation in d['properties']['name']['enum']}
    py += f'OPERATION_MODELS = {operation_models!r}\n'
    py += '''def operation_for(name):
    if name not in OPERATION_MODELS:
        raise ValueError(f'Unknown model operation {name!r}; declare its semantic owner and operation schema first')
    return MODELS[OPERATION_MODELS[name]](name=name).to_dict()

'''
    js = '// Generated by scripts/build/generate_data_models.py; DO NOT EDIT.\n'
    js += 'globalThis.Declarations = (() => {\n'
    js += '  const schemas = ' + json.dumps(definitions, indent=2) + ';\n'
    js += '  const meanings = ' + json.dumps(ontology['terms'], indent=2) + ';\n'
    js += '  const operationOwners = ' + json.dumps(operations) + ';\n'
    js += '  const experiments = ' + json.dumps(experiments, indent=2) + ';\n'
    js += f'  const hash = {json.dumps(digest)};\n'
    js += '''  const assertShape = (name, value) => {
    const check = CompiledContracts[name];
    if (!check) throw new Error('Unknown declaration: ' + name);
    if (!check(value)) throw new Error(name + ': ' + JSON.stringify(check.errors));
  };
  const assertBound = (name, value, context) => {
    assertShape(name,value);
    ContractRuntime.bounds(schemas[name],value,schemas,context);
  };
  return {schemas, meanings, hash, operationOwners, experiments, assertShape, assertBound};
})();
'''
    compiled = subprocess.run(['node', str(ROOT/'scripts/build/compile_validators.mjs'),
                               '-'], input=json.dumps(spec),
                              cwd=ROOT, check=True, capture_output=True, text=True).stdout
    from scripts.build.http_transport import generate as http_outputs
    return {'data-model/inference.schema.json':json.dumps(spec,indent=2)+'\n', 'web/contract-validators.generated.js':compiled, 'inside_inference/declarations_generated.py':py.rstrip()+'\n', 'web/declarations.generated.js':js, **http_outputs(api)}



def generate(root=ROOT, *, check=False):
    for relative, text in outputs(root).items():
        path = root / relative
        if check:
            if not path.exists() or path.read_text() != text:
                raise ValueError(f'Missing or stale {relative}; run make _data-models')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    generate(check=args.check)
    print('Declaration ownership and generated consumers checked.' if args.check else 'Generated declaration consumers.')
