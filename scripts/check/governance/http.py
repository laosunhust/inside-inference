"""Admit one HTTP application and generated runtime bridges, not adapter policies.

Import/source admission covers repository Python, not arbitrary metaprogramming.
Runtime equivalence and disjoint-root rejection are separately exercised by tests.
"""
import ast

APPLICATION = 'inside_inference/delivery/application.py'
SERVICE = 'inside_inference.delivery.service'
RUNTIMES = 'scripts/dev/http_runtimes_generated.py'
METADATA = 'inside_inference/delivery/http_generated.py'


def check_source(path, source):
    name = path.as_posix()
    failures = []
    for node in ast.walk(ast.parse(source)):
        modules = []
        if isinstance(node, ast.Import): modules = [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ''
            if node.level:
                package = list(path.parts[:-1])
                module = '.'.join(package[:len(package)-node.level+1] + ([module] if module else []))
            modules = [module + '.' + a.name for a in node.names]
        for module in modules:
            if module == SERVICE or module.startswith(SERVICE + '.'):
                if name != APPLICATION: failures.append(f'{path}: domain dispatch must pass through the shared HTTP application')
            if module.startswith(('http.server', 'wsgiref.simple_server', 'socketserver')):
                failures.append(f'{path}: HTTP runtime bridges must be generated')
            if module.startswith('inside_inference.delivery.application'):
                failures.append(f'{path}: only generated runtimes may instantiate the HTTP application')
            if name.startswith('scripts/dev/') and module.startswith(('inside_inference.workload', 'inside_inference.generation', 'inside_inference.cache_lab', 'scripts.build')):
                failures.append(f'{path}: runtime composition cannot execute domain work or build the website')
        if name.startswith('scripts/dev/') and 'http_runtimes_generated' in source and isinstance(node, ast.Constant) and isinstance(node.value,str):
            if node.value.lower() in ('origin','http_origin','content-type','content_type','application/json','cache-control'):
                failures.append(f'{path}: HTTP policy belongs to the shared application and OpenAPI')
    return failures


def audit_http(root, paths, generated):
    failures = []
    for name in (RUNTIMES, METADATA):
        if name not in generated or not (root/name).is_file() or (root/name).read_text() != generated[name]:
            failures.append(f'{name}: missing or stale generated HTTP boundary')
    if (root/'scripts/dev/responses_generated.py').exists():
        failures.append('Retired socket-only HTTP interface still exists')
    for path in paths:
        if path.suffix != '.py' or path.parts[0] not in ('scripts','inside_inference'): continue
        if path.as_posix() in generated: continue
        if path.parts[0]=='scripts' and path.parts[1] != 'dev': continue
        failures.extend(check_source(path,(root/path).read_text()))
    return failures
