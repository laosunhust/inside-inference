# Inference and experiment ontology

This directory defines shared meanings, relationships, and invariants for the
observable inference laboratory. Domain meaning is separate from implementation.
These are project contracts for reasoning and future implementations, not claims
that a serving simulator already exists or that an abstraction has been validated.

| Authority | Owns |
| --- | --- |
| [Purpose](../purpose/README.md) | Why we build, learning priorities, and public presentation direction. |
| [Inference ontology](inference.md) | Requests, work, sequence state, resources, policies, and their relationships. |
| [System optimization](system-optimization.md) | Invariants versus constraints, inputs, decision variables by time scale, and objectives. |
| [Experiment ontology](experiment.md) | Abstraction contracts, comparisons, evidence, applicability, and execution budgets. |
| [Declaration ontology](declarations.json) | Model/system/request/run/inspection ownership, lifetimes, admitted schema names, and dependency permissions. |
| [Data model](../../data-model/README.md) | Field contracts and generated consumer models; constrained by ontology ownership. |
| [Catalog](../../catalog/README.md) | Discoverable areas, innovation identities, and links to labs. |
| Executable code and tests | Implemented behavior and enforcement of the applicable contracts. |
| Individual lab evidence | Whether a particular claim is supported under stated conditions. |

The ontology constrains implementation meaning; code records what actually runs.
A mismatch is a defect to resolve, not permission for either to silently redefine
the other. Neither ontology prose nor a passing schema check proves physical
accuracy. Empirical claims need evidence outside the definitions themselves.

## Representative and inexpensive are separate requirements

Choose the least expensive abstraction that preserves the relationships needed
for the question, with evidence for that choice. Do not simplify until something
runs and assume that the resulting behavior remains representative.

A useful experiment needs both a supported scope and a measured execution cost.
When the two conflict, narrow the question, bound the workload, or use another
instrument. Keep unresolved claims visible. A small numerical demonstration and
a larger event simulation may coexist without pretending they use the same model
scale or establish the same facts.

Read the relevant definitions before introducing new simulation concepts. Keep
IDs and terms consistent across labs and the atlas. Extend these documents when
a concrete question requires a new concept; do not predefine an entire data center.
Markdown tables are the initial representation. Add machine-readable schemas
with their first consumers rather than maintaining an unused parallel schema.
