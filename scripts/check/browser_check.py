"""Exercise the actual page in installed Chrome using Node's built-in CDP transport."""
import argparse
from functools import partial
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time

from scripts.build.intro_page import ROOT, build
from scripts.dev.serve_intro import Handler
from scripts.check.parity import prepare, verify_browser_exports
from scripts.check import cache_parity


def main():
    parser = argparse.ArgumentParser(description=__doc__)
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
    class QuietHandler(Handler):
        def log_message(self, *args): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(site), checkpoint=checkpoint))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f'http://127.0.0.1:{server.server_port}'
        references = prepare(base,output,checkpoint_path=args.checkpoint)
        cache_references = cache_parity.prepare(base,output,checkpoint_path=args.checkpoint)
        for case in references:
            (output / (case['id']+'.browser.json')).unlink(missing_ok=True)
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
                    verify_browser_exports(references,output)
                    cache_parity.verify_browser_exports(cache_references,output)
                    result_path.write_text(json.dumps({'passed':True, 'scope':'local HTTP adapter, live and offline browser',
                        'cases':[{'id':c['id'],'run_id':c['record']['id']} for c in references],
                        'cache_cases':[{'id':c['id'],'run_id':c['record']['id']} for c in cache_references],
                        'contract_sha256':references[0]['record']['contract_sha256'],
                        'parity':['headless','CLI','HTTP','browser export','browser export replay']},indent=2))
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
