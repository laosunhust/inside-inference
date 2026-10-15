# Naïve inference reference

Status: implemented with the [shipped trained checkpoint](../../data/model/README.md)
and explicit compatible checkpoint loading. Owns the baseline computation boundary. The first trained pilot and its
limits are recorded under [model preparation](model-preparation.md).
Default execution is an inspection baseline, not a selectable experiment. Its scope and evidence are recorded below.
[Milestones](milestones.md) own build order and acceptance;
[purpose](../purpose/README.md) owns vocabulary and project scope.

## First complete computation

Use one request, one sequence, and one or two complete decoder-only GPT blocks,
with one causal scaled dot-product attention head per block. The shipped baseline
remains one block. Preserve embeddings, declared position handling,
normalization, residual connections, a feed-forward sublayer, output projection,
and next-token selection. Small means fewer dimensions and layers, not deleting
operations that define the GPT baseline.

At each generation step, run the complete prefix through the model again, inspect
the final-position logits, select the next token under the declared decoding rule,
and append it to the input for the next step. The first prompt pass supplies the
first next-token logits. This deliberately repeats computation; it is the reference
against which later reuse will be understood.

Materialize Q, K, V, scaled scores, the causal mask, attention probabilities,
weighted values, residual/normalization results, feed-forward intermediates, and
logits. Record actual tensor values, shapes, dtypes, positions, and dependencies.
Normalization order, position scheme, width, FFN size, numerical precision, and
selection rules must be explicit in the first executable configuration. The
historical width-4 or FP16 proposals are not silently adopted defaults.

Straightforward tensor operations are acceptable. Naïve does not require a slow
scalar object graph; it requires visible, independently checkable computation.
Do not use fused attention that hides states required by the trace contract.
No KV cache, cross-request prefix reuse, MQA/GQA, recurrent attention, batching,
quantization, or speculative generation is needed for this reference.

## Evidence before optimization

Start with hand-checkable parameter/input fixtures. Verify projections, masking,
softmax, value aggregation, residual paths, feed-forward operations, and logits
against independent calculations. Changing future positions must not change earlier
outputs. Test numerical edge cases and context boundaries explicitly.

Keep observed operation counts and actual storage separate from hypothetical
resource costs. Measured host time is another observation. A faithful forward
reference does not by itself validate a scheduler or hardware abstraction.

A compatible checkpoint adds meaningful generated examples; obtaining it is
[model preparation](model-preparation.md). Poor language quality must not be hidden
with scripted answers and need not prevent correct numerical experiments.

## Extend from this reference

Add KV caching first, comparing the cached continuation against full recomputation
with the same parameters and token history. Maintain the uncached path as an
explicit selectable reference. It is not a fallback for failed cached execution.

Then add ordinary multiple heads and inspect their independent K/V state. Only
once multiple query heads are understood does sharing one K/V head make a useful
MQA experiment. Keep dimensions, mappings, parameter identities, and any changed
checkpoint preparation explicit. More advanced state mechanisms come later, each
with its own baseline, invariants, and evidence boundary.

## Implemented interfaces

`data-model/domains/model.yaml` owns the architecture fields and constraints;
its generated `ModelArchitecture` is consumed directly by the forward engine.
`initialize` creates a reproducible untrained checkpoint; `Model.forward` consumes
IDs and emits logits plus observations from executed operations. Disabling capture
changes retention only. `inside_inference.generation.run_request` owns prompt framing,
full-prefix continuation, unmasked greedy selection, stopping, and run identity.

Every exported run includes the complete checkpoint, parameter hash, vocabulary
hash, input/framing trace, code source hashes and revision, Python version,
configuration, precision, and each pass's input sequence. Greedy selection has no
sampling RNG; initializer seed is recorded separately. Node dependencies reference
other observations or checkpoint parameters. Block weights and K/V have a leading
layer axis; shared embeddings and final projection do not. Observation IDs include
the block index, while operation names keep their shared ontology meaning. Positions are zero-based. Boolean
causal masks exclude future scores before normalization; zero probability records
that exclusion without nonfinite JSON values.

Selection compares all 384 raw logits, resolving ties by lowest ID. There is no
output grammar, filtering, repetition penalty, or minimum length. Only TURN_END
and the requested maximum new-token count terminate an admitted run. Before
execution, prompt length plus budget minus one must fit positional capacity: the
last predicted ID needs no additional forward pass. Oversized requests fail;
there is no successful context-limit stop or implicit truncation.

The trace retains raw logits, full-vocabulary softmax probabilities, and the
selected ID. Delivered IDs exclude only TURN_END. `output_display`,
`display_so_far`, and delivery `display_delta` are diagnostic token renderings:
word/space/punctuation pieces are concatenated exactly, while byte/hex/control
IDs have labeled markers. This renderer cannot influence selection or stopping;
it does not claim that arbitrary untrained output is valid UTF-8 codec input.

`replay` checks checkpoint and source identity before executing a serialized run.
Changed source versions require the original checkout; replay does not silently
accept changed semantics. The local HTTP endpoint uses the same request function
as CLI export and site generation. Browser JavaScript reads its results and the
canonical ontology definitions, without reimplementing tokenizer or GPT math.

The numerical trace binds its model, system, and request through `RequestBinding`.
The outer workload run binds `ModelArtifactReference`, `InferenceSystem`, and `Workload`.
`GenerationPolicy` owns selection and stopping; `RunOutcome` records selected and
delivered counts, unused allowance, and the observed stop condition. Checkpoint
preparation seed remains artifact provenance, not an inference request control.


## Baseline scope and evidence

**Target regime.** One decoder-only causal Transformer executed by the shared NumPy engine; the 8K checkpoint exposes every intermediate tensor, the 0.5M and 4M checkpoints expose logits.

**Preserved.** Token IDs, embeddings and positions, normalization, causal attention, residuals, feed-forward activation, output projection and unmasked greedy selection over every vocabulary ID, with the declared stop conditions. Every continuation recomputes the prefix when KV reuse is off.

**Omissions.** No scheduler, network, cache tiers, accelerator or training process. Host timings are not simulated device latency.

**Evidence plan.** Compare every intermediate tensor with independent 50-digit Decimal equations, upstream exported logits and recorded fixtures; check causal counterfactuals, context boundaries, trace on/off equality and hand recomputation of displayed values.

**Limits.** Correct tiny arithmetic supports inspection of this architecture, not learned quality or production performance. Width, scale and inputs change attention patterns, creating false-positive and false-negative risks for judging optimizations.

Evidence: [python-engine](../../governance/evaluations/results/2026-10/13/first-principles/python-engine.yaml), [panel](../../governance/evaluations/results/2026-10/13/first-principles/panel.yaml).
