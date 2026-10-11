"""Admit fixed arrivals and record causal events from the numerical engine."""
from inside_inference.declarations_generated import (
    OntologyBinding, LAB_BINDINGS, CONTRACT_SHA256, Workload, RequestArrival, InferenceRequest, RunBinding,
    InferenceSystem, ModelArtifactReference, RunRecord,
)
from inside_inference.generation import run_request, token_display
from inside_inference.model import Model, default_checkpoint, identity
from inside_inference.tokenizer import Tokenizer
from inside_inference.provenance import execution_provenance, stable_provenance, validate_provenance, reference_backend


def default_workload(request=None):
    return Workload(requests=(RequestArrival(request_id='r1', arrival_us=0,
        request=InferenceRequest() if request is None else InferenceRequest.from_dict(request)),))


def admit(workload, system):
    ids, previous = set(), -1
    for arrival in workload.requests:
        if arrival.request_id in ids: raise ValueError('Duplicate request identity')
        if arrival.arrival_us < previous: raise ValueError('Requests must be chronological')
        ids.add(arrival.request_id)
        previous = arrival.arrival_us
    if len(workload.requests) > system.max_requests:
        raise ValueError('This engine supports only one request per workload')
    if any(r.arrival_us != 0 for r in workload.requests):
        raise ValueError('This engine supports only arrival at zero; no scheduler or latency model')


def event_causes(events, payload):
    """Prerequisites of the serial baseline; publication is not a compute dependency."""
    def last(kind):
        return next((e['event_id'] for e in reversed(events) if e['payload']['kind']==kind),None)
    kind=payload['kind']
    if kind=='request-arrived': return []
    if kind=='model-forward-completed': return [last('token-selected') or last('input-encoded')]
    if kind=='request-finished':
        return [value for value in (last('token-selected'),last('token-published')) if value is not None]
    prerequisite={'input-encoded':'request-arrived','token-selected':'model-forward-completed',
                  'token-published':'token-selected'}[kind]
    return [last(prerequisite)]


def run_workload(workload=None, *, checkpoint=None):
    workload = default_workload() if workload is None else Workload.from_dict(workload)
    system = InferenceSystem()
    admit(workload, system)
    tokenizer = Tokenizer()
    checkpoint = default_checkpoint() if checkpoint is None else checkpoint
    model = Model(checkpoint)
    binding = RunBinding(model=ModelArtifactReference(checkpoint_sha256=model.sha256,
                         tokenizer_sha256=tokenizer.manifest_sha256, architecture=model.config),
                         system=system, workload=workload,
                         ontology_binding=OntologyBinding.from_dict(LAB_BINDINGS['naive-gpt']))
    binding.validate_bound(binding.to_dict())
    run_id = identity({'declaration':binding.to_dict(), 'contract':CONTRACT_SHA256,
                       'provenance':stable_provenance(execution_provenance())})
    events, traces = [], []
    for arrival in workload.requests:
        def record(payload):
            sequence = len(events)
            events.append({'event_id':f'{run_id}/event-{sequence}', 'run_id':run_id,
                           'request_id':arrival.request_id, 'sequence':sequence,
                           'causes':event_causes(events,payload), 'payload':payload})
        record({'kind':'request-arrived','arrival_us':arrival.arrival_us})
        traces.append(run_request(arrival.request.to_dict(), checkpoint=checkpoint,
                      run_id=run_id, request_id=arrival.request_id, observe=record))
    result = {'format':'workload-run-v1', 'id':run_id, 'contract_sha256':CONTRACT_SHA256,
              'declaration':binding.to_dict(), 'clock':{'kind':'execution-order'},
              'events':events, 'traces':traces}
    validate_run(result)
    return result


def publications(run, request_id):
    return [e for e in run['events'] if e['request_id']==request_id and e['payload']['kind']=='token-published']


def validate_run(run):
    """Structural admission and baseline relations; replay independently verifies computation."""
    RunRecord.validate_shape(run)
    if run['contract_sha256'] != CONTRACT_SHA256: raise ValueError('Run contract differs')
    binding = RunBinding.from_dict(run['declaration'])
    binding.validate_bound(binding.to_dict())
    admit(binding.workload,binding.system)
    if len(run['traces']) != len(binding.workload.requests): raise ValueError('Missing request evidence')
    from inside_inference.declarations import validate_result
    for arrival, trace in zip(binding.workload.requests,run['traces']):
        validate_result(trace)
        if trace['id'] != run['id'] or trace['request_id'] != arrival.request_id:
            raise ValueError('Numerical evidence belongs to another run/request')
        if trace['declaration'] != {'model':run['declaration']['model'], 'system':run['declaration']['system'],
                                    'request':arrival.request.to_dict(), 'ontology_binding':run['declaration']['ontology_binding']}:
            raise ValueError('Numerical evidence differs from workload binding')
        # These relations govern the current naive engine only; a speculative engine
        # needs its own acceptance rules; this baseline accepts each greedy selection.
        expected = [{'kind':'request-arrived','arrival_us':arrival.arrival_us},
                    {'kind':'input-encoded','input_sha256':trace['tokenizer']['input_sha256'],
                     'token_count':len(trace['tokenizer']['ids'])}]
        visible = 0
        tokenizer = Tokenizer()
        end = tokenizer.token_id('control','TURN_END')
        for step in trace['passes']:
            token = step['selection']['selected_id']
            expected += [{'kind':'model-forward-completed','work_id':step['id'],'phase':step['phase']},
                         {'kind':'token-selected','work_id':step['id'],'token_id':token,'output_position':step['step']}]
            if token != end:
                expected += [{'kind':'token-published','work_id':step['id'],'token_ids':[token],'output_start':visible,
                              'display_delta':token_display(tokenizer,token)}]
                visible += 1
        expected.append({'kind':'request-finished','outcome':trace['outcome']})
        actual = [e['payload'] for e in run['events'] if e['request_id']==arrival.request_id]
        if actual != expected: raise ValueError('Events disagree with executed baseline transitions')
        if ''.join(e['payload']['display_delta'] for e in publications(run,arrival.request_id)) != trace['output_display']:
            raise ValueError('Published text differs from numerical evidence')
    ids = {r.request_id for r in binding.workload.requests}
    for i,event in enumerate(run['events']):
        causes = event_causes(run['events'][:i],event['payload'])
        if (event['sequence'] != i or event['event_id'] != f"{run['id']}/event-{i}"
                or event['run_id'] != run['id'] or event['request_id'] not in ids or event['causes'] != causes):
            raise ValueError('Invalid event identity, order, or causal reference')


def replay_workload(record):
    validate_run(record)
    trace = record['traces'][0]
    validate_provenance(trace['provenance'], replay=True, backend=reference_backend())
    result = run_workload(record['declaration']['workload'], checkpoint=trace['checkpoint'])
    # Git revision is provenance; exact source hashes permit replay across a commit.
    for a,b in zip(result['traces'],record['traces']):
        a['provenance']['revision'] = b['provenance']['revision']
    if identity(result) != identity(record): raise ValueError('Replayed workload differs')
    return result
