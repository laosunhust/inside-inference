"""Declared execution operations shared by the browser and component tooling."""
from inside_inference.declarations_generated import EXECUTION_OPERATIONS, MODELS
from inside_inference.cache_lab import replay_cache
from inside_inference.model import canonical
from inside_inference.contract_runtime import decode_json


def execute(name, payload, *, checkpoint=None):
    if name not in EXECUTION_OPERATIONS: raise ValueError('Unknown execution operation')
    operation = EXECUTION_OPERATIONS[name]
    if operation['request']: MODELS[operation['request']].validate_shape(payload)
    elif payload is not None: raise ValueError('Unexpected operation input')
    if name == 'replayCache': value = replay_cache(decode_json(payload["record_json"]))
    else: raise ValueError('Declared operation has no implementation')
    return canonical(value).decode()


def execute_json(name, payload):
    return execute(name, decode_json(payload))


def validate_operation_input(name, raw):
    operation = EXECUTION_OPERATIONS[name]
    payload = decode_json(raw)
    if operation['request']: MODELS[operation['request']].validate_shape(payload)
    elif payload is not None: raise ValueError('Unexpected operation input')
    if name in ('prepareGeneration','generateToken'):
        if name == 'prepareGeneration':
            requests = payload['workload']['requests']
            if len(requests) != 1 or requests[0]['arrival_us'] != 0:
                raise ValueError('Only one request arriving at zero is supported; no scheduler is simulated')
            policy = requests[0]['request']['generation']
        else:
            policy = payload['generation']
        if policy['stopping'] != 'model-end-or-budget':
            raise ValueError('Generation requires model-end-or-budget')
