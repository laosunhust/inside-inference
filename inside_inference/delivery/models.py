"""Declared model operations: catalog, loading, tokenization, generation and KV simulation.

One implementation runs in the browser worker and in component tooling; only the
asset reader differs (HTTP fetch versus files).
"""
import gzip
import hashlib
import json
import time
from urllib.parse import urljoin, urlparse

from inside_inference.declarations_generated import CONTRACT_SHA256, KVResidencySystemConfig, LAB_BINDINGS, ModelCatalog
from inside_inference.generation import select_greedy
from inside_inference.model import canonical
from inside_inference.runtimes import bpe, tokenization
from inside_inference.runtimes.engine import Decoder, checkpoint_weights, llama2c_weights, observations

RESOURCES = ('kv_cache', 'scheduling', 'transfer', 'compute_service')


def resolve_execution(spec):
    """One composition; list order never overrides another assignment."""
    values = {}
    for experiment in spec['experiments']:
        if experiment['control'] in values:
            raise ValueError(f"Conflicting execution control: {experiment['control']}")
        values[experiment['control']] = experiment['value']
    if (not isinstance(values.get('model'), str) or not isinstance(values.get('kv_reuse'), bool)
            or set(values) - {'model', 'kv_reuse', *RESOURCES}):
        raise ValueError('Execution requires exactly one model and KV reuse control')
    present = [k for k in RESOURCES if k in values]
    if present and len(present) != len(RESOURCES):
        raise ValueError('Resource simulation requires cache, scheduling, transfer and compute-service controls together')
    return {'model_id': values['model'], 'kv_reuse': values['kv_reuse'],
            'resources': {k: values[k] for k in RESOURCES} if present else None}


def finish_selection(step, selected, model):
    output = [*step['output_ids'], selected]
    sequence = [*step['prefix_ids'], *output]
    stop = ('end_token' if selected in model['stop_ids'] else 'output_budget' if len(output) >= step['generation']['max_new_tokens']
            else 'context_capacity' if len(sequence) > model['architecture']['context'] else None)
    visible = output[:-1] if selected in model['stop_ids'] else output
    return output, sequence, stop, visible


class ModelService:
    """Holds the one loaded model; `read(url)` returns the bytes at an HTTP(S) or file URL."""

    def __init__(self, root, read):
        self.root, self.read = root, read
        self.catalog = self.model = self.decoder = self.tokenizer = self.checkpoint = None

    async def load_catalog(self):
        if self.catalog is None:
            catalog = json.loads(await self.read(urljoin(self.root, 'models/catalog.json')))
            ModelCatalog.validate_shape(catalog)
            self.catalog = catalog
        return self.catalog

    async def asset(self, asset):
        base = urljoin(self.root, self.catalog['storage']['base_url'])
        url = urljoin(base, asset['path'])
        target, origin = urlparse(url), urlparse(base)
        if target.scheme not in ('http', 'https', 'file') or target.netloc != origin.netloc or not target.path.startswith(origin.path):
            raise ValueError('Invalid model asset location')
        raw = await self.read(url)
        if len(raw) != asset['bytes']:
            raise ValueError(f"Model asset size mismatch: {asset['path']}")
        if hashlib.sha256(raw).hexdigest() != asset['sha256']:
            raise ValueError(f"Model asset digest mismatch: {asset['path']}")
        return raw

    def descriptor(self, model_id):
        model = next((m for m in self.catalog['models'] if m['id'] == model_id), None)
        if model is None:
            raise ValueError('Unknown model')
        return model

    async def load(self, model_id):
        model = self.descriptor(model_id)
        self.model = self.decoder = None
        start = time.perf_counter()
        weights, manifest = [await self.asset(model[k]) for k in ('weights', 'tokenizer')]
        a = model['architecture']
        if model['tokenizer_format'] == 'word-hex-manifest':
            self.checkpoint, self.tokenizer = tokenization.load(model, weights, manifest)
            parameters, tensors = self.checkpoint['parameters'], checkpoint_weights(self.checkpoint)
            pieces = tokenization.pieces(self.tokenizer, range(a['vocabulary']))
        else:
            self.checkpoint, self.tokenizer = None, bpe.BytePairTokenizer(manifest, a['vocabulary'])
            parameters, tensors = None, llama2c_weights(weights, a)
            pieces = [self.tokenizer.piece(i) for i in range(a['vocabulary'])]
        self.model, self.decoder = model, Decoder(a, tensors)
        return {'model': model, 'load_ms': (time.perf_counter() - start) * 1000, 'token_pieces': pieces, 'parameters': parameters}

    def loaded(self, model_id):
        if self.model is None or self.model['id'] != model_id:
            raise ValueError('Load the selected model first')
        return self.model

    def pieces(self, ids):
        if self.checkpoint is not None:
            return tokenization.pieces(self.tokenizer, ids)
        return [self.tokenizer.piece(i) for i in ids]

    def decode(self, ids, previous, final):
        if self.checkpoint is not None:
            return self.tokenizer.decode_prefix(ids, final=final)
        return self.tokenizer.decode(ids, previous), None

    def prepare(self, payload):
        controls = resolve_execution(payload['execution'])
        model = self.loaded(controls['model_id'])
        if controls['resources']:
            raise ValueError('Resource experiments execute through simulateResources')
        if len(payload['workload']['requests']) != 1:
            raise ValueError('This execution supports one request')
        text = payload['workload']['requests'][0]['request']['text']
        if self.checkpoint is not None:
            ids, encoding = tokenization.encode(self.tokenizer, text)
        else:
            ids, encoding = self.tokenizer.encode(bpe.normalize(text)), None
        if len(ids) > model['architecture']['context']:
            raise ValueError('Input exceeds model context')
        self.decoder.prefix = []
        return {'input': payload, 'prompt_ids': ids, 'pieces': self.pieces(ids), 'encoding': encoding}

    def generate(self, step):
        controls = resolve_execution(step['execution'])
        model = self.loaded(controls['model_id'])
        if controls['resources']:
            raise ValueError('Resource experiments execute through simulateResources')
        a, ids = model['architecture'], [*step['prefix_ids'], *step['output_ids']]
        if any(type(i) is not int or not 0 <= i < a['vocabulary'] for i in ids):
            raise ValueError('Token ID outside vocabulary')
        if (len(ids) > a['context'] or len(step['output_ids']) >= step['generation']['max_new_tokens']
                or any(i in model['stop_ids'] for i in step['output_ids'])):
            raise ValueError('Request has already finished')
        start = time.perf_counter()
        run = self.decoder.run(ids, controls['kv_reuse'], capture=model['inspection'] == 'tensors')
        logits = run['logits'].astype(float).tolist()
        selection = select_greedy(logits)
        selected = selection['selected_id']
        output, sequence, stop, visible = finish_selection(step, selected, model)
        text, note = self.decode(visible if self.checkpoint is not None else output, step['prefix_ids'][-1], stop is not None)
        identity = hashlib.sha256(canonical([CONTRACT_SHA256, model['weights']['sha256'], model['tokenizer']['sha256'], step])).hexdigest()
        nodes = observations(run['trace'], ids, run['work'], a, identity + '/', run_id=identity, step=len(output) - 1)
        return {'model_id': model['id'], 'weights_sha256': model['weights']['sha256'], 'tokenizer_sha256': model['tokenizer']['sha256'],
                'sequence_ids': sequence, 'output_ids': output, 'text': text, 'pieces': self.pieces(sequence),
                'logits': logits, 'probabilities': selection['probabilities'], 'selected_id': selected, 'stop_reason': stop,
                'compute_ms': (time.perf_counter() - start) * 1000, 'nodes': nodes, 'decoding_note': note, 'work': run['work'],
                'request': step, 'id': identity, 'contract_sha256': CONTRACT_SHA256}

    def simulate(self, payload):
        from inside_inference.cache_lab import run_cache_experiment
        controls = resolve_execution(payload['execution'])
        model = self.loaded(controls['model_id'])
        if not controls['resources']:
            raise ValueError('Configure a KV residency experiment first')
        if self.checkpoint is None:
            raise ValueError('Resource simulation currently requires the 8K state format; select 8K explicitly')
        if not controls['kv_reuse']:
            raise ValueError('KV residency simulation requires KV reuse')
        spec = {'system': {**KVResidencySystemConfig().to_dict(), **controls['resources']}, 'workload': payload['workload'],
                'ontology_binding': LAB_BINDINGS['prefix-cache']}
        run = run_cache_experiment(spec, checkpoint=self.checkpoint)
        outputs, notes = {}, {}
        for request in payload['workload']['requests']:
            ids = [c['selection']['selected_id'] for c in run['computations'] if c['request_id'] == request['request_id'] and c['selection']]
            outputs[request['request_id']], note = self.tokenizer.decode_prefix([i for i in ids if i not in model['stop_ids']], final=True)
            if note:
                notes[request['request_id']] = note
        return {'input': payload, 'run': run, 'outputs': outputs, 'decoding_notes': notes}
