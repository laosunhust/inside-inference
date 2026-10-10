from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from inside_inference.generation import DEFAULT_REQUEST
from inside_inference.model import canonical
from inside_inference.workload import default_workload, run_workload
from inside_inference.declarations_generated import API_PATHS, ApiError
from scripts.build.intro_page import build
from scripts.dev.serve_intro import Handler


class ServerTests(unittest.TestCase):
    shared_site = None

    def test_http_input_preservation_and_error_translation(self):
        with tempfile.TemporaryDirectory() as directory:
            if self.shared_site is None:
                build(Path(directory))
            else:
                directory = str(self.shared_site)
            class QuietHandler(Handler):
                def log_message(self, *args): pass
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=directory))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base + '/index.html') as response:
                    self.assertIn(b'inference-data', response.read())
                def post(spec, origin=None):
                    headers = {'Content-Type': 'application/json'}
                    if origin: headers['Origin'] = origin
                    return urlopen(Request(base + API_PATHS['run'], data=json.dumps({'kind':'fixed-arrivals','requests':[{'request_id':'r1','arrival_us':0,'request':spec}]}).encode(), headers=headers))
                # Valid domain input must not acquire an undeclared HTTP-only size rule.
                workload=default_workload().to_dict()
                workload['requests'][0]['request_id']='r'+'x'*17000
                workload['requests'][0]['request']['generation']['max_new_tokens']=1
                request=Request(base+API_PATHS['run'],data=json.dumps(workload).encode(),
                                headers={'Content-Type':'application/json; charset=utf-8'})
                with urlopen(request) as response:
                    self.assertEqual(canonical(json.load(response)),canonical(run_workload(workload)))
                for spec, origin, code in [(dict(DEFAULT_REQUEST, text='cat ' * 200), None, 400), (DEFAULT_REQUEST, 'http://unrelated.example', 403), ({}, None, 400)]:
                    with self.assertRaises(HTTPError) as caught:
                        post(spec, origin)
                    self.assertEqual(caught.exception.code, code)
                    ApiError.validate_shape(json.load(caught.exception))
            finally:
                server.shutdown()
                server.server_close()
                thread.join()
