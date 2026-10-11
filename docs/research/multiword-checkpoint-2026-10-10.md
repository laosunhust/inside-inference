# Multi-word supervision: readable output, limited answer accuracy

The owner requested this bounded pilot because separated output is easier to read
and judge. The [predeclared protocol](../implementation/checkpoint-multiword.md)
and [evaluation criteria](../../governance/evaluations/records/2026-10/readable-multiword-checkpoint.yaml)
were frozen before training. One run was performed; no quality tuning followed.

## Result

The selected checkpoint passes the declared readability and task screens, within
this controlled development set. It emits actual SPACE IDs: no tokenizer changes,
masking, forced spacing, or output repair were introduced.

| Measure on 60 development cases | Result | Criterion |
| --- | ---: | ---: |
| Separated multi-word output, period and TURN_END | 60/60 | At least 54/60 |
| Correct and separated output | 45/60 | At least 42/60 |
| Exact chosen-target match | 45/60 | Report separately |
| Negation correctness | 15/15 | At least 12/15 |
| Correction correctness | 15/15 | At least 12/15 |
| Location correctness | **5/15** | Report; no family gate was declared |
| Ownership correctness | 10/15 | Report; no family gate was declared |
| Question-only correctness | 0/60 | Full-context advantage at least 12/60: observed 45 |
| Rotated-context correctness | 9/60 | Full-context advantage at least 12/60: observed 36 |

A readable answer can be wrong. The first location example asks where the cup is,
after stating it is in the park; this checkpoint answers **`in the box.`** That
failure remains visible. These are familiar synthetic templates and a repeatedly
used development set, not evidence of general conversation or held-out language
ability. The independent test split was not evaluated. This does not complete L1.

The first example in each other family produces `mia has the bear.`, `the book.`,
and `in the room.`, respectively, all correct for those examples. Complete per-case
outputs, IDs, controls and errors remain in the experiment evidence.

The retained original pilot, re-evaluated with the same 11-selection allowance,
has 44/60 accepted answers but **0/60 separated multi-word responses**. Its family
scores are location 7, ownership 7, negation 15 and correction 15. The new artifact
is more readable under this definition, but its location accuracy regressed.
The two training objectives differ; do not claim general quality improvement from
45 versus 44, or compare their historical per-token losses.

## Fixed run and cost

Use the same 384-ID lexical manifest, one block/head, width 8, FFN 16, context 128,
binary64 and 8,168 parameters. Optimizer, seed 7, batch 16 and 4,000-update budget
match the original pilot. The only training intervention is choosing the shortest
existing multi-word accepted answer by encoded length, with lexical tie-breaking.
Prompt projection and train/development partitions are unchanged. Targets take
5–9 selections including TURN_END; evaluation uses a uniform budget of 11.

The run completed all 4,000 updates in **55.25 seconds**, using one CPU thread and
about **329 MiB** peak RSS. It processed 2,879,545 non-padding input-token positions.
The minimum development response loss selected **step 1,800**, loss 0.1157007778.
The later final state was not substituted for that predeclared selection. Setup,
preparation checks, export verification and browser checks are outside loop timing.

The selected artifact is
`out/experiments/model-preparation/multiword/checkpoint.json`, identity
`e19dea8d9a1e1b4b8c5e975bb615002138bf0990d132364fdda9932a00c0fc18`.
The run directory retains exact targets, config, source snapshots and identities,
all checkpoint metrics, best/latest states, and deadline/completion records.
Weights are compatible with the unchanged tokenizer; prior artifacts were retained.
These outputs are reproducible disposable artifacts, not a published model release.

## Verification and inspection

Preparation checks passed: **28 tests in 106.95 seconds**, separate from the light
inference harness. They include loss/gradient/optimizer/export/resume checks and
the new target-selection and emitted-separator counterexamples. No second full
preparation run was needed before the single training loop.

Export verification compared **6,756,480 logits** across all 60 development
continuations, maximum absolute difference **2.354e-14**, below atol 1e-10 /
rtol 1e-9. Raw argmax choices agree, and one complete trace per family replays
through the reference engine. No selected token was repaired for presentation. The separate contrast diagnostic
retains raw outputs and labels its historical bare-answer match literally; that
limited rubric is not used to grade multi-word correctness.

The light workflow passed in **7.35 seconds**. The full trained-artifact workflow
passed in **91.82 seconds**: 91 unit tests, 25 integration tests and browser parity.
It includes an 11-selection ownership request through headless, CLI, HTTP, browser
export and replay, and tests that the output label does not call trained weights
untrained. The declared landing cap increased from 8 to 16, with generated consumers
updated; the default request budget and default weights remain unchanged.

The spike used a separate trained preview on port 8001. Following owner review,
that temporary workflow was retired: the [shipped checkpoint](../../data/model/README.md)
is now the default on port 8000. Choose **Maximum new tokens: 11**, then apply:

> ann has the cup. ben has the book. who has the cup?

The live endpoint returns `ann has the cup.`: nine selected IDs including TURN_END,
two unused selections. Advance predictions to inspect each emitted word and SPACE.
The initial generic prompt is not a guarantee of meaningful conversation.

Verification details live under the run's `verification/`; browser evidence is
under `out/experiments/checkpoint-integration/`. The separate preview-run record
captures the exact live request and output. The original spike deferred promotion; the subsequent owner-authorized cutover
is recorded with the shipped artifact. No additional training is needed to retain this inspection artifact.
