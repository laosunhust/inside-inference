"""Run the preregistered pilot against sealed local release bytes."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import yaml
from scripts import ROOT
from scripts.build.hosting.release import verify
from scripts.dev.http_runtimes_generated import socket_server


def main():
    home = ROOT/'data/experiments/kv-timing-pilot'
    protocol_path = home/'protocol.yaml'
    protocol = yaml.safe_load(protocol_path.read_text())
    site = ROOT/'out/releases'/protocol['release']/'site'
    verify(site, protocol['release'])
    if (home/'observations').exists():
        raise ValueError('Retained observations already exist; do not overwrite or silently rerun this pilot')
    (home/'observations').mkdir()
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    if not chrome or not shutil.which('node'): raise RuntimeError('Chrome and Node required')
    output = ROOT/'out/experiments/kv-timing-pilot';output.mkdir(parents=True,exist_ok=True)
    manifest = {'protocol_sha256':hashlib.sha256(protocol_path.read_bytes()).hexdigest(),
                'release':protocol['release'], 'chrome':subprocess.check_output([chrome,'--version'],text=True).strip(),
                'node':subprocess.check_output(['node','--version'],text=True).strip(),
                'git_revision':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
                'runner_sha256':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in (Path(__file__), ROOT/'scripts/experiments/kv_timing/pilot.mjs')},
                'protocol':protocol, 'status':'running'}
    (home/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    server = socket_server(('127.0.0.1',0),directory=site)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix='kv-pilot-') as profile, (output/'chrome.log').open('w') as log:
            process = subprocess.Popen([chrome,'--headless','--no-sandbox','--disable-gpu',
                '--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run',
                '--no-default-browser-check','--disable-default-apps','about:blank'],stdout=log,stderr=log)
            try:
                portfile=Path(profile)/'DevToolsActivePort'
                for _ in range(100):
                    if portfile.exists():break
                    if process.poll() is not None:raise RuntimeError('Chrome exited')
                    time.sleep(.1)
                else:raise RuntimeError('Chrome did not start')
                subprocess.run(['node',str(ROOT/'scripts/experiments/kv_timing/pilot.mjs'),portfile.read_text().splitlines()[0],
                    f'http://127.0.0.1:{server.server_port}',str(home)],check=True,
                    timeout=protocol['setup_wall_seconds']+len(protocol['contexts'])*protocol['context_wall_seconds']+30)
                manifest['status']='completed'
            finally:
                process.terminate();process.wait(timeout=10)
    except BaseException as error:
        manifest.update(status='failed',error=str(error));raise
    finally:
        server.shutdown();server.server_close()
        (home/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')


if __name__=='__main__':main()
