"""Small real computation for event/record checks; no validation is mocked."""
from copy import deepcopy
from inside_inference.model import initialize, ModelArchitecture
from inside_inference.tokenizer import Tokenizer


def small_checkpoint(seed=7):
    return initialize(ModelArchitecture(width=2, ffn=4), Tokenizer().manifest_sha256, seed)




def cache_scenario(texts=('the ball','the ball'), *, device=16384, host=32768, active=1):
    from inside_inference.cache_lab import default_experiment
    spec=default_experiment();template=spec['workload']['requests'][0]
    spec['system']['kv_cache'].update(device_kv_bytes=device,host_kv_bytes=host)
    spec['system']['scheduling']['max_active_requests']=active
    spec['workload']['requests']=[]
    for i,text in enumerate(texts):
        item=deepcopy(template);item.update(request_id=f'r{i}',arrival_us=0)
        item['request']['text']=text;item['request']['generation']['max_new_tokens']=2
        spec['workload']['requests'].append(item)
    return spec
