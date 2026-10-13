"""Actual numerical execution and memory residency, separate from virtual scheduling."""
from time import perf_counter_ns
import platform
import sys

from inside_inference.model import Model, identity
from inside_inference.declarations_generated import KVState


def state_bytes(state):
    """Logical packed binary64 K+V payload, not Python process memory."""
    return sum(len(row) for tensor in (state.keys, state.values) for matrix in tensor for row in matrix) * 8


def prefix_state(state, count):
    if not 0 <= count <= len(state.token_ids):
        raise ValueError('Prefix slice outside state')
    return KVState(checkpoint_sha256=state.checkpoint_sha256,
        tokenizer_sha256=state.tokenizer_sha256, token_ids=state.token_ids[:count],
        keys=tuple(layer[:count] for layer in state.keys),
        values=tuple(layer[:count] for layer in state.values))


class ReferenceRuntime:
    """CPU reference with explicit logical device/host pools; no file-backed state."""
    def __init__(self, checkpoint):
        self.model = Model(checkpoint)
        self.device, self.host = {}, {}

    def empty(self):
        return KVState(checkpoint_sha256=self.model.sha256,
            tokenizer_sha256=self.model.checkpoint['manifest_sha256'], token_ids=(),
            keys=tuple(() for _ in range(self.model.config.layers)),
            values=tuple(() for _ in range(self.model.config.layers)))

    def describe(self):
        return dict(compute_device='CPU scalar reference', device_state_storage='Logical pool in system DRAM',
            host_state_storage='Separate logical pool in system DRAM; Python objects',
            library='Python '+platform.python_version()+' ('+sys.platform+')', precision='binary64')

    def compute(self, ids, state, **trace):
        key = identity(state.to_dict())
        if state.token_ids and key not in self.device:
            raise ValueError('Computation requires device-resident state')
        before = perf_counter_ns()
        result = self.model.forward_cached(ids, state, **trace)
        elapsed = (perf_counter_ns() - before) / 1000
        self.device[identity(result['state'].to_dict())] = result['state']
        return result, elapsed

    def retain(self, state, count):
        if identity(state.to_dict()) not in self.device:
            raise ValueError('Retention requires resident producer state')
        before = perf_counter_ns()
        prefix = prefix_state(state, count)
        self.device[identity(prefix.to_dict())] = prefix
        return prefix, (perf_counter_ns() - before) / 1000

    def transfer(self, state_id, to_host):
        source, target = (self.device, self.host) if to_host else (self.host, self.device)
        if state_id not in source:
            raise ValueError('Transfer source is not resident')
        before = perf_counter_ns()
        target[state_id] = KVState.from_dict(source[state_id].to_dict())
        del source[state_id]
        return (perf_counter_ns() - before) / 1000

    def collect(self, device_ids, host_ids):
        for pool, live in ((self.device, device_ids), (self.host, host_ids)):
            for key in list(pool):
                if key not in live: del pool[key]

    def close(self):
        self.device.clear(); self.host.clear()
