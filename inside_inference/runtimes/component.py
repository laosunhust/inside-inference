"""Explicit host boundary: browser execution versus an independent preparation/test reference."""
import json
import sys
from inside_inference.declarations_generated import KVState

def forward(model, ids, **options):
    ids=list(ids)
    state=options.get('state')
    offset=len(state.token_ids) if state is not None else 0
    if not ids or offset+len(ids)>model.config.context or any(type(i) is not int or not 0<=i<model.config.vocabulary for i in ids):
        raise ValueError('Forward requires 1..context valid token IDs')
    if sys.platform != 'emscripten':
        from inside_inference.runtimes.reference import forward as reference
        return reference(model, ids, **options)
    from js import componentForward
    payload=dict(checkpoint=model.checkpoint,identity=model.sha256,ids=ids,state=None,capture=True,
                 request_id='request-0',run_id='standalone',step=0,work_id=None)
    payload.update(options)
    payload['state']=state.to_dict() if state is not None else None
    result=json.loads(componentForward(json.dumps(payload)))
    if 'state' in result:result['state']=KVState.from_dict(result['state'])
    return result
