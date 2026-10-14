# Milestones and acceptance criteria

This ledger owns delivery order, milestone-specific acceptance criteria, and
completion status. It implements the [purpose](../purpose/README.md); it does not
define another mission or set project-wide scope. Completing an instrument is
progress toward the purpose, not evidence that a customer outcome improved.

## Evaluation setup

Use the [purpose boundaries](../purpose/README.md#scope-and-boundaries),
[experimental method](../labs/methodology.md), and
[inspection architecture](../architecture/inspection.md) for project scope,
evidence interpretation, and presentation structure. Each lab supplies its
claim-specific validity evidence. The criteria below apply to individual
milestones; they do not replace those authorities.

The 384-ID decision alone does not establish an adequate vocabulary. The first
manifest candidate is complete as an ID allocation, but has known lexical gaps.
Do not fill unused entries with
undocumented dummy words, grow the tokenizer automatically, or switch vocabulary
mid-comparison. Tokenizer comparisons also change sequence lengths and must record
that effect; other mechanism comparisons hold tokenizer and corpus identities fixed.

## B0 — bootstrap checkpoint

This checkpoint can be committed before a tokenizer or model exists. It is complete
when the following are reviewable and repository checks pass:

- Current purpose, ontology, numerical/simulation boundaries, and extension contract.
- Original bootstrap: offline request-cost playground. Superseded by the main-page KV resource experiment.
- Reproducible vocabulary research and explicitly conditional training estimates.
- Public Make workflows, independent checks for implemented arithmetic, and no generated
  runs, checkpoints, or local environments in the commit payload.
- A clear list of implemented, planned, and unvalidated capabilities. No broken local
  documentation references or contradictory current vocabulary commitments.

Current capability ledger:

| Capability | State |
| --- | --- |
| Request cost simulation and ontology inspection | Main-page resource experiment with actual KV computation and explicitly hypothetical service rates; the aggregate-only playground is retired. |
| Vocabulary-budget audit | Implemented counting study; not a tokenizer or language model. |
| 384-entry manifest and reversible tokenizer | Implemented candidate; independent codec checks pass, everyday coverage gaps remain. T1 is not complete. |
| Bounded task corpus | Implemented recipe and audit; template-based and limited in lexical coverage. |
| GPT forward execution | Implemented single-block/head baseline with independent numerical checks and replay; shipped trained weights and explicit compatible checkpoint loading. |
| Checkpoint preparation | [First trained pilot](../research/checkpoint-pilot-2026-10-09.md) exported and numerically verified; provisional development behavior gate failed. L1 test gates remain unevaluated. |
| Learned conversation | Not established; checkpoint preparation is supporting work. |
| Tensor inspection in all three views | Implemented for the naïve baseline; offline replay and local live execution. |
| KV reuse, misses, residency, and admission | Implemented with real cached computation, bounded logical resources, and simulated transfers in the browser. [M2 evidence](../research/kv-residency-2026-10-09.md) passes for the fixed model; service rates remain hypothetical. |
| Attention mechanism switching | Planned; no optimized attention options exposed. |
| Validated hardware, serving, or language-quality claims | Not established. |

Passing B0 does not imply any criterion below is met. A failed future experiment
can still produce a useful, publishable learning result; do not label it a completed
inference-instrument milestone.

## Build order: establish the reference before changing it

The next implementation priority is a barebones, faithful decoder-only GPT. An
advanced paper appearing in the catalog or an existing standalone demo does not
set the implementation order.

| Stage | Add one capability | What must become explainable |
| --- | --- | --- |
| T1 + M1 | Fixed tokenizer and naïve single-head, single-block inference; recompute the full prefix for each generated token. | Where every token, score, mask, intermediate tensor, and output comes from. |
| M2 | KV caching for the same computation and checkpoint. | What is reused, what work disappears, and why next-token logits remain equivalent. |
| G1 | Transfer the M2 cache across a declared logical boundary. | State identity, representation, ownership, and resumed logits relative to uninterrupted execution. |
| M3 | Ordinary multi-head attention with independent K/V per head. | Head splitting, per-head attention, concatenation, projection, and cache layout. |
| M4 | Multi-query attention (MQA) as a controlled change to the multi-head reference. | Which K/V projections and state are shared, what storage changes, and what computation differs. |
| Later | GQA, alternative state mechanisms such as KDA, or other justified interventions. | One new mechanism relative to an already understood reference. |

M1 uses the [naïve inference contract](naive-inference.md).
The planned sequence is M2 → G1 → M3 → M4 after T1/M1 correctness.
G1 depends on M2; M3/M4 retain their preceding numerical baselines. L1 is a separate checkpoint
suitability assessment; it is not a prerequisite for arithmetic, caching, or state
layout experiments. E1's evidence requirements apply to every intervention.
Neither production performance nor an advanced attention mechanism is required
to declare the baseline successful.

## T1 — tokenizer and vocabulary instrument

| KPI | Acceptance criterion | Evidence |
| --- | --- | --- |
| Vocabulary identity | Exactly 384 unique IDs with declared roles; immutable manifest hash recorded in every run. | Manifest validation and boundary-ID checks. |
| Reversibility | 100% exact UTF-8 round trips on the declared fixture suite and deterministic generated cases; no unknown-ID substitution or silent normalization. | Compare original bytes with decoded bytes; include ASCII, accents, composed/decomposed Unicode, CJK, emoji, mixed scripts, whitespace, case, long words, and names. |
| Fallback observability | Every fallback span maps to original byte offsets, bytes, emitted IDs, and reason; summed emitted lengths equal the actual sequence. | Trace-to-execution checks and byte/hex reference calculations. |
| Defined failures | All malformed-encoding, malformed-token-stream, and context-overflow fixtures produce the specified explicit outcome. | Negative tests; no silent truncation or character replacement. |
| In-domain coverage | 100% of the reviewed in-domain dialogue suite is directly representable without byte fallback; report utterance and complete-dialogue coverage separately. | Freeze the manifest first, then review an additional dialogue set; disclose any subsequent vocabulary revision. |

Report tokens per word/byte, fallback fraction, and full framed lengths including
multi-turn history. A fallback test passing says nothing about the model knowing
the word. The current ASCII counting fixture is only a budgeting input, not this
acceptance suite. Do not claim exhaustive Unicode verification from finite tests;
supplement them with the codec's stated rules and invariants.

## M1 — naïve numerical baseline and trace

The first complete path is input → tokenizer → embedding/position → causal GPT
layers → logits → selection → output. Obtaining compatible weights is a
[preparation prerequisite](model-preparation.md), not a second
reader journey through training. Start with one causal attention head and one
complete GPT block, with full-prefix recomputation and explicit intermediate
operations. No KV cache, shared-KV attention, quantization, or fused attention is
needed to pass this milestone. Hand-specified parameters can first verify the
computation; useful learned behavior is assessed separately in L1.

- Every maintained forward and causality test must
  pass against an independent calculation/reference. Declare
  dtype-specific absolute/relative tolerances and comparison scope before evaluation;
  no universal tolerance is asserted for unimplemented precisions.
- Trace values must come from the executed operations. Capturing versus disabling
  trace must preserve outputs and sequence state under the declared deterministic setup.
  All traced inputs/outputs have request, run, step, position, and layer identity
  where applicable; no invented state is used to complete a visual explanation.
- A selected request must be navigable through all three zoom levels, reaching
  actual inputs, intermediate values, outputs, configuration, and evidence type.
- Every baseline selection must equal the full-vocabulary raw-logit argmax, with
  lowest-ID tie-breaking. Integration checks must independently recompute logits
  from exported weights and enforce only TURN_END or token-budget termination.
  Context capacity is admission validation, not an extra successful stop condition.
- A replay from a recorded checkpoint and run specification must reproduce the
  selected inference reference cases within declared tolerances. Include decoding
  RNG state, inputs, sequence state, precision, checkpoint, and code identity.
  Any maintained trainer has separate preparation correctness/resume checks.

These are implementation gates, not evidence that the model is useful at language.

Current M1 evidence: the untrained reference implements the full path, tensor
capture, unmasked greedy generation, and saved-run replay. Independent Decimal
and hand-calculated fixtures cover its binary64 arithmetic; browser checks cover
live/offline navigation and changed-input execution. See the
[reference-execution experiment](../../data/experiments/catalog.yaml). This supports the implemented computation and inspection requirements; it does
not establish completion of every milestone gate. T1's reviewed coverage gate and L1's learned-behavior gate remain
unmet. A separate [trained pilot](../research/checkpoint-pilot-2026-10-09.md) exists;
Cached execution now has [separate M2 evidence](../research/kv-residency-2026-10-09.md);
production timing remains unvalidated.

## M2 — reuse state without changing the answer

Add KV caching to M1 while preserving the tokenizer, architecture, parameters,
positions, precision, prompt, and supplied continuation tokens. Keep the uncached
path as the explicit reference, not an error fallback.

Acceptance: compare next-token logits at every continuation step within declared
tolerances; inspect each layer's cached K/V against the corresponding uncached
calculation; verify masks, absolute positions, cache reset, and context boundaries.
Record retained bytes and the operations actually avoided. Compare logits rather
than only sampled text, which can differ near probability or rounding boundaries.
Do not claim that a cache is faster merely because the count of operations falls.

Current assessment: **passed for the fixed one-block/head, width-8, binary64
instrument**, using seeded and compatible trained weights. The
[KV residency experiment](../../data/experiments/catalog.yaml) links actual K/V and reduced numerical
work to cache hits, misses, transfers, reservations, and queued requests. Its
[evidence record](../research/kv-residency-2026-10-09.md) covers numerical checks,
replay, browser parity, and local DRAM/VRAM measurements. This does not establish
G1's layout-conversion/endpoint protocol, E1's complete performance gates, or
calibrated accelerator predictions.

## G1 — inspect a state handoff

Planned, not implemented. The first scope is one request and a lossless cache
handoff between two logical endpoints, which may run on the same host. Hold the
checkpoint, token history, positions, attention computation, and precision fixed.
This tests state semantics, not a vendor transport or distributed performance.

Acceptance:

- Export the actual M2 K/V and required continuation metadata; import into separate
  consumer state without shared mutable tensor storage. Identify model, request,
  cached positions, representation, and logical endpoints in the trace.
- Exercise an explicit lossless layout conversion and inverse mapping. Inspect
  serialized bytes and reconstructed tensors; compare every resumed next-token
  logit against uninterrupted cached execution using M2's declared tolerance.
  A copy with different endpoint labels is insufficient.
- Reject incompatible identities, shapes, positions, representations, and malformed
  payloads before decode. Expose the minimal handoff lifecycle: producer retains
  state until import succeeds; consumer cannot decode from incomplete state.
  Network retries and distributed failure recovery remain outside this first scope.
- Reproduce the same declared handoff headlessly and through the interactive view.
  Keep actual bytes/computation distinct from any separately modeled transfer cost.

A lossy precision conversion is a subsequent intervention, not part of the lossless
acceptance gate. Declare its numerical error criteria before comparison and report
logit divergence; unchanged selected text does not prove equivalence. Neither
variant requires trained weights. No real cross-vendor interoperability is implied.

## M3 — ordinary multi-head attention

Generalize the verified attention computation to multiple query heads, each with
its own keys and values. Check each head against independent calculations, trace
concatenation/output projection, and repeat M2's cache-equivalence checks. The
one-head setting must reproduce the established one-head computation when supplied
identical parameters. A multi-head checkpoint need not reproduce a differently
parameterized one-head model's language outputs.

## M4 — share K/V with MQA

Hold multiple query heads and per-head dimensions fixed; change the number of K/V
heads from one per query head to one shared K/V head. This is the sharing studied
in the [MQA paper](https://arxiv.org/abs/1911.02150). A single-query-head model cannot
demonstrate this contrast.

Acceptance: verify shared-head mapping and output arithmetic against an independent
reference, cache equivalence within each variant, and explicit K/V storage counts.
Hold sequence length and dtype fixed when comparing bytes. Do not require MQA to
match ordinary multi-head logits for arbitrary weights: sharing changes the model.
Quality claims require compatible checkpoints and their preparation provenance;
mechanical experiments may use identified hand-specified parameters.

GQA may follow as an intermediate K/V-head count; see the
[GQA paper](https://arxiv.org/abs/2305.13245). KDA is a later optional change in state
mechanism, not the next required implementation. The existing recurrence demo can
remain independently inspectable without defining the roadmap.

## L1 — minimal learned behavior

Initial project targets below are engineering acceptance choices, not claims about
child development, production language models, or results already achieved. Freeze
tasks, scorers, splits, seeds, and thresholds before training; record revisions
rather than lowering a threshold after seeing failures.

Use 100 held-out cases, 25 each for **location recall, ownership, negation/choice,
and later corrections**. Cases should recombine familiar words and relationships;
exclude verbatim training examples and disclose template overlap. Development data
is separate. Score the requested fact/choice with predeclared acceptable forms,
not a requirement to reproduce one reference sentence. Each case gets one bounded,
deterministically decoded response, with failures and invalid responses counted.

For a selected model configuration, evaluate three independently prepared
checkpoints with recorded seeds/provenance to check that behavior is not a lucky
run. Preparing these checkpoints is supporting work. Each must achieve:

- At least **90/100 correct overall**, and at least **20/25 in every task family**.
- At least **20 additional correct answers** over the stronger of a predeclared
  context-blind majority-answer baseline and a shuffled-context baseline, on the
  same test set. Define both baselines using training/development data; balance
  cases so this margin is feasible before freezing the suite.
- No vocabulary-rule violations under the default decoding configuration.

Also report held-out loss, repetition, premature stopping, sample dialogues,
training exposure, and train/test gaps; these are diagnostics, not substitutes
for the behavioral score. Full conversational completeness is not established by
these four tasks. No readable neuron/embedding meaning is promised: support any
semantic interpretation with controlled contrasts or interventions.

## E1 — experimentation and cost

One connected experiment must replay a fixed request with one declared mechanism
change, show the relevant equations/state/operations, and preserve access to raw
traces. A precise outcome is sufficient: saved work with equal outputs, numerical
divergence, or a documented failure. Improving every metric is not required.
An attention-family quality comparison normally requires compatible separately
trained checkpoints; an isolated arithmetic lab does not.

For every lab, require a question, baseline, preserved causal relationships,
omissions, validity regime, and false-positive/false-negative risks. An uncalibrated
cost simulation cannot pass as a real-device timing measurement. Unsupported
real-system conclusions remain unresolved even if the experiment runs correctly.

Initial local execution targets, to be measured after implementation:

| KPI | Target and measurement boundary |
| --- | --- |
| Peak working memory | A declared bounded inference/replay workload stays below 8 GiB GPU allocation/reservation and 16 GiB process RAM on the inspected local machine; report workload, method, and other GPU load. |
| Detailed inspection | p95 control-to-render latency below 250 ms for a selected already-loaded trace step over 100 interactions. Report browser and trace size; measure new computation latency separately. |
| Disposable run output | At most 5 GiB per bounded inference experiment, with trace selection and retention declared; no silent loss of required evidence. |

These are starting budgets for a repeatable learning loop, not requirements for
every future mechanism. If exceeded, report the result and revise the scope or
execution strategy explicitly; do not conceal required computation to hit a target.
Checkpoint preparation has separate [cost planning](model-preparation.md#cost-planning);
training speed is not an inference-research success metric.

## Review outcome format

Report each milestone as **passed**, **failed**, or **not evaluated**, with exact
configuration/evidence links. M2 passes for the fixed configuration above. T1, M1,
M3–M4, G1, L1, and E1 are not yet evaluated as complete milestones.
Existing unit tests support only their stated
implemented subcomponents. Review the next milestone using new evidence; do not
use the current hardware's capacity or a polished page as a proxy for completion.
