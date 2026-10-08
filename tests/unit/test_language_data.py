from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

from inside_inference.corpus import build_cases, load_recipe
from inside_inference.language_data import prepare_language_seed
from inside_inference.tokenizer import Tokenizer


class LanguageDataTests(unittest.TestCase):
    def test_seed_coverage_is_exposure_not_evaluation(self):
        codec = Tokenizer()
        cases = build_cases(load_recipe())
        records, report = prepare_language_seed(codec, cases)
        self.assertEqual(len(records), 101)
        self.assertEqual(report['distinct_words'], 352)
        self.assertEqual(report['unseen_manifest_words'], [])
        self.assertEqual(report['exact_task_prompt_overlaps'], [])
        self.assertEqual({r['split'] for r in records}, {'language-seed'})
        # Historical research partitions are retained as provenance, not passed off as model holdouts.
        originals = [r for r in records if r['id'].startswith('budget-')]
        self.assertEqual(Counter(r['provenance']['original_audit_split'] for r in originals),
                         {'design': 35, 'probe': 12})
        self.assertEqual([r['record_id'] for r in report['semantic_exclusions']], ['memory-1'])
        self.assertNotIn('budget-memory-1', {r['id'] for r in records})
        self.assertTrue(report['words_seen_once'])
        independent_counts = Counter()
        for row in records:
            for t in codec.decode_dialogue(row['token_ids']):
                # Independently count known lexical strings in the decoded seed text.
                independent_counts.update(re.findall("[a-z]+(?:'[a-z]+)*", t.text))
        self.assertEqual(dict(independent_counts), report['word_occurrences'])

    def test_exact_held_out_prompt_overlap_fails(self):
        codec = Tokenizer()
        cases = build_cases(load_recipe())
        records, _ = prepare_language_seed(codec, cases)
        fake_test = {'id': 'overlap', 'split': 'test', 'turns': records[0]['turns'], 'group_id': 'fake'}
        with self.assertRaisesRegex(ValueError, 'held-out'):
            prepare_language_seed(codec, cases + [fake_test])

    def test_undeclared_fallback_in_language_seed_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'seed.json'
            source.write_text(json.dumps([{'id': 'bad', 'turns': ['unlistedword', 'yes.']}]))
            with patch('inside_inference.language_data.SOURCES', (('extension', str(source), 'test'),)):
                with self.assertRaisesRegex(ValueError, 'undeclared fallback'):
                    prepare_language_seed(Tokenizer(), build_cases(load_recipe()))

    def test_stale_semantic_exclusion_fails_instead_of_dropping_data(self):
        cases = build_cases(load_recipe())
        without_overlap = [c for c in cases if not c['group_id'].startswith('f881d944708e9607')]
        with self.assertRaisesRegex(ValueError, 'stale language exclusion'):
            prepare_language_seed(Tokenizer(), without_overlap)

    def test_manifest_revision_is_exact_and_reproducible(self):
        root = Path('data/tokenizer')
        old_bytes = (root / 'history/v1.json').read_bytes()
        new_bytes = (root / 'vocabulary.json').read_bytes()
        revision = json.loads((root / 'revision-v2.json').read_text())
        self.assertEqual(hashlib.sha256(old_bytes).hexdigest(), revision['previous_sha256'])
        self.assertEqual(hashlib.sha256(new_bytes).hexdigest(), revision['current_sha256'])
        old, new = json.loads(old_bytes)['tokens'], json.loads(new_bytes)['tokens']
        actual = [{'id': before['id'], 'before': before['piece'], 'after': after['piece']}
                  for before, after in zip(old, new) if before['piece'] != after['piece']]
        self.assertEqual(actual, revision['exchanges'])
        self.assertEqual(len(actual), 8)
        codec = Tokenizer()
        for exchange in actual:
            self.assertEqual(codec.encode(exchange['after']).ids, (exchange['id'],))
            old_word = codec.encode(exchange['before'])
            self.assertEqual(len(old_word.ids), 3 * len(exchange['before']))
            self.assertEqual(codec.decode(old_word.ids), exchange['before'])
        previous = Tokenizer(root / 'history/v1.json')
        self.assertEqual(previous.encode('cat').ids, codec.encode('cat').ids)
        self.assertNotEqual(previous.manifest_sha256, codec.manifest_sha256)


if __name__ == '__main__':
    unittest.main()
