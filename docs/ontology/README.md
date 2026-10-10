# Executable ontology

Only this README may contain standalone prose in this directory. The ontology
itself is registered YAML, consumed by declaration generation and visual inspection.
`make check`, `make test`, and `make test-integration` reject additional prose files,
unregistered files, nested authorities, symlinks, malformed modules, and ownership drift.

| Authority | Owns |
| --- | --- |
| [Manifest](declarations.yaml) | Exact module inventory. |
| [Model](model.yaml) | Parameter identity and numerical sequence-state snapshots. |
| [Inference system](inference-system.yaml) | Execution configuration, requests, responses, workloads, and current logical resource limits. |
| [Hardware](hardware.yaml) | Observed compute and storage backend identity. |
| [Experiment](experiment.yaml) | Experiment specifications, executions, causal events, and numerical/measurement observations. |
| [Interface](interface.yaml) | Inspection cursors, advertised execution capabilities, and service errors. |
| [Tokenizer](tokenizer.yaml) | One tokenizer concept owning vocabulary entries, framing inputs, encoding spans, and results. |
| [Data model](../../data-model/README.md) | Concrete field shapes and generated consumers. |

## Enforced mapping

Each concept grants an explicit, nonempty list of declaration names using `schemas`.
Every declaration has exactly one concept as its `x-owner`; supporting records may
share that owner. Unused grants, unowned schemas, duplicate
owners, and forbidden dependencies fail admission. Owners cannot introduce fields;
field shapes remain in the data model.

Each visual projection belongs to one owner and names existing fields in that
owner's schemas. Unknown labels, missing fields, and cross-owner bindings fail
checks. The site derives meanings and declaration links from these projections;
there is no parallel Markdown glossary. A projection labels a view of a declaration,
not a new independently configurable entity. Structural mapping does not prove
that computation or an abstraction is correct; behavioral tests and lab evidence
remain necessary.

The shared loader and admission checker run before generating Python models,
browser validators, or pages. `make _data-models` explicitly regenerates consumers;
checks never repair drift. [Architecture](../architecture/declarations.md) explains
how the declarations govern execution and inspection. [Lab guidance](../labs/README.md)
explains how to assess evidence without treating prose as an enforced contract.

## Not yet declared

A configurable **worker** would identify an execution location within the inference
system, with supported work and bindings to resources. It need not correspond to
one GPU, process, Pod, or machine. Prefill and decode are phases of work; an
experiment must explicitly introduce separate locations to study their placement.
The current KV lab has one serialized execution resource and no worker-fleet
configuration. There is no `Worker` schema or admitted owner yet. Introduce both
with the first executable placement experiment, and account for shared resources
without duplicating their capacity.

Reusable hardware profiles, multi-node topology, deployment controllers, and
optimization objectives are also pending. Current `KVResidencySystemConfig` limits and rates
are hypothetical system assumptions; `ExecutionBackend` identifies actual execution.
Neither is a calibrated hardware model. The [KV lab](../labs/kv-residency.md) owns
the implemented boundary and evidence.

## System optimization direction

The intended planning problem is to choose hardware, deployment, and runtime
policies under fixed requirements. Computational fidelity, dependency order, state
identity, and capacity conservation are correctness obligations. Latency, quality,
availability, residency policy, budget, and delivery deadlines are candidate
constraints; failing one means a candidate is infeasible, not that the requirement
should be silently relaxed.

P1 holds the hardware pool fixed while varying software and execution choices.
P2 also varies hardware and topology. Candidate comparisons should disclose
uncertain workload, reliability, economic, and policy inputs, and tradeoffs among
cost, service, resilience, energy, robustness, and operability. These are intended
questions, not implemented optimization declarations. See the
[purpose](../purpose/README.md#learning-and-decision-goals) and
[candidate-screening guidance](../labs/README.md#candidate-screening).
