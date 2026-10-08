# Reversible lexical tokenizer

Status: first implementation checkpoint in progress. This document owns the codec
and framing contract, not model quality. The [purpose](../purpose/README.md) fixes
384 total IDs; [milestones](../purpose/milestones.md) own acceptance. The maintained
manifest at `data/tokenizer/vocabulary.json` owns the actual IDs and their roles.

## Question and validity boundary

What changes in a request's token sequence when a familiar word is replaced by
an unfamiliar word, case changes, or another script? The codec must preserve exact
UTF-8 bytes and expose its actual matching decisions and sequence expansion.
Token counts are exact for this codec, not estimates of production tokenizers.
Byte representability does not establish learned meaning. Hex fallback is an
intentional, expensive baseline, not a claim of efficient tokenization.

## Content encoding

No case folding, Unicode normalization, whitespace collapsing, implicit spaces,
or special-token string recognition occurs. Content encoding adds no framing.

1. A word unit is a maximal run of Unicode letters, marks, numbers, or connector
   punctuation (Unicode categories L*, M*, N*, Pc). ASCII or curly apostrophes
   join a unit only when between two word characters. This prevents matching `cat`
   inside `cats`, `caté`, `cat_2`, or `cat's`. Hyphens separate units explicitly.
2. Match the entire unit against an exact lexical entry. Manifest words are
   lowercase ASCII, with optional internal ASCII apostrophes. Every inflected
   form costs its own ID. Unknown units use byte fallback in their entirety.
3. A literal ASCII space or declared punctuation character has its own ID.
   Other non-word characters use byte fallback. Each fallback byte emits the
   BYTE marker followed by two hex IDs, most-significant nibble first.
4. Input must be a Python string encodable as strict UTF-8, or valid UTF-8 bytes
   through the explicit byte-input method. Invalid bytes and lone surrogates fail.

The manifest contains explicit protocol, space, punctuation, hexadecimal, and
lexical entries. No padding slots or unused dummy words are inserted to reach
384. PAD is a protocol symbol for a future batching consumer, not spoken text.

## Decoding and failures

Raw content decoding concatenates lexical/space/punctuation bytes and bytes from
complete BYTE/hex/hex triples, then validates UTF-8 strictly. Bare hex IDs,
incomplete triples, invalid IDs (including booleans), protocol symbols in content,
and invalid UTF-8 fail explicitly. It accepts valid noncanonical encodings, such
as spelling a known word through bytes; only `decode(encode(text)) == text` is
promised. Literal text resembling protocol labels cannot inject role tokens.

Context limits count the actual returned IDs, including framing when used.
Overflow reports the required and allowed sizes; nothing is silently truncated.
An absent limit means unbounded encoding, not an inferred model context size.

## Conversation framing

Roles are metadata, not parsed from text. Complete dialogues contain alternating
user/assistant turns, starting with user and ending with assistant:

`BOS (USER content TURN_END ASSISTANT content TURN_END)+ EOS`

An inference prompt ends with a user turn and opens the next assistant turn:

`BOS ... USER content TURN_END ASSISTANT`

No system/tool roles, padding inside a dialogue, or automatic history truncation
are supported. Empty turn content is representable. These rules deliberately
bound the first conversation instrument; arbitrary serving roles remain future
work. Raw decoding does not silently strip controls; framed decoding validates
the complete grammar and returns structured turns.

## Trace and identity

The encoding loop emits both IDs and observations of the same operation. Each
content span records half-open UTF-8 byte offsets, half-open token offsets, raw
bytes, emitted IDs, match kind, and fallback reason. Framing events are explicit
and separate from content spans; turn identity preserves local byte coordinates
and global token coordinates. No renderer reconstructs tokenization decisions.

The manifest identity is SHA-256 of its exact file bytes, not its filename. A
whitespace-only manifest edit changes that identity. Input bytes are separately
hashed. Exported traces also identify the codec version and Python Unicode table
version because word boundaries use Unicode categories. Run reports identify
code revision and dirty state; no checkpoint exists at this stage.
The successful encoding records the caller's context limit (or explicit absence
of a limit); overflow exceptions record required and allowed lengths.

## Output policy boundary

The codec encodes and decodes valid content streams; it does not constrain model
selection. Unmasked generation can concatenate word IDs or produce incomplete
byte triples and control IDs. Preserve those IDs. The generation inspector uses
explicit diagnostic markers for non-text IDs; it must not repair or filter the
sequence to make the strict codec accept it. See the
[baseline selection contract](naive-inference.md#implemented-interfaces).
