# Naïve GPT: follow the actual numbers

## Abstraction and evidence contract

Question: what happens to token IDs, causal dependencies, and next-token scores
when one input changes, holding the vocabulary and parameters fixed?

The instrument executes one complete decoder-only GPT block with one causal
attention head. Token embeddings, learned absolute position embeddings, pre-layer
normalization, attention, residuals, GELU feed-forward, final normalization, and
untied output projection are preserved. Every continuation recomputes the whole
prefix. This preserves the baseline's arithmetic and causal dependencies; it
does not simulate a scheduler, network, cache, accelerator, or training process.

The default checkpoint contains seeded **untrained** parameters. Explicit checkpoint
loading also supports the [bounded trained pilot](../research/checkpoint-pilot-2026-10-09.md). Its outputs do not
establish language understanding. Unmasked greedy selection compares all 384 logits;
readable words and spacing are not enforced. Changing a prompt is an intervention on the
input; changing the initialization seed changes the checkpoint, not an inference
optimization. No attention alternatives are offered before implementation.

The admitted architecture schema owns dimensions, context limit, precision, and
normalization constants. Parameters and their identity travel with exported runs.
Python binary64 storage, computation, and accumulation are used; UI rounding is
display precision only. JSON stores full round-trippable floats. No host timing
is a simulated GPU latency.

Validation plan, declared before evaluation: compare complete small forward
passes to independent high-precision Decimal equations (absolute and relative
tolerance 1e-10 for binary64). Include nonzero parameters, normalization scales
and biases, multiple positions, causal counterfactuals, extreme finite softmax
inputs, context boundaries, and trace-on/off equality. Replay saved parameters
and request specifications; check raw-logit winners and the two declared stop conditions.
Inspect browser navigation and a changed-input run, including failures.

Scope limits: a correct tiny forward pass supports inspection of this architecture,
not quality or performance transfer to production models. Width, parameter scale,
and inputs can change observed attention patterns. Random preferences are not
learned relationships. These create both false-positive and false-negative risks
when inferring the value of an optimization from this instrument.

Execution budget: bounded prompt context and generated-token count, with complete
tensors retained for all executed passes. Context overflow fails explicitly;
reaching an output budget reports a limited continuation, not a completed answer.
Measure runtime and serialized trace size on the default and boundary workloads
before claiming suitability for local interactive use.

The offline page inspects a run computed at build time. Live execution uses the
same Python engine via the local development server; JavaScript only presents
returned observations. Definitions are generated from the ontology. Neither
offline playback nor a failed live request may manufacture model results.

## Current evidence

The maintained checks cover hand-calculated uniform attention/residuals and
independent 50-digit Decimal calculations for every intermediate tensor at widths
2 and 8, with nontrivial normalization scales and biases. Binary64 comparisons
use the declared 1e-10 absolute/relative tolerance. Causal counterfactuals and
prefix-only evaluation agree exactly at earlier positions; capture on/off leaves
outputs unchanged. Generation checks cover every vocabulary ID as a possible winner, real checkpoints
that repeatedly select punctuation/control/byte IDs, immediate and later TURN_END,
capacity admission errors, and saved-record tampering.

The browser check visits all three zoom levels, compares a rendered tensor to its
recorded observation, changes input while holding parameters fixed, inspects byte
fallback and all vocabulary scores, rejects an oversized request without replacing
the prior run, and checks offline/mobile inspection. These are implementation
checks, not evidence of learned language or external performance transfer.

A historical sample under the removed lexical grammar on Linux x86-64, Python 3.12.3 measured the default three-pass request
at about 35 ms execution plus 14 ms JSON serialization (0.87 MB record). A stress
case retaining eight forward traces at lengths 121 through 128 took about 0.65 s
execution plus 0.39 s serialization (23.3 MB). Combined process peak RSS was about
97.5 MiB. The stress case supplies IDs directly, independently of generation's
possible early stop; it is not a sampled conversation. These single samples support
bounded local use only, not a latency guarantee. Run `make _measure-inference` to
regenerate platform, code, checkpoint, workload, and cost evidence under
`out/experiments/naive-gpt/`. That directory is disposable; this summary preserves
the finding. The default checkpoint hash in that sample begins `44d991d4e35e`.

The supported conclusion is that the naïve instrument executes and exposes its
specified arithmetic, with practical local trace costs at the tested bounds.
Vocabulary coverage remains incomplete and no learned-quality gate has been
attempted. The public static site can inspect a recorded run; live public
execution and numerical-to-resource-cost integration remain future work.

## Declaration and interaction evidence

The [declaration contract](../../data-model/README.md) now separates model artifacts,
system capabilities, request generation policy, run outcomes, and inspection state.
The earlier lexical mask reduced the candidate set after each word and forced
TURN_END after punctuation. It was removed because it changed generation beyond
what the baseline is intended to demonstrate. The acceptance policy changed
explicitly with that removal: all 384 logits now compete. Default budgets 1/2/3/8
produce 1/2/3/8 predictions, while controlled real checkpoints exercise genuine
early stopping. The integration oracle recomputes full-vocabulary winners directly
from exported weights, without using the generation selector, and applies to
headless, CLI, HTTP, browser-download, and replay evidence.

Browser tests verify dirty/applied separation, the bound ceiling displayed beside
actual steps, in-flight control locking, failed-request preservation, and offline
read-only controls. Pure state-transition tests reject stale responses and invalid
inspection cursors. Generator tests reject competing owners, unowned schemas,
forbidden dependencies, unsupported keywords, and stale generated consumers. This
addresses the earlier interaction gap; numerical agreement alone did not prove it.

The execution-cost sample above predates this declaration refactor and uses the
then-default prompt; it is historical feasibility evidence, not a current latency
measurement or an acceptance threshold.

The exported record now wraps numerical traces in a workload run. Arrival, encoding,
forward completion, selection, delivery, and request completion events are recorded during
execution. Client output derives from delivery events. This first adapter accepts
only one arrival at zero and records execution order without claiming latency.
See the [input/output contract](../architecture/workloads.md).

For exact replay, pass the downloaded record to
`.venv/bin/python -m scripts.experiments.run_inference --replay PATH`.
Replay verifies source and checkpoint identity as well as the resulting evidence.

Changes to decoding filters, forced tokens or stops, output repair, or other
inference policies require explicit authorization and a declared contract. The
raw-logit selection and declared-termination integration oracle must be preserved.
