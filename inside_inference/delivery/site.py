"""Static presentation composition; API requests always reach the HTTP application."""
import mimetypes
from pathlib import Path
from urllib.parse import unquote
from wsgiref.util import FileWrapper
from inside_inference.delivery.http_generated import POLICY


def validate_roots(directory, store):
    if not hasattr(store, 'root'): return
    site, evidence = Path(directory).resolve(), store.root.resolve()
    if evidence.is_relative_to(site) or site.is_relative_to(evidence):
        raise ValueError('Website and evidence roots must be disjoint')


def site_application(directory, api):
    root = Path(directory).resolve()
    def serve(environ, start_response):
        route = environ['PATH_INFO']
        prefix = POLICY['api-prefix']
        if route == prefix.rstrip('/') or route.startswith(prefix):
            return api(environ, start_response)
        path = (root / unquote(route).lstrip('/')).resolve()
        if path.is_dir(): path = (path / 'index.html').resolve()
        if (environ['REQUEST_METHOD'] not in ('GET','HEAD') or not path.is_relative_to(root)
                or not path.is_file()):
            start_response('404 Not Found', [('Content-Type','text/plain'), ('Cache-Control','no-store')])
            return [b'Not found']
        headers = [('Content-Type',mimetypes.guess_type(path)[0] or 'application/octet-stream'),
                   ('Content-Length',str(path.stat().st_size)), ('Cache-Control','no-cache')]
        start_response('200 OK', headers)
        return [] if environ['REQUEST_METHOD']=='HEAD' else FileWrapper(path.open('rb'))
    return serve
