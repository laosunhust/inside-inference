"""Exercise the same static browser model-family lab interactively and headlessly."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
from scripts import ROOT
from scripts.dev.http_runtimes_generated import socket_server


def main():
    out=ROOT/'out/experiments/story-models';out.mkdir(parents=True,exist_ok=True)
    server=socket_server(('127.0.0.1',0),directory=ROOT/'out/intro-page')
    assets=socket_server(('127.0.0.1',0),directory=ROOT/'out/intro-page/models',cors_origin='*')
    asset_thread=threading.Thread(target=assets.serve_forever,daemon=True);asset_thread.start()
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        chrome=shutil.which('google-chrome') or shutil.which('chromium')
        if not chrome:raise RuntimeError('Chrome required')
        with tempfile.TemporaryDirectory(prefix='story-browser-') as profile,(out/'chrome.log').open('w') as log:
            process=subprocess.Popen([chrome,'--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0',f'--user-data-dir={profile}','--disable-default-apps','about:blank'],stdout=log,stderr=log)
            try:
                portfile=Path(profile)/'DevToolsActivePort'
                for _ in range(100):
                    if portfile.exists():break
                    if process.poll() is not None:raise RuntimeError('Chrome exited')
                    time.sleep(.1)
                else:raise RuntimeError('Chrome did not start')
                port=portfile.read_text().splitlines()[0]
                subprocess.run(['node',str(ROOT/'scripts/check/story_models/runner.mjs'),port,f'http://127.0.0.1:{server.server_port}',str(out),str(ROOT/'out/intro-page'),f'http://127.0.0.1:{assets.server_port}/'],check=True,timeout=120)
            finally:process.terminate();process.wait(timeout=10)
    finally:
        server.shutdown();server.server_close();thread.join()
        assets.shutdown();assets.server_close();asset_thread.join()


if __name__=='__main__':main()
