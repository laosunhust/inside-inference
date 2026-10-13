"""Browser cost/inspection evidence using the existing static builder and socket server."""
from pathlib import Path
import shutil,subprocess,tempfile,threading,time,json
from scripts import ROOT
from scripts.build.intro_page import build
from scripts.dev.http_runtimes_generated import socket_server


def main():
    root=ROOT/'out/experiments/model-family';out=root/'browser-cost';out.mkdir(exist_ok=True)
    for name in ('baseline','wider','deeper'):
        checkpoint=json.loads((root/'training'/f'{name}-7/checkpoint.json').read_text())
        build(out/name,checkpoint=checkpoint)
    server=socket_server(('127.0.0.1',0),directory=out)
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        chrome=shutil.which('google-chrome') or shutil.which('chromium')
        if not chrome:raise RuntimeError('Chrome required')
        with tempfile.TemporaryDirectory(prefix='family-browser-') as profile,(out/'chrome.log').open('w') as log:
            process=subprocess.Popen([chrome,'--headless','--no-sandbox','--disable-gpu','--remote-debugging-port=0',f'--user-data-dir={profile}','about:blank'],stdout=log,stderr=log)
            try:
                portfile=Path(profile)/'DevToolsActivePort'
                for _ in range(100):
                    if portfile.exists():break
                    if process.poll() is not None:raise RuntimeError('Chrome exited')
                    time.sleep(.1)
                else:raise RuntimeError('Chrome did not start')
                port=portfile.read_text().splitlines()[0]
                subprocess.run(['node',str(ROOT/'scripts/check/model_family/browser.mjs'),port,f'http://127.0.0.1:{server.server_port}',str(out)],check=True,timeout=180)
            finally:process.terminate();process.wait(timeout=10)
    finally:server.shutdown();server.server_close();thread.join()

if __name__=='__main__':main()
