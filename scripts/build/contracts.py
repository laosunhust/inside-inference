"""Compose authored YAML contracts; JSON bundles are generated transport artifacts."""
import hashlib
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


VARIANT_FIELDS = ('position', 'normalization', 'activation')


def architectures(definitions):
    """Declared architectures and the variant values each one permits."""
    result = {}
    for name, declaration in definitions.items():
        properties = declaration.get('properties', {})
        if declaration.get('x-owner') != 'ModelArchitecture' or not set(VARIANT_FIELDS) <= set(properties): continue
        result[name] = {field: set(properties[field].get('enum') or [properties[field]['const']]) for field in VARIANT_FIELDS}
    return result


def admit_principles(terms, definitions):
    """Governing equations are owned by concepts; architecture variants select them."""
    failures = []
    owners = operation_owners({'$defs': definitions})
    variants = architectures(definitions)
    parameters = set(definitions['ModelWeights']['properties'])
    fields = {f for a in variants for f in definitions[a]['properties']}
    def applies(when, allowed): return all(value in allowed.get(key, ()) for key, value in when.items())
    seen, homes = set(), {}
    for owner, term in terms.items():
        for index, principle in enumerate(term.get('principles', [])):
            where = f'{owner}.principles[{index}]'
            if not isinstance(principle, dict) or set(principle) != {'id', 'when', 'equation', 'symbols'}:
                failures.append(f'{where}: a principle needs exactly id, when, equation and symbols'); continue
            identifier = principle['id']
            if not isinstance(identifier, str) or not identifier or identifier in seen:
                failures.append(f'{where}: duplicate principle id {identifier!r}')
            seen.add(identifier)
            where = f'{owner}.{identifier}'
            when, equation = principle['when'], principle['equation']
            if not isinstance(equation, str) or not equation.strip():
                failures.append(f'{where}: needs a LaTeX equation'); equation = ''
            if not isinstance(when, dict):
                failures.append(f'{where}: when must map variant fields to values'); continue
            for key, value in when.items():
                if key not in VARIANT_FIELDS:
                    failures.append(f'{where}: {key!r} is not an architecture variant field {VARIANT_FIELDS}')
                elif not any(value in allowed[key] for allowed in variants.values()):
                    failures.append(f'{where}: {key}={value!r} is not declared by any architecture')
            if set(when) <= set(VARIANT_FIELDS) and not any(applies(when, allowed) for allowed in variants.values()):
                failures.append(f'{where}: condition matches no declared architecture')
            symbols = principle['symbols']
            if not isinstance(symbols, list) or not symbols:
                failures.append(f'{where}: needs symbols'); continue
            for symbol in symbols:
                if (not isinstance(symbol, dict) or set(symbol) != {'symbol', 'meaning', 'binds'}
                        or not all(isinstance(symbol[k], str) and symbol[k].strip() for k in ('symbol', 'meaning'))
                        or not isinstance(symbol['binds'], list)):
                    failures.append(f'{where}: each symbol needs symbol, meaning and a binds list'); continue
                if symbol['symbol'] not in equation:
                    failures.append(f'{where}: symbol {symbol["symbol"]!r} does not appear in its equation')
                for binding in symbol['binds']:
                    kind, _, name = str(binding).partition(':')
                    if kind == 'operation':
                        if name not in owners: failures.append(f'{where}: unknown operation {name!r}')
                        elif owners[name] == owner: homes.setdefault(name, []).append((owner, identifier, when))
                    elif kind == 'parameter':
                        if name not in parameters: failures.append(f'{where}: unknown parameter {name!r}; declare it in ModelWeights')
                    elif kind == 'architecture':
                        if name not in fields: failures.append(f'{where}: unknown architecture field {name!r}')
                    else:
                        failures.append(f'{where}: binding kind of {binding!r} must be operation, parameter or architecture')
    for operation, owner in owners.items():
        if operation not in homes:
            failures.append(f'{owner}: operation {operation!r} has no first-principles binding; bind it in a principle owned by {owner}')
    for architecture, allowed in variants.items():
        for owner in sorted(set(owners.values())):
            applicable = [p for p in terms[owner].get('principles', []) if isinstance(p, dict) and isinstance(p.get('when'), dict) and applies(p['when'], allowed)]
            if not applicable:
                failures.append(f'{architecture}: no applicable {owner} principle')
        for operation, claims in homes.items():
            claimed = {identifier for _, identifier, when in claims if applies(when, allowed)}
            if len(claimed) > 1:
                failures.append(f'{architecture}: operation {operation!r} is bound by several applicable {owners[operation]} principles {sorted(claimed)}')
    return failures


MARKER = re.compile(r'^\s*# (end )?principle ([a-z0-9-]+)\s*$')


def scan_principle_spans(root):
    """Marked spans of packaged engine code, keyed by principle id, and structural failures."""
    spans, failures = {}, []
    for path in sorted((root / 'inside_inference').rglob('*.py')):
        name = path.relative_to(root).as_posix()
        raw = path.read_bytes()
        lines = raw.decode().splitlines()
        digest = hashlib.sha256(raw).hexdigest()
        open_id = open_line = None
        for number, line in enumerate(lines, 1):
            match = MARKER.match(line)
            if not match:
                continue
            closing, identifier = bool(match.group(1)), match.group(2)
            if not closing:
                if open_id is not None:
                    failures.append(f'{name}:{number}: principle {identifier!r} is nested inside {open_id!r}; spans must not nest')
                    continue
                open_id, open_line = identifier, number
                continue
            if open_id != identifier:
                failures.append(f'{name}:{number}: end of principle {identifier!r} without an opening marker')
                continue
            if number == open_line + 1:
                failures.append(f'{name}:{open_line}: principle {identifier!r} has an empty code span')
            elif identifier in spans:
                failures.append(f'{name}:{open_line}: principle {identifier!r} has more than one code span')
            else:
                spans[identifier] = {'path': name, 'start': open_line + 1, 'end': number - 1, 'sha256': digest,
                                     'code': '\n'.join(lines[open_line:number - 1])}
            open_id = None
        if open_id is not None:
            failures.append(f'{name}:{open_line}: principle {open_id!r} is unclosed')
    return spans, failures


def principle_spans(root):
    spans, failures = scan_principle_spans(root)
    if failures:
        raise ValueError('Invalid principle code spans:\n' + '\n'.join(failures))
    return spans
