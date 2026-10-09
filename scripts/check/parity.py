"""Replay the same admitted workloads across in-process, CLI, and HTTP adapters."""
import json
import subprocess
import sys
from urllib.request import Request, urlopen

from scripts import ROOT
from scripts.check.selection_contract import assert_unrestricted_generation
from inside_inference.contract_runtime import decode_json
from inside_inference.declarations_generated import API_PATHS, Capabilities, CONTRACT_SHA256
from inside_inference.model import canonical
from inside_inference.workload import run_workload, validate_run


def assert_same(expected, actual, label):
    validate_run(actual)
    assert_unrestricted_generation(actual)
    if canonical(expected) != canonical(actual):
        raise AssertionError(f'{label}: complete run differs from headless execution')


def prepare(base, output, *, checkpoint_path=None):
    checkpoint = decode_json(checkpoint_path.read_text()) if checkpoint_path else None
    with urlopen(base + API_PATHS['capabilities'],timeout=30) as response:
        capabilities=json.load(response)
    Capabilities.validate_shape(capabilities)
    if capabilities['contract_sha256'] != CONTRACT_SHA256:
        raise AssertionError('HTTP contract differs from local execution')
    cases=decode_json((ROOT/'tests/fixtures/integration/workloads.json').read_text())
    references=[]
    for case in cases:
        name=case['id']
        workload=case['workload']
        workload_path=output/f'{name}.workload.json'
        workload_path.write_bytes(canonical(workload)+b'\n')
        expected=run_workload(workload, checkpoint=checkpoint)
        assert_unrestricted_generation(expected)
        (output/f"inference-{expected['id'][:12]}.json").unlink(missing_ok=True)
        # These fixture outcomes belong to the default weights. External artifacts
        # must satisfy the same raw-logit/termination oracle, but may select TURN_END.
        for field,value in (case['expected'] if checkpoint is None else {}).items():
            if expected['traces'][0]['outcome'][field] != value:
                raise AssertionError(f'{name}: baseline outcome differs at {field}')
        (output/f'{name}.headless.json').write_bytes(canonical(expected)+b'\n')
        cli_path=output/f'{name}.cli.json'
        subprocess.run([sys.executable,'-m','scripts.experiments.run_inference',
            '--workload',str(workload_path),'--output',str(cli_path)]
            + (['--checkpoint',str(checkpoint_path)] if checkpoint_path else []),cwd=ROOT,check=True,
            capture_output=True,text=True,timeout=60)
        assert_same(expected,decode_json(cli_path.read_text()),name+' CLI')
        request=Request(base+API_PATHS['run'],data=canonical(workload),headers={'Content-Type':'application/json'})
        with urlopen(request,timeout=60) as response:
            remote=decode_json(response.read().decode())
        (output/f'{name}.http.json').write_bytes(canonical(remote)+b'\n')
        assert_same(expected,remote,name+' HTTP')
        references.append({'id':name,'workload':workload,'record':expected})
    (output/'references.json').write_bytes(canonical(references)+b'\n')
    return references


def verify_browser_exports(references,output):
    for case in references:
        browser_path=output/f"{case['id']}.browser.json"
        browser=decode_json(browser_path.read_text())
        assert_same(case['record'],browser,case['id']+' browser export')
        replay_path=output/f"{case['id']}.replayed.json"
        subprocess.run([sys.executable,'-m','scripts.experiments.run_inference',
            '--replay',str(browser_path),'--output',str(replay_path)],cwd=ROOT,
            check=True,capture_output=True,text=True,timeout=60)
        assert_same(browser,decode_json(replay_path.read_text()),case['id']+' browser replay')
