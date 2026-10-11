"""Serve static assets only and run the real Chromium-worker experiment."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
from scripts.experiments.browser_spike.prepare import OUTPUT
from scripts.experiments.browser_spike.compare import compare


def main():
    (OUTPUT/'result.json').write_text(json.dumps({'passed':False,'status':'running'}))
    chrome=shutil.which('google-chrome') or shutil.which('chromium')
    if not chrome:raise RuntimeError('Installed Chromium is required')
    requests=[]
    class Static(SimpleHTTPRequestHandler):
        def log_message(self,fmt,*args):pass
        def do_GET(self):
            requests.append({'method':self.command,'path':self.path,'phase':self.server.phase})
            if self.server.phase=='offline':self.send_error(503,'Static server disabled');return
            return super().do_GET()
        def do_POST(self):
            requests.append({'method':self.command,'path':self.path,'phase':self.server.phase})
            self.send_error(405,'No compute service exists')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Static,directory=str(OUTPUT/'site')))
    server.phase='startup'
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with tempfile.TemporaryDirectory(prefix='inference-pyodide-') as profile, (OUTPUT/'chrome.log').open('w') as log:
            browser=subprocess.Popen([chrome,'--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0',
                '--no-first-run','--no-default-browser-check',f'--user-data-dir={profile}','about:blank'],stdout=log,stderr=log)
            try:
                portfile=Path(profile)/'DevToolsActivePort'
                for _ in range(100):
                    if portfile.exists():break
                    if browser.poll() is not None:raise RuntimeError('Browser exited')
                    time.sleep(.1)
                else:raise RuntimeError('Browser debugging startup timed out')
                driver=subprocess.Popen(['node',str(Path(__file__).with_name('driver.mjs')),portfile.read_text().splitlines()[0],
                    f'http://127.0.0.1:{server.server_port}',str(OUTPUT)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
                for line in driver.stdout:
                    if line.strip() in ('offline','online'):
                        server.phase='offline' if line.strip()=='offline' else 'repeat-startup'
                        driver.stdin.write('ok\n');driver.stdin.flush()
                    else:print(line,end='',flush=True)
                if driver.wait()!=0:raise RuntimeError('Browser spike failed; inspect evidence')
            finally:browser.terminate();browser.wait(timeout=10)
    finally:
        server.shutdown();server.server_close();thread.join()
        (OUTPUT/'requests.json').write_text(json.dumps(requests,indent=2))
    compare()


if __name__=='__main__':main()
