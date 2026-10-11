"""The website server exposes static assets, never a compute API."""
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from scripts.dev.http_runtimes_generated import socket_server


class StaticRuntimeTests(unittest.TestCase):
    def test_static_only_and_private_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);site=root/'site';site.mkdir()
            (site/'index.html').write_text('website')
            (root/'private').write_text('private')
            (site/'leak').symlink_to(root/'private')
            server=socket_server(('127.0.0.1',0),directory=site)
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            base=f'http://127.0.0.1:{server.server_port}'
            try:
                with urlopen(base+'/') as response:self.assertEqual(response.read(),b'website')
                for path in ('/api/runs','/leak','/../private'):
                    with self.assertRaises(HTTPError):urlopen(base+path)
                with self.assertRaises(HTTPError) as caught:
                    urlopen(Request(base+'/',data=b'private input'))
                self.assertEqual(caught.exception.code,501)
            finally:server.shutdown();server.server_close();thread.join()
