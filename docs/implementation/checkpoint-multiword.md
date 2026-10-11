# Readable multi-word checkpoint spike

Authorized on 2026-10-10 for human inspection: the owner needs separated words to
read and judge output. This is preparation for that concrete use, not a requirement
for cache-equivalence labs. The one-hour window ends at **23:53:15 UTC**.

The [evaluation record](../../governance/evaluations/records/2026-10/readable-multiword-checkpoint.yaml)
owns acceptance, and [configuration](../../data/preparation/multiword.json) owns the
executable settings. Keep one block/head, width 8, FFN 16, context 128, binary64,
384 unchanged token meanings, seed 7 and the original pilot optimizer. One run of
4,000 updates at most; select minimum development response loss. No further seeds,
hyperparameter changes, architecture changes or response repair after results.

Use the existing 400 training and 60 development examples. Preserve prompt
projection, partitions, IDs and acceptable answers. Choose one target per case:
the acceptable answer with at least two whitespace-delimited words and the fewest
encoded content IDs; break ties lexically. This favors shorter existing forms over
copying a whole context sentence, but does not rule out template shortcuts. Encode
it unchanged and append TURN_END. Store chosen target text and IDs with the run.

Targets require 5, 7 or 9 selections including TURN_END. Evaluate all cases with
11 selections (maximum 9 plus margin 2), never a per-case answer-length hint.
Raise the generated landing system's declared cap to 16 to support inspection;
leave its default request budget and default untrained weights unchanged.

Score emitted IDs, without inserting spaces. A readable response terminates and
has the exact shape WORD (SPACE WORD)+ PERIOD TURN_END. Wrong words may satisfy
that syntax, so report accepted-answer correctness, exact chosen-target match,
and correctness combined with readability separately. Require at least 54/60
readable responses (90%). The distinct task gate requires at least 42/60 correct
readable responses (70%), 12/15 correct for both previously strong families,
negation and correction, and 12/60 full-context advantage over each context control.
These are practical inspection screening thresholds, not claims of general language
quality. A readability pass and task failure must be reported as separate outcomes.

Run question-only and rotated-context controls as in the pilot. Compare the retained
pilot under the same 11-selection diagnostics when available, but do not compare
raw response losses across different targets. Do not inspect the held-out test set,
add language-seed examples, or select the checkpoint by accuracy. Report all
failures and stop after the single run.

Verify the exported artifact numerically against the inspectable engine for every
development continuation and through the existing browser/headless harness.
Makefile owns preparation, verification, and CHECKPOINT-based preview commands.
The artifact stays under out/experiments/; retain previous outputs. A maintained
result report records source identities and observed limits. No default promotion
or second commit is authorized by this spike.
