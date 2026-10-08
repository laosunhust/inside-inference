from collections import Counter, defaultdict
import copy
import json
from pathlib import Path
import re
import tempfile
import unittest

from inside_inference.corpus import (FAMILIES, answer_from_events, audit_cases, audit_dialogues,
                                   build_cases, canonical, digest, load_recipe, render, score_response,
                                   position_guess, shortcut_baselines)
from inside_inference.tokenizer import Tokenizer, Turn
from scripts.experiments.prepare_corpus import prepare


def answer_from_rendered_text(family, contexts, question):
    """Independent reference for the declared templates; never calls the event interpreter."""
    text = ' '.join(contexts)
    if family in ('location', 'correction'):
        subject = re.fullmatch(r'where is the (\w+)(?: now)?\?', question)[1]
        facts = re.findall(r'the (\w+) is (?:in|on) the (\w+)\.', text)
        return dict(facts)[subject]
    if family == 'ownership':
        subject = re.fullmatch(r'who has the (\w+)\?', question)[1]
        facts = re.findall(r'(\w+) has the (\w+)\.', text)
        return {obj: person for person, obj in facts}[subject]
    if family == 'negation':
        person = re.fullmatch(r'what does (\w+) want\?', question)[1]
        return dict(re.findall(r'(\w+) would like the (\w+)', text))[person]
    raise AssertionError(f'Unknown test family {family}')


class CorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recipe = load_recipe()
        cls.cases = build_cases(cls.recipe)
        cls.codec = Tokenizer()

    def test_determinism_and_balanced_held_out_cases(self):
        self.assertEqual(self.cases, build_cases(self.recipe))
        self.assertEqual(Counter(c['split'] for c in self.cases),
                         {'train': 400, 'development': 60, 'test': 100})
        test = [c for c in self.cases if c['split'] == 'test']
        self.assertEqual(Counter(c['family'] for c in test), dict.fromkeys(FAMILIES, 25))
        for family in FAMILIES:
            counts = Counter(c['answer'] for c in test if c['family'] == family)
            self.assertEqual(sorted(counts.values()), [5] * 5)
            variants = Counter(c['variant'] for c in test if c['family'] == family)
            self.assertEqual(sorted(variants.values()), [12, 13])
        # This is only an answer-frequency baseline, not a model evaluation.
        majority_correct = sum(max(Counter(c['answer'] for c in test if c['family'] == f).values())
                               for f in FAMILIES)
        self.assertEqual(majority_correct, 20)

    def test_group_split_and_prompt_disjointness(self):
        groups = defaultdict(set)
        prompts = set()
        for case in self.cases:
            groups[case['group_id']].add(case['split'])
            self.assertEqual(case['group_id'], digest(case['scenario']))
            prompt = canonical(case['turns'][:-1])
            self.assertNotIn(prompt, prompts)
            prompts.add(prompt)
        self.assertTrue(all(len(splits) == 1 for splits in groups.values()))
        # Deliberately change a split on a surface variant of a training group.
        bad = copy.deepcopy(self.cases)
        first = next(c for c in bad if c['split'] == 'train')
        first['split'] = 'test'
        with self.assertRaisesRegex(ValueError, 'crosses splits'):
            audit_cases(bad, self.codec, self.recipe)

    def test_actual_rendered_prompts_match_independent_answers(self):
        for case in self.cases:
            with self.subTest(case=case['id']):
                users = [t['text'] for t in case['turns'] if t['role'] == 'user']
                # In the correction variant, new facts and the query share the last turn.
                match = re.search(r'(where is the \w+(?: now)?\?|who has the \w+\?|what does \w+ want\?)$', users[-1])
                self.assertIsNotNone(match)
                question = match[0]
                contexts = users[:-1] + [users[-1][:match.start()]]
                reference = answer_from_rendered_text(case['family'], contexts, question)
                self.assertEqual(case['answer'], reference)
                self.assertEqual(case['turns'][-1]['text'], reference + '.')

    def test_framed_lengths_and_round_trips(self):
        report = audit_cases(self.cases, self.codec, self.recipe)
        for stats in report.values():
            self.assertEqual(stats['fallback_spans'], 0)
            self.assertEqual(stats['over_context_budget'], [])
        for case in self.cases:
            turns = tuple(Turn(**t) for t in case['turns'])
            full = self.codec.encode_dialogue(turns)
            prompt = self.codec.encode_prompt(turns[:-1])
            # Four content segments + BOS/EOS + eight role/turn-end tokens.
            expected = sum(len(self.codec.encode(t.text).ids) for t in turns) + 10
            self.assertEqual(len(full.ids), expected)
            self.assertEqual(full.ids[:len(prompt.ids)], prompt.ids)
            self.assertEqual(self.codec.decode_dialogue(full.ids), turns)

    def test_scoring_requires_a_single_declared_answer(self):
        case = next(c for c in self.cases if c['family'] == 'location')
        for form in case['acceptable_answers']:
            self.assertTrue(score_response(case, form))
            self.assertTrue(score_response(case, '\n' + form + '  '))
        for response in ['', 'i do not know.', case['answer'] + ' or something else.',
                         'not ' + case['answer'] + '.', case['answer'] + '. ' + case['answer'] + '.']:
            self.assertFalse(score_response(case, response))

    def test_simple_position_policies_do_not_solve_the_evaluation(self):
        case = {'family': 'negation', 'turns': [
            {'role': 'user', 'text': 'sam does not want the ball. sam would like the bear.'},
            {'role': 'assistant', 'text': 'ball.'},  # Must not read the answer field.
        ]}
        self.assertEqual(position_guess(case, self.recipe, 'first'), 'ball')
        self.assertEqual(position_guess(case, self.recipe, 'last'), 'bear')
        report = shortcut_baselines(self.cases, self.recipe)
        self.assertLessEqual(sum(v['test_correct'] for v in report.values()), 60)
        for values in report.values():
            self.assertLess(values['test_correct'], 20)

    def test_counterfactual_pairs_need_relationships_or_order(self):
        pairs = json.loads(Path('data/corpus/contrast-pairs.json').read_text())
        self.assertEqual({p['family'] for p in pairs}, set(FAMILIES))
        for pair in pairs:
            left, right = pair['cases']
            self.assertEqual(Counter(re.findall(r'\w+', left['context'])),
                             Counter(re.findall(r'\w+', right['context'])))
            self.assertEqual(left['question'], right['question'])
            self.assertNotEqual(left['answer'], right['answer'])
            for case in pair['cases']:
                expected = answer_from_rendered_text(pair['family'], [case['context']], case['question'])
                self.assertEqual(expected, case['answer'])
                for text in case.values():
                    self.assertFalse(any(s.kind == 'fallback' for s in self.codec.encode(text).spans))

    def test_events_reject_unknown_or_contradictory_input(self):
        with self.assertRaises(ValueError):
            answer_from_events([], {'kind': 'location', 'subject': 'ball'})
        with self.assertRaises(ValueError):
            answer_from_events([{'kind': 'preference', 'subject': 'sam', 'value': 'ball',
                                 'rejected': 'ball'}], {'kind': 'preference', 'subject': 'sam'})
        with self.assertRaises(ValueError):
            render(self.cases[0]['scenario'], 99, self.recipe)
        bad = copy.deepcopy(self.recipe)
        bad['groups_per_label']['test'] = 9999
        with self.assertRaises(ValueError):
            build_cases(bad)

    def test_probe_gaps_are_reported_and_not_silently_repaired(self):
        original = Tokenizer('data/tokenizer/history/v1.json')
        probes = audit_dialogues(original)
        self.assertEqual(len(probes), 24)
        missing = {f['text'] for p in probes for f in p['fallback']}
        self.assertEqual(missing, {'fill', 'fell', 'done', 'draw', 'out', 'coats', 'white', 'listen'})
        self.assertTrue(missing.isdisjoint(original.words))
        # Preserve the failure, then explicitly measure the fitted revision.
        self.assertFalse(any(p['fallback'] for p in audit_dialogues(self.codec)))
        followup = audit_dialogues(self.codec, 'data/corpus/probes-v2.json')
        self.assertEqual({f['text'] for p in followup for f in p['fallback']},
                         {'knee', 'lonely', 'heavy', 'wipe'})

    def test_audit_rejects_corrupted_ground_truth_and_identity(self):
        for field, value in [('answer', 'invented'), ('group_id', 'pretend'),
                             ('acceptable_answers', ['anything']), ('split', 'unknown')]:
            case = copy.deepcopy(self.cases[0])
            case[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                audit_cases([case], self.codec, self.recipe)
        case = copy.deepcopy(self.cases[0])
        case['turns'][0]['text'] = 'unrelated facts.'
        with self.assertRaises(ValueError):
            audit_cases([case], self.codec, self.recipe)

    def test_exported_splits_are_reproducible_and_match_codec(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            report = prepare(path)
            self.assertIsNone(report['sources']['model_checkpoint'])
            self.assertEqual(report['context_blind_majority']['test_correct'], 20)
            first = {p.name: p.read_bytes() for p in path.glob('*.jsonl')}
            repeated = prepare(path)
            self.assertEqual(report['dataset_sha256'], repeated['dataset_sha256'])
            self.assertEqual(first, {p.name: p.read_bytes() for p in path.glob('*.jsonl')})
            for name, data in first.items():
                for line in data.decode().splitlines():
                    row = json.loads(line)
                    turns = tuple(Turn(**t) for t in row['turns'])
                    self.assertEqual(self.codec.decode_dialogue(row['token_ids']), turns)
                    self.assertEqual(list(self.codec.encode_prompt(turns[:-1]).ids), row['prompt_token_ids'])
                    self.assertEqual(row['split'], name.removesuffix('.jsonl'))


if __name__ == '__main__':
    unittest.main()
