"""Local live execution for the generated intro page; numerical results stay in Python."""
import argparse
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer
from scripts.dev.responses_generated import DeclaredResponseHandler

from inside_inference.workload import run_workload
from inside_inference.declarations_generated import CONTRACT_SHA256, API_PATHS, Capabilities, ApiError, CacheRun, RunRecord
from inside_inference.contract_runtime import decode_json
from inside_inference.cache_lab import run_cache_experiment, available_backends
from inside_inference.declarations_generated import CacheCapabilities
from scripts.build.intro_page import ROOT, build


class Handler(DeclaredResponseHandler):
    def __init__(self, *args, checkpoint=None, **kwargs):
        self.checkpoint = checkpoint
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == API_PATHS['cacheCapabilities']:
            return self.send_declaration(200, CacheCapabilities(contract_sha256=CONTRACT_SHA256,
                backends=tuple(available_backends())))
        if self.path == API_PATHS['capabilities']:
            return self.send_declaration(200, Capabilities(contract_sha256=CONTRACT_SHA256))
        return super().do_GET()

    def do_POST(self):
        if self.path not in (API_PATHS['run'], API_PATHS['cacheRun']):
            return self.send_declaration(404, ApiError(error='Unknown endpoint'))
        # This server is bound to loopback and accepts same-origin JSON only.
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.send_declaration(403, ApiError(error='Cross-origin execution is not supported'))
        try:
            if self.headers.get_content_type() != 'application/json':
                raise ValueError('Expected application/json')
            size = int(self.headers.get('Content-Length', '0'))
            if size <= 0:
                raise ValueError('Request body must contain JSON')
            spec = decode_json(self.rfile.read(size).decode('utf-8'))
            execute = run_cache_experiment if self.path == API_PATHS['cacheRun'] else run_workload
            result = execute(spec, checkpoint=self.checkpoint)
        except (ValueError, TypeError, UnicodeError) as exc:
            return self.send_declaration(400, ApiError(error=str(exc)))
        if self.path == API_PATHS['cacheRun']:
            return self.send_declaration(200, CacheRun.from_dict(result))
        return self.send_declaration(200, RunRecord.from_dict(result))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--checkpoint', type=Path, help='Use this explicit checkpoint for embedded and live runs')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    directory = ROOT / 'out/intro-page'
    checkpoint = decode_json(args.checkpoint.read_text()) if args.checkpoint else None
    build(directory, checkpoint=checkpoint)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(directory), checkpoint=checkpoint))
    print(f'Inside Inference: http://127.0.0.1:{server.server_port}/index.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
