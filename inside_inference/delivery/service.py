"""Declared execution operations shared by the browser worker and component tooling."""
from inside_inference.declarations_generated import EXECUTION_OPERATIONS, MODELS
from inside_inference.cache_lab import replay_cache
import time
from inside_inference.model import canonical
from inside_inference.contract_runtime import decode_json

_service = None


def validate_operation_input(name, payload):
    if name not in EXECUTION_OPERATIONS: raise ValueError('Unknown execution operation')
    operation = EXECUTION_OPERATIONS[name]
    if operation['request']: MODELS[operation['request']].validate_shape(payload)
    elif payload is not None: raise ValueError('Unexpected operation input')
    if name == 'prepareGeneration':
        requests = payload['workload']['requests']
        if len(requests) != 1 or requests[0]['arrival_us'] != 0:
            raise ValueError('Only one request arriving at zero is supported; no scheduler is simulated')
        policy = requests[0]['request']['generation']
        if policy['stopping'] != 'model-end-or-budget':
            raise ValueError('Generation requires model-end-or-budget')


def execute(name, payload, *, checkpoint=None):
    validate_operation_input(name, payload)
    if name == 'replayCache': value = replay_cache(decode_json(payload["record_json"]))
    else: raise ValueError('Model operations require a model service')
    return canonical(value).decode()


async def execute_model(service, name, payload, *, timing=None):
    started = time.perf_counter()
    validate_operation_input(name, payload)
    if timing is not None:
        timing['operation_validation_ms'] = (time.perf_counter() - started) * 1000
    if name == 'replayCache': return replay_cache(decode_json(payload['record_json']))
    if name == 'modelCatalog': return await service.load_catalog()
    await service.load_catalog()
    if name == 'loadModel': return await service.load(payload['model_id'])
    if name == 'prepareGeneration':
        service.prepared = None
        await service.configure_draft(payload)
        return service.prepare(payload)
    if name == 'generateToken': return service.generate(payload)
    if name == 'simulateResources': return service.simulate(payload)
    raise ValueError('Declared operation has no implementation')


async def _fetch(url):
    from js import Object, fetch
    from pyodide.ffi import to_js
    try:
        response = await fetch(url, to_js({'credentials': 'omit'}, dict_converter=Object.fromEntries))
        if not response.ok:
            raise ValueError(f'status {response.status}')
        return (await response.arrayBuffer()).to_bytes()
    except Exception as error:
        raise ValueError(f'Model asset unavailable: {url} ({error})') from None


async def execute_browser(name, payload):
    """Browser worker entry: the site root is the parent of the worker's execution/ folder."""
    global _service
    if _service is None:
        from js import location
        from urllib.parse import urljoin
        from inside_inference.delivery.models import ModelService
        _service = ModelService(urljoin(str(location.href), '../'), _fetch)
    started = time.perf_counter()
    timing = {}
    value = await execute_model(_service, name, payload, timing=timing)
    timing['operation_ms'] = (time.perf_counter() - started) * 1000
    return value, timing
