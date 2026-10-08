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
from inside_inference.workload import default_workload, validate_run, run_workload
from inside_inference.declarations_generated import API_PATHS, Capabilities, RunRecord, ApiError
from scripts.build.intro_page import build
from scripts.dev.serve_intro import Handler


class ServerTests(unittest.TestCase):
    def test_same_engine_over_http_and_explicit_failures(self):
        with tempfile.TemporaryDirectory() as directory:
            build(Path(directory))
            class QuietHandler(Handler):
                def log_message(self, *args): pass
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=directory))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base + '/index.html') as response:
                    self.assertIn(b'inference-data', response.read())
                with urlopen(base + API_PATHS['capabilities']) as response:
                    Capabilities.validate_shape(json.load(response))
                def post(spec, origin=None):
                    headers = {'Content-Type': 'application/json'}
                    if origin: headers['Origin'] = origin
                    return urlopen(Request(base + API_PATHS['run'], data=json.dumps({'kind':'fixed-arrivals','requests':[{'request_id':'r1','arrival_us':0,'request':spec}]}).encode(), headers=headers))
                with post(DEFAULT_REQUEST) as response:
                    run = json.load(response)
                    RunRecord.validate_shape(run)
                    validate_run(run)
                    self.assertEqual(run['declaration']['workload']['requests'][0]['request'], DEFAULT_REQUEST)
                    self.assertEqual(run['traces'][0]['passes'][0]['selection']['raw_logits'], run['traces'][0]['passes'][0]['nodes'][-1]['values'][-1])
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
