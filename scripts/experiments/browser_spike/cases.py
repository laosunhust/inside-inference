"""Identical native/worker experiment driver; inputs and outputs retain domain schemas."""
import copy
from pathlib import Path
from time import perf_counter
from inside_inference.workload import default_workload, run_workload, replay_workload
from inside_inference.generation import run_token_step, replay_token_step
from inside_inference.model import default_checkpoint, identity, canonical
from inside_inference.declarations_generated import LAB_BINDINGS
from inside_inference.cache_lab import default_experiment, run_cache_experiment, replay_cache
from inside_inference.delivery.codec import bundle, restore_bundle


def cases():
    workload=default_workload().to_dict()
    step={'checkpoint_sha256':identity(default_checkpoint()),'prefix_ids':[0,3,331], 'output_ids':[],
          'generation':workload['requests'][0]['request']['generation'],'ontology_binding':LAB_BINDINGS['naive-gpt']}
    cache=default_experiment()
    cache['workload']['requests']=cache['workload']['requests'][:2]
    for item in cache['workload']['requests']:
        item['request']['text']='the ball';item['request']['generation']['max_new_tokens']=2
        item['arrival_us']=0
    cache['system']['kv_cache'].update(device_kv_bytes=16384,host_kv_bytes=32768)
    cache['system']['scheduling']['max_active_requests']=1
    values=[('workload',workload),('step',step),('cache',cache)]
    for field,value in [('compute',1),('memory',1),('capacity',1024),('transfer',1)]:
        changed=copy.deepcopy(cache)
        if field=='compute':changed['system']['compute_service']['compute_flops_per_us']=value
        elif field=='memory':changed['system']['compute_service']['memory_bytes_per_us']=value
        elif field=='capacity':changed['system']['kv_cache']['device_kv_bytes']=value
        else:
            changed['system']['kv_cache']['device_kv_bytes']=1024
            changed['system']['transfer']['link_bytes_per_us']=value
        values.append(('cache-'+field,changed))
    impossible=copy.deepcopy(cache);impossible['system']['kv_cache']['device_kv_bytes']=1
    values.extend([('invalid-capacity',impossible),('invalid-workload',{})])
    return values


def execute(index):
    name,spec=cases()[index];started=perf_counter()
    try:
        if name=='workload':
            record=run_workload(spec)
            executed=perf_counter();replay_started=None
            packed=bundle(record);restored=restore_bundle(packed)
            assert canonical(record)==canonical(restored)
            replay_started=perf_counter()
            assert canonical(replay_workload(restored))==canonical(record)
        elif name=='step':
            record=run_token_step(spec)
            executed=perf_counter();replay_started=None
            packed=bundle(record);restored=restore_bundle(packed)
            assert canonical(record)==canonical(restored)
            replay_started=perf_counter()
            assert canonical(replay_token_step(restored))==canonical(record)
        else:
            record=run_cache_experiment(spec)
            executed=perf_counter();replay_started=executed
            replay_cache(record)
        if name.startswith('invalid'):raise AssertionError('Invalid input unexpectedly succeeded')
        result={'name':name,'input':spec,'record':record,'replayed':True,
                'execution_seconds':executed-started,'artifact_roundtrip_seconds':replay_started-executed,
                'replay_seconds':perf_counter()-replay_started}
    except ValueError as error:
        if not name.startswith('invalid'):raise
        result={'name':name,'input':spec,'error':str(error)}
    result['seconds']=perf_counter()-started
    return canonical(result).decode()


def native(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    for i,(name,_) in enumerate(cases()):
        (output/(name+'.json')).write_text(execute(i))
