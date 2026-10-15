"""Greedy block verification using the shared decoder and independent KV state.

A round computes once and retains verified target logits. Subsequent token deliveries
consume that buffer; their decoder work is zero. Cache prefixes exclude the final
committed token so the next round computes the first required target distribution.
"""
import hashlib
import time
import numpy as np
from inside_inference.model import canonical
from inside_inference.declarations_generated import CONTRACT_SHA256


def verify_greedy(proposals, target_ids, stop_ids, budget):
    """Accept a matching prefix, then emit a target correction or bonus if allowed."""
    if budget < 1 or len(target_ids) != len(proposals) + 1:
        raise ValueError('Verification requires one target choice per proposal plus a bonus')
    emitted, accepted = [], 0
    for index, selected in enumerate(target_ids):
        emitted.append(selected)
        matched = index < len(proposals) and selected == proposals[index]
        accepted += int(matched)
        if selected in stop_ids or len(emitted) == budget or not matched:
            break
    return emitted, accepted


def trim(decoder, ids):
    """Discard every retained position not proven to match the committed prefix."""
    count = 0
    while count < min(len(ids), len(decoder.prefix)) and ids[count] == decoder.prefix[count]:
        count += 1
    decoder.prefix = decoder.prefix[:count]


class Speculator:
    def __init__(self, target, draft, proposal_tokens):
        self.target, self.draft, self.proposal_tokens = target, draft, proposal_tokens
        self.pending = []

    def next(self, step):
        if self.pending and self.pending[0][0] != step:
            self.pending = []
        if not self.pending:
            self._round(step)
        _, logits, work, duration, delivery = self.pending.pop(0)
        return {'logits': logits, 'work': work, 'trace': None}, duration, delivery

    def _round(self, step):
        target, draft = self.target, self.draft
        ids = [*step['prefix_ids'], *step['output_ids']]
        budget = step['generation']['max_new_tokens'] - len(step['output_ids'])
        count = min(self.proposal_tokens, budget - 1, target.model['architecture']['context'] - len(ids))
        proposed, draft_ms = [], 0.0
        draft_work = {'matmul_flops': 0.0, 'processed_positions': 0, 'reused_positions': 0}
        # Fresh sequences start cold, including UI Reset without another tokenization call.
        if not step['output_ids']:
            draft.decoder.prefix = [];target.decoder.prefix = []
        # Both histories may contain abandoned candidates after edits or earlier rounds.
        trim(draft.decoder, ids[:-1]);trim(target.decoder, ids[:-1])
        for _ in range(count):
            started = time.perf_counter()
            run = draft.decoder.run([*ids, *proposed], True)
            draft_ms += (time.perf_counter() - started) * 1000
            for key in draft_work: draft_work[key] += run['work'][key]
            token = int(np.argmax(run['logits']))
            proposed.append(token)
            if token in target.model['stop_ids']: break
        started = time.perf_counter()
        run = target.decoder.run([*ids, *proposed], True)
        target_ms = (time.perf_counter() - started) * 1000
        offset = len(ids) - 1 - run['work']['reused_positions']
        rows = run['logits_rows'][offset:]
        target_ids = [int(np.argmax(row)) for row in rows]
        committed, accepted = verify_greedy(proposed, target_ids, target.model['stop_ids'], budget)
        round_id = hashlib.sha256(canonical([CONTRACT_SHA256, target.model['weights']['sha256'], step, draft.model['weights']['sha256'], proposed, committed])).hexdigest()
        evidence = {'id': round_id, 'draft_model_id': draft.model['id'],
                    'draft_weights_sha256': draft.model['weights']['sha256'],
                    'proposed_ids': proposed, 'target_selected_ids': target_ids,
                    'accepted_count': accepted, 'committed_ids': committed,
                    'draft_calls': len(proposed), 'target_calls': 1,
                    'draft_work': draft_work, 'target_work': run['work'],
                    'draft_ms': draft_ms, 'target_ms': target_ms}
        aggregate = {key: draft_work[key] + run['work'][key] for key in draft_work}
        for index, token in enumerate(committed):
            request = {**step, 'output_ids': [*step['output_ids'], *committed[:index]]}
            delivery = {'round_id': round_id, 'token_offset': index, 'buffered': index > 0,
                        'round': evidence if index == 0 else None}
            self.pending.append((request, rows[index].copy(), aggregate if index == 0 else {key: 0 for key in aggregate},
                                 draft_ms + target_ms if index == 0 else 0.0, delivery))
        # Correction/bonus is not yet in target KV; rejected candidate positions cannot survive.
        retained = [*ids, *committed][:-1]
        trim(target.decoder, retained);trim(draft.decoder, retained)
