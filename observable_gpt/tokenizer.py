"""Exact lexical/UTF-8 codec; trace observations are emitted by the encoding loop."""

from dataclasses import asdict, dataclass, replace
import hashlib
import json
from pathlib import Path
import re
from types import MappingProxyType
import unicodedata


MANIFEST = Path(__file__).resolve().parents[1] / 'data/tokenizer/vocabulary.json'
CODEC_VERSION = 'lexical-utf8-hex-v1'
CONTROLS = ('BOS', 'EOS', 'PAD', 'USER', 'ASSISTANT', 'TURN_END')
PUNCTUATION = ".,?!'-:;"


class TokenizerError(ValueError):
    """An invalid manifest, text, token stream, framing, or configuration."""


class ContextOverflow(TokenizerError):
    def __init__(self, required, limit):
        self.required = required
        self.limit = limit
        super().__init__(f'Encoding requires {required} tokens; context limit is {limit}')


@dataclass(frozen=True)
class Token:
    id: int
    kind: str
    piece: str
    group: str


@dataclass(frozen=True)
class Span:
    kind: str
    reason: str
    byte_start: int | None
    byte_end: int | None
    token_start: int
    token_end: int
    raw_bytes: tuple[int, ...]
    ids: tuple[int, ...]
    turn: int | None = None


@dataclass(frozen=True)
class Encoding:
    ids: tuple[int, ...]
    spans: tuple[Span, ...]
    input_sha256: str
    input_kind: str
    manifest_sha256: str
    context_limit: int | None = None
    codec_version: str = CODEC_VERSION
    unicode_version: str = unicodedata.unidata_version

    def to_dict(self):
        return asdict(self)


@dataclass(frozen=True)
class Turn:
    role: str
    text: str


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _manifest_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise TokenizerError(f'Duplicate manifest field: {key}')
        result[key] = value
    return result


def _word_char(char):
    category = unicodedata.category(char)
    return category[0] in 'LMN' or category == 'Pc'


def _check_limit(limit, length):
    if limit is not None:
        if type(limit) is not int or limit < 0:
            raise TokenizerError('context_limit must be a nonnegative integer or None')
        if length > limit:
            raise ContextOverflow(length, limit)


class Tokenizer:
    def __init__(self, manifest_path=MANIFEST):
        raw = Path(manifest_path).read_bytes()
        try:
            document = json.loads(raw.decode('utf-8'), object_pairs_hook=_manifest_object)
        except (json.JSONDecodeError, UnicodeError) as exc:
            raise TokenizerError('Manifest is not valid UTF-8 JSON') from exc
        if (not isinstance(document, dict)
                or set(document) != {'format_version', 'name', 'tokens'}
                or type(document['format_version']) is not int
                or document['format_version'] != 1
                or not isinstance(document['name'], str) or not document['name']):
            raise TokenizerError('Unsupported manifest header')
        rows = document['tokens']
        if not isinstance(rows, list) or len(rows) != 384:
            raise TokenizerError('Manifest must contain exactly 384 tokens')
        tokens = []
        for index, row in enumerate(rows):
            if (not isinstance(row, dict) or set(row) != {'id', 'kind', 'piece', 'group'}
                    or type(row['id']) is not int or row['id'] != index
                    or any(not isinstance(row[key], str) or not row[key]
                           for key in ('kind', 'piece', 'group'))):
                raise TokenizerError(f'Invalid manifest entry at index {index}')
            tokens.append(Token(**row))
        pairs = [(t.kind, t.piece) for t in tokens]
        if len(set(pairs)) != 384:
            raise TokenizerError('Duplicate token kind/piece')
        required = {
            'control': set(CONTROLS), 'space': {' '}, 'byte': {'BYTE'},
            'hex': set('0123456789ABCDEF'), 'punctuation': set(PUNCTUATION),
        }
        if set(t.kind for t in tokens) != set(required) | {'word'}:
            raise TokenizerError('Unknown or missing token kind')
        for kind, pieces in required.items():
            if {t.piece for t in tokens if t.kind == kind} != pieces:
                raise TokenizerError(f'Invalid {kind} inventory')
        words = [t for t in tokens if t.kind == 'word']
        if len(words) != 352 or any(not re.fullmatch("[a-z]+(?:'[a-z]+)*", t.piece)
                                    for t in words):
            raise TokenizerError('Expected 352 distinct lowercase lexical entries')
        self.tokens = tuple(tokens)
        self.name = document['name']
        self.manifest_sha256 = _sha(raw)
        self._lookup = MappingProxyType({(t.kind, t.piece): t.id for t in tokens})
        self.words = MappingProxyType({t.piece: t.id for t in words})

    def token_id(self, kind, piece):
        try:
            return self._lookup[kind, piece]
        except KeyError as exc:
            raise TokenizerError(f'Unknown token: {kind}/{piece!r}') from exc

    def _validate_ids(self, ids):
        ids = tuple(ids)
        if any(type(i) is not int or not 0 <= i < len(self.tokens) for i in ids):
            raise TokenizerError('Token IDs must be integers in [0, 384)')
        return ids

    def encode(self, text, *, context_limit=None):
        if not isinstance(text, str):
            raise TypeError('encode requires str; use encode_utf8 for bytes')
        try:
            source = text.encode('utf-8', errors='strict')
        except UnicodeError as exc:
            raise TokenizerError('Input contains a lone surrogate; not valid UTF-8') from exc
        ids, observations = [], []
        index, byte_offset = 0, 0
        while index < len(text):
            end = index + 1
            word = _word_char(text[index])
            if word:
                while end < len(text):
                    if _word_char(text[end]):
                        end += 1
                    elif (text[end] in "'’" and end + 1 < len(text)
                          and _word_char(text[end - 1]) and _word_char(text[end + 1])):
                        end += 2
                    else:
                        break
            piece = text[index:end]
            raw_bytes = piece.encode('utf-8')
            if word and piece in self.words:
                kind, reason = 'word', 'exact-lexical-match'
                emitted = (self.words[piece],)
            elif piece == ' ':
                kind, reason = 'space', 'explicit-ascii-space'
                emitted = (self.token_id('space', piece),)
            elif piece in PUNCTUATION and len(piece) == 1:
                kind, reason = 'punctuation', 'exact-punctuation-match'
                emitted = (self.token_id('punctuation', piece),)
            else:
                kind = 'fallback'
                reason = 'unknown-word-unit' if word else 'unlisted-character'
                emitted = tuple(i for byte in raw_bytes for i in (
                    self.token_id('byte', 'BYTE'),
                    self.token_id('hex', '0123456789ABCDEF'[byte >> 4]),
                    self.token_id('hex', '0123456789ABCDEF'[byte & 15]),
                ))
            start = len(ids)
            ids.extend(emitted)
            observations.append(Span(kind, reason, byte_offset, byte_offset + len(raw_bytes),
                                     start, len(ids), tuple(raw_bytes), emitted))
            byte_offset += len(raw_bytes)
            index = end
        _check_limit(context_limit, len(ids))
        return Encoding(tuple(ids), tuple(observations), _sha(source), 'text',
                        self.manifest_sha256, context_limit)

    def encode_utf8(self, source, *, context_limit=None):
        if not isinstance(source, bytes):
            raise TypeError('encode_utf8 requires bytes')
        try:
            text = source.decode('utf-8', errors='strict')
        except UnicodeError as exc:
            raise TokenizerError('Input bytes are not valid UTF-8') from exc
        return self.encode(text, context_limit=context_limit)

    def decode(self, ids):
        ids = self._validate_ids(ids)
        result = bytearray()
        position = 0
        while position < len(ids):
            token = self.tokens[ids[position]]
            if token.kind in ('word', 'space', 'punctuation'):
                result.extend(token.piece.encode('utf-8'))
                position += 1
            elif token.kind == 'byte':
                if position + 2 >= len(ids):
                    raise TokenizerError(f'Incomplete byte triple at token {position}')
                digits = [self.tokens[i] for i in ids[position + 1:position + 3]]
                if any(t.kind != 'hex' for t in digits):
                    raise TokenizerError(f'Expected two hex IDs at token {position}')
                result.append(int(''.join(t.piece for t in digits), 16))
                position += 3
            else:
                raise TokenizerError(f'Unexpected {token.kind} token at position {position}')
        try:
            return result.decode('utf-8', errors='strict')
        except UnicodeError as exc:
            raise TokenizerError('Decoded bytes are not valid UTF-8') from exc

    def _frame(self, turns, *, prompt, context_limit):
        turns = tuple(turns)
        expected_parity = 1 if prompt else 0
        if not turns or len(turns) % 2 != expected_parity:
            raise TokenizerError('Prompt must end in user; complete dialogue in assistant')
        for number, turn in enumerate(turns):
            expected = 'user' if number % 2 == 0 else 'assistant'
            if not isinstance(turn, Turn) or turn.role != expected:
                raise TokenizerError(f'Turn {number} must have role {expected}')
            if not isinstance(turn.text, str):
                raise TokenizerError(f'Turn {number} content must be text')
        ids, observations = [], []

        def control(piece, turn):
            emitted = (self.token_id('control', piece),)
            start = len(ids)
            ids.extend(emitted)
            observations.append(Span('control', piece, None, None, start, len(ids), (),
                                     emitted, turn))

        control('BOS', None)
        for number, turn in enumerate(turns):
            control(turn.role.upper(), number)
            encoded = self.encode(turn.text)
            offset = len(ids)
            ids.extend(encoded.ids)
            observations.extend(replace(s, token_start=s.token_start + offset,
                                        token_end=s.token_end + offset, turn=number)
                                for s in encoded.spans)
            control('TURN_END', number)
        control('ASSISTANT' if prompt else 'EOS', len(turns) if prompt else None)
        _check_limit(context_limit, len(ids))
        source = json.dumps([asdict(t) for t in turns], ensure_ascii=False,
                            separators=(',', ':')).encode('utf-8')
        return Encoding(tuple(ids), tuple(observations), _sha(source),
                        'prompt' if prompt else 'dialogue', self.manifest_sha256, context_limit)

    def encode_dialogue(self, turns, *, context_limit=None):
        return self._frame(turns, prompt=False, context_limit=context_limit)

    def encode_prompt(self, turns, *, context_limit=None):
        return self._frame(turns, prompt=True, context_limit=context_limit)

    def decode_dialogue(self, ids):
        ids = self._validate_ids(ids)
        bos, eos, end = (self.token_id('control', p) for p in ('BOS', 'EOS', 'TURN_END'))
        if len(ids) < 2 or ids[0] != bos or ids[-1] != eos:
            raise TokenizerError('Complete dialogue must start with BOS and end with EOS')
        turns, position = [], 1
        while position < len(ids) - 1:
            role = 'user' if len(turns) % 2 == 0 else 'assistant'
            if ids[position] != self.token_id('control', role.upper()):
                raise TokenizerError(f'Expected {role} role at token {position}')
            position += 1
            content_start = position
            while position < len(ids) - 1 and ids[position] != end:
                position += 1
            if position == len(ids) - 1:
                raise TokenizerError('Missing TURN_END')
            turns.append(Turn(role, self.decode(ids[content_start:position])))
            position += 1
        if not turns or len(turns) % 2:
            raise TokenizerError('Complete dialogue must contain user/assistant pairs')
        return tuple(turns)
