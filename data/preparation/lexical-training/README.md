# Intact-sentence filtering experiment

Filtering reduced fallback output in this small sample, but did not make the 8K
model a reliable language model. After owner review, the covered checkpoint was promoted to the website’s 8K
slot. The unfiltered arm remains experimental; the 4M default is unchanged.

The existing story corpus uses **77.9% byte/hex token positions**, excluding
framing. This is a token-position share, not a fraction of words. All 32,795
training sentence spans require fallback in their original case. Lowercasing
leaves 1,090 covered spans (3.3%); excluding development overlap leaves 891
distinct training sentences. The filtered training stream has only 13,660 IDs,
versus 2,252,132 in the matched unfiltered arm.

Both arms use lowercased intact sentence spans, the same 384-ID tokenizer,
8,168-parameter architecture, seed 7, optimizer, and 4,000 updates. No words are
deleted, no token choices are masked, and foreign input remains encodable.
The sentence splitter is a punctuation heuristic, not a linguistic parser.
Selection uses each arm's development loss, not evaluation prompt performance.
The filtered checkpoint selected step 1,000; later development loss worsened.
The unfiltered checkpoint selected step 3,600. Losses across these different
corpora are not quality comparisons. Total experiment time was 554 seconds.

| Fixed prompt group | Unfiltered sentences | Covered sentences |
|---|---:|---:|
| Familiar prompts with terminal decoding diagnostics | 9/10 | 0/10 |
| Familiar prompts with nonempty visible continuation | 9/10 | 9/10 |
| Unfamiliar prompts with terminal decoding diagnostics | 5/6 | 0/6 |
| Unfamiliar prompts with nonempty visible continuation | 4/6 | 5/6 |
| BYTE selections across all prompts | 280 | 0 |

**Diagnostic distinction:** all nine familiar baseline diagnostics are unfinished
byte triples at the 64-token allowance. Four unfamiliar diagnostics are also
unfinished triples; one is an unexpected standalone hex token. These counts do
not mean nine familiar continuations broke the byte grammar mid-generation.
The `malformed` field in result.json counts any terminal decoding diagnostic.

Examples from the covered checkpoint:

- `the cat was` → ` happy.`
- `ben went to the` → ` park.`
- `i want to play` → ` with the park.`
- `the dog had a` → repeated ` big`, followed by repeated spaces.
- `你好` → ` happy and sorry.`; this does not establish understanding Chinese.

The complete default sentence `a little cat had a red ball.` immediately selects
EOS in both arms. Sentence-framed training teaches termination after complete
sentences; cleaner encoding does not make this a good default story demo.
All continuations and token IDs, including empty and repetitive failures, remain
in [all.json](all.json) and [covered.json](covered.json).

This passes the predeclared narrow signal gate, not a model-quality gate. One seed
and 16 prompts cannot establish reliability. Filtering also changes diversity and
repeated exposure; the tiny filtered corpus visibly overfits. No fallback targets
does not mathematically prevent fallback selections on other inputs.

[Admission](admission.json) freezes prompts, configuration, source and corpus
identities. [Results](result.json) summarize the runs. Exported logits agree with
the scalar engine to a maximum absolute error of 1.25e-14. The 31 preparation tests
passed, including sentence preservation and foreign-text round trips.
[Makefile](../../../Makefile)'s `_lexical-study` owns reproduction; use a fresh
evidence destination for another experiment rather than overwrite these results.
