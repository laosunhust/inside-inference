"""Prefix rendering must not change the generated token stream or strict codec."""
import unittest
from inside_inference.tokenizer import Tokenizer, TokenizerError


class StreamingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.codec = Tokenizer()

    def test_pending_byte_and_unicode_prefixes_are_not_errors(self):
        for text in ['T', 'é', '🙂']:
            ids = list(self.codec.encode(text).ids)
            for length in range(1, len(ids)):
                with self.subTest(text=text, length=length):
                    decoded, note = self.codec.decode_prefix(ids[:length], final=False)
                    self.assertEqual(decoded, '')
                    self.assertIsNone(note)
                    with self.assertRaises(TokenizerError): self.codec.decode(ids[:length])
            self.assertEqual(self.codec.decode_prefix(ids, final=False), (text, None))
            self.assertEqual(self.codec.decode_prefix(ids, final=True), (text, None))

    def test_terminal_incomplete_and_malformed_streams_remain_visible(self):
        t = self.codec
        prefix = list(t.encode('cat ').ids)
        byte = t.token_id('byte', 'BYTE')
        h = t.token_id('hex', '4')
        word = t.words['cat']
        for suffix in [[byte], [byte, h], list(t.encode('é').ids)[:3]]:
            self.assertEqual(t.decode_prefix(prefix+suffix, final=False), ('cat ', None))
            text, note = t.decode_prefix(prefix+suffix, final=True)
            self.assertEqual(text, 'cat ')
            self.assertTrue(note)
        for suffix in [[byte, word], [byte, h, word], [h], [2], [byte, 23, 23]]:
            for final in [False, True]:
                text, note = t.decode_prefix(prefix+suffix, final=final)
                self.assertEqual(text, 'cat ')
                self.assertTrue(note)
        for invalid in [[True], [384], [-1]]:
            with self.assertRaises(TokenizerError): t.decode_prefix(invalid, final=False)

