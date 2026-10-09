"""Reproduce cache experiments through direct, CLI, HTTP, and exported browser evidence."""
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
from urllib.request import Request,urlopen

from inside_inference.cache_lab import run_cache_experiment,replay_cache,logical_record,available_backends
from inside_inference.model import canonical,identity
from inside_inference.declarations_generated import API_PATHS
from scripts import ROOT


def prepare(base,output,checkpoint_path=None):
    checkpoint=json.loads(checkpoint_path.read_text()) if checkpoint_path else None
    cases=json.loads((ROOT/'tests/fixtures/integration/cache.json').read_text())
    references=[]
    for backend in available_backends():
        for original in cases:
            case=deepcopy(original);case['id']=backend+'-'+case['id'];case['spec']['system']['backend']=backend
            record=run_cache_experiment(case['spec'],checkpoint=checkpoint)
            lookups=[e['kind'] for e in record['events'] if e['kind'] in ('miss','local-hit','remote-hit')]
            if lookups!=case['lookups']:raise AssertionError(f"{case['id']}: unexpected cache decisions")
            replay_cache(record)
            request=Request(base+API_PATHS['cacheRun'],data=canonical(case['spec']),headers={'Content-Type':'application/json'})
            with urlopen(request) as response:http=json.load(response)
            if identity(logical_record(http))!=identity(logical_record(record)):raise AssertionError('Cache HTTP differs')
            spec_path=output/(case['id']+'.cache-spec.json');spec_path.write_bytes(canonical(case['spec']))
            cli_path=output/(case['id']+'.cache-cli.json')
            command=[sys.executable,'-m','scripts.experiments.run_cache','--spec',str(spec_path),'--output',str(cli_path)]
            if checkpoint_path:command.extend(['--checkpoint',str(checkpoint_path)])
            subprocess.run(command,cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
            cli=json.loads(cli_path.read_text())
            if identity(logical_record(cli))!=identity(logical_record(record)):raise AssertionError('Cache CLI differs')
            references.append(dict(case,record=record))
    (output/'cache-references.json').write_bytes(canonical(references))
    return references


def verify_browser_exports(references,output):
    for case in references:
        record=json.loads((output/(case['id']+'.cache-browser.json')).read_text())
        if identity(logical_record(record))!=identity(logical_record(case['record'])):
            raise AssertionError('Cache browser differs from direct/CLI/HTTP evidence')
        replay_cache(record)
