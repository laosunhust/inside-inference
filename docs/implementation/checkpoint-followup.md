# Checkpoint preparation follow-up

The user authorized a further four-hour attempt at **55/60 development answers**
on 2026-10-09. The work window ends at 10:01 UTC. This replaces the earlier
48/60 development screening target for this attempt only; it does not change the
historical pilot result or establish held-out generalization.

Keep the 384-ID tokenizer, architecture, 400 training cases, 60 development cases,
response scorer, projection, and unrestricted greedy decoding unchanged. Do not
evaluate the held-out test set. Retain the original artifact. Select checkpoints
by minimum development response loss as before; report accuracy independently.
Keep the other pilot screening criteria and numerical/integration checks.

First intervention: reduce AdamW learning rate from 0.003 to 0.001 and allow
12,000 updates so the slower optimizer has time to converge. Seed, initialization,
batch size, loss, and all other settings remain unchanged. This tests optimization
under the existing capacity, not a different model. Record subsequent decisions
from observed evidence before running them. Repeated development use limits the
meaning of the final score; it is a preparation target, not an independent benchmark.

Executable settings live in `data/preparation/followup.json`; all run artifacts,
source snapshots, and verification evidence remain under `out/experiments/`.
No deployment or commit is authorized by this attempt.

## Decision after the lower-rate run

The 12,000-update run selected step 2,800: 41/60 development answers and
349/400 training answers. Its lowest development loss was 0.35615; the later
maximum observed accuracy was 48/60 with worse loss. More updates did not remove
the binding failures. Next, change only the initialization/sampling seed to 11
with the same lower-rate configuration. This single repeat probes sensitivity
to initialization and stochastic batches before attributing the failure to
capacity; it is not an independent generalization evaluation or a seed sweep.

The seed-11 repeat selected step 2,000 at loss 0.30941 and 40/60; its peak
observed accuracy was 45/60. Neither run is promoted. The unchanged 44/60 pilot
remains the primary artifact. The user has been asked whether a separately
declared small architecture change is acceptable; no such change is authorized
or implemented at this point. The target remains unmet.

The two loops took 64.17 and 63.56 seconds respectively. Full metrics, source
snapshots, and states are in `out/experiments/model-preparation/followup/` and
`followup-seed11/`. They retain the historical evaluator's `provisional_pass`
field for the old 48/60 screen; that field does **not** mean the new 55/60 target
passes. Neither run reached 55/60 at any recorded evaluation.

An actual reference trace on the original checkpoint compared `ann has the book.
mia has the bear. who has the book?` with the same facts asking about the bear.
Only question-token position 26 changed. The final query and attention scores
at all unchanged positions were identical. In this one-block architecture the
query at the final ASSISTANT position derives from its token and position alone;
the feed-forward layer must infer the requested relationship from mixed values.
This identifies a computational constraint, not proof of an accuracy ceiling.
Evidence: `out/experiments/model-preparation/binding-query-diagnostic.json`.

## Regularization check

Before attributing the result to insufficient capacity, evaluate the final states
on training data. Seed 7 reached 377/400 (loss 0.04533); seed 11 reached 383/400
(loss 0.03436). Their development losses worsened despite improving training fit.
This motivates one regularization check: retain seed 7 and the lower-rate setup,
and increase weight decay from 0.01 to 0.1. All other choices remain fixed.
This tests the observed overfitting gap; it does not presume an architecture
change is necessary. Settings: `data/preparation/followup-regularized.json`.

Result: selected step 2,800, loss 0.33372, 41/60; peak observed accuracy 45/60.
The 12,000-update loop took 64.01 seconds. Stronger decay did not close the
gap and this checkpoint is not promoted. The three follow-up loops together
took about 192 seconds on one CPU thread. No recorded checkpoint reached 55/60.
`out/experiments/model-preparation/followup-summary.json` contains exact counts,
artifact identities, and the new target result; `followup-report.md` summarizes
the comparison. The original 44/60 artifact remains preferred. Architecture
guidance is still pending; the failed attempts do not prove a capacity ceiling.

## User decision

The user subsequently dropped the 55/60 quality goal and chose to proceed with
KV/resource experiments on the existing architecture. No architecture decision
is pending for checkpoint quality, and no further training is scheduled.
