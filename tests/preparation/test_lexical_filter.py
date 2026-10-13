import unittest
from inside_inference.tokenizer import Tokenizer
from scripts.experiments.story_models.lexical import sentences, covered


class SentenceFilterTests(unittest.TestCase):
    def test_keeps_intact_sentences_not_deleted_words(self):
        source = 'the cat had a ball. the giraffe had a ball! the dog was happy.'
        parts = sentences(source)
        self.assertTrue(all(part in source for part in parts))
        codec = Tokenizer()
        self.assertEqual([s for s in parts if covered(codec,s)],
                         ['the cat had a ball.', 'the dog was happy.'])

    def test_foreign_input_remains_encodable_and_fails_only_filter(self):
        codec = Tokenizer()
        for text in ['你好', 'Zorvik', 'un éléphant']:
            self.assertEqual(codec.decode(codec.encode(text).ids), text)
            self.assertFalse(covered(codec,text))
