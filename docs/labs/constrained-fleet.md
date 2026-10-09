# Constrained heterogeneous fleet — planned scenario

Question: a model and workload must be served from a fixed, mixed fleet that no
single homogeneous island can host. What is feasible, what fails first, how does
the service degrade under failure, and when the fleet cannot meet requirements,
which additions would?

This is a planned scenario connecting the [learning and decision goals](../purpose/README.md#learning-and-decision-goals):
P0 explains each mechanism, P1 screens options on the fixed fleet, and P2 screens
hardware additions when P1 has no acceptable candidate. Nothing here is implemented.
Numbers are illustrative arithmetic on assumed configurations, not measurements
or vendor claims. Screening evidence follows the
[candidate-screening rules](../labs/README.md#candidate-screening).

## Why profiled step times are insufficient

Serving simulators commonly take model execution as a profiled input: a step time
for a given batch on a given device. In this scenario execution cost depends on
decisions the simulator is supposed to evaluate:

```text
batch size (scheduling) → distinct experts per layer (model routing)
  → resident vs. remote experts (placement, memory tiers)
  → transfers and cross-island crossings (topology)
  → step time → queueing → next batch size
```

A fixed profile cuts this loop. The scenario must keep it closed, and every link
in it must be either actual computation or a declared, inspectable assumption.

## Inputs to declare

| Input | Contents | Source |
| --- | --- | --- |
| Model structure | Total/active parameters, layers, experts and top-k, attention type and KV bytes per token, supported precisions. | Published configuration. |
| Routing behavior | Per-layer expert selections on a representative workload: popularity, temporal locality, co-activation, tenant skew. | Traces from the real model, which can run slowly offloaded; the tiny model cannot supply this distribution. |
| Workload | Arrivals, input/output lengths, shared prefixes, session and tool-turn structure. | Recorded or declared distributions. |
| Requirements | Latency and throughput targets, quality floor (whether quantization or expert changes are allowed), availability targets per failure domain. | Stated service objectives. |
| Fleet graph | Devices, memory tiers with capacity and bandwidth, intra- and inter-island links, power, software stack per island. | Inventory plus measured primitives. |
| Constraints | No external capacity, software supply-chain limits, vendor or location restrictions. | Policy. |

## Illustrative instance

Assumed model: MoE, FP8 weights, ≈10 TB (≈10T parameters), 61 layers × 384 experts,
8 active per token, hidden size 7168, with all weights assumed to be expert weights.
That is ≈430 MB per expert and 61 × 8 × 430 MB ≈ 210 GB of expert weights touched
per token; attention or shared weights, if specified, add to both figures. Assumed
fleet: 16 × 288 GB, 16 × 141 GB, and 32 × 80 GB accelerators from two vendors and
three generations, ≈9.4 TB of HBM in total, with large host DRAM. Between vendors,
only Ethernet RDMA: assumed eight 50 GB/s NICs per island side, attached to a
non-blocking switch, with traffic spread evenly, for ≈400 GB/s aggregate.

| Check | Arithmetic | Consequence |
| --- | --- | --- |
| Weight capacity | 10 TB > 9.4 TB HBM, before KV. | Quantize, tier experts to DRAM, or change the model. Each changes something P0 must explain. |
| Island capacity | No island holds the model in HBM. | Either one instance spans islands, which mainstream engines do not support across vendors, or one island offloads experts to host memory. Software feasibility is a screening dimension. |
| Cross-island expert traffic | 7168 × 8 × 1 B × 2 directions × 61 layers ≈ 7 MB per token if every selected expert is remote (worst case); batch 256 ≈ 1.8 GB per step ≈ 4.5 ms at the assumed 400 GB/s aggregate. | Plus 122 dependent crossings per step that pipelining does not remove. |
| DRAM-tier expert miss | 430 MB at ≈50 GB/s ≈ 9 ms per expert. | Viable only if routing traces show a stable hot set. |

Candidate placements: FP4 with experts spread across islands; hot experts in HBM
and cold experts in DRAM; attention and KV on one island with experts elsewhere;
layer pipelining across islands; and prefill/decode separation with a
[state handoff](../purpose/milestones.md#g1--inspect-a-state-handoff).
Each has a different crossing pattern, capacity use, and failure behavior.

## Operations: degraded modes are part of the design

Placement determines failure behavior, so resilience is evaluated with each
candidate rather than added afterward.

- **Series versus parallel composition.** An instance spanning three islands needs
  all three: with an assumed 99.5% availability each and independent failures, the
  instance has ≈0.995³ ≈ 98.5%. Shared power, network, or software dependencies
  make failures correlated and change this figure. Vendor diversity adds resilience only when islands can serve
  independently; spanning instances turn diversity into a series dependency.
  Correlated faults such as a driver or firmware defect can remove a whole island.
- **Recovery that preserves computation versus recovery that changes it.**
  Replicating hot experts, reloading shards, and recomputing state preserve the
  model. Dropping or rerouting experts, switching to a smaller model, or lowering
  precision change outputs; each must be a declared policy with a quality
  criterion, never a silent fallback.
- **Reload time.** Restoring a 288 GB device shard at an assumed 10 GB/s takes
  ≈29 s, during which the instance is down unless that state is replicated.
- **State loss causes load spikes.** Sessions whose KV was on a failed device must
  re-prefill on surviving capacity at the same moment. A 32k-token context is
  ≈10.7 GB of GQA-70B-class KV to recompute per session. Admission control and
  priority shedding decide who waits.
- **Mixed software stacks.** Each island has its own drivers, kernels, and
  release cadence. Rolling upgrades must keep cross-island state representations
  compatible or drain first.
- **Headroom.** Declare N+k spare capacity per island and verify the plan still
  meets requirements after the worst declared failure, not only at full strength.

Simulate failure injection: remove a device, node, link, or island; replay the
same workload; report capacity, latency, quality changes, recovery time, and
which requests were affected.

## When the fleet cannot meet requirements (P2)

An empty P1 shortlist is a result. Turn it into a proposal:

1. **Name the binding constraint and its deficit**: weight capacity, KV capacity,
   memory bandwidth, cross-island link, compute, power, or availability after
   failure, quantified against the requirement.
2. **Include non-hardware options**: lower precision, a distilled or smaller model,
   changed requirements, workload shaping, or different placement. Hardware is one
   option, not the default.
3. **For each hardware option**: what it relieves, the next constraint that binds,
   cost, power and cooling, lead time, software-stack risk, and operational burden.
   Additions that create a new island inherit the series-composition problem.
4. **Sensitivity**: which uncertain inputs (routing skew, link efficiency, growth)
   would reverse the recommendation.
5. **Staged plan with measurement gates**: the smallest purchase or pilot that
   tests the critical assumption before committing to the rest.

## Instrument roles

| Instrument | Establishes | Does not establish |
| --- | --- | --- |
| Tiny model | Mechanics: routing, dispatch/combine, expert residency and misses, KV handoff, recomputation equivalence. | Routing distributions, quality at scale, timings. |
| Real-model routing traces | The workload's expert distribution and locality. | Performance or placement outcomes. |
| Coupled event simulation | Consequences of placement, batching, routing, and failure under declared assumptions. | Accuracy without calibration against measured primitives. |
| Measured primitives | Transfer, all-to-all, tier fetch, and expert-kernel rates on each device type. | End-to-end behavior by themselves. |

Existing profilers and simulators can supply measured primitives where their
assumptions fit; see [similar products](../similar-products/README.md).

## Prerequisites in this repository

Proposed, not yet scheduled in the [milestones](../purpose/milestones.md):
the G1 state handoff; a MoE milestone after M4 with actual routing, dispatch,
combine, and expert load; routing traces and a fleet graph as declared inputs in
the [data model](../../data-model/README.md); and failure events in the workload
simulation.
