"""Read-only evaluation after all matrix checkpoints have been selected."""
import hashlib,json,math,subprocess,sys
from pathlib import Path
import torch
from inside_inference.model import Model,default_checkpoint,parameter_shapes,identity
from inside_inference.preparation import PreparationModel,evaluate,separated_response,generate
from inside_inference.tokenizer import Tokenizer,Turn
from inside_inference.generation import select_greedy,token_display
from inside_inference.kv_runtime import state_bytes
from scripts.experiments.model_family.cases import PROBES
from scripts import ROOT


def write(path,data):path.write_text(json.dumps(data,indent=2)+'\n')


def score(checkpoint,examples,rotation):
    model=PreparationModel(checkpoint);codec=Tokenizer()
    report=evaluate(model,examples,codec,11);report.pop('provisional_pass',None)
    for row,example in zip(report['records'],examples,strict=True):
        assert rotation[row['id']]==row['rotated_source_id']
        row['full']['readable']=separated_response(row['full']['ids'],codec)
        row['full']['correct_readable']=row['full']['correct'] and row['full']['readable']
        row['full']['exact_target']=row['full']['text']==example['training_target']
    report['counts']={key:sum(r['full'][key] for r in report['records']) for key in ('correct','readable','correct_readable','exact_target')}
    report['correct_readable_by_family']={f:sum(r['full']['correct_readable'] for r in report['records'] if r['family']==f) for f in ('ownership','location','negation','correction')}
    return report


def diagnostics(checkpoint):
    model=Model(checkpoint);codec=Tokenizer();rows=[]
    for prompt,expected in PROBES:
        ids=list(codec.encode_prompt([Turn(role='user',text=prompt)],context_limit=128).ids)
        # Every prefix position, not only final emitted tokens; independent uncached path.
        state=None;error=0.
        for i,token in enumerate(ids):
            cached=model.forward_cached([token],state,capture=False);state=cached['state']
            reference=model.forward(ids[:i+1],capture=False)['logits'][-1]
            actual=cached['logits'][-1]
            for a,b in zip(actual,reference):
                error=max(error,abs(a-b))
                if not math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-10):raise AssertionError('KV arithmetic diverged')
            assert select_greedy(actual)['selected_id']==select_greedy(reference)['selected_id']
        outputs=[];first=None
        for _ in range(11):
            raw=model.forward(ids+outputs,capture=False)['logits'][-1];selection=select_greedy(raw)
            if first is None:first=selection
            outputs.append(selection['selected_id'])
            if outputs[-1]==codec.token_id('control','TURN_END'):break
            cached=model.forward_cached([outputs[-1]],state,capture=False);state=cached['state']
            expected_logits=model.forward(ids+outputs,capture=False)['logits'][-1]
            assert all(math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-10) for a,b in zip(cached['logits'][-1],expected_logits))
            assert select_greedy(cached['logits'][-1])['selected_id']==select_greedy(expected_logits)['selected_id']
        rows.append(dict(prompt=prompt,expected_first_word=expected,first_selection=first,output_ids=outputs,
            output_text=''.join(token_display(codec,i) for i in outputs if i!=codec.token_id('control','TURN_END')),
            cached_max_abs_error=error,kv_payload_bytes=state_bytes(state),kv_shape=[len(state.keys),len(state.token_ids),model.config.width]))
    return rows


def compare(items,out):
    baselines={r['seed']:r for r in items if r['variant']=='baseline'}
    comparisons={}
    for variant in ('wider','deeper'):
        rows=[r for r in items if r['variant']==variant]
        deltas={f:sum(r['family'][f]-baselines[r['seed']]['family'][f] for r in rows)/(3*(10 if f=='negation' else 25)) for f in ('ownership','location','negation','correction')}
        gains=[sum(r['family'][f]-baselines[r['seed']]['family'][f] for f in ('ownership','location')) for r in rows]
        gates=dict(binding_gain=sum(gains)/150>=.1-1e-12,seed_consistency=sum(g>0 for g in gains)>=2,
            no_binding_regression=all(deltas[f]>=-1e-12 for f in ('ownership','location')),
            strong_family_retention=all(deltas[f]>=-.05-1e-12 for f in ('negation','correction')),
            readability=all(r['counts']['readable']>=77 for r in rows),
            context_controls=all(r['accuracy']['full']-r['accuracy'][control]>=.2-1e-12 for r in rows for control in ('question_only','rotated_context')))
        paired={}
        for r in rows:
            baseline=json.loads((out/f'baseline-{r["seed"]}.json').read_text())['records']
            candidate=json.loads((out/(r['name']+'.json')).read_text())['records']
            assert [x['id'] for x in candidate]==[x['id'] for x in baseline]
            paired[str(r['seed'])]={kind:[a['id'] for a,b in zip(candidate,baseline,strict=True) if predicate(a['full']['correct_readable'],b['full']['correct_readable'])]
                for kind,predicate in [('improved',lambda a,b:a and not b),('regressed',lambda a,b:b and not a)]}
        comparisons[variant]=dict(behavior_pass=all(gates.values()),gates=gates,
            family_accuracy_deltas=deltas,binding_gain=sum(gains)/150,seed_binding_gains=gains,paired_cases=paired)
    passing=[r for r in items if r['seed']==7 and r['variant']!='baseline' and comparisons[r['variant']]['behavior_pass']]
    preferred=min(passing,key=lambda r:(r['parameters'],1 if r['variant']=='wider' else 2))['variant'] if passing else 'baseline'
    return dict(variants=comparisons,behavior_recommendation=preferred,preview_seed=7,
        depth_prediction_supported=comparisons['deeper']['behavior_pass'] and not comparisons['wider']['behavior_pass'],
        caveat='Behavioral screens only; deployment requires independent execution/browser gates. Failed quality does not invalidate a verified inference fixture.')


def main():
    torch.set_num_threads(1);torch.use_deterministic_algorithms(True)
    root=ROOT/'out/experiments/model-family';training=root/'training'
    complete=json.loads((training/'complete.json').read_text())
    assert len(complete['runs'])==9 and complete['matched_token_exposures']
    frozen_path=ROOT/'data/preparation/model-family/evaluation.json';frozen=json.loads(frozen_path.read_text())
    out=root/'evaluation';out.mkdir(exist_ok=True)
    if (out/'summary.json').exists():raise ValueError('Evaluation already completed; do not overwrite')
    items=[]
    for row in complete['runs']:
        name=f"{row['variant']}-{row['seed']}";path=training/name
        config=json.loads(path.with_suffix('.config.json').read_text())
        assert config['evaluation_cases_sha256']==hashlib.sha256(frozen_path.read_bytes()).hexdigest()
        checkpoint=json.loads((path/'checkpoint.json').read_text())
        # Reuse existing export verifier, which never reads the held-out spike set.
        with (out/(name+'-verify.log')).open('w') as log:
            subprocess.run([sys.executable,'-m','scripts.check.checkpoint','--checkpoint',str(path/'checkpoint.json'),
                '--config',str(path.with_suffix('.config.json')),'--output',str(out/(name+'-verification'))],stdout=log,stderr=subprocess.STDOUT,check=True)
        report=score(checkpoint,frozen['examples'],frozen['rotation']);write(out/(name+'.json'),report)
        write(out/(name+'-diagnostics.json'),diagnostics(checkpoint))
        parameters=sum(math.prod(dims) for dims in parameter_shapes(Model(checkpoint).config).values())
        items.append(dict(name=name,variant=row['variant'],seed=row['seed'],counts=report['counts'],family=report['correct_readable_by_family'],accuracy=report['accuracy'],
            checkpoint_sha256=identity(checkpoint),parameters=parameters,weight_bytes=parameters*8,kv_bytes_per_position=checkpoint['config']['layers']*checkpoint['config']['width']*16))
        print(name,'verified and evaluated',flush=True)
    shipped=score(default_checkpoint(),frozen['examples'],frozen['rotation']);write(out/'shipped.json',shipped)
    write(out/'summary.json',dict(models=items,shipped_counts=shipped['counts'],test_split_evaluated=False,evaluation_cases=85,comparison=compare(items,out)))

if __name__=='__main__':main()
