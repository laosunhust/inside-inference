"""Exercise the actual page in installed Chrome using Node's built-in CDP transport."""
import argparse
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
from scripts.dev.http_runtimes_generated import socket_server


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
        # Default-checkpoint site assertions and browser consume the same fresh build.
        # External checkpoints require a separate default fixture for those assertions.
        import sys
        if checkpoint is None:
            sys.modules['test_site'].AtlasTests.shared_site = site
        if not run_suite(suite, output/'integration-timing.json'):
            result_path.write_text(json.dumps({'passed':False,'status':'integration tests failed'}))
            raise SystemExit(1)
    server = socket_server(('127.0.0.1', 0), directory=site)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f'http://127.0.0.1:{server.server_port}'
        shutil.copyfile(ROOT/'tests/fixtures/integration/workloads.json',output/'references.json')
        shutil.copyfile(ROOT/'tests/fixtures/integration/cache.json',output/'cache-references.json')
        with tempfile.TemporaryDirectory(prefix='inference-browser-') as profile:
            with (output / 'chrome.log').open('w') as log:
                process = subprocess.Popen([chrome, '--headless', '--no-sandbox', '--disable-gpu',
                    '--remote-debugging-port=0', f'--user-data-dir={profile}', '--no-first-run',
                    '--no-default-browser-check', 'about:blank'], stdout=log, stderr=log)
                try:
                    portfile = Path(profile) / 'DevToolsActivePort'
                    for _ in range(100):
                        if portfile.exists(): break
                        if process.poll() is not None: raise RuntimeError('Chrome exited; inspect chrome.log')
                        time.sleep(.1)
                    else: raise RuntimeError('Chrome debugging did not start')
                    port = int(portfile.read_text().splitlines()[0])
                    subprocess.run([node, str(ROOT / 'scripts/check/browser_check.mjs'), str(port),
                        f'http://127.0.0.1:{server.server_port}', site.as_uri(), str(output)], check=True, timeout=120)
                    result_path.write_text(json.dumps({'passed':True,
                        'scope':'static-only site; interactive/headless calls in the same browser worker',
                        'parity':['browser headless operations','interactive computation','artifact restoration','browser export']},indent=2))
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


if __name__ == '__main__':
    main()
