"""Run the admitted matrix with shared recipe and independent initialization/sampling RNGs."""
import hashlib,json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
import yaml
from inside_inference.declarations_generated import ModelArchitecture
from scripts import ROOT


def main():
    root=ROOT/'out/experiments/model-family/training'
    matrix=yaml.safe_load((ROOT/'data/preparation/model-family/matrix.yaml').read_text())
    base=json.loads((ROOT/matrix['base_recipe']).read_text())
    base['evaluation_cases_sha256']=hashlib.sha256((ROOT/'data/preparation/model-family/evaluation.json').read_bytes()).hexdigest()
    results=[]
    for variant in matrix['variants']:
        for seed in matrix['seeds']:
            config=dict(base,seed=seed,architecture=ModelArchitecture(**{k:v for k,v in variant.items() if k!='name'}).to_dict(),evaluation_record=matrix['evaluation_record'])
            path=root/f'{variant["name"]}-{seed}'
            if path.exists(): raise ValueError(f'Refuse to overwrite run {path}')
            path.parent.mkdir(parents=True,exist_ok=True)
            config_path=path.with_suffix('.config.json');config_path.write_text(json.dumps(config,indent=2)+'\n')
            remaining=(datetime.fromisoformat(matrix['deadline'].replace('Z','+00:00'))-datetime.now(timezone.utc)).total_seconds()
            if remaining<300:raise RuntimeError('Reporting reserve reached; matrix incomplete')
            with path.with_suffix('.log').open('w') as log:
                subprocess.run([sys.executable,'-m','scripts.experiments.prepare_checkpoint','--config',str(config_path),'--output',str(path),'--deadline',matrix['deadline']],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,check=True)
            completion=json.loads((path/'completion.json').read_text())
            if completion['step']!=4000 or completion['reason']!='max_steps':raise RuntimeError(f'Incomplete run {path}')
            results.append(dict(variant=variant['name'],seed=seed,completion=completion))
            (root/'progress.json').write_text(json.dumps(results,indent=2)+'\n')
            print(variant['name'],seed,'completed',completion['elapsed_seconds'],flush=True)
    exposures={seed:{r['completion']['token_presentations'] for r in results if r['seed']==seed} for seed in matrix['seeds']}
    if any(len(v)!=1 for v in exposures.values()):raise AssertionError('Training token exposure differs between variants')
    (root/'complete.json').write_text(json.dumps(dict(runs=results,matched_token_exposures=True),indent=2)+'\n')

if __name__=='__main__':main()
