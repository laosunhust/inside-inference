# Workloads, events, and client output

Owns the executable input/output boundary. Declaration meanings and ownership are
in [ontology modules](../ontology/README.md); field shapes belong to
[JSON Schema](../../data-model/declarations.yaml). HTTP operations belong to
[execution operations](../../data-model/execution.yaml). The UI is a projection of the recorded run.

## Input: a workload, bound to a model and system

A fixed-arrival workload contains an ordered array of identified requests. Each
entry carries arrival time in virtual microseconds and its request payload. Entries
are ordered by arrival time; array position breaks ties deterministically. Request
identities are unique within the workload. Equal-time ordering is a deterministic
choice, not evidence of a causal dependency.

The uncached numerical adapter admits exactly one arrival at virtual time zero. It
rejects multiple requests and delayed arrivals before model execution. This defines
the wider boundary without pretending to implement queues, resources, or concurrency.
The input arrival declaration does not establish simulated service times.

Dependent agent workloads will need a separately declared arrival rule tied to
prior results. Do not preassign their actual arrival times or silently convert
feedback-driven traffic into fixed traffic. That behavior is not implemented here.

The [KV residency adapter](../labs/kv-residency.md) reuses this workload shape,
with its own generated `KVResidencySystemConfig` and `CacheRun` contracts. It admits multiple
fixed arrivals through bounded reservations and records virtual service times,
causal events, actual numerical work, and separate local measurements. It does not
change the uncached adapter's execution-order-only clock.

## Submitted input, resolved specification, and provenance

The main page accepts `GenerationInput`: a `GenerationExperiment` selecting the
model and ontology binding, plus the request `Workload`. Its browser preparation
rejects unsupported concurrency and arrivals; token stepping returns
`GenerationPrediction`. [Delivery](delivery.md) owns this selected-model interface.

The retained preparation/reference endpoint accepts a `Workload`; the KV endpoint accepts
`KVExperimentInput` containing a system configuration, workload, and ontology binding. The host selects
the model artifact. These submissions are not complete identities of the computation.
Both execution paths record a resolved `declaration` with `model`, `system`,
`workload`, and `ontology_binding`: `RunBinding` for the reference path and `KVRunBinding` for the KV path.
The model reference must match the retained artifact and tokenizer identity. The
fixed reference lab resolves its subjects from the catalog; the KV endpoint verifies
submitted subjects against its declared lab. These bindings are preserved on replay.

Standalone request traces and KV run records use the same `ExecutionProvenance`
shape: source-file hashes and their aggregate identity, Python version, Git revision,
and the observed `ExecutionBackend`. A workload record contains its request traces;
their provenance remains with each trace rather than being copied onto the envelope.
Backend evidence describes what ran; it does not replace the requested system configuration.

Replay validates source-inventory integrity, executing source bytes, runtime identity,
and the resolved model. Backend differences are rejected as well. Git revision is
informational: a new commit with identical executing source bytes may replay the record.
Local wall-time measurements remain separate and may vary across replay.

## Output: ordered evidence, with causal links

`InferenceResponse` owns the existing publication, completion, and outcome records.
The run supplies their request identity and ordering through its event envelope;
no separate response token array is maintained.

The output owns an append-only event sequence. Every event identifies its run,
request, sequence number, event ID, causes, and a typed payload. Causes must refer
to earlier events in that same run. Chronological order alone is not causality. In the current baseline,
next-token computation depends on the previous selection, not on publication. Completion
joins the final selection and output publication; array adjacency is not a cause.

The current clock is **execution order only**: no duration or latency can be
calculated from its sequence numbers. Future measured and simulated clock variants
must declare their units, origin, and ordering rules. Host time, virtual time, and
animation time must not be substituted for one another.

The implemented path records request arrival, input encoding, model forward
completion, token selection, output publication, and request completion. The greedy
baseline accepts each selection immediately; it has no separate commitment event.
The `token-published` event means publication to the in-process output collector,
not receipt across a network. The retained reference operation returns an execution receipt;
[artifact delivery](delivery.md) supplies the completed evidence separately. Token
streaming and client acknowledgments are not implemented. A
control token can stop generation without being delivered as text. Client output
is a projection of publication events, not a second maintained token array. The
current display concatenates text pieces and labels control/byte/hex IDs; it does
not assert that arbitrary untrained token streams decode to valid text. Numerical
tensors remain actual computation evidence linked from the corresponding work event.

There is no general invariant that one model pass produces one delivered token.
The current naïve adapter selects one ID per pass; its terminal control ID
produces no delivered token. That behavior is specific to this adapter. Delivery
must follow selection in this baseline; proposed or rejected tokens are not client output.

## Speculative decoding boundary

Speculative decoding can be inspected through this boundary: draft work proposes
candidates; target work verifies them; accepted continuations become committed;
rejected suffixes remain visible as rejected work; only committed output is delivered.
Proposal identities, verification policy, model identities, and sequence-state
rollback/reuse must become explicit with that lab. Do not represent speculative
candidates as already accepted output, or erase the cost of rejected work.

Those event variants and the optimization are **planned**, not enabled options.
The current schema admits only implemented event kinds and requires explicit
extension for new ones. Greedy equivalence and distribution-preserving sampling
are different claims requiring different verification. Arithmetic or acceptance
rates alone cannot establish speedup on real hardware. See the
[planned lab](../labs/speculative-decoding.md).

## Standards and enforcement

Domain records use JSON Schema 2020-12. The execution operation registry references
those records across the browser worker boundary. Python uses a maintained JSON Schema validator; browser
validators are compiled from the same schemas with Ajv. Ontology ownership checks
and behavioral invariants remain repository code because shape validation cannot
prove chronology, valid output publication, or computational fidelity.

Kubernetes is not required to simulate request scheduling. A future deployment
controller may map experiment resources to CRDs, while token/tensor evidence stays
outside the Kubernetes API. Such an adapter must not redefine the domain contracts.
