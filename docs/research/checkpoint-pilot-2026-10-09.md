# First trained checkpoint: preparation works, behavioral gate fails

The [predeclared pilot](../implementation/checkpoint-pilot.md) produced a compatible
trained artifact without changing the 384-ID tokenizer, one-layer/one-head width-8
architecture, binary64 precision, or unmasked greedy policy. It is a useful local
numerical instrument, not a validated conversational model or a completed L1.

## Result

The 8,168-parameter model trained on 400 controlled examples; selection used only
the existing 60 development examples. User turns were explicitly joined into one
prompt to match the current request interface. No language-seed mixture, vocabulary
expansion, architecture change, or held-out test evaluation was performed.

A single configuration ran 4,000 updates. The selected checkpoint is step 1,600,
chosen by minimum development response loss, not maximum accuracy. A repeat with
the same settings after provenance integration reproduced its parameter values
exactly. The two checkpoint identities differ because their source provenance
changed; this is not a second independent seed or additional quality evidence.

| Development measure | Observed | Predeclared criterion |
| --- | --- | --- |
| Accepted responses | 44/60 (73.3%) | At least 48/60 — failed |
| Location | 7/15 | At least 9/15 — failed |
| Ownership | 7/15 | At least 9/15 — failed |
| Negation | 15/15 | At least 9/15 — passed in these templates |
| Correction | 15/15 | At least 9/15 — passed in these templates |
| TURN_END within 8 selections | 60/60 | At least 90% — passed |
| At least two nonterminal tokens then TURN_END | 60/60 | At least 90% — passed |
| Question-only accuracy | 2/60 | Full-context advantage at least 20 percentage points — passed |
| Rotated-context accuracy | 9/60 | Full-context advantage at least 20 percentage points — passed |

Development response loss at selection: **0.26849**. Training response loss at the
same weights: **0.10390**, with 342/400 accepted responses (85.5%). This gap and the
family failures rule out declaring the preparation goal's behavioral gate passed.
Context sensitivity is visible, but does not prove relational understanding.

Post-pilot diagnostics used the existing eight contrast probes, with no subsequent
tuning: location 0/2, ownership 1/2, negation 2/2, correction 0/2. Both location
responses chose the distractor's location. Both shorter correction prompts stopped
immediately, despite perfect development correction scores. Template and positional
sensitivity remain material risks; the probes are not an independent test set.
These findings do not isolate architecture capacity, optimizer behavior, or corpus
coverage as the sole cause. Longer training or a larger model is not justified by
this run alone.

## Numerical evidence and cost

Eight preparation checks cover independent reference logits and finite-difference
gradients, causal padding and supervised-loss positions, scalar AdamW updates,
exact optimizer/sampler resume, export isolation, invalid inputs/provenance, and
unmasked selection. A separate exported-artifact verification compared **2,761,344
logit values** over all development continuations; maximum absolute difference
between PyTorch and the inspectable engine was **1.16e-14** (rounded upward).
All generated token IDs agreed. Resuming the actual step-1,600 state through
step 4,000 reproduced the uninterrupted model, optimizer, sampler, and PyTorch RNG
states exactly; its selected exported checkpoint was byte-identical. Full traces for one example per family replayed
through the reference engine and its raw-logit oracle.

Final pilot loop, including periodic development evaluation/checkpointing:
**21.47 seconds**, one CPU thread, **359,579,648 bytes peak process RSS** (about
343 MiB), no GPU execution. It processed 2,623,897 non-padding input-token positions
and 192,000 supervised response targets over 4,000 updates. This is local preparation
cost for this architecture, not accelerator inference performance. Library import,
installation, correctness testing, and integration verification are outside that
loop timing. The initial run, repeat, and actual-checkpoint resume verification together spent
about 57 seconds in their training loops; there was no overnight GPU job.

## Artifacts and use

The primary local artifact is
`out/experiments/model-preparation/final/checkpoint.json`, with SHA-256 identity
`1d258332e360340b4505e4241c9a11a4cfd70a9bbb398bbbe890df790343bca3`.
Its directory also contains best/latest resumable states, exact projected examples,
source snapshots, configuration and environment identities, per-checkpoint development
reports, metrics, and completion status. Latest state is step 4,000; best is 1,600.

The local handoff report is `out/experiments/model-preparation/report.md`.
Reference traces and diagnostics are under `out/experiments/model-preparation/verification/`;
trained browser parity evidence is under `out/experiments/checkpoint-integration/`.
These outputs are disposable and not committed; the protocol, recipe, and preparation
implementation are maintained. No checkpoint has been published.

The Makefile owns setup, training, verification, and optional `CHECKPOINT` selection
for live inspection. Default inference remains seeded and untrained. Explicitly
loading an artifact uses those weights for both the embedded page and HTTP runs;
provenance is visible and travels with exported traces. Preparation dependencies
are optional; reference inference does not import PyTorch.

## Next decision

The user subsequently authorized a bounded attempt at 55/60 without changing
the architecture or scorer. The [follow-up record](../implementation/checkpoint-followup.md)
preserves its decisions and results separately from this original pilot.

Proceed with M2 and G1 using the fixed numerical instrument, retaining this trained
artifact as an additional state/trace case. Before another quality-oriented training
run, review the entity-binding and short-prompt failures and decide which behavior
is needed by the next experiment. Do not expand architecture or data solely to make
these scores green. T1's broader coverage and L1's independent learned-behavior
requirements remain unmet; the held-out test set remains unevaluated.
