# Declaration ownership and browser state

The [declaration ontology modules](../ontology/README.md) own meanings, lifetimes,
exclusions, schema names, and permitted capability reads. The
[contract](../../data-model/declarations.yaml) owns field shapes, baseline defaults,
labels, constraints, and references. Neither may silently redefine the other.
Visual meanings bind to declared fields in those same owners; no separate prose
ontology can introduce domain authority.

The contract is a deliberately bounded JSON Schema vocabulary, read with duplicate
key rejection. Generation rejects unsupported keywords, unowned/duplicate schema
names, dangling references, and declaration cycles. Python frozen
data classes, browser validators, and field metadata are generated
from it. Generated files are checked in and are never edited by hand. `make _data-models` regenerates them; `make _check` checks exact output without repairing it.

## Declared layers

- `ModelArtifactReference`: resolved weights, tokenizer and architecture.
- `ExecutionControl`: an ontology-bound system control; `ExecutionSpec` composes them.
- `ExperimentSpec`: a labeled selectable configuration containing a complete `GenerationInput`.
- `GenerationInput`: execution configuration and a separate `Workload`.
- `GenerationPrepared`, `GenerationStep`, `GenerationPrediction`: encoded input,
  submitted prefix and observed selected-model computation.
- `ResourceExecution`: the same submitted configuration/workload, cache simulation
  evidence and decoded output.
- `CacheRun` / `KVRunBinding`: resolved model and resource configuration, causal
  events, computations, KV states, provenance and observed completion outcomes.
- `InspectionState`: selection over accepted evidence, not a second execution.

## Composed execution

`ExecutionSpec.experiments` is the sole editable execution configuration. Each
`ExecutionControl` names a declared control, its value and its ontology binding.
Conflicting assignments and unsupported controls fail before computation; list
order does not decide which value wins. The current executable controls select a
model, enable or disable KV reuse, and optionally configure KV residency. Model architecture remains owned by the
artifact; cache policy is independent of model size.

`Workload` supplies customer input and per-request generation settings separately.
There is no parallel UI preview object. Unimplemented transformations and client
conditions are unavailable, rather than settings the engine silently ignores.
`GenerationPrediction` retains the consumed specification and actual processed /
retained position counts. Matrix FLOP counts exclude scalar normalization,
activation and softmax; they are not hardware timings.

## Interaction lifecycle

One selected experiment, workload, prepared input and optional prediction govern
the main page. [Inspection architecture](inspection.md#model-selection-and-live-stepping)
owns its selection, switching and reset behavior. Generated declarations validate
submissions and results; the session rejects stale model, request and prefix identities. Numerical selection
and stopping are owned by execution and verified by the harness. A model card is a projection of the catalog's descriptor,
not a second configuration authority.

## Behavioral evidence

Schema generation cannot prove execution semantics. Tests must also establish:
changing the budget changes executed passes unless the raw-logit winner is
the selected model's declared end token. Adversarial selection tests cover terminal and nonterminal IDs, including byte/control IDs;
the observed stop and unused budget must explain the actual execution. Editing without submitting, failed submissions,
in-flight edits, stale responses, offline viewing, and moving the inspection
cursor must preserve the lifecycle rules. Numerical correctness remains covered
by independent forward calculations.

## Generated presentation

The [experiment catalog](../../data/experiments/catalog.yaml) declares every lab as
ExperimentSpec variants, missing controls and an abstraction contract; ExperimentDesign
owns it and generation publishes it to Python and the browser. An experiment is
executable exactly when it lacks no controls. The Inference system configuration
selects complete configurations without generating output; there are no standalone lab pages. Browser operation owners
come from generated declarations. Templates select operations by reference, which
frontend admission checks against the selected ontology projection.

Request controls consume generated field constraints. KV residency and every other
executable experiment use the main page.

Governance rejects unknown literal ontology/lab references, mismatched template
operation owners, authored lab listings, and common forms of handwritten browser
bindings, registries, and numeric field limits. This is bounded source admission,
not analysis of arbitrary JavaScript or proof of scientific relevance. Generated
page tests check links, primary/related projections, and changed source data;
browser tests compare interactive displays with numerical and cost evidence.

## Composing inference mechanisms

KVResidencySystemConfig binds `scheduling`, `kv_cache`,
`transfer`, and `compute_service`, retaining only system-wide admission ceilings
at the composition level. Each component's declaration has its own ontology owner.
The main-page resource editor traverses those generated references, and execution reads the same
nested configurations. Legacy flat settings fail validation rather than being
silently migrated or ignored.

Prediction-step and token-selection evidence belongs to Decoding; forward work
and numerical precision belong to ModelExecution. Generic tensor and event
containers remain shared evidence infrastructure. Response publication remains a
separate boundary and is not a numerical-computation lab subject. See the
[ontology decomposition](../ontology/README.md#decomposition-under-test) for the
current limits and counterexamples motivating these responsibilities.

## Configure, inspect, then execute

Each catalog variant contains both Workload and ExecutionSpec through GenerationInput.
Selecting a variant replaces both, prepares the input and clears previous output and
measurements. It never generates tokens. Interaction shows the actual selected model,
KV-reuse state, mode, input and token limit; its settings disclosure exposes all
request and execution values. Generate and Next Token are the execution actions.

KV-reuse variants share identical input except for kv_reuse. Both start cold; the
second token exposes the difference in computed and reused positions. Counts derive
from the accepted timing ledger, not from which button was selected. Single-run
timing does not establish a statistically resolved speedup. Retained headless pilot
evidence remains a separate protocol and measurement scope.
