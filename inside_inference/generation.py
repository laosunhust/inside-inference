"""Unmasked greedy selection and reproducible request execution over the forward engine."""
from dataclasses import asdict
import math

from inside_inference.model import ModelArchitecture, Model, identity, initialize, softmax
from inside_inference.tokenizer import Tokenizer, Turn
from inside_inference.declarations_generated import CONTRACT_SHA256, InferenceRequest, RunOutcome
from inside_inference.declarations import bind, validate_result
from inside_inference.provenance import execution_provenance, stable_provenance, validate_provenance, reference_backend

DECODING_CONTRACT = {
    'rule': 'unmasked-greedy-v1',
    'explanation': 'All vocabulary IDs compete using the actual raw logits. No output grammar, '
                   'token mask, repetition penalty, forced spacing, or minimum length.',
    'choice': 'greedy; ties choose smallest ID',
}
DEFAULT_REQUEST = InferenceRequest().to_dict()


def select_greedy(logits):
    if not logits or any(not math.isfinite(x) for x in logits):
        raise ValueError('Selection requires finite vocabulary logits')
    return {'rule': DECODING_CONTRACT['rule'], 'raw_logits':list(logits),
            'probabilities':softmax(logits),
            'selected_id':max(range(len(logits)), key=lambda i:(logits[i],-i)),
            'decoding':DECODING_CONTRACT['choice'], 'rng_state':None}


def token_display(tokenizer, token_id):
    """Diagnostic display only: never modifies selection or the retained token IDs."""
    token = tokenizer.tokens[token_id]
    if token.kind in ('word','space','punctuation'): return token.piece
    return f'<{token.kind}:{token.piece}>'


def run_request(request=None, *, checkpoint=None, capture=True, run_id=None, request_id=None, observe=None):
    request = InferenceRequest.from_dict(DEFAULT_REQUEST if request is None else request)
    tokenizer = Tokenizer()
    checkpoint = initialize(ModelArchitecture(), tokenizer.manifest_sha256) if checkpoint is None else checkpoint
    model = Model(checkpoint)
    if checkpoint['manifest_sha256'] != tokenizer.manifest_sha256:
        raise ValueError('Checkpoint vocabulary identity does not match tokenizer')
    declaration = bind(model, tokenizer, request)
    if (declaration.system.execution != 'full-prefix-recomputation'
            or request.generation.selection != 'greedy-lowest-id-tie'
            or request.generation.stopping != 'turn-end-or-budget'):
        raise ValueError('Declared inference policy has no execution implementation')
    if model.config.vocabulary != len(tokenizer.tokens):
        raise ValueError('Model and tokenizer vocabulary sizes differ')
    encoding = tokenizer.encode_prompt([Turn(role='user', text=request.text)], context_limit=model.config.context)
    required = len(encoding.ids) + request.generation.max_new_tokens - 1
    if required > model.config.context:
        raise ValueError(f'Prompt plus token budget requires {required} positions; capacity is {model.config.context}. Reduce the prompt or token budget.')
    source = execution_provenance()
    run_id = run_id or identity({'declaration': declaration.to_dict(), 'contract': CONTRACT_SHA256, 'provenance': stable_provenance(source)})
    request_id = request_id or 'request-' + encoding.input_sha256[:16]
    def emit(kind, **payload):
        if observe is not None: observe({'kind':kind, **payload})
    emit('input-encoded', input_sha256=encoding.input_sha256, token_count=len(encoding.ids))
    prefix, emitted, passes = list(encoding.ids), [], []
    end = tokenizer.token_id('control','TURN_END')
    stop_reason = 'output_budget'
    for number in range(request.generation.max_new_tokens):
        result = model.forward(prefix, capture=capture, request_id=request_id, run_id=run_id, step=number)
        work_id = f'{run_id}/step-{number}'
        emit('model-forward-completed', work_id=work_id, phase='prefill' if number == 0 else 'decode')
        selection = select_greedy(result['logits'][-1])
        selected = selection['selected_id']
        item = {'id': f'{run_id}/step-{number}', 'request_id': request_id, 'run_id': run_id,
                'step': number, 'phase': 'prefill' if number == 0 else 'decode',
                'input_ids': prefix[:], 'positions': list(range(len(prefix))),
                'selection_position': len(prefix) - 1, 'output_position': len(prefix),
                'execution': declaration.system.execution, 'nodes': result['nodes'],
                'selection': selection}
        emit('token-selected', work_id=work_id, token_id=selected, output_position=len(emitted))
        if selected != end:
            emit('token-delivered', work_id=work_id, token_ids=[selected], output_start=len(emitted),
                 display_delta=token_display(tokenizer,selected))
        emitted.append(selected)
        visible = emitted[:-1] if selected == end else emitted
        item['display_so_far'] = ''.join(token_display(tokenizer,i) for i in visible)
        passes.append(item)
        prefix.append(selected)
        if selected == end:
            stop_reason = 'turn_end'
            break
    outcome = RunOutcome(selected_tokens=len(emitted), delivered_tokens=sum(i != end for i in emitted),
                         unused_budget=request.generation.max_new_tokens - len(emitted),
                         stop_reason=stop_reason, complete=stop_reason == 'turn_end')
    record = {'format': 'naive-gpt-run-v2', 'id': run_id, 'request_id': request_id,
            'evidence': 'actual forward computation; checkpoint preparation is recorded in provenance; no hardware cost model',
            'declaration': declaration.to_dict(), 'contract_sha256': CONTRACT_SHA256,
            'provenance': source, 'decoding_contract': DECODING_CONTRACT,
            'precision': {'storage': 'binary64', 'compute': 'binary64', 'accumulation': 'binary64'},
            'checkpoint': model.checkpoint, 'tokenizer': encoding.to_dict(),
            'vocabulary': [asdict(t) for t in tokenizer.tokens], 'passes': passes,
            'output_ids': emitted, 'sequence_ids': prefix, 'outcome': outcome.to_dict(),
            'output_display': passes[-1]['display_so_far']}
    validate_result(record)
    emit('request-finished', outcome=outcome.to_dict())
    return record


def replay(record):
    if record['format'] != 'naive-gpt-run-v2':
        raise ValueError('Unsupported run format')
    if identity(record['checkpoint']) != record['declaration']['model']['checkpoint_sha256']:
        raise ValueError('Checkpoint identity mismatch')
    validate_provenance(record['provenance'], replay=True, backend=reference_backend())
    result = run_request(record['declaration']['request'], checkpoint=record['checkpoint'])
    if set(record) != set(result):
        raise ValueError('Run record fields differ')
    result['provenance']['revision'] = record['provenance']['revision']
    for key in result:
        # JSON normalization makes tuple/list representation irrelevant.
        if identity(result[key]) != identity(record[key]):
            raise ValueError(f'Replay differs at {key}')
    return result
