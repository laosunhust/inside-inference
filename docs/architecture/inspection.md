# Three levels of inspection

This document owns code boundaries and navigation for the connected instrument.
[Purpose](../purpose/README.md) owns the fixed-vocabulary learning scope;
[ontology](../ontology/README.md) owns shared meanings; the catalog owns lab
placement. The naïve numerical path supports identified checkpoints, with the [shipped trained checkpoint](../../data/model/README.md)
by default. The [KV residency lab](../labs/kv-residency.md) adds cached
execution and a bounded resource scheduler alongside that explicit reference.

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

The uncached adapter does not model resources. The KV residency adapter implements
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
| `inside_inference/model.py` | One complete single-head GPT forward path, explicit checkpoint validation, and tensor observations. |
| `inside_inference/cache_lab.py` | Cached computation linked to admission, retention, retrieval, and virtual resource service. |
| `inside_inference/kv_runtime.py` | Reference execution and logical residency pools. |
| `inside_inference/cuda_runtime.py` | Optional CUDA computation and actual VRAM/pinned-DRAM K/V transfers. |
| `inside_inference/tensor_model.py` | Explicit tensor equations shared by preparation and CUDA inspection. |
| `inside_inference/generation.py` | Unmasked greedy selection, uncached continuation, run identity, and replay. |
| `scripts/dev/serve_intro.py` | Local HTTP adapter to that same execution path. |
| `inside_inference/tokenizer.py` | Exact lexical/byte codec, conversation framing, and actual encoding traces. |
| `inside_inference/corpus.py` | Bounded task recipe, grouping, scoring forms, and corpus audit. |
| `inside_inference/language_data.py` | Separate authored language seed and provenance/coverage audit. |
| `data/` | Candidate vocabulary and maintained corpus inputs. |
| `web/` | Trace playback, navigation, and inspection. |
| `tests/` | Independent arithmetic checks and generated-site checks. |

The `inside_inference/` package owns tokenizer, corpus, model, and generation responsibilities.
As additional mechanisms arrive, keep their simulation and trace responsibilities explicit. Move the
existing engines into the applicable modules and update callers together; keep
`scripts/` for entry points and site generation. Add maintained vocabulary/corpus
assets and serialized configurations with their first consumers. Do not create
empty packages, speculative plugin loaders, or a second computation in JavaScript
solely to animate values.

The implemented first vertical slice is a fixed-vocabulary prompt through tokenizer,
embedding, one faithful single-head causal GPT layer, logits, selection, and diagnostic output-token display,
with trace navigation across all three zoom levels. Verify tokenizer behavior,
independent forward calculations, causality, and trace fidelity before connecting
resource costs. Add attention alternatives behind the execution interface only
when their own computation, state semantics, and checks exist.

The [naïve implementation contract](../implementation/naive-inference.md) defines
the initial computation and exclusions. Preserve its explicit uncached reference
when introducing caching; do not route failed optimized execution through it
silently. Add interfaces as the first real variants arrive rather than building
an advanced-attention plugin framework before the baseline.

## Browser execution and offline replay

The generated `index.html` embeds a compact [artifact bundle](delivery.md) for
inspection of one actual run without a server.
`make serve-intro` adds live prompt/budget changes through the canonical Python
engine. Offline controls never pretend to execute. Live failures keep the prior
run visible with an explicit error. The cost simulator lives at `request-cost.html`;
its schedules are not attached to the numerical run or presented as its timing.
Parameter tensors, source hashes, masks, and complete intermediate tensors remain
available in the exported record even when the UI shows only one position.

Declaration and interaction governance lives in [declarations](declarations.md).
Every run binds the generated model, system, and workload declarations. The browser
keeps editable workloads separate from accepted evidence, and all three zoom levels
share a run-bound inspection cursor. A model card presents the identified artifact;
it does not own request policy or duplicate executable configuration.

The [workload boundary](workloads.md) defines the ordered arrivals and recorded
events. Client token display is projected from delivery events; numerical passes retain
actual tensors. The uncached adapter has no queue or service-time model. `kv-cache.html` consumes
`CacheRun` evidence with virtual times and separate host measurements, under the
KV lab contract.

Generated pages and experiment outputs under `out/` are disposable. Maintained
fixtures and required datasets remain outside it. Today a static deployment can inspect
recorded evidence; executing new inputs currently requires the native service.
The [primary architectural hypothesis](website.md) is execution of the same Python
engine in the browser, preserving declared execution and evidence interfaces. A separate
[feasibility spike](../research/browser-execution-spike.md) passed for the reference
model and KV simulation; the product UI has not yet adopted that execution path.
Restart the native service after contract changes so its identity matches the page.

## Prefix selection and live stepping

`InspectionState.position` is the single sequence cursor. The token strip selects
it; the recorded computation is derived from that position. Inspecting an operand
never moves the prefix. The newest selected output has no embedding computation
of its own yet; details identify the last computed row rather than inventing one.

**Next Token** sends a generated `TokenStepRequest` through the declared token-step
route. It computes one raw-prefix forward pass and returns a `TokenStepResult`.
Selection alone does not execute. A successful earlier-position branch replaces
the suffix; a failed call preserves it. Selecting within generated output retains
the preceding continuation and its budget usage. Selecting within the prompt starts
a new continuation from that exact prefix, without adding chat framing. Partial
byte encodings are numerical inputs, not claims of text comprehension.

The loaded baseline remains an inspectable completed reference run. Stepping makes
new computations; it does not play its next recorded frame. Step exports retain
the consumed request, checkpoint, provenance, tensors and raw-logit selection and
use the CLI replay path. Prior continuation IDs are declared inputs, not evidence
that this stateless call executed their earlier predictions. No KV reuse or
hardware-performance claim is introduced by this interface.

Shared appearance lives in `web/theme.css`; page stylesheets own layout. The site
build and unit harness reject competing appearance rules and direct JavaScript
paint assignments. `primary` is the common action-button variant; token-inspection
controls retain a quieter shared variant. This build check does not parse arbitrary
SVG drawing code or prove visual accessibility.
