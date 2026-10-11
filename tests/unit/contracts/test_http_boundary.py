"""Governance and HTTP admission checks; no socket or external runtime work."""
import io
from pathlib import Path
import tempfile
import unittest
from scripts import ROOT
from scripts.check.governance.http import check_source, audit_http, RUNTIMES, METADATA
from inside_inference.delivery.application import application
from inside_inference.delivery.site import validate_roots
from inside_inference.delivery.store import FileStore, MemoryStore
from inside_inference.declarations_generated import API_PATHS


class HttpBoundaryTests(unittest.TestCase):
    def test_runtime_bypasses_and_generated_drift_are_rejected(self):
        for source in ('from inside_inference.delivery.service import dispatch as run',
                       'from inside_inference.delivery import service',
                       'from inside_inference.delivery.application import application',
                       'from http.server import BaseHTTPRequestHandler',
                       'from scripts.build.intro_page import build',
                       'from scripts.dev.http_runtimes_generated import lambda_response\nheader="Origin"'):
            with self.subTest(source=source):
                self.assertTrue(check_source(Path('scripts/dev/new_runtime.py'),source))
        self.assertFalse(check_source(Path('scripts/dev/entry.py'),
                                     'from scripts.dev.http_runtimes_generated import lambda_response'))
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            generated={name:(ROOT/name).read_text() for name in (RUNTIMES,METADATA)}
            for name,source in generated.items():
                (root/name).parent.mkdir(parents=True,exist_ok=True)
                (root/name).write_text(source)
            self.assertEqual(audit_http(root,[],generated),[])
            (root/RUNTIMES).write_text(generated[RUNTIMES]+'\n# alternate handler\n')
            self.assertTrue(audit_http(root,[],generated))

    def test_storage_roots_must_be_disjoint_including_symlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); site=root/'site'; site.mkdir()
            validate_roots(site,FileStore(root/'evidence'))
            for location in (site, site/'evidence',root):
                with self.assertRaisesRegex(ValueError,'disjoint'): validate_roots(site,FileStore(location))
            (root/'alias').symlink_to(site,target_is_directory=True)
            with self.assertRaisesRegex(ValueError,'disjoint'): validate_roots(site,FileStore(root/'alias'))

    def test_shared_admission(self):
        for origin in ('','https://example.test/path'):
            with self.assertRaises(ValueError): application(MemoryStore(),public_origin=origin)
        app=application(MemoryStore(),public_origin='https://example.test')
        def invoke(path,method,body=b'',**headers):
            captured=[]
            chunks=app({'PATH_INFO':path,'REQUEST_METHOD':method,'CONTENT_LENGTH':str(len(body)),
                        'wsgi.input':io.BytesIO(body),**headers},lambda status,head:captured.append((status,head)))
            return int(captured[0][0].split()[0]),b''.join(chunks)
        self.assertEqual(invoke(API_PATHS['capabilities'],'GET')[0],200)
        self.assertEqual(invoke(API_PATHS['capabilities'],'GET',HTTP_ORIGIN='https://wrong.test')[0],403)
        self.assertEqual(invoke(API_PATHS['run'],'POST',b'{}',CONTENT_TYPE='text/plain')[0],400)
        self.assertEqual(invoke(API_PATHS['run'],'POST',b'\xff',CONTENT_TYPE='application/json')[0],400)
