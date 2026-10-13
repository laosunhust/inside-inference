"""Admit semantic references in authored frontend sources, before rendering.

This checks literal references and binding objects in repository templates/scripts.
It does not prove arbitrary JavaScript or the scientific relevance of a valid binding.
Generated-page and interactive parity tests cover the rendered consumers.
"""
from pathlib import PurePosixPath
import re
from scripts.build.presentation import Elements
from scripts.build.contracts import operation_owners, lab_bindings


def audit_frontend_source(path, source, ontology, spec, labs):
    terms = ontology['terms']
    projections = {label: owner for owner, term in terms.items() for label in term['projections']}
    anchors = set(terms) | {label.lower().replace(' ', '-') for label in projections}
    operations = operation_owners(spec)
    failures = []
    def fail(message): failures.append(f'{path}: {message}')
    if path.suffix == '.html':
        for _, attrs in Elements(source).elements:
            label = attrs.get('data-term')
            if label is not None and label not in projections:
                fail(f'unknown ontology projection {label!r}; use docs/ontology declarations')
            operation = attrs.get('data-operation')
            if operation is not None and (operation not in operations or operations[operation] != projections.get(label)):
                fail(f'operation {operation!r} does not belong to projection {label!r}; use its generated ontology owner')
            if attrs.get('id') == 'operation-labels':
                fail('handwritten operation labels; consume ArchitectureWalkthrough')
            if 'data-map-area' in attrs:
                fail('handwritten system map; generate from InferenceMap')
            if 'data-owner' in attrs or 'data-primary' in attrs or 'data-lab' in attrs:
                fail('handwritten ownership/lab listing; generate from ontology and catalog')
    for anchor in re.findall(r'ontology\.html#([A-Za-z][A-Za-z0-9-]*)(?=["\'`])', source):
        if anchor not in anchors: fail(f'unknown ontology anchor {anchor!r}')
    for lab in re.findall(r'labs/([a-z][a-z0-9-]*)\.html', source):
        if lab not in labs: fail(f'unknown lab {lab!r}; register in catalog/stack.json')
    if path.suffix in ('.js', '.mjs'):
        if re.search(r'\b(?:minimum|maximum)\s*:\s*-?\d', source):
            fail('handwritten field limit; consume generated schema constraints')
        if re.search(r'\bontology_binding\s*:\s*\{', source):
            fail('handwritten ontology_binding; consume generated Declarations.labs or a validated execution binding')
        if re.search(r'\b(?:const|let|var)\s+(?:operationOwners|meanings|labs|inferenceMap)\s*=\s*[\[{]', source):
            fail('handwritten semantic registry; consume generated Declarations')
        if re.search(r'\bDeclarations\.(?:operationOwners|meanings|labs|inferenceMap)\s*=(?!=)', source):
            fail('cannot replace a generated semantic registry')
    return failures


def audit_system_map(ontology, spec, labs):
    """Navigation is a checked composition, never a second ontology."""
    model = spec['$defs']['InferenceMap']['const']
    areas = model['areas']
    ids = [area['id'] for area in areas]
    failures = []
    def fail(message): failures.append(f'InferenceMap: {message}')
    if len(ids) != len(set(ids)): fail('duplicate area ID')
    concepts = [owner for area in areas for owner in area['concepts']]
    if len(concepts) != len(set(concepts)): fail('concept has multiple navigation homes')
    unknown = set(concepts) - set(ontology['terms'])
    if unknown: fail(f'unknown ontology concepts: {sorted(unknown)}')
    subjects = {owner for binding in labs.values() for owner in [binding['primary'], *binding['related']]}
    missing = (subjects | set(operation_owners(spec).values())) - set(concepts)
    if missing: fail(f'missing navigation homes for lab or operation owners: {sorted(missing)}')
    engines = [area for area in areas if area['view'] == 'engine']
    if len(engines) != 1 or [area for area in areas if area['expanded']] != engines:
        fail('exactly one engine area must be expanded initially')
    for edge in model['relationships']:
        if edge['source'] not in ids or edge['target'] not in ids:
            fail(f'dangling relationship {edge["source"]!r} -> {edge["target"]!r}')
        if edge['source'] == edge['target']: fail('self relationship adds no system boundary')
    return failures



def audit_execution_journey(spec):
    """A single declaration owns conceptual shape and numerical operation homes."""
    failures = []
    def fail(message): failures.append('ArchitectureWalkthrough: ' + message)
    declaration = spec['$defs']['ArchitectureWalkthrough']
    if 'oneOf' in declaration or 'const' not in declaration:
        return ['ArchitectureWalkthrough: require one shared declared graph']
    stages = declaration['const']['stages']
    owners = operation_owners(spec)
    observed = []
    for index, stage in enumerate(stages):
        if any(type(source) is not int or not 0 <= source < index for source in stage['inputs']):
            fail('edges must reference earlier stages')
        if stage['inspection'] not in stage['operations']:
            fail('inspection operation must belong to its stage')
        for operation in stage['operations']:
            if operation not in owners: fail('unknown operation ' + operation)
            elif owners[operation] not in [stage['owner'], *stage['related']]:
                fail('operation owner missing from stage: ' + operation)
            observed.append(operation)
    if len(observed) != len(set(observed)): fail('operation has multiple stage homes')
    if set(owners) - set(observed): fail('operations missing stage homes: ' + str(sorted(set(owners) - set(observed))))
    if any('runtime' in spec['$defs'][name]['properties'] for name in ('ModelDescriptor','ModelSource')):
        fail('model selection must not select a second numerical runtime')
    return failures


def audit_frontend(root, generated):
    from scripts.build.ontology import load_declarations
    from scripts.build.contracts import load_schema
    ontology, spec = load_declarations(root), load_schema(root)
    labs = lab_bindings(root, ontology, spec)
    failures = audit_system_map(ontology, spec, labs) + audit_execution_journey(spec)
    for name in ('inside_inference/runtimes/inspectable.py', 'inside_inference/runtimes/llama_bridge.c'):
        if (root/name).exists(): failures.append(name + ': superseded model-specific browser execution')
    for path in (root/'web').rglob('*'):
        relative = path.relative_to(root)
        if relative.as_posix() in generated or path.suffix not in ('.html', '.js', '.mjs'): continue
        failures.extend(audit_frontend_source(PurePosixPath(relative), path.read_text(), ontology, spec, labs))
    return failures
