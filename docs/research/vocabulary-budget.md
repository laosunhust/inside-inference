# Vocabulary budget: small research audit

Date: 2026-10-08. Status: recommendation, not a frozen tokenizer/model contract.

**Decision update:** the user has now frozen vocabulary size at 384 total IDs.
The [current purpose](../purpose/README.md#fixed-language-inspectable-computation)
owns that decision and the planned byte/hex fallback. Candidate recommendations
below preserve the reasoning before that decision; other model dimensions remain
experimental. This study does not establish trained-model quality.

**Recommendation: investigate 384 total IDs, retaining 256 and 512 as comparison
budgets. Do not freeze 100 or 150 based on inspectability alone.** The initial
100-ID commitment was premature. A bounded, simple-language world remains the
goal; a natural three-year-old's full language is not the target being validated.

## External evidence

The follow-up [small-vocabulary model search](small-vocabulary-models.md) finds
concrete 378-, 384-, and 512-entry examples, including Karpathy's `stories260K`.
Models in this range already exist; compare token units and architecture before
drawing conclusions about our proposed language world.

- Eldan and Li's [TinyStories paper, introduction and §2](https://arxiv.org/html/2305.07759v2)
  uses about 1,500 basic words as prompts for generating diverse stories. This is
  not a hard output lexicon. Its model setup retains 10,000 tokenizer entries.
  Simple child-directed content therefore does not imply a 100-token model.
  Its language-quality results do not establish sufficiency of our much smaller
  vocabulary, width, corpus, or training procedure.
- Binger et al., [How Toddlers Use Core and Fringe Vocabulary](https://www.achievebeyondusa.com/images/ABI/monthly_journal_club/April_How_Toddlers_Use_Core_Fringe_Vocabulary.pdf)
  (2024, DOI [10.1044/2024_AJSLP-23-00366](https://doi.org/10.1044/2024_AJSLP-23-00366))
  studies 112 transcripts from 56 children aged 30 months, comprising 10,188
  utterances. Lists of 250–332 core words covered entire utterances only slightly
  more than half the time. Combining core and topic-specific vocabulary supported
  richer utterances. This is evidence against equating frequent-word coverage
  with expressive completeness, not a tokenizer-size prescription. List membership,
  morphology conventions, sampled settings, and population limit transfer.
- [Project Core's own FAQ](https://project-core.com/frequently-asked-questions-faqs/)
  describes its 36-word vocabulary as a starting point toward more extensive,
  individualized systems, selected partly from a 596-word priority list. It is
  not evidence that 36 or 100 entries suffice for a standalone conversational LM.
- [ByT5](https://aclanthology.org/2022.tacl-1.17/) demonstrates byte-level modeling
  and studies its parameter, training, and inference tradeoffs. Our inference:
  arbitrary-input representability and efficient, understandable model sequences
  are separate objectives. Its measured performance is not a prediction for our
  proposed hex encoding.

## What exactly is being counted?

A word type, a lemma, and a token ID are different units. `eat`, `eats`, `ate`,
and `eating` cost four IDs in a whole-word vocabulary. Subword or suffix schemes
can share pieces, but change sequence lengths, boundaries, and the vocabulary
constraint. A small subword inventory can spell many words outside a closed
lexicon. Likewise, byte fallback can represent an unknown word without teaching
its meaning. Vocabulary size alone cannot enforce simple-language output.

For this audit, budget 32 distinct non-word IDs:

| Allocation | IDs | Proposed symbols |
| --- | ---: | --- |
| Framing, spacing, and fallback marker | 8 | BOS, EOS, PAD, USER, ASSISTANT, TURN_END, SP, BYTE |
| Hex digits | 16 | Separate symbols for 0–9 and A–F |
| Punctuation | 8 | Period, comma, question/exclamation marks, apostrophe, hyphen, colon, semicolon |
| Total | 32 | A candidate protocol, not a required minimum |

Some allocations could be reduced: packing does not always require PAD, framing
may combine markers, and a restricted text format needs fewer punctuation IDs.
The original archived plan used 30 nonlexical IDs plus 10 chunks, leaving 60
common-word slots. Neither allocation makes 100 IDs equivalent to 100 words.

With this candidate protocol, removing BYTE and all hex digits saves 17 IDs,
leaving 15 overhead IDs. That buys 17 extra whole words, not hundreds. Direct byte
fallback needs 256 byte values before additional framing; hex saves vocabulary
space by spending sequence positions. These are design alternatives, not supported
runtime modes yet.

Per-byte hex costs three IDs per byte: BYTE followed by two digits. An unfamiliar
ASCII `blanket` costs 21 IDs instead of one known-word ID. Spaces and framing add
more. This would consume most of the historical 32-position context by itself.
Byte runs or suffixes could improve it, but would be different tokenizers with
their own tests. Do not hide that change behind a fallback label.

## Local audit and reproducibility

Run `make vocabulary-study`. It writes the full vocabulary lists, counts, missing
words, successful dialogue IDs, and fixture hash to
`out/experiments/vocabulary-study/report.json`.

Maintained inputs: [dialogues.json](../../research/vocabulary/dialogues.json).
Implementation: [vocabulary_study.py](../../scripts/vocabulary_study.py).
These 48 dialogues were authored by the coding agent for this audit, before
counting their vocabulary. They are NOT sampled child transcripts, a training
corpus, or language-model outputs. They contain 96 utterances, 689 word occurrences,
and 259 distinct written words over 12 topics/functions. Case is deliberately
lowercase; contractions and names are underrepresented. Both speakers count.

The script preserves every character in its declared ASCII fixture format and
rejects unsupported input; it is a counting instrument, not the future tokenizer.
It treats whole words as lexical candidates, keeps inflected forms separate,
allocates explicit space/punctuation IDs, and counts an unknown whole word as
three IDs per UTF-8 byte. BOS/EOS plus role/end-of-turn framing are included in
lengths. Generated language quality, tensor numerics, checkpoint precision, and
latency are not measured.

Rank words by frequency, breaking ties alphabetically. The following fit uses
**all dialogues**, so it is an optimistic in-sample accounting exercise. It
maximizes covered word occurrences among whole-word choices for this fixture;
it does not optimize complete-dialogue coverage or establish a minimum vocabulary.

| Total IDs | Word slots | Word occurrences directly covered | Whole dialogues without fallback | Sequence length vs all words known |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 68 | 66.0% | 0 / 48 | 2.740× |
| 150 | 118 | 79.5% | 5 / 48 | 2.096× |
| 256 | 224 | 94.9% | 26 / 48 | 1.278× |
| 384 | 352 | 100% | 48 / 48 | 1.000× |
| 512 | 480 | 100% | 48 / 48 | 1.000× |

Exactly this fixture needs 259 + 32 = **291 IDs** to represent every word as one
ID. 384 is not a mathematically special threshold: it offers 93 additional word
slots beyond this narrow fixture; 512 offers 221. Unused slots in this audit are
budget headroom, not dummy trainable tokens or a completed vocabulary manifest.

A second fit uses only the 36 dialogues marked `design`; the other 12 were marked
`probe` before counting. At budgets of 256 and above it has only 188 learned word
entries, leaving capacity unused. Those entries cover 57.0% of probe word
occurrences and **zero complete probe dialogues**. This is a topic-expansion
stress test, not an independently sampled generalization benchmark. It shows
that a larger cap alone does not choose the missing vocabulary: curation and
coverage by conversational function are essential. Do not describe the all-data
100% result as held-out success.

Python 3 standard-library computation, deterministic ranking, no random seed or
model checkpoint. The report records the fixture SHA-256; retain code revision
alongside archived runs if results are used after these sources change. There
is no historical commit identity for this uncommitted study. Tests independently
check byte/spacing/framing arithmetic, utterance-versus-dialogue coverage, and
explicit rejection of unsupported characters. They verify accounting, not realism.

## Cost and inspection implications

The follow-up [training forecast](training-feasibility.md) separates vocabulary,
model capacity, token exposure, and trace costs, and checks Karpathy’s actual
character and subword vocabulary choices.

At fixed hidden width d, a tied embedding/output matrix has V*d parameters;
untied matrices have 2*V*d, excluding output bias. A dense output projection costs
approximately V*d multiply-accumulates per evaluated position. Increasing V from
100 to 384 scales these components by 3.84, not the whole model by that factor.
At d=32, the tied matrix grows from 3,200 to 12,288 parameters: 18,176 extra bytes
at two bytes per parameter, excluding gradients, optimizer state, and other arrays.
These are dimensional calculations, not measured runtime or quality claims.

Attention computation does not directly depend on V at fixed sequence length and
model dimensions. However, tokenization changes sequence length: fallback can
increase attention work, retained state, and context pressure. Thus saving a few
embedding rows may make the trace longer and less interpretable. Show all logits
on demand, with sorting and selected-row inspection; do not equate inspectability
with fitting every value on screen simultaneously.

## Recommendation and remaining decisions

Use **384 total IDs as the next vocabulary-design candidate**, not as a frozen
model setting. Aim for a few hundred useful whole-word entries, including grammar,
inflections, clarification, negation, time, ownership, and a bounded set of topics.
Keep 100/150 as deliberately restricted experimental comparisons. If a genuinely
useful manifest approaches the 352-word allowance, prefer 512 over contorted
language; the present audit does not justify 512 as necessary.

Budget fallback conservatively now without forcing its implementation choice.
A closed-output instrument can expose reversible fallback on input while
restricting generated words, but that needs explicit, traced decoding constraints
and rules for invalid byte sequences. Unconstrained hex generation breaks a closed
lexicon. Rejecting unknown input is simpler but excludes open-input experiments.
The final input/output policy remains a design decision, not something this audit
settles. The earlier blanket rejection requirement was premature too.

Before freezing the manifest and training:

1. Review vocabulary by conversational function and topic, not just frequency.
2. Write another independently reviewed set of dialogues after selecting entries;
   distinguish new combinations of known words from genuinely missing words.
3. Require no fallback for declared in-domain examples and report complete-turn
   and complete-dialogue coverage. Exercise fallback separately as a tokenizer lab.
4. Measure full framed sequence lengths, including multi-turn histories, before
   choosing context length. The historical 32-token limit is not established here.
5. Train a small pilot and test unseen combinations, context recall, and corrections.
   Vocabulary coverage is a prerequisite, not evidence that a width-4 model learns
   coherent conversation. Freeze vocabulary and corpus identities before comparing
   attention mechanisms or other interventions.

False-positive risk: this authored, normalized fixture can make the proposed
budget look ample while real readers introduce missing names, forms, or topics.
False-negative risk: whole-word frequency selection can make a small budget look
worse than a carefully curated micro-world or a good subword scheme. Neither
risk justifies claiming a universal minimum from this audit.
