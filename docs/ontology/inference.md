# Inference ontology

Owns the meaning of modeled inference entities and their causal relationships.
Excludes hardware presets, scheduling algorithms, service-time formulas, UI
layout, wire formats, and claims of predictive accuracy. Those belong to a
specific implementation or [abstraction contract](experiment.md#abstraction-contract).

## Entities

| Term | Meaning and boundary |
| --- | --- |
| Inference system | The configured boundary that accepts requests and produces responses, including input preparation, model execution, serving policies, state storage, and execution resources. A worker is an execution location within this system, not the system itself. |
| Tokenizer | Converts input text or bytes into ordered token IDs under an identified vocabulary and encoding rules. Token boundaries need not be word boundaries. |
| Embedding | Maps token IDs to parameter vectors; position information is applied according to the model configuration. These vectors are model inputs, not sequence-state cache entries. |
| Transformer layers | Transform position-aware representations through attention, feed-forward operations, normalization, and residual paths under the model configuration. Causal attention restricts accessible history; execution may read or update sequence state. |
| Output projection | Maps final hidden representations to vocabulary logits. Logits are scores, not selected tokens or decoded text. |
| Token selection | Chooses a next token from logits under a specified decoding rule, stopping conditions, and any randomness. The selected token can feed the next model step. |
| Detokenizer | Converts output token IDs back to text or bytes using the tokenizer configuration. A streamed token may not complete a printable character; buffering can be required. |
| Request | One invocation seeking output from an identified model/configuration, with input and completion/cancellation conditions. An agent turn may produce multiple requests. |
| Workload | Requests plus arrivals and dependencies. A workload can use fixed arrivals or make later arrivals depend on earlier responses or tool results; the experiment must distinguish them. |
| Model configuration | Identity of the computation and parameters, including relevant tokenizer, position, precision, and state semantics. A display name is not sufficient identity for reuse. |
| Work item | A unit of modeled computation or data movement, with prerequisites, inputs, outputs, and resource demands. Its granularity is an abstraction choice. |
| Sequence state | Intermediate state used to continue an inference sequence, such as retained keys/values or a recurrent state. It is distinct from trained parameters, input text, and a cached final answer. |
| State artifact | An identified snapshot or reusable portion of sequence state, tied to the computation and input history that produced it. Logical identity is distinct from physical placement. |
| Residency | A copy of a state artifact at a location, with allocated size, readiness, and lifetime. A remote or in-flight copy is not automatically ready for local computation. |
| Worker | A modeled execution location that can perform compatible work using available resources. It is not necessarily one GPU, process, or machine. |
| Resource | A bounded capability or capacity consumed by work or retained state. Compute rate, storage capacity, and data-transfer bandwidth have different units and constraints. |
| Link | A modeled transfer path between locations, with declared delay, bandwidth, and sharing behavior. Links may share a bottleneck; independent-link assumptions must be explicit. |
| Queue | Work or requests waiting for eligibility or resources. Being queued is different from actively consuming service. |
| Batch | Work grouped for execution. Its joint service demand must be modeled; adding requests does not imply either free work or a simple sum of independent times. |
| Policy | A rule choosing among permitted actions: admission, routing, scheduling, placement, retention, or eviction. A policy cannot bypass prerequisites or create capacity. |
| Event | A modeled occurrence or transition at a simulation time, linked to causes and affected entities. Equal-time events require explicit ordering semantics. |
| Trace | Recorded events and numerical transitions from a run, sufficient for the declared observations. Presentation reads this evidence instead of inventing another execution history. |

## Relationships and actions

```text
Workload supplies Requests and dependency rules
Inference system accepts Requests under its configuration
Inference system contains Workers, Resources, state locations, and Policies
Request induces Work items
Work item depends on inputs and other Work items
Policy chooses admission, placement, ordering, grouping, or retention
Worker executes eligible work using Resources
Work produces output and may create or update Sequence state
State artifact has zero or more Residencies
Transfer consumes link service and makes a destination Residency ready
Events record these transitions; Trace preserves their history
```

Prefill and decode identify phases of model execution, not universal hardware
types. Routing chooses a destination; scheduling decides when and with what other
work execution proceeds. Keeping those decisions distinct allows experiments to
study their interaction without assuming they are implemented by separate services.

## Invariants

- Work cannot consume an input before its prerequisites make that input available.
  Any speculative execution must explicitly model provisional results and their
  acceptance or discard conditions.
- Account for allocations, transfers, release, and eviction under a declared
  capacity model. Logical sharing must not be counted as both duplicated storage
  and free copies. Evicting one copy does not erase other copies.
- Capacity and service accounting must respect the declared resource model.
  Concurrent operations do not each receive the full rate of a shared bottleneck
  unless the model explicitly provides independent capacity.
- Reuse requires compatible computation identity, input history, and continuation
  semantics. Equal text labels alone do not prove compatible state. Recurrent
  checkpoints and per-token KV histories need not support the same reuse boundaries.
- A reusable artifact may still require retrieval, transfer, reconstruction, or
  waiting. Logical hit, local readiness, work avoided, and elapsed time saved are
  different observations.
- Recomputing an evicted state is new work with its own dependencies and cost.
  Cancellation and completion must account for outstanding work and state lifetime.
- Units and observation boundaries are explicit. Distinguish operations from
  operations/second, stored bytes from transferred bytes, and model tokens from
  display objects. A block or token icon may represent many underlying elements.
- Simulation time, host execution time, and animation time are separate clocks.
  Faster playback must not change the simulated outcome.
- Any supported same-input replay uses identified configuration, randomness, and
  event-order rules. A repeatable trace establishes repeatability, not realism.

## Resource abstraction boundary

A worker may use a declared effective compute rate; a storage location may have
capacity and access behavior; a transfer path may have bandwidth and delay.
These are candidate representations, not a universally sufficient hardware model.
Hardware names alone do not establish those values or their applicability.

Each experiment must decide whether it needs shape- and precision-dependent
service, startup overhead, read/write asymmetry, access patterns, shared buses,
contention, or other effects. Include an effect when omitting it threatens the
question being answered. Do not claim to capture an absent effect by assigning
a generic efficiency factor without supporting evidence.

For example, counting reusable tokens can require no timing model at all.
Predicting retrieval-versus-recompute time requires more. Predicting a particular
storage device's behavior may require access-pattern and concurrency information
that a single bandwidth number cannot represent. These are different claim scopes.

## Computation inside the system

For a decoder-only GPT path, inspect input text/bytes → token IDs →
embedding vectors → transformer-layer tensors and sequence state → logits →
selected token IDs → decoded output. Prefill and decode are execution phases
through the model, not substitutes for these internal operations. The final
prompt-position logits can select the first output token; subsequent steps consume
the selected token and retained state to predict the next. Do not imply that
every delivered token has already been appended to the KV cache.

The system configuration spans model/tokenizer identity, serving policies,
state placement, and resource constraints. An individual experiment implements
only its declared subset; unsupported controls must not silently affect a drawing
without changing executable behavior.

Numerical execution must own token identities, tensor values, shapes, dtypes,
state updates, logits, and selection decisions. Resource simulation may attach
explicit cost assumptions to those work items, but must not manufacture their
values. Link observations by request, work item, sequence position, and layer
where applicable. Keep actual computation, simulated costs, and measured host
time distinct. The numerical instrument executes this path; the separate request-cost lab
does not derive timings from its numerical execution.
