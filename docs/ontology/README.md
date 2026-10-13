# Executable ontology

Only this README may contain standalone prose in this directory. The ontology
itself is registered YAML, consumed by declaration generation and visual inspection.
`make _check`, `make test`, and `make test-integration` reject additional prose files,
unregistered files, nested authorities, symlinks, malformed modules, and ownership drift.

| Authority | Owns |
| --- | --- |
| [Manifest](declarations.yaml) | Exact module inventory. |
| [Operations](operations.yaml) | Semantic ownership of implemented transformer operations. |
| [Model](model.yaml) | Parameter identity and numerical sequence-state snapshots. |
| [Inference system](inference-system.yaml) | Component composition, caller contracts, requests, responses, and workloads. |
| [Runtime](runtime.yaml) | Model forward execution and the decoding algorithm that advances a sequence. |
| [Serving](serving.yaml) | Request scheduling, KV-cache management, state transfer, and conditional compute service. |
| [Hardware](hardware.yaml) | Observed backend identity and hypothetical resource graphs. |
| [Customer interaction](interaction.yaml) | Declared submission, consumption and cancellation actions. |
| [Experiment](experiment.yaml) | Control interventions, their ExecutionSpec composition, executions, causal events, and observations. |
| [Interface](interface.yaml) | Inspection cursors, advertised execution capabilities, and service errors. |
| [Tokenizer](tokenizer.yaml) | One tokenizer concept owning vocabulary entries, framing inputs, encoding spans, and results. |
| [Data model](../../data-model/README.md) | Concrete field shapes and generated consumers. |

## Experiment harness and system under test

The existing owners distinguish three roles:

| Role in the experiment harness | Declared owner |
| --- | --- |
| Experiment configuration and resolved system/workload bindings | [ExperimentSpec](experiment.yaml) |
| Request input: concrete arrivals, with proposed transformations distinguished from instantiated requests | [Workload](inference-system.yaml) |
| Consumed configuration and execution evidence | [ExperimentExecution](experiment.yaml) |

The UI's “control plane” and “data plane” refer to the **experiment harness**:
configuration controls the experiment, while the request view supplies and follows
its input. They do not name the inference system's operational control plane or
request-processing path. Workload describes input to that path; it is not the path
itself. Scheduling and routing decisions belong to the system under test, not to
ExperimentSpec merely because both involve control. Prefer “experiment
configuration” and “request input” when this UI distinction is unnecessary.
These are explanations of the linked owners, not additional schema definitions.

## Enforced mapping

Each concept grants an explicit, nonempty list of declaration names using `schemas`.
Every declaration has exactly one concept as its `x-owner`; supporting records may
share that owner. Unused grants, unowned schemas, duplicate
owners, and dangling declaration references fail admission. Owners cannot introduce fields;
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

Calibrated hardware profiles, topology execution, deployment controllers, and
optimization objectives are pending. ResourceGraph now declares hypothetical nodes
and directed links; it does not execute a fleet. The separately owned components of `KVResidencySystemConfig` carry hypothetical limits and rates; `ExecutionBackend` identifies actual execution.
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

## Operation ownership and experiment subjects

[Operations](operations.yaml) declares embedding, positional encoding, normalization,
attention, residual addition, feed-forward computation, and output projection.
Their operation declarations enumerate the implemented operations they own.
Tokenizer and KVState own their input-ID and retained-state operations. These
are supported operation identities, not a claim that alternative architectures
are implemented. ModelArchitecture still governs the fixed model configuration.

TensorObservation records evidence and references an owned operation declaration;
it no longer carries an independently authored display category. Generation
rejects competing operation names or an observation union that omits an operation.
The engine rejects unregistered operations. Semantic owners and navigation are
therefore derived from the same declarations as the execution evidence.

ExperimentSpec owns `OntologyBinding`: exactly one `primary` concept and unique
`related` concepts that exclude the primary. Reference choices are generated
from admitted ontology; do not maintain an enum elsewhere. Catalog experiments
must declare this binding. The build reports unknown concepts with their catalog
path and suggestions; generated Python and browser validators enforce the same
reference and uniqueness rules in records and submitted inputs.

Fixed lab endpoints retain their declared subjects in resolved specifications and
reject incompatible bindings. Association identifies what is being studied, not
proof that an experiment is correct or that every associated concept is changed.
The generated step-level Ontology and Labs links use these owners and bindings.

## Navigable system map

InferenceSystem owns the [map declaration](../../data-model/domains/system-map.yaml).
Its areas group existing system owners; area labels are not additional ontology concepts.
Customer interaction stays in the Interaction panel, outside this system boundary.
Server-side response delivery stays inside; publication is not proof of receipt.
Each lab subject and operation owner has one navigation home. Relationships describe
responsibilities, not chronological events or proof that a path executed. The same
map surrounds each model's actual architecture and captured computation.

The frontend derives names, membership, links and initial expansion from that
admitted declaration. Governance rejects unknown subjects, multiple homes, missing
lab/operation owners and dangling relationships. Opening an area or the separate Numerics section changes disclosure
only, not the experiment or inspection cursor. Concept explanations remain available
for all models. Intermediate tensor inspection follows the declared model capability,
not a hardcoded parameter-count threshold; available output scores remain inspectable. Replay reveals a selected computation
inside its area. A lab link means an implemented primary lab exists; it does not
mean that mechanism can be selected in the current main-page execution.

Areas also list missing subjects explicitly. A paper can motivate an area without
having an admitted ontology owner or an executable ExperimentSpec. First identify
its primary mechanism and related owners; declare missing semantics, configuration
and evidence before implementing a runnable experiment. Do not bind routing or
collectives to InferenceSystem just to pass validation. New ideas may challenge the
map itself; Transformer ancestry is not a completeness guarantee.

## Decomposition under test

These boundaries are hypotheses, not a complete or certified architecture. The
YAML modules own their meanings; this outline explains how to challenge them.

- A request supplies GenerationPolicy. Decoding uses model predictions to advance
  the sequence under that policy. ModelExecution performs the forward work;
  transformer operations explain its internal computation.
- RequestScheduling chooses eligible work. KVCache manages valid reuse and
  capacity; KVState is the numerical payload. Neither changes the attention rule.
- StateTransfer makes a payload available across a boundary. ComputeService gives
  conditional service costs. ExecutionBackend identifies the actual local device
  and implementation; it is not the hypothetical resource model.
- InferenceResponse describes publication and completion. Producing logits or
  selecting a token is not evidence of client delivery or protocol behavior.

Prefill and decode are phases, not separate owners or necessarily separate
machines. Cached continuation exercises the same numerical model with retained
state. Speculation challenges the Decoding boundary through draft/verify/accept
work; it is still planned. The planned P/D lab is currently scoped to lossless
KV handoff, not a complete disaggregated fleet.

Routing, execution placement, TP/PP collectives, and response transport remain
undeclared. They need executable declarations with their first implementations;
SSE framing, backpressure, cancellation and API compatibility must not be inferred
from the current in-process response records. These gaps should drive future
revision rather than assigning new labs to InferenceSystem by default.

The local nano-vLLM reference separates scheduler, block manager, model runner and
sampler. That supports investigating these responsibilities independently, but
its classes are not a universal ontology and its scheduling policy is not ours.

## Scenario foundations, not execution capabilities

CustomerInteraction and ResourceGraph are generated, inspectable declarations for
future investigations. They are deliberately separate from supported run bindings.
Existing engines reject these configurations rather than silently ignore them.
[Scenario validation](../../inside_inference/scenarios.py) checks their cross-record
invariants after generated shape validation; it returns generated records and
performs no scheduling or performance prediction. Shape validation alone does not
check graph endpoints or action chronology.

Customer actions use one declared virtual clock. Submissions have unique invocation
IDs; consumption is cumulative application-output bytes; cancellation is intent.
Consumption after cancellation may drain buffered output. Availability, receipt,
acknowledgment, retries and external-tool dependencies need future execution
semantics and evidence. Workload remains the implemented fixed-arrival input.

ResourceGraph starts with local compute/memory budgets and independent directed
point-to-point links. IDs are unique, endpoints must exist, and disconnected nodes
are legal. There is no implicit reverse route, shared-duplex capacity, multi-hop
routing or contention solver. Expand this representation with a concrete experiment
when shared memory, switches or shared link pools must be represented; do not encode
one physical budget multiple times. Rates are hypothetical and explicitly unitized.
SimGrid's [resource models](https://simgrid.org/doc/latest/Models.html) provide a reuse
reference for future shared-link simulation; this declaration does not adopt or
validate those algorithms.

Ontology has no `depends_on` allowlist. Generated schema references express record
composition; execution events and tensor inputs express the causal evidence
currently available. Neither is a complete model of operational dependencies.
