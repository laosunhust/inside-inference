# Inspectable model family: width and depth

The nine-run comparison does **not** support replacing the baseline for better
answers. Neither additional width nor a second layer passed the predeclared
behavior screens. The separate execution result is useful: both layers now have
inspectable computations, parameters and K/V, verified against independent arithmetic
and preparation execution. This is a bounded capacity comparison, not a scaling law.

The [evaluation record](../../governance/evaluations/records/2026-10/inspectable-model-family-85.yaml)
owns criteria. This report owns findings and limitations. The authorized window was
2026-10-11 20:49:36–22:49:36 UTC; the comparison and required checks finished at 22:05:02 UTC; no default promotion or additional tuning was allowed.

## Reproduction and admission

The browser worker reproduced `ann has the book.` for:

> ann has the cup. ben has the book. who has the book?

With 11 allowed selections, it emitted IDs `331,6,131,6,242,6,65,24,5`, including
spaces and TURN_END. Ann's first logit/probability were 10.237249511414557 /
0.5340051854563033; ben's were 9.956335552749302 / 0.403223738729041. These match the
owner's rounded report. [Admission evidence](../../data/preparation/model-family/admission.json)
retains all first-selection logits and source identities. This was a fresh reproduction,
not recovery of the original session; its served bundle preceded commit ccee962.

The original 100-case admission **failed**: negation had only ten unused semantic
groups, two per answer label. Existing train/development/test partitions already
reserved 90 of the recipe's 100 groups. Rewording a scenario would not make it fresh.
The owner approved 85 cases at 21:19 UTC, before alternative-model quality was inspected:
25 each ownership, location and correction; ten negation. The original failure and
superseding criteria remain recorded. Percentage thresholds and deadline did not change.

[Cases](../../data/preparation/model-family/cases.json) exclude all original split
identities, duplicate prompts and known probes. [Projected evaluation inputs](../../data/preparation/model-family/evaluation.json)
freeze targets and context rotations. Independent text-derived labels and exclusion
checks pass. The original 100-case test split was not scored.

## Matched comparison

All variants use 384 IDs, context 128, one attention head per layer, learned absolute
positions and binary64. Each ran 4,000 updates with batch 16 and the existing optimizer,
loss and multiword target policy. Initialization and sampling RNGs are separate;
training token exposure matched across architectures for each seed. Checkpoint selection
used the earliest minimum development response loss at 200-update intervals.
No fresh-case score selected a checkpoint or seed. This holds data exposure and
update count fixed, not parameter count or total computation; it does not isolate
depth's intrinsic advantage.

Correct, readable answers out of 85:

| Architecture | Seed 7 | Seed 17 | Seed 27 | Mean accuracy | Ownership/location mean |
| --- | ---: | ---: | ---: | ---: | ---: |
| Baseline: 1 layer, width 8 | 59 | 61 | 57 | 69.4% | 48.0% |
| Wider: 1 layer, width 16 | 57 | 53 | 62 | 67.5% | 46.7% |
| Deeper: 2 layers, width 8 | 57 | 56 | 58 | 67.1% | 46.0% |

All nine runs produced readable answers on all 85 evaluation cases and passed the
question-only/rotated-context advantage screens. Export-verifier development
quality flags are historical diagnostics, not the fresh-set adoption criteria. Both changed architectures failed
the required +10 percentage-point binding improvement and no-binding-family-regression
conditions. Wider regressed ownership by four points; deeper regressed location by
four points. Both regressed correction by four points, within its declared five-point
limit. Negation was unchanged. The prediction “depth passes, width does not” was false
under this protocol. Depth's binding delta was 0.67 points below width's.

The [summary](../../data/preparation/model-family/results/summary.json) retains all gates
and paired improved/regressed case IDs. Each run's directory retains every full-context,
question-only and rotated response, diagnostic logits, configuration/source identities,
checkpoint selection history and numerical verification. These are three seeds on the
same 85 cases, not 255 independent examples; utility screens are not significance tests.
The small negation sample limits conclusions further.

Both changed seed-7 models answer the original book question correctly, **but both
answer `ben has the cup.` when only the question changes to ask who has the cup**.
The baseline answers that second question correctly. Single-fact diagnostic prompts
also produce malformed or wrong responses. Fixing one visible example is therefore
not evidence of a reliable improvement; perfect readability on the templated evaluation
set does not establish readability on arbitrary input.

Depth was motivated by composed attention circuits, not an impossibility theorem for
this MLP-containing baseline. Causality still prevents `ben` from reading a later `book`
at its own position. This experiment identifies neither an induction circuit nor the
cause of the quality plateau. It does not show that depth cannot help with another
training setup. There was no follow-up tuning, data expansion or best-seed promotion.

## Execution and cost

Block parameters and K/V now have an explicit layer axis; shared embeddings and output
projection remain shared. Observations have unique layer-qualified identities and
cross-layer dependencies. Browser selection follows those identities, and parameter
inspection shows the slice actually used by the selected layer. Cache reservations,
retained payload and matrix-operation counts include every layer.

The shipped checkpoint changed serialization only. All learned values stayed unchanged;
[the migration check](../../data/preparation/model-family/migration.json) compared
1,035,648 development logits with the previous engine and found exact equality.
Independent Decimal arithmetic and finite-difference gradient checks cover two layers.
All nine exports agree with preparation logits at atol 1e-10 / rtol 1e-9 and select
identical tokens: 60,808,320 compared logits, maximum absolute error 6.35e-14. Cached/uncached logits and selections agree at every diagnostic
prefix and continuation. These establish numerical execution, not model quality or
real-accelerator fidelity.

| Architecture | Parameters | Binary64 weight bytes | K/V bytes per position | Seed-7 gzip artifact bytes |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 8,168 | 65,344 | 128 | 77,448 |
| Wider | 16,976 | 135,808 | 256 | 157,828 |
| Deeper | 8,768 | 70,144 | 256 | 83,138 |

A second block adds only 600 parameters here because embeddings/projection dominate
this tiny model, but doubles K/V payload at fixed width. Payload excludes metadata and
Python/browser container overhead. Gzip JSON size is not numerical weight storage.
[Cost records](../../data/preparation/model-family/results/costs.json) include selected
and final development losses: final updates did not uniformly improve loss, so this
is not evidence of converged capacity limits. Training took about 55–69 seconds per
run on one CPU thread, including periodic evaluation; implementation and verification
accounted for most of the spike.

The first valid [browser timing batch](../../data/preparation/model-family/results/browser-timings.json)
used one warmup and ten measured API steps on the same 30-ID prefix:

| Architecture | Median step | Range | Navigation to ready |
| --- | ---: | ---: | ---: |
| Baseline | 395.7 ms | 392.9–407.2 ms | 2.72 s |
| Wider | 549.9 ms | 546.3–577.8 ms | 1.53 s |
| Deeper | 502.5 ms | 499.6–512.6 ms | 1.52 s |

These are local Chromium operation times including trace creation, validation and
serialization, not pure numerical kernel times or end-to-end rendering. Sequential
navigations shared one browser process, so startup is not a guaranteed cold-cache
comparison. No extrapolation to accelerator throughput is justified.

[Final checks](../../data/preparation/model-family/results/checks.json): 105 unit tests,
9.05 seconds for the complete light harness; 29 preparation tests, 107.22 seconds in
the separate optional preparation harness. Full integration passes for the shipped
baseline in 79.63 seconds and the trained two-layer seed-7 artifact in 94.71 seconds,
including 24 integration tests and interactive/headless browser checks. Both remain
within the unchanged 100-second limit. Desktop and 390-pixel layouts were reviewed;
layer selection is distinct and diagram scrolling stays inside its container.
The retrained baseline seed-7 weights equal the shipped weights exactly.

## Failures corrected during the spike

- Layer selectors initially shared operation names, highlighting both layers. Unique
  observation IDs now govern selection; browser checks traverse both layers and their
  actual parameter slices.
- Replay's fixed virtual-time allowance covered one block only. It now derives from
  observation count; presentation speed did not change.
- External-model cache fixtures assumed baseline byte capacity. Their declared test
  inputs now scale with layers × width to retain the same slot pressure. Runtime
  capacity admission remains strict and never repairs insufficient capacity.
- The isolated governance test inherited a `supersedes` link without its predecessor.
  The owner explicitly approved its fixture fix and hash update; the governance rule
  was unchanged.
- The trained two-layer cache page exceeded the harness's ten-second startup wait.
  A separate browser run reached ready; startup may now use thirty seconds within the
  unchanged total 100-second integration budget. Functional checks subsequently passed, but the full run took 103.3 seconds and
  failed its budget. Profiling found about 35 seconds in the cache lab and 25 seconds
  in per-token/inspection checks. The harness now shares its built site across consumers,
  avoids duplicate full graph walks for already-covered continuation states, and visits
  each dependency once while checking every reverse link. Final timings are recorded
  in the maintained check evidence. Those first consolidations saved little. Replaying
  every cache scenario was redundant with the per-scenario headless/interactive
  comparison; replay now covers the transfer scenario once, with an explicit admission
  assertion. That assertion caught a stale fixture selector before the final pass.
  [Before](../../data/preparation/model-family/results/browser-harness-before.json) and
  [after](../../data/preparation/model-family/results/browser-harness-after.json) profiles
  show the cache phase falling from 34.9 to 28.0 seconds. No budget was relaxed.
- The first timing probe supplied an undeclared request field and omitted checkpoint
  identity. Generated validation rejected it before computation; the probe now uses
  the declared TokenStepRequest.

## Disposition

Retain the shipped baseline. The layer-aware implementation and verified family can
support inference/cache experiments despite the negative quality result. Do not infer
accelerator throughput, general language capability or scaling laws from these cases.

Raw training artifacts, source snapshots and browser evidence remain under
`out/experiments/model-family/` for review; nothing there has been deleted. The maintained
result data above preserves the comparison independently of disposable traces. No new
checkpoint is an adopted fixture. Before adopting or deleting run artifacts, establish
durable model storage: the wider gzip JSON exceeds the current 128 KiB fixture cap;
this spike does not relax that cap or invent another checkpoint format to evade it.
The [Makefile](../../Makefile) owns the private preparation/evaluation workflows.
