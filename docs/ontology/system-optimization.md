# System optimization ontology

Owns the formulation of inference-system design as a constrained optimization
problem: what must always hold, what is given, what can be chosen, and what is
being optimized. [Inference ontology](inference.md) owns the entities named here;
[experiment ontology](experiment.md) owns the evidence that supports a conclusion
about them. This is a planning vocabulary; no optimizer or screening engine is
implemented.

```text
choose decision variables x
to optimize objectives f(x, θ)
subject to invariants (every valid execution)
and constraints g(x, θ) ≤ 0 (requirements a candidate may fail)
given inputs θ, many of them uncertain
```

## Invariants versus constraints

An **invariant** holds in every valid execution or model of one. A violation
means the implementation or abstraction is wrong. A **constraint** is a
requirement a candidate configuration may fail; a violation means the candidate
is infeasible. Do not encode a requirement as an invariant, or repair an invariant
violation by relaxing a requirement.

| Invariant | Meaning |
| --- | --- |
| Computational fidelity | Outputs follow the declared model, precision, and decoding policy. Any change to computation, including degraded modes, is a declared intervention with its own quality evidence. |
| Dependency order | Work runs only after the state and inputs it depends on exist: prefill before decode, layer order, token order, handoff before resumed use. |
| Capacity conservation | At every instant, resident state in each memory tier and queued data in each buffer fit their declared capacities. |
| Physical rate ceilings | Compute, memory access, and link transfer rates never exceed declared ceilings for the device or link. |
| State identity | Retained state belongs to an identified request, model, position range, and representation; it is never silently shared or reinterpreted. |
| Work and request accounting | Avoided, repeated, and discarded work is counted. Every admitted request is completed, cancelled, failed explicitly, or reported as pending when a bounded run ends. |
| Constraint reporting | Every evaluated constraint is reported as satisfied or violated with its evidence; violations are never silently repaired or omitted. |

| Constraint | Typical form |
| --- | --- |
| Latency | Time-to-first-token and inter-token latency at stated percentiles. |
| Throughput | Sustained goodput at the declared workload. |
| Quality | Minimum task quality; whether precision, model, or expert changes are allowed. |
| Availability | Service level under declared failure domains, including after the worst declared failure. |
| Budget | Capital, operating cost, power, cooling, and space envelopes. |
| Delivery | Hardware lead time and software readiness by a deadline. |
| Policy | Data and computation stay within declared location, tenancy, and vendor restrictions. |

## Inputs

Inputs are given for a comparison. Record each with its provenance and, where
uncertain, a range rather than a point value.

| Input | Examples |
| --- | --- |
| Workload | Arrival process and burstiness, input/output lengths, shared prefixes, session and tool-turn structure, tenant mix, daily and seasonal patterns, growth. |
| Model | Architecture, parameter count, active parameters, layers, attention type and KV bytes per token, expert count and routing behavior, supported precisions. |
| Fleet | Devices, memory tiers with capacity and bandwidth, intra- and inter-node links, topology, power and cooling, software stack per device type. |
| Reliability | Failure rates by component and domain, correlated-failure groups, detection and recovery times, weight reload rates. |
| Economics | Hardware and power prices, utilization accounting, lead times, operational staffing per software stack. |
| Policy | Data residency, sovereignty, tenancy isolation, approved vendors and software. |

## Decision variables

Decisions operate on different time scales. Slower decisions constrain faster
ones; compare candidates at one scale while holding slower decisions fixed.

| Time scale | Decision variables |
| --- | --- |
| Planning (months) | Hardware additions and retirements, topology and interconnect, power and cooling, model and precision selection, software stacks to operate. |
| Deployment (days to weeks) | Placement and parallelism (tensor, pipeline, expert, data), prefill/decode separation and ratios, replicas per island, expert and KV tier placement, spare capacity, degradation ladder definitions. |
| Runtime (milliseconds to minutes) | Admission, routing, batching, scheduling and preemption, cache retention and eviction, expert migration, activation of declared degraded modes. |

P1 in the [purpose](../purpose/README.md#learning-and-decision-goals) varies
deployment and runtime decisions on a fixed fleet; P2 also varies planning decisions.

## Objectives

Objectives conflict; report tradeoffs and crossover conditions rather than forcing
a single score unless the decision maker declares the weighting.

| Objective | Examples |
| --- | --- |
| Cost efficiency | Cost per delivered token at the required service level; capital per unit of sustained goodput. |
| Service | Latency percentiles, goodput, fairness between tenants. |
| Resilience | Capacity and latency after declared failures, recovery time, margin before a requirement breaks. |
| Energy | Energy per delivered token; peak power. |
| Robustness | How far uncertain inputs can deviate before a constraint fails. |
| Operability | Number of software stacks, upgrade and on-call burden. |

## Scale changes the problem

Aggregating many tenants can reduce relative demand variation; fewer tenants
offer less of that averaging. Idealized arithmetic: with N independent tenants of
equal mean demand and coefficient of variation 1, the aggregate coefficient of
variation is 1/√N. Under a normal approximation, provisioning for the 99th
percentile needs about 2.3% headroom at N = 10,000 and about 74% at N = 10. The
approximation may be poor at N = 10, and real tenants are neither independent nor
equal; correlated demand, such as one time zone or one dominant tenant, reduces
the benefit of aggregation at any size. Use measured demand when available.

Failures and supply differ similarly, but size alone does not determine
resilience. Losing one of sixteen equal nodes removes 6.25% of nominal capacity;
losing a node that holds a uniquely required shard can stop the whole service.
Placement, replication, and failure domains decide which case applies. A region
bound by residency rules cannot send overflow elsewhere, and procurement limits
can produce mixed vendors and generations. Constraints that a large, flexible
region can often absorb may become binding design inputs in a small one.
