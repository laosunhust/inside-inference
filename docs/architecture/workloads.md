# Workloads, events, and client output

Owns the executable input/output boundary. Declaration meanings and ownership are
in [ontology modules](../ontology/README.md); field shapes belong to
[JSON Schema](../../data-model/declarations.yaml). HTTP operations belong to
[OpenAPI](../../data-model/openapi.yaml). The UI is a projection of the recorded run.

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
with its own generated `CacheSystem` and `CacheRun` contracts. It admits multiple
fixed arrivals through bounded reservations and records virtual service times,
causal events, actual numerical work, and separate local measurements. It does not
change the uncached adapter's execution-order-only clock.

## Output: ordered evidence, with causal links

The output owns an append-only event sequence. Every event identifies its run,
request, sequence number, event ID, causes, and a typed payload. Causes must refer
to earlier events in that same run. Chronological order alone is not causality. In the current baseline,
next-token computation depends on the committed prefix, not on delivery. Completion
joins the final selection and output publication; array adjacency is not a cause.

The current clock is **execution order only**: no duration or latency can be
calculated from its sequence numbers. Future measured and simulated clock variants
must declare their units, origin, and ordering rules. Host time, virtual time, and
animation time must not be substituted for one another.

The implemented path records arrival, input encoding, completed model work,
token selection, token commitment, output publication, and request completion.
The `token-delivered` event means publication to the in-process output collector,
not receipt across a network. HTTP returns the completed record in one response;
network streaming and client acknowledgments are not implemented. A
control token can stop generation without being delivered as text. Client output
is a projection of delivery events, not a second maintained token array. The
current display concatenates text pieces and labels control/byte/hex IDs; it does
not assert that arbitrary untrained token streams decode to valid text. Numerical
tensors remain actual computation evidence linked from the corresponding work event.

There is no general invariant that one model pass produces one delivered token.
The current naïve adapter selects one ID per pass; its terminal control ID
produces no delivered token. That behavior is specific to this adapter. Delivery
must follow a committed decision; proposed or rejected tokens are not client output.

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

Domain records use JSON Schema 2020-12. OpenAPI 3.1 describes the HTTP boundary by
referencing those records. Python uses a maintained JSON Schema validator; browser
validators are compiled from the same schemas with Ajv. Ontology ownership checks
and behavioral invariants remain repository code because shape validation cannot
prove chronology, valid commitment, or computational fidelity.

Kubernetes is not required to simulate request scheduling. A future deployment
controller may map experiment resources to CRDs, while token/tensor evidence stays
outside the Kubernetes API. Such an adapter must not redefine the domain contracts.
