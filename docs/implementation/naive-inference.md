# Naïve inference reference

Status: planned. Owns the first implementation's computation boundary.
[Milestones](../purpose/milestones.md) own build order and acceptance;
[purpose](../purpose/README.md) owns vocabulary and project scope.

## First complete computation

Use one request, one sequence, one complete decoder-only GPT block, and one causal
scaled dot-product attention head. Preserve embeddings, declared position handling,
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
