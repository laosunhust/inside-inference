"""Admit generated browser execution and static-only serving; reject native compute."""
import ast
import re

RUNTIMES = 'scripts/dev/http_runtimes_generated.py'
CLIENT = 'web/execution/client.generated.js'
WORKER = 'web/execution/worker.generated.js'


def check_source(path, source):
    failures = []
    if path.suffix in ('.js','.mjs','.html'):
        if re.search(r'\b(?:fetch|XMLHttpRequest|WebSocket|Worker|postMessage)\b|Declarations\s*\.\s*routes|ExecutionClient\s*\.\s*(?:http|create)',source):
            failures.append(f'{path}: presentation must use the generated execution client')
        return failures
    for node in ast.walk(ast.parse(source)):
        modules=[]
        if isinstance(node,ast.Import):modules=[a.name for a in node.names]
        elif isinstance(node,ast.ImportFrom):
            modules=[(node.module or '')+'.'+a.name for a in node.names]
        for module in modules:
            if module.startswith(('http.server','wsgiref.simple_server','socketserver')):
                failures.append(f'{path}: static server must be generated')
            if path.parts[:2]==('scripts','dev') and module.startswith(('inside_inference','scripts.build')):
                failures.append(f'{path}: static serving cannot import computation or storage')
    return failures


def audit_http(root, paths, generated):
    failures=[]
    worker=generated.get(WORKER,'')
    imports = re.findall(r'^\s*import\b.*$|\bimport\s*\(', worker, re.M)
    if "await execute_json(operation_name, operation_input)" not in worker or imports != ["import {loadPyodide} from './runtime/pyodide.mjs';"]:
        failures.append(WORKER+': every browser operation must execute through the shared Python service')
    for name in (RUNTIMES,CLIENT,WORKER):
        if name not in generated or not (root/name).is_file() or (root/name).read_text()!=generated[name]:
            failures.append(f'{name}: missing or stale generated execution boundary')
    for name in ('inside_inference/delivery/application.py','inside_inference/delivery/http.py',
                 'inside_inference/delivery/http_generated.py','inside_inference/cuda_runtime.py',
                 'scripts/dev/lambda_api.py','data-model/openapi.yaml',
                 'inside_inference/delivery/store.py','inside_inference/delivery/codec.py',
                 'inside_inference/workload.py','inside_inference/declarations.py',
                 'inside_inference/runtimes/engine.c','inside_inference/runtimes/decoder.h',
                 'inside_inference/runtimes/component.py','inside_inference/runtimes/reference.py',
                 'scripts/build/model_assets/runtime.py','web/execution/decoder.js',
                 'web/execution/observations.js','web/execution/component-engine.js',
                 'web/execution/model-service.js','web/execution/model-storage.js',
                 'web/execution/controls.js'):
        if (root/name).exists():failures.append(f'{name}: retired execution path')
    for path in paths:
        if path.as_posix() in generated:continue
        if path.parts[0]=='web' and path.suffix in ('.js','.mjs','.html'):
            failures.extend(check_source(path,(root/path).read_text()))
        if path.suffix=='.py' and path.parts[:2]==('scripts','dev'):
            failures.extend(check_source(path,(root/path).read_text()))
    return failures
