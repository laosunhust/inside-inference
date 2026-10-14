"""Byte-pair tokenizer for 4096-ID story models.

Port of pinned llama2.c run.c encode/decode (MIT; data/models/LICENSE-llama2c.txt):
UTF-8 codepoint lookup with byte fallback, then repeated merging of the adjacent
pair whose merged piece has the highest vocabulary score.
"""
import re
import struct

BOS, EOS, UNKNOWN = 1, 2, 0
BYTE_PIECE = re.compile(rb'<0x([0-9A-F]{2})>')


class BytePairTokenizer:
    def __init__(self, raw, vocabulary):
        (self.max_token_length,) = struct.unpack_from('<i', raw, 0)
        offset, self.pieces, self.scores = 4, [], []
        for _ in range(vocabulary):
            score, length = struct.unpack_from('<fi', raw, offset)
            offset += 8
            self.pieces.append(raw[offset:offset + length])
            self.scores.append(score)
            offset += length
        if offset != len(raw):
            raise ValueError('Tokenizer payload length differs from vocabulary')
        self.ids = {}
        for i, piece in enumerate(self.pieces):
            if piece in self.ids:
                raise ValueError('Duplicate tokenizer piece; lookup would be ambiguous')
            self.ids[piece] = i

    def encode(self, text):
        """BOS, dummy-prefix space, codepoints (or raw bytes + 3), then best-score merges."""
        data = text.encode('utf-8')
        tokens = [BOS]
        if data:
            tokens.append(self.ids[b' '])
        index = 0
        while index < len(data):
            # One codepoint: a lead byte plus at most three continuation bytes.
            end = index + 1
            while end < len(data) and data[end] & 0xC0 == 0x80 and end - index < 4:
                end += 1
            codepoint = data[index:end]
            if codepoint in self.ids:
                tokens.append(self.ids[codepoint])
            else:
                tokens.extend(byte + 3 for byte in codepoint)
            index = end
        while True:
            best = None
            for i in range(len(tokens) - 1):
                merged = self.ids.get(self.pieces[tokens[i]] + self.pieces[tokens[i + 1]])
                if merged is not None and (best is None or self.scores[merged] > self.scores[best[1]]):
                    best = (i, merged)
            if best is None:
                return tokens
            i, merged = best
            tokens[i:i + 2] = [merged]

    def piece_bytes(self, previous, token):
        """Bytes one token contributes after `previous`; BOS strips a leading space."""
        if token in (BOS, EOS):
            return b''
        if token == UNKNOWN:
            return ' ⁇ '.encode()
        piece = self.pieces[token]
        if previous == BOS and piece.startswith(b' '):
            piece = piece[1:]
        byte = BYTE_PIECE.fullmatch(piece)
        return bytes([int(byte.group(1), 16)]) if byte else piece

    def decode(self, ids, previous):
        return b''.join(self.piece_bytes(ids[i - 1] if i else previous, token) for i, token in enumerate(ids)).decode('utf-8', errors='replace')

    def piece(self, token):
        return self.pieces[token].decode('utf-8', errors='replace')


def normalize(text):
    """Request text as the pinned upstream tokenizer expects it."""
    if '\0' in text:
        raise ValueError('NUL input is not supported by the upstream tokenizer')
    return re.sub(' +', ' ', text).strip(' ').replace('▁', ' ')
