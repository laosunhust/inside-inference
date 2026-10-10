"""Resolve generated declarations and validate causal relations, not tensor arithmetic."""
from inside_inference.declarations_generated import (
    OntologyBinding, LAB_BINDINGS, CONTRACT_SHA256, InferenceRequest, InferenceSystem, ModelArtifactReference, RequestBinding, RunOutcome,
)


def bind(model, tokenizer, request, system=None):
    request = request if isinstance(request, InferenceRequest) else InferenceRequest.from_dict(request)
    system = InferenceSystem() if system is None else system
    artifact = ModelArtifactReference(checkpoint_sha256=model.sha256, tokenizer_sha256=tokenizer.manifest_sha256,
                             architecture=model.config)
    binding = RequestBinding(model=artifact, system=system, request=request,
        ontology_binding=OntologyBinding.from_dict(LAB_BINDINGS['naive-gpt']))
    binding.validate_bound(binding.to_dict())
    return binding


def validate_result(record):
    if record['contract_sha256'] != CONTRACT_SHA256:
        raise ValueError('Run declaration contract version differs')
    binding = RequestBinding.from_dict(record['declaration'])
    binding.validate_bound(binding.to_dict())
    if binding.ontology_binding.to_dict() != LAB_BINDINGS['naive-gpt']:
        raise ValueError('Recorded ontology binding differs from the naive-gpt experiment')
    if record['checkpoint']['config'] != binding.model.architecture.to_dict():
        raise ValueError('Checkpoint and bound architecture disagree')
    if record['checkpoint']['manifest_sha256'] != binding.model.tokenizer_sha256:
        raise ValueError('Checkpoint and bound tokenizer disagree')
    from inside_inference.model import identity
    from inside_inference.provenance import validate_provenance
    if identity(record['checkpoint']) != binding.model.checkpoint_sha256:
        raise ValueError('Checkpoint identity differs from resolved model')
    validate_provenance(record['provenance'])
    outcome = RunOutcome.from_dict(record['outcome'])
    passes = record['passes']
    selected = record['output_ids']
    end = next(t['id'] for t in record['vocabulary'] if t['kind'] == 'control' and t['piece'] == 'TURN_END')
    if not passes or len(passes) != len(selected) or outcome.selected_tokens != len(selected):
        raise ValueError('Observed counts do not match actual passes')
    if outcome.unused_budget != binding.request.generation.max_new_tokens - len(selected):
        raise ValueError('Unused allowance does not match the submitted request')
    if outcome.published_tokens != sum(i != end for i in selected):
        raise ValueError('Visible token count differs')
    if outcome.complete != (outcome.stop_reason == 'turn_end'):
        raise ValueError('Completion and stop reason disagree')
    if outcome.stop_reason == 'turn_end' and selected[-1] != end:
        raise ValueError('Terminal outcome without terminal token')
    if outcome.stop_reason != 'turn_end' and end in selected:
        raise ValueError('Terminal selection must end the run')
    if outcome.stop_reason == 'output_budget' and outcome.unused_budget != 0:
        raise ValueError('Budget outcome before budget exhausted')
    prefix = list(record['tokenizer']['ids'])
    for index, (step, token) in enumerate(zip(passes, selected)):
        if (step['input_ids'] != prefix or step['step'] != index or step['run_id'] != record['id']
                or step['selection']['selected_id'] != token
                or step['execution'] != binding.system.model_execution.execution):
            raise ValueError('Prediction does not belong to the bound run')
        logits = step['selection']['raw_logits']
        if token != max(range(len(logits)),key=lambda i:(logits[i],-i)):
            raise ValueError('Selection differs from the unmasked logit argmax')
        if end in prefix[len(record['tokenizer']['ids']):]:
            raise ValueError('Generation continued after TURN_END')
        prefix.append(token)
    if prefix != record['sequence_ids']:
        raise ValueError('Sequence differs from actual continuation')
    if record['tokenizer']['manifest_sha256'] != binding.model.tokenizer_sha256:
        raise ValueError('Tokenizer identity differs')
    return binding
