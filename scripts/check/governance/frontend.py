"""Admit semantic references in authored frontend sources, before rendering.

This checks literal references and binding objects in repository templates/scripts.
It does not prove arbitrary JavaScript or the scientific relevance of a valid binding.
Generated-page and interactive parity tests cover the rendered consumers.
"""
from pathlib import PurePosixPath
import re
from scripts.build.presentation import Elements
from scripts.build.contracts import operation_owners, experiment_catalog


def audit_frontend_source(path, source, ontology, spec, experiments):
    terms = ontology['terms']
    projections = {label: owner for owner, term in terms.items() for label in term['projections']}
    anchors = set(terms) | {label.lower().replace(' ', '-') for label in projections}
    operations = operation_owners(spec)
    failures = []
    def fail(message): failures.append(f'{path}: {message}')
    if path.suffix == '.html':
        dialog = re.search(r'<dialog\b[^>]*id=[\"\']system-dialog[\"\'][^>]*>(.*?)</dialog>', source, re.S)
        if dialog and any(tag in ('input', 'select', 'textarea', 'details') for tag, _ in Elements(dialog.group(1)).elements):
            fail('handwritten system editor; generate concept homes from ExperimentSpec primary bindings')
        for _, attrs in Elements(source).elements:
            label = attrs.get('data-term')
            if label is not None and label not in projections:
                fail(f'unknown ontology projection {label!r}; use docs/ontology declarations')
            operation = attrs.get('data-operation')
            if operation is not None and (operation not in operations or operations[operation] != projections.get(label)):
                fail(f'operation {operation!r} does not belong to projection {label!r}; use its generated ontology owner')
            if attrs.get('id') == 'operation-labels':
                fail('handwritten operation labels; consume ArchitectureWalkthrough')
            if 'data-map-area' in attrs or 'data-map-node' in attrs or 'data-map-parent' in attrs:
                fail('handwritten system map; generate from InferenceMap')
            if 'data-owner' in attrs or 'data-primary' in attrs or 'data-lab' in attrs or 'data-experiment' in attrs:
                fail('handwritten ownership/experiment listing; generate from ontology and the experiment catalog')
    for anchor in re.findall(r'ontology\.html#([A-Za-z][A-Za-z0-9-]*)(?=["\'`])', source):
        if anchor not in anchors: fail(f'unknown ontology anchor {anchor!r}')
    for lab in re.findall(r'labs(?:-by-concept|/[a-z0-9-]+)\.html', source):
        fail(f'retired standalone lab page {lab!r}; declare an experiment in data/experiments/catalog.yaml and apply it from the Inference system configuration')
    if path.suffix in ('.js', '.mjs'):
        if re.search(r'\b(?:minimum|maximum)\s*:\s*-?\d', source):
            fail('handwritten field limit; consume generated schema constraints')
        if re.search(r'\bontology_binding\s*:\s*\{', source):
            fail('handwritten ontology_binding; consume generated Declarations.experiments or a validated execution binding')
        if re.search(r'\b(?:const|let|var)\s+(?:operationOwners|meanings|experiments|labs|inferenceMap)\s*=\s*[\[{]', source):
            fail('handwritten semantic registry; consume generated Declarations')
        if re.search(r'\bDeclarations\.(?:operationOwners|meanings|experiments|inferenceMap)\s*=(?!=)', source):
            fail('cannot replace a generated semantic registry')
    return failures


def audit_system_map(ontology, spec, experiments):
    """One containment tree; cross-component relationships never create second parents."""
    model = spec['$defs']['InferenceMap']['const']
    if 'areas' in model or 'nodes' not in model:
        return ['InferenceMap: replace flat areas with ontology-owned nodes']
    nodes = model['nodes']
    failures = []
    def fail(message): failures.append('InferenceMap: ' + message)
    ids = [n['id'] for n in nodes]
    owners = [n['owner'] for n in nodes]
    by_id = {n['id']: n for n in nodes}
    if len(ids) != len(set(ids)): fail('duplicate node ID')
    if len(owners) != len(set(owners)): fail('concept has multiple navigation homes')
    roots = [n for n in nodes if n['parent'] is None]
    if len(roots) != 1 or roots[0]['owner'] != 'InferenceSystem':
        fail('require one InferenceSystem root')
    for node in nodes:
        owner = node['owner']
        term = ontology['terms'].get(owner)
        if term is None: fail(f'unknown ontology concept {owner!r}')
        elif not term['meaning'].strip(): fail(f'{owner}: missing explanation')
        if node['parent'] is not None and node['parent'] not in by_id:
            fail(f"{node['id']}: dangling parent {node['parent']!r}")
        seen = set()
        at = node
        while at is not None:
            if at['id'] in seen:
                fail(f"{node['id']}: containment cycle")
                break
            seen.add(at['id'])
            at = by_id.get(at['parent'])
        if node['view'] == 'engine' and owner != 'ModelExecution':
            fail('numerical diagram must belong to ModelExecution')
    if len([n for n in nodes if n['view'] == 'engine']) != 1:
        fail('require exactly one numerical diagram home')
    for control in spec['$defs']['ExperimentSpec']['oneOf']:
        properties = control['properties']
        name = properties['control']['const']
        binding = properties['ontology_binding']['const']
        for owner in [binding['primary'], *binding['related']]:
            if owner not in owners:
                fail(f'experiment control {name!r} has no explanation/concept home for {owner!r}')
    subjects = {owner for binding in experiments.values() for owner in [binding['primary'], *binding['related']]}
    missing = (subjects | set(operation_owners(spec).values())) - set(owners)
    if missing: fail(f'missing navigation homes for experiment or operation owners: {sorted(missing)}')
    for edge in model['relationships']:
        if edge['source'] not in by_id or edge['target'] not in by_id:
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
    experiments = {e['id']: e['ontology_binding'] for e in experiment_catalog(root, ontology, spec)}
    failures = audit_system_map(ontology, spec, experiments) + audit_execution_journey(spec)
    for name in ('inside_inference/runtimes/inspectable.py', 'inside_inference/runtimes/llama_bridge.c'):
        if (root/name).exists(): failures.append(name + ': superseded model-specific browser execution')
    for path in (root/'web').rglob('*'):
        relative = path.relative_to(root)
        if relative.as_posix() in generated or path.suffix not in ('.html', '.js', '.mjs'): continue
        failures.extend(audit_frontend_source(PurePosixPath(relative), path.read_text(), ontology, spec, experiments))
    return failures
