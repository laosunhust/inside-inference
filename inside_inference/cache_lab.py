"""A bounded, replayable KV lab: actual computation, explicit virtual resource service."""
from collections import OrderedDict, deque
from pathlib import Path
from functools import lru_cache
import hashlib
import math
from time import perf_counter_ns

from inside_inference.declarations_generated import CacheExperiment, CacheRun, RunOutcome
from inside_inference.generation import select_greedy
from inside_inference.kv_runtime import ReferenceRuntime, state_bytes
from inside_inference.model import Model, ModelArchitecture, identity, initialize, parameter_shapes
from inside_inference.tokenizer import Tokenizer, Turn


@lru_cache(maxsize=1)
def available_backends():
    import importlib.util
    backends = ['reference']
    if importlib.util.find_spec('torch') is not None:
        import torch
        if torch.cuda.is_available(): backends.append('cuda')
    return backends


def source_identity():
    root = Path(__file__).resolve().parent
    names = ('cache_lab.py','kv_runtime.py','model.py','tokenizer.py','generation.py',
             'declarations_generated.py','contract_runtime.py')
    if (root/'cuda_runtime.py').exists(): names += ('cuda_runtime.py', 'tensor_model.py')
    return identity({name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in names})


def default_experiment():
    from inside_inference.declarations_generated import CacheSystem
    from inside_inference.workload import default_workload
    workload = default_workload().to_dict()
    first = workload['requests'][0]
    workload['requests'] = [dict(first, request_id=f'r{i+1}', arrival_us=t)
                            for i,t in enumerate((0, 0, 10000))]
    return {'system':CacheSystem().to_dict(), 'workload':workload}


def logical_record(record):
    """Only local measurements vary across repeated runs on the same backend."""
    return {key:value for key,value in record.items() if key != 'measurements'}


def replay_cache(record):
    CacheRun.from_dict(record)
    if record['source_sha256'] != source_identity():
        raise ValueError('Replay requires the recorded cache execution sources')
    result = run_cache_experiment(record['spec'], checkpoint=record['checkpoint'])
    if identity(logical_record(result)) != identity(logical_record(record)):
        raise ValueError('Cache logical replay differs')
    return result


def run_cache_experiment(spec=None, *, checkpoint=None):
    spec = CacheExperiment.from_dict(default_experiment() if spec is None else spec)
    codec = Tokenizer()
    checkpoint = initialize(ModelArchitecture(), codec.manifest_sha256) if checkpoint is None else checkpoint
    model = Model(checkpoint)
    if model.checkpoint['manifest_sha256'] != codec.manifest_sha256:
        raise ValueError('Checkpoint tokenizer identity differs')
    cfg = spec.system
    if cfg.backend == 'cuda' and cfg.backend not in available_backends():
        raise ValueError('CUDA backend unavailable in this environment; use make _cache-cuda-setup and its Python')
    # Admit and encode the entire workload before allocating resources or computing.
    waiting_inputs, seen, previous = [], set(), -1
    if not 1 <= len(spec.workload.requests) <= cfg.max_requests:
        raise ValueError(f'Cache lab admits 1..{cfg.max_requests} requests')
    for item in spec.workload.requests:
        if item.request_id in seen or item.arrival_us < previous:
            raise ValueError('Workload IDs must be unique and arrivals chronological')
        seen.add(item.request_id); previous = item.arrival_us
        request = item.request
        if request.generation.max_new_tokens > cfg.max_new_tokens_cap:
            raise ValueError('Request selection budget exceeds the declared system capability')
        ids = list(codec.encode_prompt([Turn(role='user', text=request.text)],context_limit=model.config.context).ids)
        positions = len(ids) + request.generation.max_new_tokens - 1
        if positions > model.config.context:
            raise ValueError('Prompt plus output budget exceeds positional capacity')
        reservation = positions * model.config.width * 2 * 8
        if reservation > cfg.device_kv_bytes:
            raise ValueError('One request exceeds device KV capacity; no truncation or silent offload policy')
        waiting_inputs.append(dict(id=item.request_id, arrival=item.arrival_us, ids=ids,
            prefix_ids=ids[:-1], request=request, reservation=reservation, emitted=[],
            stage='lookup', state=None, step=0))
    source = source_identity()
    if cfg.backend == 'reference':
        runtime = ReferenceRuntime(checkpoint)
    else:
        from inside_inference.cuda_runtime import CudaRuntime
        runtime = CudaRuntime(checkpoint)
    backend = runtime.describe()
    run_id = identity({'spec':spec.to_dict(),'checkpoint':model.sha256,'source':source,'backend':backend})
    events, computations, measurements, outcomes, states = [], [], [], {}, {}
    pending, active, incoming = deque(), deque(), deque(waiting_inputs)
    retained = OrderedDict()
    now, reserved, host_inflight = 0.0, 0, 0
    end_token = codec.token_id('control','TURN_END')
    current = None
    last_request, state_ready = {}, {}
    last_resource, last_service = None, None

    def device_used():
        return reserved + sum(e['bytes'] for e in retained.values() if e['tier']=='device')
    def host_used():
        return host_inflight + sum(e['bytes'] for e in retained.values() if e['tier']=='host')
    def event(kind, request_id, *, time=None, state_id=None, count=0, detail=''):
        nonlocal last_resource, last_service
        if device_used() > cfg.device_kv_bytes or host_used() > cfg.host_kv_bytes:
            raise AssertionError('KV capacity conservation violated')
        causes = [] if kind == 'arrived' else [last_request.get(request_id)]
        if kind == 'admitted': causes.append(last_resource)
        if kind in ('compute-start','transfer-start','retention-start'): causes.append(last_service)
        if kind in ('local-hit','remote-hit','compute-start','transfer-start','retention-start') and state_id:
            causes.append(state_ready.get(state_id))
        row = dict(event_id=f'{run_id}/event-{len(events)}', request_id=request_id,
            time_us=now if time is None else time, kind=kind, state_id=state_id, bytes=count,
            device_reserved_bytes=device_used(),host_retained_bytes=host_used(),detail=detail,
            causes=list(dict.fromkeys(c for c in causes if c is not None)))
        if events and row['time_us'] < events[-1]['time_us']:
            raise AssertionError('Events must be chronological')
        events.append(row)
        last_request[request_id] = row['event_id']
        if kind in ('admitted','transfer-end','evicted','retained','finished'): last_resource=row['event_id']
        if kind in ('compute-end','transfer-end','retained'): last_service=row['event_id']
        if kind in ('compute-end','transfer-end','retained') and state_id: state_ready[state_id]=row['event_id']
        return row['event_id']
    def advance(target):
        nonlocal now
        while incoming and incoming[0]['arrival'] <= target:
            item = incoming.popleft(); pending.append(item)
            event('arrived',item['id'],time=item['arrival'])
            event('queued',item['id'],time=item['arrival'],detail='Awaiting FIFO admission and KV reservation')
        now = target
    def snapshot(state):
        key = identity(state.to_dict()); states[key] = state.to_dict(); return key
    def cache_key(item):
        return identity({'checkpoint':model.sha256,'tokens':item['prefix_ids']})
    def pinned():
        items = list(active) + ([current] if current is not None else [])
        return {identity(a['state'].to_dict()) for a in items if a['state'] is not None}
    def collect():
        runtime.collect(pinned() | {e['state_id'] for e in retained.values() if e['tier']=='device'},
                        {e['state_id'] for e in retained.values() if e['tier']=='host'})
    def transfer(entry, to_host, request_id):
        nonlocal host_inflight
        direction = 'device-to-host' if to_host else 'host-to-device'
        # Reserve a destination for offload, or retain the removed host source
        # throughout retrieval. Transfers serialize on the shared service resource.
        host_inflight += entry['bytes']
        start = event('transfer-start',request_id,state_id=entry['state_id'],count=entry['bytes'],detail=direction)
        elapsed = runtime.transfer(entry['state_id'],to_host)
        measurements.append(dict(event_id=start,kind=direction,elapsed_us=elapsed,bytes=entry['bytes']))
        advance(now + cfg.link_latency_us + entry['bytes']/cfg.link_bytes_per_us)
        host_inflight -= entry['bytes']
        entry['tier'] = 'host' if to_host else 'device'
        event('transfer-end',request_id,state_id=entry['state_id'],count=entry['bytes'],detail=direction)
    def evict_device(request_id):
        # Whole-prefix LRU; never move a prefix still consumed by an active request.
        victim = next((k for k,e in retained.items() if e['tier']=='device' and e['state_id'] not in pinned()),None)
        if victim is None: return False
        entry = retained[victim]
        if entry['bytes'] <= cfg.host_kv_bytes:
            while host_used()+entry['bytes'] > cfg.host_kv_bytes:
                old = next(k for k,e in retained.items() if e['tier']=='host')
                removed = retained.pop(old)
                event('evicted',request_id,state_id=removed['state_id'],count=removed['bytes'],detail='Host LRU: state no longer reusable')
            transfer(entry,True,request_id)
        else:
            retained.pop(victim)
            event('evicted',request_id,state_id=entry['state_id'],count=entry['bytes'],detail='No host capacity: state no longer reusable')
        collect(); return True
    def room(size, request_id):
        while device_used()+size > cfg.device_kv_bytes:
            if not evict_device(request_id): return False
        return True
    def compute(item, ids, phase):
        before = item['state'] if item['state'] is not None else runtime.empty()
        n, total, d, f = len(ids), len(before.token_ids)+len(ids), model.config.width, model.config.ffn
        # Executed dense matmul arithmetic (multiply+add = two FLOPs); excludes scalar ops.
        flops = 2*n*(4*d*d+2*d*f+d*model.config.vocabulary) + 4*n*total*d
        weight_bytes = 8*sum(math.prod(shape) for shape in parameter_shapes(model.config).values())
        traffic = weight_bytes + 16*d*(total+n)
        work_id = f'{run_id}/work-{len(computations)}'
        start = event('compute-start',item['id'],state_id=snapshot(before),detail=phase)
        result, elapsed = runtime.compute(ids,before,capture=True,request_id=item['id'],run_id=run_id,step=item['step'],work_id=work_id)
        reference_started = perf_counter_ns()
        reference = model.forward(list(before.token_ids)+list(ids),capture=False)['logits'][-n:]
        error = 0.0
        for actual_row,expected_row in zip(result['logits'],reference):
            for actual,expected in zip(actual_row,expected_row):
                error=max(error,abs(actual-expected))
                if not math.isclose(actual,expected,abs_tol=1e-10,rel_tol=1e-9):
                    raise AssertionError('Cached logits differ from uncached reference')
        selection = None if phase=='cache-build' else select_greedy(result['logits'][-1])
        if selection is not None and selection['selected_id'] != select_greedy(reference[-1])['selected_id']:
            raise AssertionError('Cached greedy selection differs from uncached reference')
        measurements.append(dict(event_id=start,kind='reference-check',
            elapsed_us=(perf_counter_ns()-reference_started)/1000,bytes=0))
        advance(now + max(flops/cfg.compute_flops_per_us,traffic/cfg.memory_bytes_per_us))
        item['state'] = result['state']
        event('compute-end',item['id'],state_id=snapshot(item['state']),detail=phase)
        measurements.append(dict(event_id=start,kind='compute',elapsed_us=elapsed,bytes=0))
        computations.append(dict(work_id=work_id,request_id=item['id'],step=item['step'],phase=phase,
            input_ids=list(ids),state_before=before.to_dict(),state_after=item['state'].to_dict(),
            nodes=result['nodes'],selection=selection,matmul_flops=flops,logical_memory_bytes=traffic,
            reference_matmul_flops=2*total*(4*d*d+2*d*f+d*model.config.vocabulary)+4*total*total*d,
            reference_max_abs_error=error))
        collect()
        return selection
    try:
        while incoming or pending or active:
            advance(now)
            while pending and len(active) < cfg.max_active_requests:
                item=pending[0]
                if not room(item['reservation'],item['id']): break
                pending.popleft(); reserved+=item['reservation']; active.append(item)
                event('admitted',item['id'],count=item['reservation'],detail='Reserve maximum active KV positions')
            if not active:
                if pending: raise AssertionError('No active request can release capacity: admission deadlock')
                if incoming: advance(float(incoming[0]['arrival'])); continue
                break
            current=active.popleft(); key=cache_key(current)
            if current['stage']=='lookup':
                entry=retained.get(key)
                if entry is None:
                    event('miss',current['id'],detail='Exact prefix absent; execute prefix computation')
                    compute(current,current['prefix_ids'],'cache-build')
                else:
                    retained.move_to_end(key)
                    if entry['tier']=='host':
                        event('remote-hit',current['id'],state_id=entry['state_id'],count=entry['bytes'])
                        # Move payload into the already reserved active allocation. Remove retention
                        # first so it is not additionally counted as a retained device allocation.
                        retained.pop(key)
                        transfer(entry,False,current['id'])
                    else:
                        event('local-hit',current['id'],state_id=entry['state_id'],count=entry['bytes'])
                    current['state']=runtime.device[entry['state_id']]
                current['stage']='prefill'
                active.append(current);current=None;continue
            phase=current['stage']
            ids=[current['ids'][-1]] if phase=='prefill' else [current['emitted'][-1]]
            selection=compute(current,ids,phase)
            token=selection['selected_id'];current['emitted'].append(token)
            event('selected',current['id'],detail=str(token))
            budget=current['request'].generation.max_new_tokens
            finished=token==end_token or len(current['emitted'])==budget
            if finished:
                n=len(current['emitted'])
                outcomes[current['id']]=RunOutcome(selected_tokens=n,delivered_tokens=sum(t!=end_token for t in current['emitted']),
                    unused_budget=budget-n,stop_reason='turn_end' if token==end_token else 'output_budget',complete=token==end_token).to_dict()
                if key not in retained:
                    size=len(current['prefix_ids'])*model.config.width*16
                    start=event('retention-start',current['id'],state_id=snapshot(current['state']),count=size,
                        detail='Materialize retained prefix; charge payload read and write')
                    prefix,elapsed=runtime.retain(current['state'],len(current['prefix_ids']))
                    advance(now+2*size/cfg.memory_bytes_per_us)
                    measurements.append(dict(event_id=start,kind='device-copy',elapsed_us=elapsed,bytes=size))
                    current['state']=prefix
                    reserved-=current['reservation']
                    if not room(size,current['id']): raise AssertionError('Released reservation must accommodate its prefix')
                    retained[key]={'state_id':snapshot(prefix),'bytes':state_bytes(prefix),'tier':'device'}
                    event('retained',current['id'],state_id=retained[key]['state_id'],count=size)
                else:
                    reserved-=current['reservation']
                    retained.move_to_end(key)
                event('finished',current['id'],detail=outcomes[current['id']]['stop_reason'])
            else:
                current['stage']='decode';current['step']+=1;active.append(current)
            current=None;collect()
        record=dict(id=run_id,spec=spec.to_dict(),checkpoint=model.checkpoint,source_sha256=source,
            events=events,computations=computations,measurements=measurements,outcomes=outcomes,states=states,backend=backend,
            evidence='Actual cached numerics with uncached verification. Virtual rates are hypothetical; logical KV budgets exclude weights and workspace. Local wall times include backend inspection overhead, not target accelerator predictions.')
        CacheRun.from_dict(record)
        return record
    finally: runtime.close()
