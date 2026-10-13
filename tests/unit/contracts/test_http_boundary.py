"""Generated browser boundary admission; no servers or subprocesses."""
from pathlib import Path
import tempfile
import unittest
from scripts import ROOT
from scripts.check.governance.http import check_source, audit_http, RUNTIMES, CLIENT, WORKER
from inside_inference.delivery.service import execute
from inside_inference.delivery.store import MemoryStore


class ExecutionBoundaryTests(unittest.TestCase):
    def test_bypasses_and_generated_drift_are_rejected(self):
        for source in ('from inside_inference.delivery.service import execute',
                       'from http.server import BaseHTTPRequestHandler',
                       'from scripts.build.intro_page import build'):
            self.assertTrue(check_source(Path('scripts/dev/new_runtime.py'),source))
        for source in ('fetch(url)','new Worker(url)','Declarations.routes.run','ExecutionClient.http("run",{})'):
            self.assertTrue(check_source(Path('web/inference.js'),source))
        self.assertFalse(check_source(Path('web/inference.js'),'Execution.prepareInput(workload)'))
        self.assertFalse(check_source(Path('web/execution/model-storage.js'),'fetch(url)'))
        self.assertTrue(check_source(Path('web/execution/model-service.js'),'fetch(url)'))
        self.assertTrue(check_source(Path('web/execution/model-storage.js'),'new Worker(url)'))
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
            retired=root/'inside_inference/cuda_runtime.py';retired.parent.mkdir(parents=True)
            retired.write_text('')
            self.assertTrue(audit_http(root,[],generated))

    def test_operation_admission(self):
        store=MemoryStore()
        for name,payload in [('invented',None),('capabilities',{}),('prepareInput',{})]:
            with self.assertRaises(ValueError):execute(name,payload,store)
        self.assertIn('contract_sha256',execute('capabilities',None,store))
