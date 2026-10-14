"""Qualify the actual HTTPS origin and browser against a sealed local release."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import gzip
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from scripts import ROOT
from scripts.build.hosting.release import verify, entries, digest
from scripts.build.hosting.aws import configuration, stack, outputs, aws, hostname


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def redirect(url):
    try:
        with build_opener(NoRedirect).open(url, timeout=30) as response:
            return response.status, dict(response.headers)
    except HTTPError as error:
        return error.code, dict(error.headers)


def fetch(url, encoding='identity'):
    with urlopen(Request(url, headers={'Accept-Encoding':encoding}), timeout=60) as response:
        raw = response.read()
        headers = {k.lower():v for k,v in response.headers.items()}
    return raw, headers


def assets(origin, release, manifest):
    inventory = entries(manifest)
    pages = {'index.html':'/'}
    status, headers = redirect(origin+'/')
    headers = {k.lower():v for k,v in headers.items()}
    if status != 200 or 'location' in headers:
        raise ValueError('Root must serve directly without redirect')
    if headers.get('cache-control') != 'no-cache':
        raise ValueError('Document must revalidate on navigation')
    status, headers = redirect(origin.replace('https:', 'http:')+'/')
    if status not in (301, 302, 307, 308) or not headers.get('Location', headers.get('location', '')).startswith(origin):
        raise ValueError('HTTP must redirect to HTTPS')
    types = {'.html':('text/html',), '.js':('application/javascript','text/javascript'),
             '.mjs':('application/javascript','text/javascript'), '.css':('text/css',),
             '.json':('application/json',), '.wasm':('application/wasm',)}
    def check(item):
        name, checksum = item
        raw, headers = fetch(origin+pages.get(name, '/'+name))
        if digest(raw) != checksum: raise ValueError('Hosted digest mismatch: '+name)
        suffix = Path(name).suffix
        if suffix in types and headers.get('content-type', '').split(';')[0] not in types[suffix]:
            raise ValueError('Wrong MIME type: '+name)
        if name not in pages and 'immutable' not in headers.get('cache-control', ''):
            raise ValueError('Versioned asset lacks immutable caching: '+name)
        if headers.get('x-content-type-options') != 'nosniff' or 'max-age=' not in headers.get('strict-transport-security', ''):
            raise ValueError('Missing hosted security headers: '+name)
        return len(raw)
    with ThreadPoolExecutor(max_workers=8) as pool:
        sizes = list(pool.map(check, entries(manifest).items()))
    for path in ('/ontology/', '/declarations/', '/missing-route', '/missing.js', '/index.html', '/releases/'+release+'/index.html'):
        missing, _ = redirect(origin+path)
        if missing != 404: raise ValueError('Unknown or internal page must be 404: '+path)
    runtime = next(name for name in inventory if name.endswith('/execution/runtime/pyodide.asm.js'))
    absent, _ = redirect(origin+'/'+runtime.rsplit('/', 1)[0]+'/missing.js')
    if absent not in (403, 404): raise ValueError('Missing payload must not fall back to HTML')
    compressed, headers = fetch(origin+'/'+runtime, 'gzip')
    if headers.get('content-encoding') != 'gzip': raise ValueError('Runtime JavaScript is not delivered compressed')
    if digest(gzip.decompress(compressed)) != inventory[runtime]:
        raise ValueError('Compressed asset changed bytes')
    return {'files':len(sizes), 'uncompressed_bytes':sum(sizes), 'sample_gzip_bytes':len(compressed),
            'missing_status':missing, 'root':'/', 'root_status':200, 'redirect':False}


def browser(origin, release, output):
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    if not chrome or not shutil.which('node'): raise RuntimeError('Chrome and Node required')
    with tempfile.TemporaryDirectory(prefix='inside-inference-hosted-') as profile, (output/'chrome.log').open('w') as log:
        process = subprocess.Popen([chrome, '--headless', '--no-sandbox', '--disable-gpu',
            '--remote-debugging-port=0', '--user-data-dir='+profile, '--no-first-run',
            '--no-default-browser-check', '--disable-default-apps', 'about:blank'], stdout=log, stderr=log)
        try:
            portfile = Path(profile)/'DevToolsActivePort'
            for _ in range(100):
                if portfile.exists(): break
                if process.poll() is not None: raise RuntimeError('Chrome exited')
                time.sleep(.1)
            else: raise RuntimeError('Chrome did not start')
            subprocess.run(['node', str(ROOT/'scripts/check/hosting/smoke.mjs'),
                portfile.read_text().splitlines()[0], origin, release, str(output)], check=True, timeout=180)
        finally:
            process.terminate(); process.wait(timeout=10)
    return json.loads((output/'browser.json').read_text())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--environment', choices=['dev', 'prod'], required=True)
    parser.add_argument('--release', required=True)
    args = parser.parse_args()
    config = configuration()
    current = outputs(stack(config, args.environment))
    if current['Release'] != args.release: raise ValueError('Stack has a different active release')
    origin = 'https://'+hostname(config, args.environment)
    release_dir = ROOT/'out/releases'/args.release
    manifest = verify(release_dir/'site', args.release)
    output = ROOT/'out/experiments/hosting'/args.environment/args.release
    output.mkdir(parents=True, exist_ok=True)
    report_path = release_dir/(args.environment+'-verification.json')
    report = {'passed':False, 'origin':origin, 'release':args.release}
    report_path.write_text(json.dumps(report))
    private_url = 'https://'+current['Bucket']+'.s3.'+config['region']+'.amazonaws.com/releases/'+args.release+'/index.html'
    private_status, _ = redirect(private_url)
    if private_status != 403: raise ValueError('S3 origin must deny anonymous asset reads')
    report['private_origin_status'] = private_status
    report['assets'] = assets(origin, args.release, manifest)
    report['browser'] = browser(origin, args.release, output)
    report['passed'] = True
    report_path.write_text(json.dumps(report, indent=2)+'\n')
    aws(config, 's3', 'cp', str(report_path), 's3://'+current['Bucket']+'/qualifications/'+args.release+'/hosted.json', '--only-show-errors')
    print(json.dumps(report, indent=2))


if __name__ == '__main__': main()
