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
        if re.search(r'\b(?:const|let|var)\s+(?:operationOwners|meanings|labs)\s*=\s*[\[{]', source):
            fail('handwritten semantic registry; consume generated Declarations')
        if re.search(r'\bDeclarations\.(?:operationOwners|meanings|labs)\s*=(?!=)', source):
            fail('cannot replace a generated semantic registry')
    return failures


def audit_frontend(root, generated):
    from scripts.build.ontology import load_declarations
    from scripts.build.contracts import load_schema
    ontology, spec = load_declarations(root), load_schema(root)
    labs = lab_bindings(root, ontology, spec)
    failures = []
    for path in (root/'web').rglob('*'):
        relative = path.relative_to(root)
        if relative.as_posix() in generated or path.suffix not in ('.html', '.js', '.mjs'): continue
        failures.extend(audit_frontend_source(PurePosixPath(relative), path.read_text(), ontology, spec, labs))
    return failures
