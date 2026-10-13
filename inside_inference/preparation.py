"""Optional checkpoint preparation; inference continues to use the reference engine."""
from copy import deepcopy
import math

import torch
from torch import nn

from inside_inference.corpus import build_cases, load_recipe, score_response
from inside_inference.generation import token_display
from inside_inference.model import Model
from inside_inference.tokenizer import Tokenizer, Turn


# Numerical equations are shared with the optional inspected tensor backend.
from inside_inference.tensor_model import TensorModel as PreparationModel


def prepare_examples(target_policy="original", budget=8, *, cases=None, splits=("train", "development")):
    """Explicit single-user projection; never select or evaluate test examples."""
    if target_policy not in ('original', 'shortest-multiword-v1'):
        raise ValueError('Unsupported training target policy')
    tokenizer = Tokenizer()
    examples = {split: [] for split in splits}
    questions = {'location': 'where is ', 'correction': 'where is ',
                 'ownership': 'who has ', 'negation': 'what does '}
    for case in build_cases(load_recipe()) if cases is None else cases:
        if case['split'] not in examples:
            continue
        text = ' '.join(turn['text'] for turn in case['turns'] if turn['role'] == 'user')
        question_start = text.rfind(questions[case['family']])
        if question_start < 0:
            raise ValueError('Task projection has no recognized final question')
        prompt = tokenizer.encode_prompt([Turn(role='user', text=text)], context_limit=128)
        target = case['turns'][-1]['text']
        if target_policy == 'shortest-multiword-v1':
            candidates = [a for a in case['acceptable_answers'] if len(a.split()) > 1]
            if not candidates:
                raise ValueError('No existing multi-word acceptable answer')
            target = min(candidates, key=lambda a: (len(tokenizer.encode(a).ids), a))
        response = list(tokenizer.encode(target).ids)
        response.append(tokenizer.token_id('control', 'TURN_END'))
        if len(prompt.ids) + max(len(response), budget) - 1 > 128:
            raise ValueError('Complete example and evaluation budget must fit; no truncation')
        examples[case['split']].append({
            'id': case['id'], 'group_id': case['group_id'], 'family': case['family'],
            'split': case['split'], 'text': text, 'context': text[:question_start].rstrip(),
            'question': text[question_start:], 'answer': case['answer'],
            'acceptable_answers': case['acceptable_answers'],
            'prompt_ids': list(prompt.ids), 'response_ids': response,
        })
        if target_policy != 'original':
            examples[case['split']][-1]['training_target'] = target
    for rows in examples.values():
        rows.sort(key=lambda item: item['id'])
    return examples


def batch_tensors(examples, pad_id):
    if not examples:
        raise ValueError('Training batch must not be empty')
    lengths = [len(e['prompt_ids']) + len(e['response_ids']) - 1 for e in examples]
    inputs = torch.full((len(examples), max(lengths)), pad_id, dtype=torch.long)
    targets = torch.full_like(inputs, -100)
    for row, example in enumerate(examples):
        prompt, response = example['prompt_ids'], example['response_ids']
        if not prompt or not response:
            raise ValueError('Each example needs prompt and supervised response')
        sequence = prompt + response
        inputs[row, :len(sequence) - 1] = torch.tensor(sequence[:-1])
        targets[row, len(prompt) - 1:len(sequence) - 1] = torch.tensor(response)
    return inputs, targets


def response_loss(model, examples, pad_id):
    inputs, targets = batch_tensors(examples, pad_id)
    logits = model(inputs)
    return nn.functional.cross_entropy(logits.reshape(-1, model.config.vocabulary), targets.reshape(-1))


def make_optimizer(model, config):
    return torch.optim.AdamW(model.parameters(), lr=config['learning_rate'],
                             betas=tuple(config['betas']), eps=config['epsilon'],
                             weight_decay=config['weight_decay'], foreach=False)


def train_step(model, optimizer, examples, pad_id):
    optimizer.zero_grad(set_to_none=True)
    loss = response_loss(model, examples, pad_id)
    if not torch.isfinite(loss):
        raise ValueError('Nonfinite training loss')
    loss.backward()
    if any(p.grad is None or not torch.isfinite(p.grad).all() for p in model.parameters()):
        raise ValueError('Missing or nonfinite gradient')
    optimizer.step()
    return float(loss.detach())


def save_state(path, model, optimizer, sampler, step, run_identity):
    """Atomic local resumable state; never load an untrusted serialized state."""
    temporary = path.with_suffix(path.suffix + '.tmp')
    torch.save({'format': 'preparation-state-v1', 'model': model.state_dict(),
                'optimizer': optimizer.state_dict(), 'sampler': sampler.getstate(),
                'torch_rng': torch.get_rng_state(), 'step': step,
                'run_identity': run_identity}, temporary)
    temporary.replace(path)


def load_state(path, model, optimizer, sampler, expected_identity):
    state = torch.load(path, map_location='cpu', weights_only=True)
    if state['format'] != 'preparation-state-v1' or state['run_identity'] != expected_identity:
        raise ValueError('Resume configuration/data/source identity differs')
    model.load_state_dict(state['model'], strict=True)
    optimizer.load_state_dict(state['optimizer'])
    sampler.setstate(state['sampler'])
    torch.set_rng_state(state['torch_rng'])
    return state['step']


@torch.no_grad()
def generate(model, texts, tokenizer, budget=8):
    prefixes = [list(tokenizer.encode_prompt([Turn(role='user', text=text)], context_limit=model.config.context).ids)
                for text in texts]
    if any(len(prefix) + budget - 1 > model.config.context for prefix in prefixes):
        raise ValueError('Generation budget exceeds context')
    outputs = [[] for _ in texts]
    end, pad = tokenizer.token_id('control', 'TURN_END'), tokenizer.token_id('control', 'PAD')
    active = list(range(len(prefixes)))
    for _ in range(budget):
        if not active:
            break
        lengths = [len(prefixes[i]) for i in active]
        ids = torch.full((len(active), max(lengths)), pad, dtype=torch.long)
        for row, index in enumerate(active):
            ids[row, :lengths[row]] = torch.tensor(prefixes[index])
        logits = model(ids)[torch.arange(len(active)), torch.tensor(lengths) - 1]
        selected = logits.argmax(dim=-1).tolist()  # First ID wins ties; no masking.
        remaining = []
        for index, token in zip(active, selected):
            outputs[index].append(token)
            prefixes[index].append(token)
            if token != end:
                remaining.append(index)
        active = remaining
    return [{'ids': ids, 'stopped': bool(ids and ids[-1] == end),
             'text': ''.join(token_display(tokenizer, token) for token in ids if token != end)}
            for ids in outputs]


@torch.no_grad()
def evaluate(model, examples, tokenizer, budget=8):
    pad = tokenizer.token_id('control', 'PAD')
    loss = float(response_loss(model, examples, pad))
    full = generate(model, [e['text'] for e in examples], tokenizer, budget)
    blind = generate(model, [e['question'] for e in examples], tokenizer, budget)
    rotated = {}
    for family in sorted({e['family'] for e in examples}):
        group = [e for e in examples if e['family'] == family]
        for index, item in enumerate(group):
            rotated[item['id']] = group[(index + 1) % len(group)]
    swapped = generate(model, [rotated[e['id']]['context'] + ' ' + e['question'] for e in examples], tokenizer, budget)
    records = []
    for e, answer, ablated, shuffled in zip(examples, full, blind, swapped):
        records.append({'id': e['id'], 'family': e['family'], 'text': e['text'], 'expected': e['answer'],
            'full': dict(answer, correct=score_response(e, answer['text'])),
            'question_only': dict(ablated, correct=score_response(e, ablated['text'])),
            'rotated_context': dict(shuffled, correct=score_response(e, shuffled['text'])),
            'rotated_source_id': rotated[e['id']]['id'],
            'rotated_source_answer_matches': rotated[e['id']]['answer'] == e['answer']})
    accuracy = {kind: sum(r[kind]['correct'] for r in records) / len(records)
                for kind in ('full', 'question_only', 'rotated_context')}
    family = {f: sum(r['full']['correct'] for r in records if r['family'] == f) for f in sorted({e['family'] for e in examples})}
    termination = sum(r['full']['stopped'] for r in records) / len(records)
    multiple = sum(r['full']['stopped'] and len(r['full']['ids']) >= 3 for r in records) / len(records)
    return {'loss': loss, 'accuracy': accuracy, 'correct_by_family': family,
            'termination_rate': termination, 'multi_token_termination_rate': multiple,
            'provisional_pass': accuracy['full'] >= 0.8 and min(family.values()) >= 9
            and termination >= 0.9 and multiple >= 0.9
            and all(accuracy['full'] - accuracy[k] >= 0.2 for k in ('question_only', 'rotated_context')),
            'records': records}


def separated_response(ids, tokenizer):
    """Exact emitted WORD (SPACE WORD)+ PERIOD TURN_END, without text cleanup."""
    if len(ids) < 5 or ids[-2:] != [tokenizer.token_id('punctuation', '.'), tokenizer.token_id('control', 'TURN_END')]:
        return False
    content = ids[:-2]
    return (len(content) % 2 == 1 and all(
        tokenizer.tokens[token].kind == 'word' if i % 2 == 0
        else token == tokenizer.token_id('space', ' ')
        for i, token in enumerate(content)))


def readability_report(report, examples, tokenizer, criteria):
    """Attach a distinct inspection screen; never reuse the historical pilot gate."""
    report.pop('provisional_pass', None)
    records = report['records']
    for row, example in zip(records, examples, strict=True):
        if row['id'] != example['id']:
            raise ValueError('Readability examples differ from evaluated cases')
        row['full']['separated'] = separated_response(row['full']['ids'], tokenizer)
        row['full']['exact_target'] = row['full']['text'] == example['training_target']
    counts = {
        'separated_terminated': sum(r['full']['separated'] for r in records),
        'correct_separated': sum(r['full']['correct'] and r['full']['separated'] for r in records),
        'exact_target': sum(r['full']['exact_target'] for r in records),
        'accepted_answer': sum(r['full']['correct'] for r in records),
    }
    controls = {k: sum(r[k]['correct'] for r in records) for k in ('question_only', 'rotated_context')}
    counts['context_advantage'] = {k: counts['accepted_answer'] - v for k,v in controls.items()}
    report['readability'] = counts
    report['readability_pass'] = counts['separated_terminated'] >= criteria['separated_terminated']
    report['task_pass'] = (counts['correct_separated'] >= criteria['correct_separated']
        and report['correct_by_family']['negation'] >= criteria['negation_correct']
        and report['correct_by_family']['correction'] >= criteria['correction_correct']
        and all(v >= criteria['context_advantage'] for v in counts['context_advantage'].values()))
    return report
