"""Recompute the frozen pilot criteria from retained observations; no reruns."""
import hashlib
import json
from pathlib import Path
import statistics
import numpy as np
import yaml
from scripts import ROOT

HOME = ROOT/'data/experiments/kv-timing-pilot'


def resolution(off, on, protocol):
    differences = [a-b for a,b in zip(off,on)]
    median = statistics.median(differences)
    mad = statistics.median(abs(x-median) for x in differences)
    threshold = max(protocol['minimum_absolute_difference_ms'],
                    protocol['minimum_relative_difference']*statistics.median(off))
    agreeing = sum(x*median>0 for x in differences)
    resolved = (len(differences)==protocol['measured_pairs'] and abs(median)>=threshold
                and abs(median)>3*mad and agreeing>=protocol['minimum_agreeing_pairs'])
    return {'off_trial_means_ms':off,'on_trial_means_ms':on,'paired_off_minus_on_ms':differences,
            'median_difference_ms':median,'mad_difference_ms':mad,'threshold_ms':threshold,
            'agreeing_pairs':agreeing,'resolved':resolved,
            'direction':'reuse-faster' if resolved and median>0 else 'reuse-slower' if resolved else 'unresolved'}


def read_trial(path):
    trial=json.loads(path.read_text());meta=trial['logits'];raw=(path.parent/meta['file']).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=meta['sha256']: raise ValueError('Logit digest mismatch')
    logits=np.frombuffer(raw,dtype='<f4').reshape(meta['rows'],meta['columns'])
    return trial,logits


def pair_evidence(folder,context,protocol):
    off,a=read_trial(folder/'off.json');on,b=read_trial(folder/'on.json');issues=[]
    for trial,reuse in [(off,False),(on,True)]:
        samples=trial['timing']['samples']
        if trial['status']!='completed':issues.append('incomplete trial')
        if len(samples)<2:issues.append('fewer than two generated tokens')
        if any(v!='visible' for v in trial['visibility']):issues.append('background visibility')
        for index,s in enumerate(samples):
            expected=1 if reuse and index else context+index
            if s['context_length']!=context+index or s['work']['processed_positions']!=expected or s['work']['reused_positions']!=context+index-expected:
                issues.append('work mismatch')
            if not s['started_ms']<=s['dispatched_ms']<=s['updated_ms'] or s['decoder_ms']>s['service_ms']:
                issues.append('timing boundary mismatch')
    if off['request']['prefix_ids']!=on['request']['prefix_ids']:issues.append('prefix mismatch')
    if [s['selected_id'] for s in off['timing']['samples']]!=[s['selected_id'] for s in on['timing']['samples']]:issues.append('selected-token divergence')
    maximum=None
    if a.shape!=b.shape:issues.append('logit shape divergence')
    elif a.size:
        delta=np.abs(a.astype(float)-b.astype(float));maximum=float(delta.max())
        if not np.all(delta<=protocol['numerical_atol']+protocol['numerical_rtol']*np.abs(a)):
            issues.append('numerical tolerance exceeded')
    values={}
    for mode,trial in [('off',off),('on',on)]:
        samples=trial['timing']['samples'];decode=samples[1:]
        if decode:
            values[mode]={'decoder':statistics.mean(s['decoder_ms'] for s in decode),
                          'service':statistics.mean(s['service_ms'] for s in decode),
                          'publication_interval':statistics.mean(b['updated_ms']-a['updated_ms'] for a,b in zip(samples,samples[1:])),
                          'decode_matmul_flops':sum(s['work']['matmul_flops'] for s in decode),
                          'prefill_decoder_ms':samples[0]['decoder_ms']}
    return {'issues':sorted(set(issues)),'max_abs_logit_difference':maximum,'values':values,
            'generated_tokens':{mode:len(t['timing']['samples']) for mode,t in [('off',off),('on',on)]}}


def main():
    protocol=yaml.safe_load((HOME/'protocol.yaml').read_text())
    manifest=json.loads((HOME/'manifest.json').read_text())
    if hashlib.sha256((HOME/'protocol.yaml').read_bytes()).hexdigest()!=manifest['protocol_sha256']:
        raise ValueError('Protocol changed after execution')
    report={'protocol_sha256':manifest['protocol_sha256'],'release':manifest['release'],
            'execution_status':manifest['status'],'contexts':[]}
    for context in protocol['contexts']:
        root=HOME/'observations'/f'context-{context}';pairs=[];warmups=[];issues=[]
        for phase,count,results in [('warmup',protocol['warmup_pairs'],warmups),('measured',protocol['measured_pairs'],pairs)]:
            for i in range(count):
                try:results.append(pair_evidence(root/f'{phase}-{i}',context,protocol))
                except (FileNotFoundError,ValueError,KeyError) as e:issues.append(f'{phase}-{i}: {e}')
        issues += [issue for pair in warmups+pairs for issue in pair['issues']]
        metrics={}
        if not issues and len(pairs)==protocol['measured_pairs']:
            for metric in ['decoder','service','publication_interval']:
                metrics[metric]=resolution([pair['values']['off'][metric] for pair in pairs],
                                           [pair['values']['on'][metric] for pair in pairs],protocol)
        report['contexts'].append({'context':context,'issues':issues,'warmup_pairs':warmups,'measured_pairs':pairs,'metrics':metrics})
    (HOME/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({str(c['context']):{'issues':c['issues'],'metrics':{k:v['direction'] for k,v in c['metrics'].items()}} for c in report['contexts']},indent=2))


if __name__=='__main__':main()
