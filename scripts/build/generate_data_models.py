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
from scripts.build.ontology import load_declarations
from scripts.build.contracts import load_schema
from scripts.build.structured import read_yaml


def read(path):
    return decode_json(path.read_text())


def admit(ontology, spec):
    if set(ontology) != {'purpose','terms'} or set(spec) != {'$schema','title','version','$defs'} or spec['version'] != 1:
        raise ValueError('Unsupported contract document')
    owners = {}
    terms, definitions = ontology['terms'], spec['$defs']
    for term, entry in terms.items():
        if set(entry) != {'meaning', 'lifetime', 'owns', 'excludes', 'schemas', 'depends_on', 'capability_reads', 'projections'}:
            raise ValueError(f'{term}: malformed semantic owner')
        if not re.fullmatch('[A-Z][A-Za-z0-9]*', term):
            raise ValueError(f'{term}: invalid semantic owner name')
        if not all(isinstance(entry[k], str) and entry[k].strip() for k in ('meaning', 'lifetime')):
            raise ValueError(f'{term}: incomplete semantic boundary')
        for key in ('owns', 'excludes', 'depends_on', 'capability_reads'):
            value = entry[key]
            if not isinstance(value, list) or not all(isinstance(v, str) and v.strip() for v in value) or len(set(value)) != len(value):
                raise ValueError(f'{term}: invalid {key}')
            if key in ('owns', 'excludes') and not value:
                raise ValueError(f'{term}: {key} cannot be empty; no declaration-free ontology owners')
        if not set(entry['depends_on']) <= set(terms):
            raise ValueError(f'{term}: unknown dependency owner')
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
    dependencies = {name: set() for name in definitions}
    Draft202012Validator.check_schema(spec)
    keywords = {'type','title','description','const','default','minimum','maximum','enum','pattern',
                'x-maximum-from','x-owner','properties','required','additionalProperties',
                '$ref','items','minItems','maxItems','uniqueItems','oneOf','anyOf'}
    def walk(name, child):
        if set(child) - keywords:
            raise ValueError(f'{name}: unsupported schema vocabulary')
        if child.get('type') == 'object' and child is not definitions[name]:
            if 'properties' in child or not isinstance(child.get('additionalProperties'),dict):
                raise ValueError(f'{name}: nested records require a named ontology-owned declaration')
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
    ontology = load_declarations(root)
    spec = load_schema(root)
    api = read_yaml(root / 'data-model/openapi.yaml')
    # Bundle in memory from the same canonical JSON, avoiding YAML coercion when
    # the OpenAPI resolver reads exponent-form JSON numbers from external files.
    bundled = copy.deepcopy(api)
    def api_refs(value):
        if isinstance(value,dict):
            if 'schema' in value and (not isinstance(value['schema'],dict) or set(value['schema']) != {'$ref'}):
                raise ValueError('Inline public schemas are forbidden; reference an admitted declaration')
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
    for name, exported in api.get('components',{}).get('schemas',{}).items():
        if exported != {'$ref':f'./inference.schema.json#/$defs/{name}'}:
            raise ValueError('API schema exports must preserve canonical declaration names')
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
    responses = {(path,method.upper(),int(status)):response['content']['application/json']['schema']['$ref'].split('/')[-1]
                 for path,methods in api['paths'].items() for method,operation in methods.items()
                 for status,response in operation['responses'].items()}
    unknown = api['x-unknown-route-response']
    unknown_response = (unknown['status'],unknown['schema']['$ref'].split('/')[-1])
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
                               '-'], input=json.dumps(spec),
                              cwd=ROOT, check=True, capture_output=True, text=True).stdout
    transport = header + '''from http.server import SimpleHTTPRequestHandler
from inside_inference.declarations_generated import MODELS
from inside_inference.model import canonical

'''+f'RESPONSES = {responses!r}\nUNKNOWN_RESPONSE = {unknown_response!r}\n\n'+'''class DeclaredResponseHandler(SimpleHTTPRequestHandler):
    def send_declaration(self, status, value):
        expected = RESPONSES.get((self.path, self.command, status))
        if expected is None and self.path not in {path for path, _, _ in RESPONSES} and status == UNKNOWN_RESPONSE[0]:
            expected = UNKNOWN_RESPONSE[1]
        if expected is None or type(value) is not MODELS[expected]:
            raise TypeError('Response type/status is not declared for this operation')
        value.validate_shape(value.to_dict())
        raw = canonical(value.to_dict())
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(raw)
'''
    return {'data-model/inference.schema.json':json.dumps(spec,indent=2)+'\n', 'data-model/openapi.json':json.dumps(api,indent=2)+'\n', 'web/contract-validators.generated.js':compiled, 'inside_inference/declarations_generated.py':py, 'web/declarations.generated.js':js, 'scripts/dev/responses_generated.py':transport}


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
