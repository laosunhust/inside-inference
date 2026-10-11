"""Cross-runtime checks compare declared semantics, preserving full original evidence."""
import json
import math
from pathlib import Path
from scripts import ROOT

OUTPUT=ROOT/'out/experiments/browser-spike'


def compare():
    differences={'floats':0,'max_absolute_error':0.0}
    def close(a,b,path='root',absolute=1e-10,relative=1e-10):
        if isinstance(a,bool) or isinstance(b,bool):assert a is b,path;return
        if isinstance(a,(int,float)) and isinstance(b,(int,float)):
            error=abs(a-b)
            differences['floats']+=1;differences['max_absolute_error']=max(differences['max_absolute_error'],error)
            assert math.isclose(a,b,abs_tol=absolute,rel_tol=relative),(path,a,b)
        elif isinstance(a,list):
            assert isinstance(b,list) and len(a)==len(b),path
            for i,(x,y) in enumerate(zip(a,b)):close(x,y,f'{path}/{i}',absolute,relative)
        elif isinstance(a,dict):
            assert a.keys()==b.keys(),path
            for key in a:close(a[key],b[key],f'{path}/{key}',absolute,relative)
        else:assert a==b,(path,a,b)
    def numerical(a,b):
        if a['selection'] is None:assert b['selection'] is None
        else:assert a['selection']['selected_id']==b['selection']['selected_id']
        close(a['selection'],b['selection'])
        assert len(a['nodes'])==len(b['nodes'])
        def normalized(node):
            run=node['run_id']
            def walk(value):
                if isinstance(value,str):return value.replace(run,'<run>')
                if isinstance(value,list):return [walk(v) for v in value]
                if isinstance(value,dict):return {k:walk(v) for k,v in value.items()}
                return value
            return walk(node)
        for x,y in zip(a['nodes'],b['nodes']):close(normalized(x),normalized(y),'node')
    reports=[]
    for native in sorted((OUTPUT/'native').glob('*.json')):
        a=json.loads(native.read_text());b=json.loads((OUTPUT/'browser'/native.name).read_text())
        close(a['input'],b['input']);name=a['name']
        if name.startswith('invalid'):
            assert 'error' in a and 'error' in b
            reports.append({'name':name,'rejected':True});continue
        x,y=a['record'],b['record']
        assert a['replayed'] and b['replayed']
        xp=x['traces'][0]['provenance'] if name=='workload' else x['provenance']
        yp=y['traces'][0]['provenance'] if name=='workload' else y['provenance']
        assert xp['sources']==yp['sources']
        assert xp['revision']==yp['revision']
        assert xp['python'] and yp['python']
        assert '(emscripten)' in yp['backend']['library']
        if name=='workload':
            assert len(x['traces'])==len(y['traces'])
            close(x['declaration'],y['declaration'])
            for p,q in zip(x['traces'],y['traces']):
                assert p['output_ids']==q['output_ids']
                assert p['sequence_ids']==q['sequence_ids']
                close(p['tokenizer'],q['tokenizer'])
                close(p['outcome'],q['outcome'])
                assert len(p['passes'])==len(q['passes'])
                for u,v in zip(p['passes'],q['passes']):numerical(u,v)
        elif name=='step':
            assert x['output_ids']==y['output_ids'];numerical(x['computation'],y['computation'])
        else:
            close(x['outcomes'],y['outcomes'])
            assert len(x['computations'])==len(y['computations'])
            for u,v in zip(x['computations'],y['computations']):
                numerical(u,v)
                for key in ('input_ids','matmul_flops','logical_memory_bytes','state_before','state_after'):close(u[key],v[key])
            # Event identities are runtime-bound. Compare causal edges by event position;
            # state hashes can differ with floating point, but state aliasing must match.
            def events(record):
                rows=record['events'];ids={e['event_id']:i for i,e in enumerate(rows)};states={}
                result=[]
                for row in rows:
                    value=dict(row)
                    value['event_id']=ids[value['event_id']]
                    for key in ('causes',):
                        if key in value:value[key]=[ids[i] for i in value[key]]
                    if value.get('state_id') is not None:
                        state=value['state_id'];states.setdefault(state,len(states));value['state_id']=states[state]
                    result.append(value)
                return result
            close(events(x),events(y),name+'/events',absolute=1e-9,relative=0)
        reports.append({'name':name,'passed':True,'native_seconds':a['seconds'],'browser_seconds':b['seconds'],
                        'browser_execution_seconds':b['execution_seconds'],
                        'browser_artifact_roundtrip_seconds':b['artifact_roundtrip_seconds'],
                        'browser_replay_seconds':b['replay_seconds']})
    first=json.loads((OUTPUT/'browser/step.json').read_text())
    restarted=json.loads((OUTPUT/'browser/restarted-step.json').read_text())
    assert first['record']==restarted['record'],'Fresh worker produced different step evidence'
    schedules={name:json.loads((OUTPUT/'browser'/(name+'.json')).read_text())['record']
               for name in ('cache','cache-compute','cache-memory','cache-capacity','cache-transfer')}
    baseline=schedules['cache']['events'][-1]['time_us']
    for name in ('cache-compute','cache-memory','cache-transfer'):
        assert schedules[name]['events'][-1]['time_us']>baseline,'Resource intervention had no cost effect'
    assert 'remote-hit' not in {e['kind'] for e in schedules['cache']['events']}
    assert 'remote-hit' in {e['kind'] for e in schedules['cache-capacity']['events']}
    requests=json.loads((OUTPUT/'requests.json').read_text())
    assert all(r['method']=='GET' for r in requests)
    assert not any(r['phase']=='offline' for r in requests),'Network access during computation'
    metrics=json.loads((OUTPUT/'browser-metrics.json').read_text());assert metrics['passed']
    summary={'passed':True,'cases':reports,'numerical_comparison':differences,'runtime_metrics':metrics,
             'network':{'requests':len(requests),'compute_requests':0},
             'assets':json.loads((OUTPUT/'assets.json').read_text())}
    (OUTPUT/'result.json').write_text(json.dumps(summary,indent=2))
    print(json.dumps({k:v for k,v in summary.items() if k not in ('assets','runtime_metrics')},indent=2))


if __name__=='__main__':compare()
