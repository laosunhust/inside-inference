# Preparing the inference instrument

Owns the prerequisite work needed to obtain a usable model/checkpoint. This is
implementation support for inference experiments, not a training-research roadmap.
The [purpose](../purpose/README.md) owns the vocabulary and language-world boundary;
the [inspection architecture](../architecture/inspection.md) owns execution/trace
interfaces; [milestones](../purpose/milestones.md) define inference acceptance.

## Minimal preparation

Build or obtain a compatible checkpoint for the fixed vocabulary and declared
model architecture. A local trainer may be necessary to produce it. Keep its
scope to reproducible checkpoint preparation: identified corpus/tokenizer, seed,
configuration, precision, validation, and checkpoint identity, within the
[purpose’s training boundary](../purpose/README.md#inference-is-the-research-boundary).

If we maintain a trainer, verify gradients, parameter updates, and checkpoint
resume against independent calculations. Those checks ensure trustworthy model
preparation; they do not make backward-pass exploration a required reader journey.
Numerical traces in the inference UI come from the actual forward execution.

A new attention family may require a separately trained compatible checkpoint for
an inference-quality comparison. Record that preparation and its differences.
Do not assume weights can be swapped unchanged between mechanisms. Independent
arithmetic/state labs can proceed without training an entire model.

The bounded first-run choices and evaluation are declared in the
[checkpoint pilot](checkpoint-pilot.md).

The first local run is documented in the
[pilot findings](../research/checkpoint-pilot-2026-10-09.md): numerical preparation
and export pass; the provisional learned-behavior gate fails. PyTorch is an optional
CPU-only preparation dependency; ordinary inference remains independent of it.

## Cost planning

The [training-feasibility study](../research/training-feasibility.md) contains
analytical budgets and the local hardware inventory, not measured training results.
Its width-64/two-layer pilot is a preparation candidate, not a frozen model size.

For local planning, the initial target is 10M token presentations at V=384, context
128, batch 16 within 60 minutes including configured evaluation/checkpoint work.
This is a proposed setup budget, not a convergence promise or an inference-research
KPI. Measure a short representative pilot before scheduling runs. Record peak
memory and retained traces as well as throughput; avoid unnecessary parameter sweeps.

The useful output is a reproducible checkpoint that passes the inference behavior
and numerical checks. Revisit preparation only when it blocks those experiments
or a declared intervention requires different weights.
