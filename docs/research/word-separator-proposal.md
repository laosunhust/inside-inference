# Counter-proposal: diagnose missing spaces before changing the tokenizer

Status: Step 1 completed after the owner's “let's start” instruction; later
options remain proposed for review against the
[byte-BPE spike proposal](tokenizer-spike-proposal.md). No training or migration
was performed or authorized by this document.
Date: 2026-10-10. Budget: thirty minutes of elapsed work for Step 1 after approval.

Step 1 evidence: [missing-space diagnosis](word-separator-diagnosis.md).
Later options remain proposed and were not executed.

## Question

Why does generated text such as `sisterbehindoflovejustbottle` lack spaces, and
which change, if any, would let the inference instrument produce correctly
separated multi-word output without hiding model selections?

The byte-BPE spike measures representation cost. Its own proposal states that it
cannot establish whether a tokenizer teaches spacing. This proposal starts from the
symptom and asks for the cheapest change that addresses its cause.

## Evidence already available

Measured at revision `323b0c1` against the pilot's prepared examples
(`out/experiments/model-preparation/final/examples.json`, SHA-256
`74a92c33…0d6b`) and the v2 manifest (SHA-256 `e5edde07…77`). These are
disposable local inputs; Step 1 must regenerate them reproducibly.

- **No supervised response contains a space.** All 400 training and 60
  development response targets are `word . TURN_END`: zero SPACE targets in 460
  responses. The model has never been trained to emit a separator, so any
  multi-word generation from the trained checkpoint is outside its supervision.
- **Multi-word answers exist but are unused.** Of 1,800 acceptable training
  answers, 1,000 have two or more words (for example `it is in the room.`); the
  supervised target is always the single-word form.
- **The default page weights are untrained.** Nothing in random weights favors
  SPACE, but one ID among 384 does not establish a selection probability: greedy
  decoding under a fixed seed is deterministic, and whether SPACE is selected
  depends on that checkpoint's logits. Read the recorded trace rather than assume.
- **SPACE is 36.6% of complete training prompt-plus-response positions, including
  framing.** These are not supervised target counts; the pilot masks prompt loss.
  A known word preceded by one ASCII space costs two IDs.

Hypothesis: the symptom is a consequence of supervision (trained checkpoint) or
random weights (default page), not of the tokenizer. Any tokenizer with separate
space tokens, including byte BPE without space-bearing merges, would show it.

## Options, cheapest first

### Option 0 — label and retain (minutes)

Identify which weights produced the reported output. Where generated text is shown
from untrained weights, label it as untrained output. The inspector already shows
the full ID sequence, so a reader can see that no SPACE ID was selected. No codec,
manifest, or model change.

### Option 1 — supervise separators with existing data (one retraining loop)

Train against multi-word acceptable answers already in the examples instead of
only the single-word form. This directly tests the hypothesis: the model receives
SPACE targets for the first time. The pilot's training loop took 21.47 s on one CPU
thread. The tokenizer, manifest, and architecture remain unchanged.

Fix before training, so that a failure is interpretable:

- **Training budget:** the pilot's architecture, precision, optimizer settings,
  4,000 updates, and checkpoint selection by minimum development response loss.
- **Target selection:** one deterministic multi-word target per example, chosen by
  a declared rule over its acceptable answers (for example, the longest), with the
  rule and resulting target identities recorded.
- **Generation allowance:** the target's ID length plus a declared margin, still
  ending only on TURN_END or the budget, with unmasked greedy selection.
- **Acceptance:** predeclared thresholds for separated multi-word responses on
  development prompts and for the pilot's previously passing families.

Success shows that the current tokenizer can support separated output. It does
not settle tokenizer efficiency. Failure within this budget leaves the cause
unresolved; by itself it does not establish a representation problem.

This is training work, which the purpose permits only in support of inference
experiments. It needs owner approval, and its behavioral scores must not be
compared with the pilot's as if they were the same task: longer targets change
the scorer's inputs and the response-loss denominator.

### Option 2 — word IDs that carry their leading space (deferred; not part of this work)

Recorded as a deferred alternative, not a planned step. Neither variant below is
specified completely enough to implement: a full grammar, failure cases such as
GLUE not followed by a word, and round-trip tests are missing.

Each lexical entry's bytes become ` word` instead of `word`, as in GPT-2's `Ġword`
and SentencePiece's `▁word` conventions. Concatenating two word IDs then yields
separated words; joining words without a space requires an explicit choice.
The model still selects every token. This is a representation change, not
decoding-time spacing repair or token masking.

Two exact, reversible variants:

| | 2A · explicit glue | 2B · turn-initial rule |
| --- | --- | --- |
| Word after one space | One ID ` word` | One ID ` word` |
| Word at turn start | GLUE + ` word` | ` word` decodes as `word` when first in turn content |
| Word after hyphen, quote, or bracket | GLUE + ` word` | Byte fallback for the whole word |
| Leading space at turn start | ` word` | SPACE + byte-fallback word |
| Other spaces (double, before punctuation, before unknown words) | Literal SPACE ID | Literal SPACE ID |
| ID budget | Needs one new GLUE ID: a recorded v3 word exchange | No new ID |
| Contract change | Adds a control-like content ID | Adds a positional decoding rule to “no implicit spaces” |

Estimated sequence lengths, computed by rewriting the existing ID sequences
(no fitting or estimation of merges involved):

| Partition and field | Current IDs | 2A | 2B |
| --- | --- | --- | --- |
| Training prompts | 15,600 | 9,850 (0.63×) | 9,450 (0.61×) |
| Training responses | 1,200 | 1,600 (1.33×) | 1,200 (1.00×) |
| Development prompts | 2,337 | 1,476 (0.63×) | 1,416 (0.61×) |
| Development responses | 180 | 240 (1.33×) | 180 (1.00×) |
| Longest prompt | 55 | 33 | 32 |

2A lengthens every current single-word response by one GLUE ID; 2B does not but
introduces position-dependent decoding. Both shorten prompts by about 37–39%
against the 128-position context. These figures cover this synthetic corpus only.

Option 2 invalidates the trained checkpoint and every encoded dataset, changes the
manifest hash pinned by tests, and requires retraining. Its benefit to M2 and G1
is indirect: shorter prompts mean fewer KV positions per request, which changes
cache-lab numbers but not the mechanisms under study.

### Comparison with the byte-BPE spike

| | Byte BPE (122 merges) | Option 2 |
| --- | --- | --- |
| Addresses missing separators | Only if space-bearing merges are learned and supervised | By construction for adjacent word IDs |
| Ordinary-text length | Expected longer: words split into pieces | Measured 0.61–0.63× for prompts |
| IDs spent on the byte alphabet | 256, most never observed in this corpus | 17 (BYTE + 16 hex), unchanged |
| Pieces a reader inspects | Merge fragments with ancestry | Whole words |
| Spelling burden on a width-8 model | Added | None |
| Requires retraining | Yes | Yes |

## Proposed order and decision rule

1. **Step 1 (30 min):** Option 0, plus a reproducible script that regenerates the
   evidence above from maintained inputs. If the reported output came from
   untrained weights, stop: label it and close this missing-space diagnosis;
   tokenizer efficiency remains deferred.
2. **Step 2, if readable multi-word output is needed and the owner approves:**
   Option 1 under the fixed budget above. Success shows that the current tokenizer
   supports separated output; it does not resolve tokenizer efficiency.
3. **Defer the byte-BPE spike and Option 2** without declaring either resolved.
   Revisit when a new question needs arbitrary-text representation cost or prompts
   that exceed the 128-position context, through a separate proposal and review.

## Evaluation admission

Register before implementation in [evaluation admission](../../governance/evaluations.yaml):

- **Question:** does the missing-space symptom originate in weights or supervision
  rather than tokenization?
- **Baseline:** the v2 manifest, the pilot checkpoint, and the untrained default.
- **Success:** the symptom's source is identified with recorded weights identity;
  for Step 2, separated multi-word output on development prompts under the
  unchanged tokenizer, judged against predeclared criteria.
- **Failure:** the symptom persists under multi-word supervision within the fixed
  Option 1 budget, or the source cannot be identified from recorded evidence.
  Neither outcome establishes a representation problem.
- **Counterexamples:** the trained model emits SPACE but in wrong positions;
  separators appear only in memorized templates; multi-word targets degrade the
  pilot's passing families (negation, correction).
- **Hard gates for any later Option 2 proposal:** exactly 384 IDs; exact
  `decode(encode(text)) == text` on the frozen challenge set from the spike
  proposal; literal control-looking text remains text; no masking, forced
  spacing, or output repair.

## Questions for the debate

- Is the supervision hypothesis sufficient to explain the symptom, or is there
  evidence that the tokenizer contributes independently?
- Does Option 1 stay within the purpose's boundary that training supports
  inference rather than becoming a research axis?
- Is 2B's positional rule an acceptable exception to “no implicit spaces,” or does
  it weaken inspectability more than 2A's extra response ID?
- Does byte BPE answer any question on the current milestone path that Option 2
  does not?
