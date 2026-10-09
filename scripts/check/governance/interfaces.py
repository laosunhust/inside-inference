"""Reject handwritten public data records and transport shapes in owned Python/JS.

This is source admission for this repository's supported implementation languages,
not a proof about arbitrary dynamically generated code. Boundary runtime validation
and integration evidence remain mandatory.
"""
import ast
import re


def audit_source(path, source, generated_names):
    failures = []
    if path.suffix in ('.js','.mjs'):
        if re.search(r'''["'`]\/api\/''',source):
            failures.append(f'{path}: handwritten API path; consume generated routes')
        return failures
    if path.suffix != '.py': return failures
    tree = ast.parse(source)
    imports = {}
    generated = set()
    for node in ast.walk(tree):
        if isinstance(node,ast.ImportFrom):
            for alias in node.names:
                local = alias.asname or alias.name
                imports[local] = (node.module or '')+'.'+alias.name
                if node.module == 'inside_inference.declarations_generated' and alias.name in generated_names:
                    generated.add(local)
        elif isinstance(node,ast.Import):
            for alias in node.names: imports[alias.asname or alias.name] = alias.name
    def resolve(node):
        if isinstance(node,ast.Name): return imports.get(node.id,node.id)
        if isinstance(node,ast.Attribute): return resolve(node.value)+'.'+node.attr
        if isinstance(node,ast.Call): return resolve(node.func)
        return ''
    factories = {'dataclasses.dataclass','typing.TypedDict','typing.NamedTuple','typing_extensions.TypedDict','collections.namedtuple','pydantic.BaseModel','inside_inference.contract_runtime.Declaration'}
    parents = {child:parent for parent in ast.walk(tree) for child in ast.iter_child_nodes(parent)}
    def generated_route(node):
        return isinstance(node,ast.Subscript) and resolve(node.value)=='inside_inference.declarations_generated.API_PATHS'
    for node in ast.walk(tree):
        if isinstance(node,ast.ClassDef):
            record = any(resolve(v) in factories for v in [*node.decorator_list,*node.bases])
            record |= any(resolve(v).startswith('inside_inference.declarations_generated.') for v in node.bases)
            record |= any(isinstance(v,ast.AnnAssign) for v in node.body)
            if record:
                failures.append(f'{path}:{node.lineno}: handwritten record {node.name}; generate from data model')
        if isinstance(node,ast.Call) and resolve(node.func) in factories-{'dataclasses.dataclass','pydantic.BaseModel'}:
            failures.append(f'{path}:{node.lineno}: handwritten record factory')
        if isinstance(node,ast.Constant) and isinstance(node.value,str) and node.value.startswith('/api/'):
            failures.append(f'{path}:{node.lineno}: handwritten API path; consume generated routes')
        if path.parts[:2] == ('scripts','dev') and isinstance(node,ast.Attribute) and node.attr=='path' and isinstance(node.value,ast.Name) and node.value.id=='self':
            parent = parents.get(node)
            choices = parent.comparators if isinstance(parent,ast.Compare) and parent.left is node else []
            choices = [item for choice in choices for item in (choice.elts if isinstance(choice,(ast.Tuple,ast.List)) else [choice])]
            if not choices or not all(generated_route(choice) for choice in choices):
                failures.append(f'{path}:{node.lineno}: route decisions must use generated API_PATHS directly')
        if path.parts[:2] == ('scripts','dev') and isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute):
            if node.func.attr in ('send_response','send_header','end_headers') or resolve(node.func).endswith('.wfile.write'):
                failures.append(f'{path}:{node.lineno}: raw public response writes belong to the generated transport')
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr in ('send_json','send_declaration'):
            value = node.args[1] if len(node.args)>1 else None
            constructor = value.func if isinstance(value,ast.Call) else None
            valid = isinstance(constructor,ast.Name) and constructor.id in generated
            valid |= isinstance(constructor,ast.Attribute) and constructor.attr=='from_dict' and isinstance(constructor.value,ast.Name) and constructor.value.id in generated
            if node.func.attr != 'send_declaration' or not valid:
                failures.append(f'{path}:{node.lineno}: public response must construct a generated declaration')
    return failures


def audit_interfaces(root, paths, generated):
    from scripts.build.contracts import load_schema
    names = set(load_schema(root)['$defs'])
    failures = []
    for path in paths:
        if path.as_posix() in generated: continue
        if path.parts[0] not in ('inside_inference','scripts','web'): continue
        if path.parts[0]=='scripts' and path.parts[1] not in ('dev','experiments'): continue
        if path.suffix not in ('.py','.js','.mjs'): continue
        failures.extend(audit_source(path,(root/path).read_text(),names))
    return failures
