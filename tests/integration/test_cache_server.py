import json
import tempfile
import threading
import unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError

from inside_inference.model import canonical
from inside_inference.declarations_generated import API_PATHS,CacheCapabilities,ApiError
from scripts.dev.http_runtimes_generated import socket_server
from inside_inference.delivery.store import MemoryStore
from tests.fixtures.execution import cache_scenario as scenario


class CacheServerTests(unittest.TestCase):
    def test_cache_capabilities_and_http_error_translation(self):
        with tempfile.TemporaryDirectory() as directory:
            server=socket_server(('127.0.0.1',0),directory=directory,store=MemoryStore())
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            base=f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base+API_PATHS['cacheCapabilities']) as response:CacheCapabilities.from_dict(json.load(response))
                spec=scenario()
                spec['system']['kv_cache']['device_kv_bytes']=1
                with self.assertRaises(HTTPError) as caught:
                    urlopen(Request(base+API_PATHS['cacheRun'],data=canonical(spec),headers={'Content-Type':'application/json'}))
                self.assertEqual(caught.exception.code,400)
                ApiError.validate_shape(json.load(caught.exception))
            finally:server.shutdown();server.server_close();thread.join()
