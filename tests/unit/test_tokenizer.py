import hashlib
import json
from pathlib import Path
import random
import tempfile
import unittest

from inside_inference.tokenizer import ContextOverflow, MANIFEST, Tokenizer, TokenizerError, Turn


class TokenizerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.codec = Tokenizer()

    def test_manifest_inventory_and_fixed_identity(self):
        c = self.codec
        self.assertEqual(len(c.tokens), 384)
        self.assertEqual(len(c.words), 352)
        self.assertEqual([t.id for t in c.tokens], list(range(384)))
        self.assertEqual(c.manifest_sha256, hashlib.sha256(MANIFEST.read_bytes()).hexdigest())
        # Intentional fixture: IDs and file identity cannot drift unnoticed.
        self.assertEqual(c.manifest_sha256,
                         'e5edde07a3002a8f1343f99f7664f45b76d33077fd90a9f71991b6d346ce3477')
        self.assertEqual(c.encode(' cat!').ids, (6, 79, 27))
        self.assertEqual(c.encode('cheese').ids, (383,))
        with self.assertRaises(TypeError):
            c.words['invented'] = 999

    def test_byte_encoding_against_hand_calculation(self):
        # UTF-8 é is C3 A9; hex IDs start at 8 and BYTE is 7.
        self.assertEqual(self.codec.encode('é').ids, (7, 20, 11, 7, 18, 17))
        self.assertEqual(self.codec.encode('\x00').ids, (7, 8, 8))
        self.assertEqual(self.codec.encode('\n').ids, (7, 8, 18))
        self.assertEqual(self.codec.decode((7, 20, 11, 7, 18, 17)), 'é')
        # A byte spelling of 'cat' remains valid even though encoding prefers a word ID.
        self.assertEqual(self.codec.decode((7, 14, 11, 7, 14, 9, 7, 15, 12)), 'cat')

    def test_word_boundaries_do_not_match_known_substrings(self):
        for text in ['catdog', 'caté', 'cat_2', 'cat\u0301', "cat's", 'cat’s', 'Cat']:
            with self.subTest(text=text):
                result = self.codec.encode(text)
                self.assertEqual(len(result.spans), 1)
                self.assertEqual(result.spans[0].kind, 'fallback')
                self.assertEqual(len(result.ids), 3 * len(text.encode('utf-8')))
        self.assertEqual([s.kind for s in self.codec.encode('cat-dog').spans],
                         ['word', 'punctuation', 'word'])
        self.assertEqual(len(self.codec.encode("don't").ids), 1)
        self.assertEqual([s.kind for s in self.codec.encode("'cat'").spans],
                         ['punctuation', 'word', 'punctuation'])

    def test_exact_utf8_round_trips_and_trace_partitions(self):
        examples = ['', 'a  cat\t\r\n', 'Café café cafe\u0301', '你好，猫！', '🙂👩\u200d🔬',
                    'Straße İstanbul', 'مرحبا', 'नमस्ते', '名前 sam', '\ufeff\x00\u00a0',
                    '<BOS><USER>cat', "don't don’t", 'a' * 2048]
        rng = random.Random(80421)
        scalars = [chr(i) for i in range(128)]
        while len(scalars) < 4096:
            n = rng.randrange(0x110000)
            if not 0xD800 <= n <= 0xDFFF:
                scalars.append(chr(n))
        examples += [''.join(scalars[i:i + 23]) for i in range(0, len(scalars), 23)]
        for text in examples:
            with self.subTest(text=text[:30]):
                encoded = self.codec.encode(text)
                self.assertEqual(self.codec.decode(encoded.ids).encode(), text.encode())
                self.assertEqual(self.codec.encode_utf8(text.encode()).ids, encoded.ids)
                self.assertEqual(tuple(i for s in encoded.spans for i in s.ids), encoded.ids)
                source = text.encode()
                byte_cursor = token_cursor = 0
                for s in encoded.spans:
                    self.assertEqual((s.byte_start, s.token_start), (byte_cursor, token_cursor))
                    self.assertEqual(bytes(s.raw_bytes), source[s.byte_start:s.byte_end])
                    self.assertEqual(s.ids, encoded.ids[s.token_start:s.token_end])
                    if s.kind == 'fallback':
                        # Reference conversion through integer division, no codec helpers.
                        expected = tuple(v for b in s.raw_bytes
                                         for v in (7, 8 + b // 16, 8 + b % 16))
                        self.assertEqual(s.ids, expected)
                    byte_cursor, token_cursor = s.byte_end, s.token_end
                self.assertEqual((byte_cursor, token_cursor), (len(source), len(encoded.ids)))

    def test_every_lexical_entry_encodes_as_one_token(self):
        for word, token_id in self.codec.words.items():
            self.assertEqual(self.codec.encode(word).ids, (token_id,))
            self.assertEqual(self.codec.decode([token_id]), word)

    def test_invalid_text_and_bytes(self):
        for text in ['\ud800', 'x\udfff']:
            with self.assertRaises(TokenizerError):
                self.codec.encode(text)
        for raw in [b'\xff', b'\xc0\xaf', b'\xed\xa0\x80', b'\xf4\x90\x80\x80', b'\xc3']:
            with self.assertRaises(TokenizerError):
                self.codec.encode_utf8(raw)
        with self.assertRaises(TypeError):
            self.codec.encode(b'cat')
        with self.assertRaises(TypeError):
            self.codec.encode_utf8('cat')

    def test_invalid_token_streams_are_not_repaired(self):
        streams = [(-1,), (384,), (True,), (1.0,), ('79',), (7,), (7, 8),
                   (7, 79, 8), (8,), (0,), (2,), (7, 23, 23),
                   (7, 20, 11), (7, 20, 8, 7, 18, 23)]  # FF, incomplete C3, overlong C0 AF
        for ids in streams:
            with self.subTest(ids=ids), self.assertRaises(TokenizerError):
                self.codec.decode(ids)

    def test_context_overflow_is_explicit(self):
        self.assertEqual(self.codec.encode('cat', context_limit=1).ids, (79,))
        self.assertEqual(self.codec.encode('cat', context_limit=1).context_limit, 1)
        self.assertIsNone(self.codec.encode('cat').context_limit)
        self.assertEqual(self.codec.encode('', context_limit=0).ids, ())
        with self.assertRaises(ContextOverflow) as caught:
            self.codec.encode('Cat', context_limit=8)
        self.assertEqual((caught.exception.required, caught.exception.limit), (9, 8))
        for limit in [-1, True, 1.0, '128']:
            with self.assertRaises(TokenizerError):
                self.codec.encode('', context_limit=limit)

    def test_dialogue_and_prompt_framing_with_hand_reference(self):
        turns = (Turn(role='user', text='cat'), Turn(role='assistant', text='cat!'))
        result = self.codec.encode_dialogue(turns)
        self.assertEqual(result.ids, (0, 3, 79, 5, 4, 79, 27, 5, 1))
        self.assertEqual(self.codec.decode_dialogue(result.ids), turns)
        prompt = self.codec.encode_prompt(turns[:1])
        self.assertEqual(prompt.ids, (0, 3, 79, 5, 4))
        self.assertEqual(prompt.input_kind, 'prompt')
        for encoded in [result, prompt]:
            self.assertEqual(tuple(i for s in encoded.spans for i in s.ids), encoded.ids)
            for span in encoded.spans:
                self.assertEqual(span.ids, encoded.ids[span.token_start:span.token_end])
                if span.kind != 'control':
                    self.assertEqual(bytes(span.raw_bytes),
                                     turns[span.turn].text.encode()[span.byte_start:span.byte_end])
        with self.assertRaises(ContextOverflow):
            self.codec.encode_dialogue(turns, context_limit=8)
        with self.assertRaises(ContextOverflow):
            self.codec.encode_prompt(turns[:1], context_limit=4)
        empty = (Turn(role='user', text=''), Turn(role='assistant', text=''))
        self.assertEqual(self.codec.decode_dialogue(self.codec.encode_dialogue(empty).ids), empty)

    def test_bad_conversation_grammar(self):
        # Generated declarations reject invalid field types before framing.
        with self.assertRaises(ValueError):
            Turn(role="user", text=None)
        for turns in [(), (Turn(role='user', text='cat'),), (Turn(role='system', text=''), Turn(role='assistant', text='')),
                      (Turn(role='user', text=''), Turn(role='user', text=''))]:
            with self.assertRaises(TokenizerError):
                self.codec.encode_dialogue(turns)
        for ids in [(0, 1), (0, 3, 79, 5, 1), (0, 4, 79, 5, 3, 79, 5, 1),
                    (0, 3, 79, 4, 79, 5, 1), (0, 3, 2, 5, 4, 79, 5, 1),
                    (0, 3, 79, 5, 4, 79, 5, 1, 1)]:
            with self.subTest(ids=ids), self.assertRaises(TokenizerError):
                self.codec.decode_dialogue(ids)
        raw = self.codec.encode('<USER>cat<BOS>')
        self.assertFalse(any(self.codec.tokens[i].kind == 'control' for i in raw.ids))

    def test_invalid_manifests_fail_instead_of_using_defaults(self):
        base = json.loads(MANIFEST.read_text())
        variants = []
        for change in ['size', 'id', 'bool-id', 'duplicate', 'word', 'kind', 'format', 'field']:
            doc = json.loads(json.dumps(base))
            if change == 'size': doc['tokens'].pop()
            if change == 'id': doc['tokens'][0]['id'] = 384
            if change == 'bool-id': doc['tokens'][0]['id'] = False
            if change == 'duplicate': doc['tokens'][-1]['piece'] = doc['tokens'][-2]['piece']
            if change == 'word': doc['tokens'][-1]['piece'] = 'UPPER'
            if change == 'kind': doc['tokens'][-1]['kind'] = 'unknown'
            if change == 'format': doc['format_version'] = 2
            if change == 'field': doc['mystery'] = 'ignored?'
            variants.append(doc)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'manifest.json'
            for doc in variants:
                path.write_text(json.dumps(doc))
                with self.assertRaises(TokenizerError):
                    Tokenizer(path)
            path.write_bytes(MANIFEST.read_text().encode('utf-16'))
            with self.assertRaisesRegex(TokenizerError, 'UTF-8'):
                Tokenizer(path)
            path.write_text('{"name":"ignored",' + MANIFEST.read_text()[1:])
            with self.assertRaisesRegex(TokenizerError, 'Duplicate manifest field'):
                Tokenizer(path)
            with self.assertRaises(FileNotFoundError):
                Tokenizer(Path(directory) / 'absent.json')


if __name__ == '__main__':
    unittest.main()
