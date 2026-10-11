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
from inside_inference.workload import run_workload
from inside_inference.delivery.codec import restore
from inside_inference.delivery.http import HttpStore


def assert_same(expected, actual, label):
    # Reference execution owns validity and its independent numerical oracle.
    # Exact equality checks adapter fidelity without repeating component checks.
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
            remote=restore(decode_json(response.read().decode()),HttpStore(base))
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


def prepare_steps(base, output, *, checkpoint_path=None):
    """Small branching cases; same declarations through numerical, CLI and HTTP entry points."""
    from inside_inference.generation import DEFAULT_REQUEST, run_token_step
    from inside_inference.declarations_generated import LAB_BINDINGS
    from inside_inference.model import default_checkpoint, identity
    from inside_inference.tokenizer import Tokenizer, Turn
    checkpoint=decode_json(checkpoint_path.read_text()) if checkpoint_path else default_checkpoint()
    root=list(Tokenizer().encode_prompt([Turn(role='user',text=DEFAULT_REQUEST['text'])]).ids)
    prior=[];cases=[]
    for name in ('first','continue','branch'):
        prefix=root[:3] if name=='branch' else root
        if name=='branch':prior=[]
        spec={'checkpoint_sha256':identity(checkpoint),'prefix_ids':prefix,'output_ids':prior,
              'generation':DEFAULT_REQUEST['generation'],'ontology_binding':LAB_BINDINGS['naive-gpt']}
        record=run_token_step(spec,checkpoint=checkpoint)
        path=output/f'{name}.step-input.json';path.write_bytes(canonical(spec))
        cli=output/f'{name}.step-cli.json'
        subprocess.run([sys.executable,'-m','scripts.experiments.run_inference','--step',str(path),'--output',str(cli)]
                       + (['--checkpoint',str(checkpoint_path)] if checkpoint_path else []),check=True,capture_output=True)
        assert_same(record,decode_json(cli.read_text()),name+' step CLI')
        request=Request(base+API_PATHS['tokenStep'],data=canonical(spec),headers={'Content-Type':'application/json'})
        with urlopen(request) as response:remote=restore(json.load(response),HttpStore(base))
        assert_same(record,remote,name+' step HTTP')
        cases.append({'name':name,'position':len(prefix)+len(prior)-1,'record':record})
        prior=record['output_ids']
    (output/'steps.json').write_bytes(canonical(cases))
    return cases


def verify_step_exports(cases,output):
    for case in cases:
        path=output/f"{case['name']}.step-browser.json"
        record=decode_json(path.read_text())
        assert_same(case['record'],record,case['name']+' step browser')
        target=output/f"{case['name']}.step-replay.json"
        subprocess.run([sys.executable,'-m','scripts.experiments.run_inference','--replay',str(path),'--output',str(target)],
                       check=True,capture_output=True)
        assert_same(record,decode_json(target.read_text()),case['name']+' step replay')
