"""Common API application. HTTP and Lambda only adapt envelopes around this code."""
from inside_inference.declarations_generated import API_PATHS, CONTRACT_SHA256, Capabilities, CacheCapabilities
from inside_inference.workload import run_workload
from inside_inference.generation import run_token_step
from inside_inference.cache_lab import run_cache_experiment, available_backends
from inside_inference.delivery.codec import publish
from inside_inference.delivery.store import response


def dispatch(method, route, payload, store, *, checkpoint=None):
    if method == 'GET' and route == API_PATHS['capabilities']:
        return 200, Capabilities(contract_sha256=CONTRACT_SHA256).to_dict()
    if method == 'GET' and route == API_PATHS['cacheCapabilities']:
        return 200, CacheCapabilities(contract_sha256=CONTRACT_SHA256, backends=tuple(available_backends())).to_dict()
    if method != 'POST': return 404, {'error': 'Unknown endpoint'}
    try:
        if route == API_PATHS['artifact']: return 200, response(store, payload)
        if route == API_PATHS['run']:
            return 200, publish(run_workload(payload, checkpoint=checkpoint), store)
        if route == API_PATHS['tokenStep']:
            return 200, publish(run_token_step(payload, checkpoint=checkpoint), store)
        if route == API_PATHS['cacheRun']: return 200, run_cache_experiment(payload, checkpoint=checkpoint)
        return 404, {'error': 'Unknown endpoint'}
    except FileNotFoundError:
        if route == API_PATHS['artifact']: return 404, {'error': 'Artifact not found'}
        raise
    except (ValueError, TypeError, UnicodeError) as error:
        return 400, {'error': str(error)}
