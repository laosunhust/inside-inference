"""Declared execution operations shared by the browser and component tooling."""
from inside_inference.declarations_generated import EXECUTION_OPERATIONS, MODELS, CONTRACT_SHA256, Capabilities, CacheCapabilities
from inside_inference.workload import run_workload, prepare_input
from inside_inference.generation import run_token_step, replay_token_step
from inside_inference.cache_lab import run_cache_experiment, available_backends, replay_cache
from inside_inference.delivery.codec import publish
from inside_inference.delivery.store import response
from inside_inference.model import canonical
from inside_inference.contract_runtime import decode_json


def execute(name, payload, store, *, checkpoint=None):
    if name not in EXECUTION_OPERATIONS: raise ValueError('Unknown execution operation')
    operation = EXECUTION_OPERATIONS[name]
    if operation['request']: MODELS[operation['request']].validate_shape(payload)
    elif payload is not None: raise ValueError('Unexpected operation input')
    if name == 'capabilities': value = Capabilities(contract_sha256=CONTRACT_SHA256).to_dict()
    elif name == 'cacheCapabilities': value = CacheCapabilities(contract_sha256=CONTRACT_SHA256, backends=tuple(available_backends())).to_dict()
    elif name == 'artifact': value = response(store, payload)
    elif name == 'prepareInput': value = prepare_input(payload, checkpoint=checkpoint)
    elif name == 'run': value = publish(run_workload(payload, checkpoint=checkpoint), store)
    elif name == 'tokenStep': value = publish(run_token_step(payload, checkpoint=checkpoint), store)
    elif name == 'replayTokenStep': value = replay_token_step(decode_json(payload["record_json"]))
    elif name == 'replayCache': value = replay_cache(decode_json(payload["record_json"]))
    elif name == 'cacheRun': value = run_cache_experiment(payload, checkpoint=checkpoint)
    else: raise ValueError('Declared operation has no implementation')
    MODELS[operation['response']].validate_shape(value)
    return canonical(value).decode()


def execute_json(name, payload, store):
    return execute(name, decode_json(payload), store)
