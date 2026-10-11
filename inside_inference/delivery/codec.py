"""Lossless storage projection: repeated numerical rows share bytes, not execution."""
import copy
from inside_inference.declarations_generated import (
    ExecutionReceipt, ExecutionBundle, TokenSelection,
)
from inside_inference.model import canonical
from inside_inference.delivery.store import put, get, response


def publish(record, store):
    is_run = 'traces' in record
    # Every projected field is validated when its artifact is persisted. The
    # projection admission test prevents divergent duplicate field contracts.
    stored = copy.deepcopy(record)
    rows, indices = [], {}

    def row(values):
        key = canonical(values)
        if key not in indices:
            indices[key] = len(rows)
            rows.append(values)
        return indices[key]

    def pack_pass(p):
        TokenSelection.validate_shape(p['selection'])
        for node in p['nodes']:
            values = node['values']
            node['values'] = [row(values)] if len(node['shape']) == 1 else [row(v) for v in values]
        for field in ('raw_logits', 'probabilities'):
            p['selection'][field] = row(p['selection'][field])

    traces = stored['traces'] if is_run else [stored]
    for trace in traces:
        trace['checkpoint'] = put(store, 'ModelArtifact', trace['checkpoint'])
        if is_run:
            trace['vocabulary'] = put(store, 'VocabularyArtifact', {'tokens': trace['vocabulary']})
        for p in trace['passes'] if is_run else [trace['computation']]: pack_pass(p)
    tensors = put(store, 'TensorTable', {'rows': rows})
    archive = put(store, 'ExecutionArchive', {'record': stored, 'tensors': tensors})
    result = {'execution_id': record['id'], 'archive': archive}
    ExecutionReceipt.validate_shape(result)
    return result


def restore(receipt, store):
    ExecutionReceipt.validate_shape(receipt)
    if receipt['archive']['schema'] != 'ExecutionArchive': raise ValueError('Expected execution archive')
    archive = get(store, receipt['archive'])
    if archive['tensors']['schema'] != 'TensorTable': raise ValueError('Expected tensor table')
    rows = get(store, archive['tensors'])['rows']
    record = copy.deepcopy(archive['record'])
    is_run = 'traces' in record
    def unpack_pass(p):
        for node in p['nodes']:
            try: values = [rows[i] for i in node['values']]
            except IndexError: raise ValueError('Missing tensor row') from None
            if len(node['shape']) == 1:
                if len(values) != 1: raise ValueError('Invalid vector row reference')
                values = values[0]
            node['values'] = copy.deepcopy(values)
        for field in ('raw_logits', 'probabilities'):
            try: p['selection'][field] = copy.deepcopy(rows[p['selection'][field]])
            except IndexError: raise ValueError('Missing selection row') from None
        TokenSelection.validate_shape(p['selection'])
    for trace in record['traces'] if is_run else [record]:
        if trace['checkpoint']['schema'] != 'ModelArtifact': raise ValueError('Expected model artifact')
        trace['checkpoint'] = get(store, trace['checkpoint'])
        if is_run:
            if trace['vocabulary']['schema'] != 'VocabularyArtifact': raise ValueError('Expected vocabulary')
            trace['vocabulary'] = get(store, trace['vocabulary'])['tokens']
        for p in trace['passes'] if is_run else [trace['computation']]: unpack_pass(p)
    if record['id'] != receipt['execution_id']: raise ValueError('Receipt execution differs')
    return record


def bundle(record):
    """Portable offline snapshot using the same immutable object representation."""
    from inside_inference.delivery.store import MemoryStore
    store = MemoryStore()
    receipt = publish(record, store)
    archive = get(store, receipt['archive'])
    refs = [receipt['archive'], archive['tensors']]
    source = archive['record']
    for trace in source['traces'] if 'traces' in source else [source]:
        refs.append(trace['checkpoint'])
        if 'vocabulary' in trace: refs.append(trace['vocabulary'])
    result = {'receipt': receipt, 'objects': {r['sha256']: response(store, r) for r in refs}}
    ExecutionBundle.validate_shape(result)
    return result


def restore_bundle(snapshot):
    from inside_inference.delivery.store import MemoryStore, verify
    ExecutionBundle.validate_shape(snapshot)
    store = MemoryStore()
    for key, artifact in snapshot['objects'].items():
        if key != artifact['reference']['sha256']: raise ValueError('Artifact bundle key differs')
        raw = artifact['content'].encode()
        verify(artifact['reference'], raw)
        store.write(key, raw)
    return restore(snapshot['receipt'], store)
