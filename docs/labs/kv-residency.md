# KV reuse, residency, and misses

Status: implemented and verified for the fixed one-block/head binary64 model;
see the [2026-10-09 evidence](../research/kv-residency-2026-10-09.md).
This lab owns its abstraction and evidence claims; the ontology
owns sequence state, residency, resources, and queues.

Question: what changes when an exact reusable prefix is present, absent, or
retained in a different memory tier under bounded capacity?

Preserve actual one-block GPT computation, checkpoint/tokenizer identity, causal
positions, raw-logit greedy selection, and declared termination. No training or
architecture change. Compare cached continuation with the explicit uncached
reference (absolute tolerance 1e-10, relative 1e-9 for binary64). Observe actual
K/V, cached positions, new positions computed, logical bytes, and state identity.
A full-prompt prefix lookup retains all but the last prompt token, so a hit still
executes a real forward step to produce logits; it never substitutes a cached answer.

A logical hit means compatible state exists. A local hit additionally means it is
ready at the execution tier. A remote hit requires explicit retrieval. A miss
requires recomputation. Retained prefixes are evictable; active request state is
not silently discarded. Capacity governs admission and transfers. Queued requests
must not execute before their prerequisites and reservations are satisfied.

The initial resource model uses declared service rates and one explicitly shared
execution resource. Simulation time, host-measured durations, and playback time
remain separate. It is not a calibrated model of a named accelerator. Logical
binary64 payload bytes exclude Python objects, allocator overhead, and transport
metadata; these exclusions must be visible. Model weights and working memory must
be distinguished from the KV budget rather than implied to be free device memory.

Execution supports deterministic memory-backed reference computation and optional
local DRAM/VRAM observations, with no SSD-backed inference state and no silent device fallback.
Any host/device staging required by the measured implementation is recorded; CPU
execution must not be labelled GPU computation. Saved reports/checkpoints may use
disk outside the inference-state path. Physical measurements need not replay to
identical durations; numerical results and virtual schedules must replay.

Acceptance evidence: independent cached/uncached comparison; cache identity,
mask/position/context boundary rejection; cold/warm/changed-prefix/eviction cases;
resource conservation and backpressure; exact logical replay; browser/headless
parity for exposed controls. Record missing evidence rather than marking this lab
or the broader M2/G1 milestones complete prematurely. Candidate-filtering ability
on other hardware remains a hypothesis, not a conclusion from these tests.

## Executable boundaries

`KVExperimentInput` submits `KVResidencySystemConfig` and the chronological `Workload`.
The completed run records `KVRunBinding`, adding the host-selected model identity,
and shared `ExecutionProvenance` with the source inventory and observed backend.
The generated contracts govern direct, CLI, HTTP, and browser execution. Each
experiment starts with an empty retained cache. The uncached landing page remains
an explicit reference; `kv-cache.html` is the connected cache/resource lab.

The scheduler admits FIFO requests only when a full maximum-sequence KV reservation
and a request slot are available. Active requests then alternate one work item at
a time. A cold prefix build is one work item; each subsequent prediction is another.
Multiple requests may be active, but a single service resource serializes compute
and transfers: no compute/transfer overlap, continuous batching, preemption, or
network fabric is claimed. Fixed arrivals that occur during service are recorded
at their declared virtual time and remain queued until admission is possible.

Retention uses exact prompt-minus-final-token identity, including checkpoint and
tokenizer binding. It does not find partial common prefixes. Completed requests
retain a prefix snapshot. Retained device entries are evicted by LRU to host memory
when possible; host LRU entries are discarded when needed. If a prefix cannot fit
in the host tier, eviction discards it and a later lookup recomputes it. Active
state and actively consumed prefixes are not eviction candidates. A host hit is
moved into the admitted request's reserved device allocation before computation.

Reservations are conservative: an active request reserves its entire allowed KV
extent up front. A retained prefix remains separately charged even while shared
read-only with active state. This is a reservation policy, not a measurement of
allocator usage. Weights and workspace are outside the configurable KV budget;
the control must never be described as total physical device memory.

Virtual compute service is `max(dense_matmul_FLOPs / compute_rate,
logical_memory_bytes / memory_rate)`. Multiplication plus addition counts as two
FLOPs. Scalar normalization/activation overhead is omitted. Memory charging assumes
one complete parameter payload per work item plus K/V reads and new writes; it is
not measured DRAM/HBM traffic. Transfer service is startup plus payload bytes over
link rate. Retaining a new prefix charges one payload read and one write against
the memory service rate and records its local materialization time. These intentionally simple hypotheses support controlled sensitivity
experiments, not named-device predictions. They require calibration or replacement
before filtering real hardware candidates with confidence.

## Physical execution and timing

The reference backend uses the standard-library scalar model and two logical pools
in system RAM. The optional CUDA backend shares explicit PyTorch equations with
checkpoint preparation, without importing training policy. It computes in binary64
on the actual GPU; active/retained device K/V are CUDA tensors, and offloaded K/V
are page-locked host tensors. No file stores inference K/V. Full CPU inspection
snapshots are evidence copies, not the source used to bypass device residency.
A missing CUDA backend fails explicitly; there is no automatic CPU fallback.

Transfers allocate their destination before timing, copy both K and V, and synchronize
before reporting completion. Measured transfer time includes copy dispatch and
completion overhead. Measured computation includes input staging, observation
readback, and host bookkeeping. Independent uncached reference verification happens
outside that measurement and has a separate `reference-check` wall-time sample.
It is validation overhead, not charged to simulated inference service. Each work
item records executed dense-matmul FLOPs and its full-prefix reference count. To
compare a complete uncached request, sum reference counts only for prediction work;
the cache-build check is extra validation, not an uncached prediction. These are instrumented local observations, not pure kernel
benchmarks. Small payload overhead, binary64 execution, allocator caching, and
inspection overhead limit transfer to production workloads.

Each event has causal references; computation nodes retain the experiment/request
identity and unique work IDs. Inspectable snapshots are content identified.
Replay requires the same sources, backend identity, experiment, and checkpoint.
It compares all logical evidence, including numerics and the virtual schedule;
wall-clock samples are kept separate and allowed to vary. Reproducible static builds
omit those samples rather than inventing deterministic measurements. Live and CLI
runs retain them.
