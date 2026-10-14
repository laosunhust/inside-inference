# Three levels of inspection

This document owns code boundaries and navigation for the connected instrument.
[Purpose](../purpose/README.md) owns the fixed-vocabulary learning scope;
[ontology](../ontology/README.md) owns shared meanings; the catalog owns lab
placement. The main page selects identified artifacts from the [model inventory](../../data/models/README.md),
with the 4M continuation model initially selected and the 8K model available for numerical inspection. The [KV residency lab](../labs/kv-residency.md) adds cached
execution and a bounded resource scheduler alongside that explicit reference.

## One experiment, three panels

| Panel | Responsibility |
| --- | --- |
| Experiment | Configure workload transformations, inference system and customer conditions. |
| Interaction | Edit request, model and generation settings; generate tokens and read output. |
| Explanation | Follow the request and transformer steps; inspect available evidence. |

The panels share the selected model, request and inspection cursor. Explanation
supports an architecture walkthrough for every loaded model, and recorded tensor
inspection where available. A walkthrough is not a captured execution trace or a
performance measurement. Keep request, layer and sequence position when navigating.

The first path is request → prefill or decode → naïve causal attention and its
actual arithmetic. Establish this reference before adding a mechanism selector.
Follow the [incremental milestone order](../implementation/milestones.md#build-order-establish-the-reference-before-changing-it):
naïve inference, KV reuse, lossless state handoff, ordinary multi-head attention,
then shared-KV variants.
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

## Connecting numerical execution to resource simulation

Ordinary generation does not model resource service. The optional KV residency experiment implements
this connection for exact-prefix reuse, bounded KV reservations, and serial service.
Actual execution supplies identified operations, tensor shapes, and state contents.
An explicit mapping supplies modeled work, memory traffic, allocation, and transfer
requirements to the resource simulator. Both views retain links to their evidence;
the simulator owns virtual completion times, not the host execution clock.

Do not assume logical tensor size equals device traffic, Python memory usage equals
accelerator allocation, or a tiny operation's measured duration scales linearly to
a production operation. If a scenario uses larger model dimensions, identify it as
a modeled target configuration and expose the mapping from the small computation.
Its tensors were not executed at that larger scale.

For each question, preserve the relevant relationships: compute versus data movement,
working set versus capacity, transfer versus saved work, offered load versus service
capacity, and dependencies versus permitted overlap. Effective operation rates may
depend on shape, batch, precision, and implementation. Start with the smallest
resource model adequate for the lab; reuse profiles or simulator adapters where fit
is demonstrated. Do not create a second numerical engine to explain its outcomes.

Constrained CPU/RAM/SSD experiments can provide additional observations, but resource
limits do not by themselves emulate a GPU or memory technology. Declare what those
experiments represent and validate the mapping. Event simulation may advance through
modeled delays without slowing the user's browser in real time. Candidate-selection
claims follow the [screening evidence rules](../labs/README.md#candidate-screening).

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
| `inside_inference/labs/journey.py` | Aggregate event/cost simulator, without GPT execution. |
| `inside_inference/labs/kda.py` | Standalone numerical recurrence, without a trained model. |
| `scripts/build/intro_page.py` | Build views and links from canonical definitions and catalog metadata. |
| `inside_inference/model.py` | Checkpoint validation and the lab computation interface. |
| `inside_inference/runtimes/engine.py` | One NumPy decoder for every architecture, retained K/V state, and observations of executed values. |
| `inside_inference/runtimes/bpe.py` | Byte-pair tokenizer for the 4096-ID models, ported from pinned llama2.c. |
| `inside_inference/delivery/models.py` | Declared model operations: catalog, verified asset loading, tokenization, generation and KV simulation. |
| `inside_inference/cache_lab.py` | Cached computation linked to admission, retention, retrieval, and virtual resource service. |
| `inside_inference/kv_runtime.py` | Shared-engine lab orchestration and logical residency pools. |
| `inside_inference/tensor_model.py` | Tensor equations used only by optional checkpoint preparation. |
| `inside_inference/generation.py` | Shared unmasked greedy selection. |
| `scripts/dev/serve_intro.py` | Static-only local preview server. |
| `inside_inference/tokenizer.py` | Exact lexical/byte codec, conversation framing, and actual encoding traces. |
| `inside_inference/corpus.py` | Bounded task recipe, grouping, scoring forms, and corpus audit. |
| `inside_inference/language_data.py` | Separate authored language seed and provenance/coverage audit. |
| `data/` | Candidate vocabulary and maintained corpus inputs. |
| `web/` | Trace playback, navigation, and inspection. |
| `tests/` | Independent arithmetic checks and generated-site checks. |

The `inside_inference/` package owns tokenizer, corpus, model, and generation responsibilities.
As additional mechanisms arrive, keep their simulation and trace responsibilities explicit. Keep computation in the shared engine and update callers together; keep
`scripts/` for entry points and site generation. Add maintained vocabulary/corpus
assets and serialized configurations with their first consumers. Do not create
empty packages, speculative plugin loaders, or a second computation in JavaScript
solely to animate values.

The implemented first vertical slice is a fixed-vocabulary prompt through tokenizer,
embedding, declared single-head causal GPT blocks, logits, selection, and diagnostic output-token display,
with trace navigation across all three zoom levels. Verify tokenizer behavior,
independent forward calculations, causality, and trace fidelity before connecting
resource costs. Add attention alternatives behind the execution interface only
when their own computation, state semantics, and checks exist.

The [naïve implementation contract](../implementation/naive-inference.md) defines
the initial computation and exclusions. Preserve its explicit uncached reference
when introducing caching; do not route failed optimized execution through it
silently. Add interfaces as the first real variants arrive rather than building
an advanced-attention plugin framework before the baseline.

## Model selection and live stepping

The generated landing page embeds only an initial `GenerationInput`, derived from
[data/models/initial.yaml](../../data/models/initial.yaml) with the admitted control bindings. It does not embed a completed run or checkpoint. The browser
loads the selected model through the same declared interface used headlessly.
The input row's **Edit** opens model selection and request settings. Selecting
loads immediately, preserves input and generation settings, and clears prior tokens,
output, observations, replay and exports. A late load or prediction cannot repopulate
another model's state. Incompatible input/settings fail visibly without repair.

`ExecutionSpec` composes ontology-bound `ExperimentSpec` controls for model selection and KV reuse. `Workload`
owns request input and generation policy. Preparation tokenizes without inference;
**Next Token** submits a `GenerationStep` and accepts a `GenerationPrediction`.
**Generate** repeats that same operation until stopping or the user stops it.
Reset clears the continuation while retaining input/settings. The Output Details
panel exposes the single combined token sequence.

`InspectionState.position` is the only prefix cursor. Selecting a position does
not execute. The next operation uses that prefix; a successful branch replaces
the later continuation. Selecting inside generated output preserves prior output
and budget usage. Selecting inside input starts a new continuation, without adding
chat framing. Observation selection and **Token Journey** share the diagram/detail
cursor without moving the selected prefix. Input/model changes, reset and new
execution cancel journey replay. Replay navigates the selected architecture or recorded work; its animation interval
is not execution timing.

`ArchitectureWalkthrough` declares one shared graph, stage labels, operation homes and ontology owners;
`ArchitectureStage` references are mechanically checked against admitted ontology.
The selected artifact supplies the layer count. A compact generic schematic shows
one repeated transformer block; the layer picker and playback use the same cursor.
Step details identify RoPE on Q/K, RMSNorm and SiLU-gated feed-forward for the larger
models, versus learned positions and GELU for the tiny model. Optional cache reuse
is not part of the architectural diagram. Declared schematic edges preserve residual
branches; they do not claim captured tensor dependencies. These stages are explanatory, not fabricated `TensorObservation` records.
`InspectionState.architecture_step` selects one of them; `observation_id` selects
captured evidence. These are mutually exclusive surfaces of the same cursor.

The diagram has the same shape before and after execution, for every model.
Actual observations attach to declared stages; they never construct a second graph.
Token IDs expose the actual encoded input, and embedding inspection identifies the
selected vocabulary row and vector width. The 8K inspector exposes captured tensors
and parameters. Causal attention observations contain only keys actually visited by
each query; masked future cells are not fabricated. With reuse enabled, an earlier
query may not have executed in this pass; the inspector says so rather than showing
an unrelated row. Larger models expose real tokens and logits while intermediate
tensor capture remains unavailable. **Switch to 8K for tensors** changes the model
and clears output; it never explains a larger model's output using tiny-model values.

KV reuse is an execution control for every model. Full-prefix execution recomputes
all supplied positions; reuse evaluates only a verified retained prefix's extension.
A divergent or shortened prefix recomputes. Model changes and input preparation
clear retained state. Evidence distinguishes processed and retained positions;
these are computation facts, not simulated latency or accelerator placement.

Streaming text is decoded from the selected IDs. The 384-ID codec needs three IDs
per fallback byte; a complete character can require several bytes. Valid unfinished
suffixes wait without a warning. Malformed IDs and incomplete terminal output retain
a diagnostic and the preceding valid text; no replacement characters or token repair
are inserted. Token Details preserves all IDs, including the pending suffix.

The current execution endpoint is local to the browser worker. It models no network,
queue, placement or accelerator memory budget. A native preparation reference and
the separately declared KV lab remain available; neither silently substitutes for
failed main-page model execution. Model download size is not simulated HBM residency.
[Delivery](delivery.md) owns operation, asset loading and export boundaries.

Shared appearance lives in `web/theme.css`; page stylesheets own layout. The site
build and unit harness reject competing appearance rules and direct JavaScript
paint assignments. `primary` is the common action-button variant; token-inspection
controls retain a quieter shared variant. This build check does not parse arbitrary
SVG drawing code or prove visual accessibility.
