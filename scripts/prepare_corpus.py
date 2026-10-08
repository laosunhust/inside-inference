"""Build auditable tokenizer/dataset artifacts; never starts training."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import platform
import subprocess

from observable_gpt.corpus import (DIALOGUES, RECIPE, audit_cases, audit_dialogues,
                                   build_cases, canonical, load_recipe, shortcut_baselines)
from observable_gpt.tokenizer import CODEC_VERSION, MANIFEST, Tokenizer, Turn
from observable_gpt.language_data import prepare_language_seed, SOURCES as LANGUAGE_SOURCES


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'out/experiments/tokenizer-dataset'


def sha_bytes(content):
    return hashlib.sha256(content).hexdigest()


def source_identity():
    files = [MANIFEST, RECIPE, DIALOGUES, ROOT / 'data/corpus/contrast-pairs.json',
             ROOT / 'observable_gpt/__init__.py',
             ROOT / 'observable_gpt/tokenizer.py', ROOT / 'observable_gpt/corpus.py',
             ROOT / 'scripts/prepare_corpus.py', ROOT / 'observable_gpt/language_data.py',
             ROOT / 'data/corpus/probes-v2.json', ROOT / 'data/tokenizer/revision-v2.json',
             ROOT / 'data/tokenizer/history/v1.json', ROOT / 'data/corpus/language-exclusions.json']
    files.extend(ROOT / relative for _, relative, _ in LANGUAGE_SOURCES)
    return {
        'git_revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'git_dirty': bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True)),
        'files_sha256': {str(p.relative_to(ROOT)): sha_bytes(p.read_bytes()) for p in files},
        'python': platform.python_version(), 'codec': CODEC_VERSION,
        'model_checkpoint': None,
    }


def length_summary(values):
    ordered = sorted(values)
    return {'min': ordered[0], 'max': ordered[-1], 'total': sum(ordered),
            'median': (ordered[(len(ordered) - 1) // 2] + ordered[len(ordered) // 2]) / 2}


def prepare(output=OUTPUT):
    codec, recipe = Tokenizer(), load_recipe()
    cases = build_cases(recipe)
    stats = audit_cases(cases, codec, recipe)
    probes = audit_dialogues(codec)
    original_probes = audit_dialogues(Tokenizer(ROOT / 'data/tokenizer/history/v1.json'))
    followup_probes = audit_dialogues(codec, ROOT / 'data/corpus/probes-v2.json')
    language_records, language_report = prepare_language_seed(codec, cases)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    identities = {}
    for split in ('train', 'development', 'test'):
        rows = []
        for case in cases:
            if case['split'] != split:
                continue
            turns = tuple(Turn(**t) for t in case['turns'])
            full = codec.encode_dialogue(turns)
            prompt = codec.encode_prompt(turns[:-1])
            rows.append(dict(case, token_ids=full.ids, prompt_token_ids=prompt.ids,
                             input_sha256=full.input_sha256,
                             manifest_sha256=full.manifest_sha256))
        data = ''.join(canonical(row) + '\n' for row in rows).encode('utf-8')
        filename = f'{split}.jsonl'
        (output / filename).write_bytes(data)
        identities[filename] = sha_bytes(data)
    language_bytes = ''.join(canonical(row) + '\n' for row in language_records).encode('utf-8')
    (output / 'language-seed.jsonl').write_bytes(language_bytes)
    identities['language-seed.jsonl'] = sha_bytes(language_bytes)
    language_report['complete_tokens'] = length_summary(language_report['complete_tokens'])
    summary = {}
    for split, values in stats.items():
        counts = values['word_occurrences']
        summary[split] = {
            **{k: v for k, v in values.items() if k not in ('complete_tokens', 'prompt_tokens', 'word_occurrences')},
            'complete_tokens': length_summary(values['complete_tokens']),
            'prompt_tokens': length_summary(values['prompt_tokens']),
            'distinct_words': len(counts),
            'unseen_manifest_words': sorted(set(codec.words) - set(counts)),
        }
    majority_labels = {}
    for family, counts in stats['train']['answers'].items():
        majority_labels[family] = min(counts, key=lambda word: (-counts[word], word))
    tests = [c for c in cases if c['split'] == 'test']
    baseline_correct = sum(c['answer'] == majority_labels[c['family']] for c in tests)
    report = {
        'status': 'untrained-tokenizer-and-corpus-checkpoint', 'sources': source_identity(),
        'manifest_sha256': codec.manifest_sha256, 'recipe': recipe, 'dataset_sha256': identities,
        'splits': summary,
        'probes': {
            'source': 'agent-authored; used to revise v1 to v2; current result is in-sample fit',
            'used_for_training': False,
            'dialogues': len(probes), 'direct_dialogues': sum(not p['fallback'] for p in probes),
            'utterances': sum(p['utterances'] for p in probes),
            'direct_utterances': sum(p['direct_utterances'] for p in probes),
            'missing_words': dict(sorted(Counter(f['text'] for p in probes for f in p['fallback']).items())),
            'details': probes,
            'historical_v1_direct_dialogues': sum(not p['fallback'] for p in original_probes),
            'historical_v1_missing_words': sorted({f['text'] for p in original_probes for f in p['fallback']}),
        },
        'followup_probes': {
            'source': 'agent-authored after v2; familiar recombinations plus deliberate topic extensions; not independent sampling',
            'used_for_training': False, 'details': followup_probes,
            'dialogues': len(followup_probes),
            'direct_dialogues': sum(not p['fallback'] for p in followup_probes),
            'missing_words': sorted({f['text'] for p in followup_probes for f in p['fallback']}),
        },
        'language_seed': language_report,
        'context_blind_majority': {'labels_from_training': majority_labels,
                                   'test_correct': baseline_correct, 'test_total': len(tests)},
        'position_shortcuts': shortcut_baselines(cases, recipe),
        'not_evaluated': ['learned_behavior', 'shuffled_context_model_baseline', 'model_arithmetic',
                          'closed_lexicon_generation', 'real_system_transfer'],
    }
    (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # Only selected full traces: preserve exact evidence without duplicating every case's trace.
    examples = {}
    for text in ['cat', 'Cat', 'café', '你好', 'cat  dog', '<USER>cat', 'a' * 64]:
        examples[text] = codec.encode(text).to_dict()
    examples['first_test_dialogue'] = codec.encode_dialogue(
        Turn(**t) for t in tests[0]['turns']).to_dict()
    (output / 'traces.json').write_text(json.dumps(examples, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report


def main():
    report = prepare()
    print(f'Wrote tokenizer/dataset checkpoint to {OUTPUT.relative_to(ROOT)}/')
    print('Cases: ' + ', '.join(f'{k}={v["cases"]}' for k, v in report['splits'].items()))
    probes = report['probes']
    print(f'Coverage probes: {probes["direct_dialogues"]}/{probes["dialogues"]} dialogues without fallback')
    print('This is an in-sample vocabulary repair; v1 failures are retained in report.json.')
    followup = report['followup_probes']
    print(f'Follow-up probes: {followup["direct_dialogues"]}/{followup["dialogues"]}; missing: ' + ', '.join(followup['missing_words']))
    print(f'Separate language seed: {report["language_seed"]["cases"]} cases; {report["language_seed"]["distinct_words"]} lexical entries observed')
    print('No training performed. Corpus limits remain explicit in report.json.')


if __name__ == '__main__':
    main()
