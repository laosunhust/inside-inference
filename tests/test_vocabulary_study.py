import unittest

from scripts.vocabulary_study import OVERHEAD, measure, sequence_length, spans


class VocabularyStudyTests(unittest.TestCase):
    def test_budget_and_fallback_arithmetic(self):
        self.assertEqual(OVERHEAD, 32)
        # hi = two bytes * three IDs; space and cat each cost one ID.
        self.assertEqual(sequence_length('hi cat!', {'cat'}), 9)
        self.assertEqual(sequence_length('hi cat!', {'hi', 'cat'}), 4)
        self.assertEqual(sequence_length('hi  cat', {'hi', 'cat'}), 4)

    def test_complete_dialogue_is_stricter_than_word_coverage(self):
        result = measure([{'id': 'a', 'turns': ['i see a cat.', 'i see a dog.']}], {'i', 'see', 'a', 'cat'})
        self.assertEqual(result['direct_word_coverage'], 0.875)
        self.assertEqual(result['complete_utterances'], 1)
        self.assertEqual(result['complete_dialogues'], 0)
        # Two utterances of 8 tokens plus 6 dialogue-control tokens.
        self.assertEqual(result['ideal_tokens'], 22)
        self.assertEqual(result['hex_fallback_tokens'], 30)

    def test_unsupported_input_is_not_silently_dropped(self):
        for text in ['Hi', 'café', 'hi\ncat', 'two 2']:
            with self.assertRaises(ValueError):
                spans(text)
