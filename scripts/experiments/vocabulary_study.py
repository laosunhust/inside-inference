"""Reproducible vocabulary-budget audit, not a tokenizer or language-quality test."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

from scripts import ROOT
FIXTURE = ROOT / 'data/tokenizer/studies/vocabulary-budget-dialogues.json'
# All symbols have distinct IDs. No punctuation/hex/control ID sharing assumed.
CONTROLS = ['BOS', 'EOS', 'PAD', 'USER', 'ASSISTANT', 'TURN_END', 'SP', 'BYTE']
HEX = list('0123456789ABCDEF')
PUNCTUATION = list(".,?!'-:;")
OVERHEAD = len(CONTROLS) + len(HEX) + len(PUNCTUATION)
BUDGETS = (100, 150, 256, 384, 512)
SPAN = re.compile(r"[a-z]+(?:'[a-z]+)?| +|[.,?!'\-:;]")
WORD = re.compile(r"[a-z]+(?:'[a-z]+)?\Z")


def spans(text):
    result = SPAN.findall(text)
    if ''.join(result) != text:
        raise ValueError('Audit supports lowercase ASCII words, spaces and declared punctuation only')
    return result


def words(text):
    return [s for s in spans(text) if WORD.fullmatch(s)]


def sequence_length(text, vocabulary):
    # One token per known word, punctuation mark or space character.
    # Each byte of an unknown whole word costs BYTE + two hex digits.
    return sum((1 if s in vocabulary else 3 * len(s.encode('utf-8')))
               if WORD.fullmatch(s) else len(s) for s in spans(text))


def measure(dialogues, vocabulary):
    utterances = [t for d in dialogues for t in d['turns']]
    counts = Counter(w for t in utterances for w in words(t))
    complete = lambda d: all(w in vocabulary for t in d['turns'] for w in words(t))
    # Dialogue framing: BOS, EOS and one role + TURN_END per utterance.
    ideal = sum(sequence_length(t, set(counts)) for t in utterances) + sum(2 + 2*len(d['turns']) for d in dialogues)
    actual = sum(sequence_length(t, vocabulary) for t in utterances) + sum(2 + 2*len(d['turns']) for d in dialogues)
    return dict(word_occurrences=sum(counts.values()), word_types=len(counts),
                direct_word_coverage=round(sum(n for w,n in counts.items() if w in vocabulary)/sum(counts.values()), 4),
                complete_utterances=sum(all(w in vocabulary for w in words(t)) for t in utterances), utterances=len(utterances),
                complete_dialogues=sum(complete(d) for d in dialogues), dialogues=len(dialogues),
                ideal_tokens=ideal, hex_fallback_tokens=actual, length_multiplier=round(actual/ideal, 3),
                missing_words=sorted(set(counts)-vocabulary),
                complete_dialogue_ids=[d['id'] for d in dialogues if complete(d)])


def report():
    raw = FIXTURE.read_bytes()
    dialogues = json.loads(raw)
    counts = Counter(w for d in dialogues for t in d['turns'] for w in words(t))
    rows = []
    for selection in ('all-dialogues', 'design-only'):
        fit = dialogues if selection == 'all-dialogues' else [d for d in dialogues if d['split']=='design']
        frequency = Counter(w for d in fit for t in d['turns'] for w in words(t))
        ranking = sorted(frequency, key=lambda w: (-frequency[w], w))
        for budget in BUDGETS:
            vocabulary = set(ranking[:budget-OVERHEAD])
            rows.append(dict(selection=selection, total_budget=budget, lexical_slots=budget-OVERHEAD,
                             used_lexical_slots=len(vocabulary), vocabulary=sorted(vocabulary),
                             all=measure(dialogues, vocabulary),
                             probe=measure([d for d in dialogues if d['split']=='probe'], vocabulary)))
    return dict(fixture_sha256=hashlib.sha256(raw).hexdigest(), seed=None,
                selection_rule='descending observed word frequency; alphabetical tie break',
                normalization='none; fixture is authored in lowercase ASCII',
                controls=CONTROLS, hex_symbols=HEX, punctuation=PUNCTUATION, overhead=OVERHEAD,
                word_types=len(counts), exact_fixture_budget=len(counts)+OVERHEAD,
                rows=rows)


if __name__ == '__main__':
    print(json.dumps(report(), indent=2))
