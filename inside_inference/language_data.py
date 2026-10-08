"""Authored language-exposure data, kept separate from scored task examples."""

from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

from inside_inference.corpus import canonical, digest
from inside_inference.tokenizer import Turn


ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    ('budget', 'data/tokenizer/studies/vocabulary-budget-dialogues.json', 'vocabulary-selection-data'),
    ('extension', 'data/corpus/language-seed.json', 'agent-authored-for-language-exposure'),
)


def prepare_language_seed(codec, task_cases):
    records, words = [], Counter()
    prompt_responses = defaultdict(set)
    source_records = []
    task_prompts = {canonical(c['turns'][:-1]): c for c in task_cases}
    exact_task_overlaps = []
    exclusions = json.loads((ROOT / 'data/corpus/language-exclusions.json').read_text())
    held_out_groups = {c['group_id'] for c in task_cases if c['split'] in ('development', 'test')}
    policies = {}
    for row in exclusions:
        if set(row) != {'source_path', 'record_id', 'source_record_sha256', 'task_group_id', 'reason'}:
            raise ValueError('Invalid language exclusion policy')
        key = row['source_path'], row['record_id']
        if key in policies or row['task_group_id'] not in held_out_groups:
            raise ValueError('Duplicate or stale language exclusion; review held-out scenario')
        policies[key] = row
    applied_exclusions = []
    for prefix, relative, use in SOURCES:
        path = ROOT / relative
        raw = path.read_bytes()
        rows = json.loads(raw.decode('utf-8'))
        if not isinstance(rows, list):
            raise ValueError('Language source must be a list of dialogues')
        seen = set()
        source_records.append({'path': relative, 'sha256': hashlib.sha256(raw).hexdigest(),
                               'use': use, 'count': len(rows)})
        for row in rows:
            expected = {'id', 'turns', 'split'} if prefix == 'budget' else {'id', 'turns'}
            if (not isinstance(row, dict) or set(row) != expected
                    or not isinstance(row['id'], str) or not row['id'] or row['id'] in seen
                    or not isinstance(row['turns'], list)
                    or (prefix == 'budget' and row['split'] not in ('design', 'probe'))):
                raise ValueError('Malformed or duplicate language seed record')
            seen.add(row['id'])
            exclusion = policies.get((relative, row['id']))
            if exclusion is not None:
                if digest(row) != exclusion['source_record_sha256']:
                    raise ValueError('Excluded source changed; semantic review must be repeated')
                applied_exclusions.append(exclusion)
                continue
            turns = tuple(Turn('user' if i % 2 == 0 else 'assistant', text)
                          for i, text in enumerate(row['turns']))
            full = codec.encode_dialogue(turns)
            prompt = codec.encode_prompt(turns[:-1])
            if any(s.kind == 'fallback' for s in full.spans):
                raise ValueError(f'Language seed {prefix}/{row["id"]} needs undeclared fallback')
            for token_id in full.ids:
                token = codec.tokens[token_id]
                if token.kind == 'word':
                    words[token.piece] += 1
            structured = [dict(role=t.role, text=t.text) for t in turns]
            key = canonical(structured[:-1])
            prompt_responses[key].add(turns[-1].text)
            if key in task_prompts:
                exact_task_overlaps.append({'language_id': f'{prefix}-{row["id"]}',
                                            'task_id': task_prompts[key]['id'],
                                            'task_split': task_prompts[key]['split']})
            records.append({
                'id': f'{prefix}-{row["id"]}', 'split': 'language-seed',
                'turns': structured, 'token_ids': full.ids, 'prompt_token_ids': prompt.ids,
                'input_sha256': full.input_sha256, 'manifest_sha256': codec.manifest_sha256,
                'provenance': {'path': relative, 'record_id': row['id'], 'use': use,
                               'original_audit_split': row.get('split')},
            })
    # An exact held-out prompt match is actionable leakage, not just an audit statistic.
    if any(o['task_split'] in ('development', 'test') for o in exact_task_overlaps):
        raise ValueError('Language seed duplicates a held-out task prompt')
    if len(applied_exclusions) != len(policies):
        raise ValueError('Language exclusion references a missing source record')
    report = {
        'status': 'language-exposure-seed; no automatic training mixture',
        'cases': len(records), 'utterances': sum(len(r['turns']) for r in records),
        'source_records': source_records, 'distinct_words': len(words),
        'word_occurrences': dict(sorted(words.items())),
        'unseen_manifest_words': sorted(set(codec.words) - set(words)),
        'words_seen_once': sorted(w for w, count in words.items() if count == 1),
        'complete_tokens': [len(r['token_ids']) for r in records],
        'prompts_with_multiple_answers': sum(len(v) > 1 for v in prompt_responses.values()),
        'exact_task_prompt_overlaps': exact_task_overlaps,
        'semantic_exclusions': applied_exclusions,
        'semantic_overlap_review': 'one confirmed full-scenario overlap removed; exhaustive semantic isolation not proven',
    }
    return records, report
