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

class GenerationDecodingTests(unittest.TestCase):
    def test_all_terminal_reasons_finalize_the_decoder_without_repair(self):
        import json
        from types import SimpleNamespace
        from unittest.mock import patch
        from inside_inference.runtimes import inspectable
        codec = Tokenizer()
        byte = codec.token_id('byte', 'BYTE')
        def run(selected, output, budget=32, context=64):
            logits = [0.] * 384
            logits[selected] = 1.
            model = SimpleNamespace(config=SimpleNamespace(context=context),
                forward=lambda *args, **kwargs: {'logits': [logits], 'nodes': []})
            descriptor = {'id': 'fixture', 'weights': {'sha256': '0'*64},
                'tokenizer': {'sha256': codec.manifest_sha256}, 'stop_ids': [1]}
            request = {'experiment': {'model_id': 'fixture'}, 'prefix_ids': [0],
                'output_ids': output, 'generation': {'max_new_tokens': budget}}
            with patch.multiple(inspectable, _model=model, _tokenizer=codec, _descriptor=descriptor):
                return json.loads(inspectable.execute_tiny('generateToken', json.dumps(request)))
        pending = run(byte, [])
        self.assertIsNone(pending['decoding_note'])
        self.assertEqual(pending['output_ids'], [byte])
        for result, reason in [(run(byte, [], budget=1), 'output_budget'),
                               (run(byte, [], context=1), 'context_capacity'),
                               (run(1, [byte]), 'end_token')]:
            self.assertEqual(result['stop_reason'], reason)
            self.assertIn('Incomplete byte triple', result['decoding_note'])
        high = codec.token_id('hex', '4')
        low = codec.token_id('hex', '1')
        complete = run(low, [byte, high])
        self.assertEqual(complete['output_ids'], [byte, high, low])
        self.assertEqual(complete['text'], 'A')
        self.assertIsNone(complete['decoding_note'])
