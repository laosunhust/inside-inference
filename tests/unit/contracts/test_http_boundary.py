"""Generated browser boundary admission; no servers or subprocesses."""
from pathlib import Path
import tempfile
import unittest
from scripts import ROOT
from scripts.check.governance.http import check_source, audit_http, RUNTIMES, CLIENT, WORKER
from inside_inference.delivery.service import execute


class ExecutionBoundaryTests(unittest.TestCase):
    def test_bypasses_and_generated_drift_are_rejected(self):
        for source in ('from inside_inference.delivery.service import execute',
                       'from http.server import BaseHTTPRequestHandler',
                       'from scripts.build.intro_page import build'):
            self.assertTrue(check_source(Path('scripts/dev/new_runtime.py'),source))
        for source in ('fetch(url)','new Worker(url)','Declarations.routes.run','ExecutionClient.http("run",{})'):
            self.assertTrue(check_source(Path('web/inference.js'),source))
        self.assertFalse(check_source(Path('web/inference.js'),'Execution.prepareGeneration(input)'))
        # Asset reads moved into the Python service; no web module may fetch.
        self.assertTrue(check_source(Path('web/execution/model-storage.js'),'fetch(url)'))
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            generated={name:(ROOT/name).read_text() for name in (RUNTIMES,CLIENT,WORKER)}
            for name,source in generated.items():
                (root/name).parent.mkdir(parents=True,exist_ok=True)
                (root/name).write_text(source)
            self.assertEqual(audit_http(root,[],generated),[])
            for name in generated:
                (root/name).write_text(generated[name]+'\n// drift\n')
                self.assertTrue(audit_http(root,[],generated))
                (root/name).write_text(generated[name])
            bypass=generated[WORKER].replace("import {loadPyodide}","import {executeModelOperation} from './model-service.js';\nimport {loadPyodide}")
            for worker in (generated[WORKER].replace('await execute_json(operation_name, operation_input)','execute(operation_name)'), bypass):
                changed=dict(generated);changed[WORKER]=worker
                (root/WORKER).write_text(worker)
                self.assertTrue(any('shared Python service' in e for e in audit_http(root,[],changed)))
            (root/WORKER).write_text(generated[WORKER])
            for name in ('inside_inference/cuda_runtime.py','inside_inference/workload.py','inside_inference/declarations.py',
                         'inside_inference/delivery/store.py','inside_inference/delivery/codec.py',
                         'inside_inference/runtimes/engine.c','inside_inference/runtimes/reference.py',
                         'web/execution/decoder.js','web/execution/model-service.js','scripts/build/model_assets/runtime.py'):
                retired=root/name;retired.parent.mkdir(parents=True,exist_ok=True)
                retired.write_text('')
                self.assertTrue(any(str(retired.relative_to(root)) in error for error in audit_http(root,[],generated)))
                retired.unlink()

    def test_operation_admission(self):
        for name,payload in [('invented',None),('run',{}),('tokenStep',{}),('cacheCapabilities',{}),('cacheRun',{})]:
            with self.assertRaises(ValueError):execute(name,payload)
        with self.assertRaises(ValueError): execute('cacheCapabilities',None)
