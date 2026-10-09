from functools import partial
from http.server import ThreadingHTTPServer
import json
import tempfile
import threading
import unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError

from inside_inference.cache_lab import run_cache_experiment,logical_record
from inside_inference.model import canonical
from inside_inference.declarations_generated import API_PATHS,CacheCapabilities,CacheRun
from scripts.dev.serve_intro import Handler
from tests.unit.test_cache_lab import scenario


class CacheServerTests(unittest.TestCase):
    def test_cache_http_matches_direct_and_rejects_unsupported_capacity(self):
        class QuietHandler(Handler):
            def log_message(self,*args):pass
        with tempfile.TemporaryDirectory() as directory:
            server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=directory))
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            base=f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base+API_PATHS['cacheCapabilities']) as response:CacheCapabilities.from_dict(json.load(response))
                spec=scenario()
                with urlopen(Request(base+API_PATHS['cacheRun'],data=canonical(spec),headers={'Content-Type':'application/json'})) as response:
                    record=json.load(response)
                CacheRun.from_dict(record)
                self.assertEqual(logical_record(record),logical_record(run_cache_experiment(spec)))
                spec['system']['device_kv_bytes']=1
                with self.assertRaises(HTTPError) as caught:
                    urlopen(Request(base+API_PATHS['cacheRun'],data=canonical(spec),headers={'Content-Type':'application/json'}))
                self.assertEqual(caught.exception.code,400)
            finally:server.shutdown();server.server_close();thread.join()
