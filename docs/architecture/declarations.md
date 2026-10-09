# Declaration ownership and browser state

The [declaration ontology modules](../ontology/README.md) own meanings, lifetimes,
exclusions, schema names, and permitted dependencies. The
[contract](../../data-model/declarations.yaml) owns field shapes, baseline defaults,
labels, constraints, and references. Neither may silently redefine the other.
Visual meanings bind to declared fields in those same owners; no separate prose
ontology can introduce domain authority.

The contract is a deliberately bounded JSON Schema vocabulary, read with duplicate
key rejection. Generation rejects unsupported keywords, unowned/duplicate schema
names, forbidden cross-owner references, and dangling dependencies. Python frozen
data classes, browser validators, and field metadata are generated
from it. Generated files are checked in and are never edited by hand. `make _data-models` regenerates them; `make check` checks exact output without repairing it.

## Declared layers

ModelArtifact → fixed parameter/tokenizer identity and architecture.
InferenceSystem → execution strategy and supported limits.
InferenceRequest → text and a nested generation policy.
Workload → chronologically ordered, identified request arrivals.
RunBinding → the model, system, and workload bound together for execution.
RequestBinding → the resolved request context within a numerical trace.
RunRecord → the bound workload, typed events, and linked numerical traces.
RunOutcome → observed counts and termination; it is not a requested configuration.
InspectionState → a cursor into that run's evidence; it cannot configure execution.

Architecture constraints come from generated ModelArchitecture. Runtime capability
limits belong to InferenceSystem, while a request's maximum new tokens references
that limit. Increasing a ceiling cannot override a selected terminal token. A run
records why it stopped and how much allowance remained unused. Counts include
selected control IDs; visible output count is separate. Model initialization remains
checkpoint preparation and is removed from the request form.

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
