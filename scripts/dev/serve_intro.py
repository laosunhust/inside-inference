"""Local live execution for the generated intro page; numerical results stay in Python."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from inside_inference.workload import run_workload
from inside_inference.declarations_generated import CONTRACT_SHA256, API_PATHS, Capabilities
from inside_inference.contract_runtime import decode_json
from inside_inference.model import canonical
from scripts.build.intro_page import ROOT, build


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, status, value):
        raw = canonical(value)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == API_PATHS['capabilities']:
            return self.send_json(200, Capabilities(contract_sha256=CONTRACT_SHA256).to_dict())
        return super().do_GET()

    def do_POST(self):
        if self.path != API_PATHS['run']:
            return self.send_json(404, {'error': 'Unknown endpoint'})
        # This server is bound to loopback and accepts same-origin JSON only.
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.send_json(403, {'error': 'Cross-origin execution is not supported'})
        try:
            if self.headers.get_content_type() != 'application/json':
                raise ValueError('Expected application/json')
            size = int(self.headers.get('Content-Length', '0'))
            if size <= 0:
                raise ValueError('Request body must contain JSON')
            spec = decode_json(self.rfile.read(size).decode('utf-8'))
            result = run_workload(spec)
        except (ValueError, TypeError, UnicodeError) as exc:
            return self.send_json(400, {'error': str(exc)})
        return self.send_json(200, result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    directory = ROOT / 'out/intro-page'
    build(directory)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(directory)))
    print(f'Inside Inference: http://127.0.0.1:{server.server_port}/index.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
