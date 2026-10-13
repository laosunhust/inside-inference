# Missing spaces: Step 1 diagnosis

Date: 2026-10-10. Scope: the approved thirty-minute diagnosis spike, without
training or tokenizer changes. The completed proposal is retained in Git history.
The subsequent [multi-word pilot](multiword-checkpoint-2026-10-10.md) established
readable output with the existing tokenizer; no BPE or implicit-spacing migration
was performed. Those alternatives are not active work.

## Finding

The currently served initial run uses **untrained seed-7 weights**. Its selected
tokens decode exactly to `sisterbehindoflovejustbottle`. No SPACE token was selected;
neither publication nor decoding removed a separator. Replaying its recorded
weights and workload reproduces every raw logit and selected ID. The live HTTP
endpoint produces the same selections and published text.

This reproduces the suffix reported in the conversation. The original browser
session/export was not recovered, so this is evidence about the captured current
initial run and fresh replays, not proof of every earlier browser interaction.

| Selected piece | ID | SPACE rank among 384 logits |
| --- | ---: | ---: |
| sister | 224 | 174 |
| behind | 56 | 165 |
| of | 189 | 83 |
| love | 360 | 313 |
| just | 310 | 92 |
| bottle | 344 | 135 |

The request is `the ball is in` (no trailing space), with six allowed selections.
Selection is the existing unmasked greedy policy. SPACE is ID 6. No probability
of selecting SPACE is inferred from the vocabulary size.

## Supervision evidence

The diagnosis regenerates the examples through the actual preparation function,
then examines the actual batch targets. Regenerated examples equal the archived
pilot examples as parsed data; the disposable pilot copy is not needed to rebuild
the counts. No model test examples are accessed.

| Measure | Training | Development |
| --- | ---: | ---: |
| Responses | 400 | 60 |
| Supervised response positions | 1,200 | 180 |
| SPACE targets | **0** | **0** |
| Prompt positions | 15,600 | 2,337 |
| SPACE occurrences in prompts | 6,150 | 921 |
| Accepted answer alternatives | 1,800 | 270 |
| Multi-word accepted alternatives | 1,000 | 150 |

The training fraction 6,150 / 16,800 = 36.6% counts complete prompt-plus-response
sequences, including framing. It is **not** the fraction of supervised targets.
Input spaces influence the computation, but the response-only loss never uses
SPACE as the correct next-token label in this pilot. The selected targets are
single-word answers followed by punctuation and TURN_END; accepted multi-word
alternatives are scoring options, not training targets.

This is a concrete limitation of the pilot's supervision, not a measured result
of retraining with separators. It does not show that the tokenizer cannot support
multi-word output, or that changing supervision alone will meet a quality target.

## Change and reproducibility

The output annotation now reads **Published output · untrained** when the accepted
run's checkpoint provenance says `untrained`. Other checkpoints retain **Published
output**. The label is derived from the recorded artifact, not from apparent text
quality. Token IDs, text bytes, weights, and generation policy are unchanged.

The private `_diagnose-word-separator` workflow in the [Makefile](../../Makefile)
owns reproduction against the running local page. It needs the optional preparation
dependencies because it calls the actual preparation and target-building functions,
but it never trains. Its [implementation](../../scripts/experiments/diagnose_word_separator.py)
checks declared checkpoint identity, argmax selections, publication IDs and deltas,
strict decoding, exact local replay logits, and live-endpoint agreement. A different
served run is new evidence; malformed content fails explicitly rather than being
repaired to fit this diagnosis.

Detailed report, regenerated examples, observed HTML/run, and replay/live records
are disposable outputs under `out/experiments/word-separator/`. The report retains
source and checkpoint identities. `initial-page.html` preserves the pre-edit page
captured in this spike. Browser integration checks exercise rendered output against
publication events and assert the provenance-derived annotation.

Validation: the diagnosis completed successfully; the full integration workflow
passed in **75.61 seconds**, including 90 unit tests, 24 integration tests, and
browser parity checks. The browser screenshot shows the compact annotation beside
unchanged output. Additional negative controls rejected a missing publication
delta, altered logits that would select SPACE, and weights inconsistent with their
declared identity. The local page was rebuilt and its served script verified.

## Decision

Stop at Step 1. The observed concatenation faithfully exposes selections from
untrained weights; it is not evidence for a tokenizer replacement. Readable
multi-word generation would require the separately reviewed supervision experiment.
Tokenizer efficiency remains an open, deferred question. No BPE fitting, new
training, vocabulary migration, or checkpoint replacement was performed.
