"""Generate declaration consumers only after semantic ownership admission."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import pprint
import re
import subprocess
from jsonschema import Draft202012Validator
from openapi_spec_validator import validate as validate_openapi
from inside_inference.contract_runtime import validate, decode_json

from scripts import ROOT


def read(path):
    return decode_json(path.read_text())


def admit(ontology, spec):
    if set(ontology) != {'purpose','terms'} or set(spec) != {'$schema','title','version','$defs'} or spec['version'] != 1:
        raise ValueError('Unsupported contract document')
    owners = {}
    terms, definitions = ontology['terms'], spec['$defs']
    for term, entry in terms.items():
        if set(entry) != {'meaning', 'lifetime', 'owns', 'excludes', 'schemas', 'depends_on', 'capability_reads'}:
            raise ValueError(f'{term}: malformed semantic owner')
        if not entry['meaning'] or not entry['lifetime'] or not entry['owns'] or not entry['excludes']:
            raise ValueError(f'{term}: incomplete semantic boundary')
        if not set(entry['depends_on']) <= set(terms):
            raise ValueError(f'{term}: unknown dependency owner')
        for name in entry['schemas']:
            if name in owners: raise ValueError(f'{name}: competing semantic owners')
            owners[name] = term
    if set(owners) != set(definitions):
        raise ValueError('Unowned schemas or stale semantic grants')
    dependencies = {name: set() for name in definitions}
    Draft202012Validator.check_schema(spec)
    keywords = {'type','title','description','const','default','minimum','maximum','enum','pattern',
                'x-maximum-from','x-owner','properties','required','additionalProperties',
                '$ref','items','minItems','maxItems','uniqueItems','oneOf','anyOf'}
    def walk(name, child):
        if set(child) - keywords:
            raise ValueError(f'{name}: unsupported schema vocabulary')
        if '$ref' in child:
            if set(child) != {'$ref'} or not child['$ref'].startswith('#/$defs/'):
                raise ValueError('Unsupported reference')
            target = child['$ref'].split('/')[-1]
            if target not in definitions: raise ValueError('Dangling schema reference')
            target_owner = owners[target]
            if target_owner != owners[name] and target_owner not in terms[owners[name]]['depends_on']:
                raise ValueError(f'{name} cannot depend on {target_owner}')
            dependencies[name].add(target)
        for key in ('default','const'):
            if key in child: validate(child,child[key],definitions)
        if 'x-maximum-from' in child:
            if child['x-maximum-from'] not in terms[owners[name]]['capability_reads']:
                raise ValueError('Unowned capability read')
            target = definitions['RunBinding']
            for part in child['x-maximum-from'].split('.'):
                target = target.get('properties', {}).get(part)
                if target is None: raise ValueError('Dangling capability reference')
                if '$ref' in target: target = definitions[target['$ref'].split('/')[-1]]
            if 'default' in child and 'const' in target and child['default'] > target['const']:
                raise ValueError('Default request exceeds capability')
            if target.get('type') != child['type']: raise ValueError('Capability type mismatch')
        for value in child.get('properties',{}).values(): walk(name,value)
        for key in ('items','additionalProperties'):
            if isinstance(child.get(key),dict): walk(name,child[key])
        for key in ('oneOf','anyOf'):
            for value in child.get(key,[]): walk(name,value)
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
    ontology = read(root / 'docs/ontology/declarations.json')
    spec = read(root / 'data-model/inference.schema.json')
    api = read(root / 'data-model/openapi.json')
    # Bundle in memory from the same canonical JSON, avoiding YAML coercion when
    # the OpenAPI resolver reads exponent-form JSON numbers from external files.
    bundled = copy.deepcopy(api)
    def api_refs(value):
        if isinstance(value,dict):
            if '$ref' in value:
                ref = value['$ref']
                prefix = './inference.schema.json#/$defs/'
                if not ref.startswith(prefix): raise ValueError('Unsupported API schema reference')
                name = ref[len(prefix):]
                if name not in spec['$defs']: raise ValueError('Unknown API schema')
                value['$ref'] = '#/components/schemas/' + name
            for item in value.values(): api_refs(item)
        elif isinstance(value,list):
            for item in value: api_refs(item)
    api_refs(bundled)
    def domain_refs(value):
        if isinstance(value,dict):
            if '$ref' in value: value['$ref'] = value['$ref'].replace('#/$defs/','#/components/schemas/')
            for item in value.values(): domain_refs(item)
        elif isinstance(value,list):
            for item in value: domain_refs(item)
    definitions_for_api = copy.deepcopy(spec['$defs'])
    domain_refs(definitions_for_api)
    bundled['components'] = {'schemas':definitions_for_api}
    validate_openapi(bundled)
    routes = {operation['operationId']: path for path, methods in api['paths'].items() for operation in methods.values()}
    order = admit(ontology, spec)
    definitions = spec['$defs']
    digest = hashlib.sha256(json.dumps([ontology, spec, api], sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    header = '# Generated by scripts/build/generate_data_models.py; DO NOT EDIT.\n'
    py = header + 'from dataclasses import dataclass, field\nfrom typing import Any\nfrom inside_inference.contract_runtime import Declaration\n\n'
    py += f'API_PATHS = {routes!r}\nCONTRACT_SHA256 = {digest!r}\nSCHEMAS = {pprint.pformat(definitions, sort_dicts=False)}\n\n'
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
    py += 'for model in MODELS.values():\n    model._definitions = SCHEMAS\n    model._registry = MODELS\n'
    js = '// Generated by scripts/build/generate_data_models.py; DO NOT EDIT.\n'
    js += 'globalThis.Declarations = (() => {\n'
    js += '  const schemas = ' + json.dumps(definitions, indent=2) + ';\n'
    js += '  const meanings = ' + json.dumps(ontology['terms'], indent=2) + ';\n'
    js += '  const routes = ' + json.dumps(routes) + ';\n'
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
  return {schemas, meanings, routes, hash, assertShape, assertBound};
})();
'''
    compiled = subprocess.run(['node', str(ROOT/'scripts/build/compile_validators.mjs'),
                               str(root/'data-model/inference.schema.json')],
                              cwd=ROOT, check=True, capture_output=True, text=True).stdout
    return {'web/contract-validators.generated.js':compiled, 'inside_inference/declarations_generated.py':py, 'web/declarations.generated.js':js}


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
