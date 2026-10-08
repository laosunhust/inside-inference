# Three levels of inspection

This document owns code boundaries and navigation for the connected instrument.
[Purpose](../purpose/README.md) owns the fixed-vocabulary learning scope;
[ontology](../ontology/inference.md) owns shared meanings; the catalog owns lab
placement. This is an implementation direction, not a claim of a working GPT.

## One run, three views

| Zoom | Question | Inspect and change |
| --- | --- | --- |
| 1 · Customer journey | What happens to my request? | Selected client workload → inference system → response; request progress, state movement, and resource constraints. |
| 2 · Execution steps | What work produces the response? | Tokenization, prefill, decode, output delivery; expand model phases into embedding, layers, output projection, and selection. |
| 3 · Mechanism | What happens if I change this operation? | Attention choice and its parameters; actual inputs, intermediate arithmetic, retained state, outputs, shapes, and precision. |

These are zoom levels over the same run, not three independently calculated
explanations. Preserve request, run, step, layer, and sequence-position context
when navigating. Embedding is an operation inside model execution; it is not a
separate serving phase parallel to prefill and decode. Both phases reach the
same attention mechanism configuration and implementation.

The first path is request → prefill or decode → naïve causal attention and its
actual arithmetic. Establish this reference before adding a mechanism selector.
Follow the [incremental milestone order](../purpose/milestones.md#build-order-establish-the-reference-before-changing-it):
naïve inference, KV reuse, ordinary multi-head attention, then shared-KV variants.
Both prefill and decode use the same declared attention configuration.

KDA is a possible later choice. Its existing standalone recurrence demo is a side
lab, not a foundation dependency or an integrated model option. Do not offer an
enabled switch before its execution path and correctness checks exist.

## Computation and simulation boundaries

Keep these responsibilities separate, with explicit inputs and recorded outputs:

- Model execution: tokenizer, embeddings, layers, attention/state mechanisms,
  logits, token selection, and decoding. It owns numerical values and state.
- Resource simulation: scheduling, residency, transfers, and service costs for
  identified work. It owns simulation time and declared resource assumptions.
- Trace and run identity: serialized configuration, vocabulary/corpus/checkpoint
  identities, randomness, code revision, and parent-child observation references.
- Presentation: navigation and visualization of those observations. It does not
  recompute model results or substitute invented tensors for missing evidence.

Changing configuration creates a new identified run. The intended interaction is
compute → inspect while experimenting, not merely choosing a prerecorded animation.
A browser engine or backend may execute the model; the inspection contract must
not depend on that deployment choice. Report incomplete execution explicitly.

Attention implementations need explicit prefill/continuation behavior, state
initialization, state identity, inputs, outputs, and trace observations. KV and
recurrent state must remain distinct representations. Unsupported combinations
fail explicitly. Do not assume a checkpoint trained with one attention mechanism
can be meaningfully evaluated with another: identify compatible parameters and
training, and separate arithmetic comparison from language quality.

## Model preparation boundary

Checkpoint preparation is supporting infrastructure, described in
[model preparation](../implementation/model-preparation.md). Keep any trainer
separate from inference execution and its reader-facing trace/navigation. The
project does not require a training research platform or a backward-pass UI.
Mechanism comparisons may consume differently prepared checkpoints with explicit
provenance; training itself is not a fourth inspection level.

## Repository direction

Current working code remains small:

| Location | Responsibility today |
| --- | --- |
| `scripts/journey.py` | Aggregate event/cost simulator, without GPT execution. |
| `scripts/kda.py` | Standalone numerical recurrence, without a trained model. |
| `scripts/intro_page.py` | Build views and links from canonical definitions and catalog metadata. |
| `web/` | Trace playback, navigation, and inspection. |
| `tests/` | Independent arithmetic checks and generated-site checks. |

As the first numerical path is implemented, introduce a cohesive `observable_gpt/`
package with model, mechanism, simulation, and trace responsibilities. Move the
existing engines into the applicable modules and update callers together; keep
`scripts/` for entry points and site generation. Add maintained vocabulary/corpus
assets and serialized configurations with their first consumers. Do not create
empty packages, speculative plugin loaders, or a second computation in JavaScript
solely to animate values.

The first vertical slice is a fixed-vocabulary prompt through tokenizer,
embedding, one faithful single-head causal GPT layer, logits, selection, and decoded output,
with trace navigation across all three zoom levels. Verify tokenizer behavior,
independent forward calculations, causality, and trace fidelity before connecting
resource costs. Add attention alternatives behind the execution interface only
when their own computation, state semantics, and checks exist.

The [naïve implementation contract](../implementation/naive-inference.md) defines
the initial computation and exclusions. Preserve its explicit uncached reference
when introducing caching; do not route failed optimized execution through it
silently. Add interfaces as the first real variants arrive rather than building
an advanced-attention plugin framework before the baseline.
