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

ModelArtifactReference → fixed parameter/tokenizer identity and architecture.
InferenceSystem → execution strategy and supported limits.
InferenceRequest → text and a nested generation policy.
Workload → chronologically ordered, identified request arrivals.
RunBinding / KVRunBinding → the resolved model, system, workload, and ontology subjects consumed by execution.
RequestBinding → the resolved request context and the same ontology binding within a numerical trace.
OntologyBinding → one primary subject and distinct related concepts from admitted ontology.
RunRecord → the bound workload, typed events, and linked numerical traces.
RunOutcome → observed counts and termination; it is not a requested configuration.
InspectionState → a cursor into that run's evidence; it cannot configure execution.

Architecture constraints come from generated ModelArchitecture. Runtime capability
limits belong to InferenceSystem, while a request's maximum new tokens references
that limit. Increasing a ceiling cannot override a selected terminal token. A run
records why it stopped and how much allowance remained unused. Counts include
selected control IDs; visible output count is separate. Model initialization remains
checkpoint preparation and is removed from the request form.

## Control plane and data plane

Source request text belongs to the data plane. The control plane defines rules over
that source (linguistic variants and arrival spacing), inference mechanisms, and
client consumption. A transformation rule is not an initialized request array.
Workload remains the instantiated, ordered input consumed by execution.

ConfigurationPreview composes separately owned workload transformations, system
mechanism choices and client intent. Its fields, choices and defaults generate the
controls; declaration ownership joins those controls to data-plane highlights and
Zoom 3 details. Adding a supported field must not require a parallel UI registry.

This is currently an interface preview. Nondefault transformations, KDA and paused
consumption cannot execute in the landing engine; they mark the affected boundary
without replacing the recorded baseline or fabricating tensors, messages or timing.
The data-plane Apply source action runs only the declared baseline, independently of
preview choices. Its returned binding is verified; preview highlights persist. Recorded
evidence remains inspectable and exportable. SHA identities remain in machine records, not visible presentation.

## Interaction lifecycle

The page holds one editable workload draft (currently one request), one submitted binding while executing,
and one accepted run. These have distinct authority, not competing versions of
current truth. Inspection state always names the accepted run.

- An edit enters `dirty`: results are immediately marked as belonging to the prior
  submitted request, alongside its actual settings. A success message is cleared.
- Submit validates and snapshots the draft and selected model/system binding.
  Controls are locked while executing; inspection of the previous run remains
  explicitly previous evidence.
- Success validates the returned binding and outcome, then replaces the accepted
  run and resets its inspection cursor together. A response for a different binding
  is an error, not a usable substitute.
- Failure preserves the previous evidence, labels it as such, and retains the draft.
- Offline inspection locks execution controls; no edits imply computation.

All three zoom levels, the submitted settings summary, actual/allowed counts,
termination explanation, and download derive from the same accepted run. No tab
is created for an unexecuted prediction. An explicit empty allowance is displayed
as unused budget, not fabricated decode steps.

## Behavioral evidence

Schema generation cannot prove execution semantics. Tests must also establish:
changing the budget changes executed passes unless the raw-logit winner is
TURN_END. Controlled checkpoints test both immediate and later TURN_END selection;
the observed stop and unused budget must explain the actual execution. Editing without submitting, failed submissions,
in-flight edits, stale responses, offline viewing, and moving the inspection
cursor must preserve the lifecycle rules. Numerical correctness remains covered
by independent forward calculations.

## Generated presentation

`catalog/stack.json` owns lab identities, availability, questions, and ontology
bindings. Ontology YAML owns concept meanings and declaration ownership. The build
projects both into `labs-by-concept.html`, individual lab pages, and ontology views;
related subjects cross-reference a single primary listing. Browser operation owners
come from generated declarations. Templates select operations by reference, which
frontend admission checks against the selected ontology projection.

Request controls consume generated field constraints. Standalone KDA controls and
request-cost choices consume the Python-produced traces; neither is a configurable
replacement for the GPT baseline. These older standalone traces do not yet carry
the full ExperimentSpec/execution envelope used by the GPT and KV labs.

Governance rejects unknown literal ontology/lab references, mismatched template
operation owners, authored lab listings, and common forms of handwritten browser
bindings, registries, and numeric field limits. This is bounded source admission,
not analysis of arbitrary JavaScript or proof of scientific relevance. Generated
page tests check links, primary/related projections, and changed source data;
browser tests compare interactive displays with numerical and cost evidence.

## Composing inference mechanisms

InferenceSystem now binds the reference `model_execution` configuration.
KVResidencySystemConfig binds `model_execution`, `scheduling`, `kv_cache`,
`transfer`, and `compute_service`, retaining only system-wide admission ceilings
at the composition level. Each component's declaration has its own ontology owner.
The cache form traverses those generated references, and execution reads the same
nested configurations. Legacy flat settings fail validation rather than being
silently migrated or ignored.

Prediction-step and token-selection evidence belongs to Decoding; forward work
and numerical precision belong to ModelExecution. Generic tensor and event
containers remain shared evidence infrastructure. Response publication remains a
separate boundary and is not a numerical-computation lab subject. See the
[ontology decomposition](../ontology/README.md#decomposition-under-test) for the
current limits and counterexamples motivating these responsibilities.
