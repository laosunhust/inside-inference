"""Exercise the actual page in installed Chrome using Node's built-in CDP transport."""
import argparse
from functools import partial
from urllib.parse import urlsplit
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import unittest

from scripts.check.governance.harness import run_suite

from scripts.build.intro_page import ROOT, build
from scripts.build.hosting.layout import asset_root
from scripts.build.hosting.release import checksums, digest
from scripts.dev.http_runtimes_generated import socket_server


def observe_requests(server, records):
    """Capture worker/page traffic without pausing or attaching to the worker."""
    original = server.RequestHandlerClass
    class ObservedHandler(original.func):
        def parse_request(self):
            accepted = super().parse_request()
            if accepted:
                records.append({'method': self.command, 'path': self.path, 'port': server.server_port})
            return accepted
    server.RequestHandlerClass = partial(ObservedHandler, *original.args, **original.keywords)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--integration-tests', action='store_true')
    parser.add_argument('--checkpoint', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT/'out/experiments/integration')
    args = parser.parse_args()
    checkpoint = json.loads(args.checkpoint.read_text()) if args.checkpoint else None
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    result_path = output / 'result.json'
    result_path.write_text(json.dumps({'passed':False,'status':'running'}))
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    node = shutil.which('node')
    if not chrome or not node:
        message='Browser checks require Chrome/Chromium and Node with built-in WebSocket support.'
        result_path.write_text(json.dumps({'passed':False,'status':'failed','error':message}))
        raise SystemExit(message)
    site = output / 'site'
    build(site, checkpoint=checkpoint)
    if args.integration_tests:
        suite = unittest.defaultTestLoader.discover(str(ROOT/'tests/integration'))
        # Structural checks and browser consume the same declared checkpoint/site.
        import sys
        sys.modules['test_site'].AtlasTests.shared_site = site
        sys.modules['test_site'].AtlasTests.shared_checkpoint = checkpoint
        if not run_suite(suite, output/'integration-timing.json'):
            result_path.write_text(json.dumps({'passed':False,'status':'integration tests failed'}))
            raise SystemExit(1)
    server = socket_server(('127.0.0.1', 0), directory=site)
    assets=socket_server(('127.0.0.1',0),directory=asset_root(site)/'models',cors_origin='*')
    requests=[]
    for endpoint in (server, assets): observe_requests(endpoint, requests)
    asset_thread=threading.Thread(target=assets.serve_forever,daemon=True);asset_thread.start()
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f'http://127.0.0.1:{server.server_port}'
        cache_fixtures=json.loads((ROOT/'tests/fixtures/integration/cache.json').read_text())
        if checkpoint is not None:
            from inside_inference.declarations_generated import ModelArchitecture
            baseline=ModelArchitecture()
            scale=checkpoint['config']['width']*checkpoint['config']['layers']/(baseline.width*baseline.layers)
            # Same cache-slot pressure across model shapes, declared before execution.
            # This parameterizes test inputs; production admission never repairs capacity.
            for fixture in cache_fixtures:
                for field in ('device_kv_bytes','host_kv_bytes'):
                    fixture['spec']['system']['kv_cache'][field]=int(fixture['spec']['system']['kv_cache'][field]*scale)
        (output/'cache-references.json').write_text(json.dumps(cache_fixtures,indent=2)+'\n')
        with tempfile.TemporaryDirectory(prefix='inference-browser-') as profile:
            with (output / 'chrome.log').open('w') as log:
                # Fresh profiles otherwise install Chrome's default Drive app mid-run, which
                # intermittently fails in-flight worker fetches before they reach the server.
                process = subprocess.Popen([chrome, '--headless', '--no-sandbox', '--disable-gpu',
                    '--remote-debugging-port=0', f'--user-data-dir={profile}', '--no-first-run',
                    '--no-default-browser-check', '--disable-default-apps', 'about:blank'], stdout=log, stderr=log)
                try:
                    portfile = Path(profile) / 'DevToolsActivePort'
                    for _ in range(100):
                        if portfile.exists(): break
                        if process.poll() is not None: raise RuntimeError('Chrome exited; inspect chrome.log')
                        time.sleep(.1)
                    else: raise RuntimeError('Chrome debugging did not start')
                    port = int(portfile.read_text().splitlines()[0])
                    subprocess.run([node, str(ROOT / 'scripts/check/browser_check.mjs'), str(port),
                        f'http://127.0.0.1:{server.server_port}', asset_root(site).as_uri(), str(output),f'http://127.0.0.1:{assets.server_port}/'], check=True, timeout=120)
                    (output/'static-requests.json').write_text(json.dumps(requests,indent=2))
                    if not requests or any(r['method'] != 'GET' or urlsplit(r['path']).path.startswith('/api/') for r in requests):
                        raise AssertionError('Browser and worker must use static GET requests, never a compute API')
                    result_path.write_text(json.dumps({'passed':True, 'site_sha256':digest(checksums(site)),
                        'scope':'static-only site; interactive/headless calls in the same browser worker',
                        'parity':['browser headless operations','interactive computation','verified model assets','browser export']},indent=2))
                finally:
                    process.terminate()
                    process.wait(timeout=10)
    except Exception as exc:
        result_path.write_text(json.dumps({'passed':False,'status':'failed','error':str(exc)},indent=2))
        raise
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
        assets.shutdown();assets.server_close();asset_thread.join()


if __name__ == '__main__':
    main()
