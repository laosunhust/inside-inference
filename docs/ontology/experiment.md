# Experiment ontology

Owns what an experiment means and which evidence supports its conclusions.
Implementation availability remains a catalog concern; there is no blanket
"validated simulator" status. These definitions do not validate existing labs.

## Entities and distinctions

| Term | Meaning |
| --- | --- |
| Question | A specific "what happens if?" with a target system, intervention, and outcome of interest. |
| Claim | A falsifiable answer bounded by conditions; it may be conditional, quantitative, or qualitative. |
| Abstraction | A mapping from the target problem to modeled state, transitions, constraints, and observables, with explicit omissions. |
| Scenario | A concrete workload, initial state, resource configuration, policies, and assumptions supplied to a run. |
| Intervention | A declared difference from the baseline. Derived consequences are outcomes, not additional secretly fixed controls. |
| Run | Execution of an identified implementation and scenario, with randomness and ordering rules recorded. |
| Observation | A result derived from a run or external measurement, with units and observation boundaries. |
| Comparison | Baseline and intervention observations under a stated control strategy. |
| Verification | Evidence that implementation conforms to its specified abstraction. |
| Validation | Evidence that an abstraction is adequate for a particular claim and regime. |
| Calibration | Fitting parameters to reference observations. Fit quality on those observations is not independent validation. |
| Execution budget | A declared limit and measured cost for running the experiment on the host; separate from modeled system capacity. |

## Abstraction contract

Before implementing a lab, record these items in its owning specification. This
is a content contract, not a requirement for a new framework or separate file for
every entry. Small labs can satisfy it concisely.

| Item | Required content |
| --- | --- |
| Question and claim | What changes, what is observed, and which conclusions are sought or excluded. |
| Target regime | System boundary, workload conditions, scale, and relevant implementation assumptions. |
| Mapping | How target entities, state, actions, and observables map to the simplified model. |
| Preserved relationships | Dependencies, constraints, and information needed for the claim. |
| Omissions | Removed effects, justification, and conditions under which they could change the conclusion. |
| Comparison design | Baseline, intervention, controls, and handling of stochastic or response-dependent arrivals. |
| Evidence plan | Independent checks, reference cases, boundary cases, and criteria for rejecting the abstraction or narrowing its scope. |
| Sensitivity | Uncertain parameters, ranges to examine, and whether plausible changes reverse the conclusion. |
| Execution cost | Host/runtime, workload bounds, event/state/trace growth, resource limits, and measurements needed to establish feasibility. |
| Current conclusion | What is supported, contradicted, or unresolved, with evidence and applicable input/version identities. |

Pick acceptance criteria appropriate to the claim before interpreting the result.
An exact arithmetic claim can require equality within a justified numerical
tolerance; a timing claim needs an appropriate error criterion and reference
regime. Do not invent a universal acceptable error percentage across labs.

## Evidence rules

Verification and validation remain independent. Checking a recurrence against its
matrix equation verifies its implementation; it does not validate a language
quality claim. Defining all simulated transfers to take bytes/bandwidth and then
checking that equality is not independent evidence of real transfer behavior.

Analytical results support conclusions under their premises. Empirical timing
claims require applicable measurements; use cases beyond parameter-fitting data.
If reference evidence is unavailable, retain an explicitly conditional model or
unresolved hypothesis rather than a real-world performance verdict.

A causal comparison changes one declared mechanism where possible. Preserve
external inputs and document induced differences. For an agent whose next request
waits for a response, changing service time may change later arrival times; freezing
those arrivals instead studies a fixed trace, which is a different question.

Do not infer whole-system validity by combining locally validated components.
Their boundaries, service overlap, state units, and contention assumptions must
compose consistently and receive checks for the connected claim.

Evidence refers to exact relevant versions and conditions. Changed abstractions,
inputs, or implementations require reassessing affected claims. A formerly
supported claim stays historical; it does not automatically apply to the new run.

## Candidate screening

Candidate screening uses a declared comparison to prioritize later experiments.
It may support a directional conclusion without establishing accurate absolute
timings. Its validity belongs to the stated candidates, workload, constraints,
and regime; a correct tiny-model trace alone does not validate their ranking.

Use the existing abstraction contract to record:

- The decision being supported, candidate set, fixed requirements, and permitted
  changes to models, software, hardware, or topology.
- The mapping from actual numerical state/work to modeled resource demand,
  including any scale change, effective rates, capacity, and overlap assumptions.
- The evidence and predeclared criterion for the claimed direction, bottleneck,
  crossover, or shortlist. Use independent target-system cases outside calibration
  for empirical screening claims; agreement between simulators is not a substitute.
- Sensitivity to uncertain parameters and omitted effects. Retain unresolved
  candidates if plausible changes reverse their ordering or feasibility.
- False positives (advancing an unsuitable candidate) and false negatives
  (discarding a useful one), plus the next real-hardware experiment that would
  challenge the conclusion. Do not infer false-positive/negative rates without data.

Without applicable validation, a shortlist is an explicitly conditional hypothesis
for testing. With validation, state its supported regime and remaining uncertainty.
Neither status establishes a globally optimal configuration or a procurement
recommendation. Evidence for screening and evidence for absolute timing accuracy
are separate claims; no universal error threshold applies to both.

## Keeping experiments inexpensive without changing the lesson

Use event-driven execution to skip modeled idle time where its effects are fully
represented. Represent large allocations as accounting entries when their actual
contents are irrelevant to the question. Keep detailed tensors where their values
matter. Aggregate requests or work only with justification that the aggregation
preserves the relationships being studied.

Bound run length and retained trace size explicitly. Record incomplete runs;
never silently drop events or requests to satisfy a browser budget. Rendering may
omit visual detail while retaining evidence, but visual sampling must not alter
simulation decisions or computed metrics.

Measure host runtime, memory, and trace growth on an identified workload and
platform before saying an experiment is cheap enough for interactive use. Record
simulation time separately. Feasibility evidence for the bounded landing-page simulator lives in its
[lab contract](../labs/request-playground.md). This does not establish feasibility
for larger or more detailed connected simulations.

## Worked candidate: retrieve a prefix or recompute it

**Status: proposed abstraction, not an implemented or validated timing model.**

Question: for one compatible prefix needed by one worker, when does retrieval
finish earlier than recomputing its state?

Start with an isolated case: one artifact in one remote tier, a worker able to
hold its restored state, no competing work, and serialized retrieval components.
Define readiness as the point when the worker can continue with the required
state. The candidate accounts for access/setup delay, all modeled transfer legs,
any restoration work, and recomputation work. It compares their completion times
from the same starting instant. Retrieval must restore equivalent usable state.

This narrow question deliberately excludes queues, sharing, eviction during
transfer, and overlap. It cannot select a routing policy under load or predict a
particular device without additional evidence. If the question includes such
conditions, extend the abstraction rather than reuse its isolated verdict.

Verification should check readiness dependencies, unit accounting, compatible
state, capacity failure, zero-transfer and zero-work limits, and agreement with
an independent calculation. Validation of real timings needs reference retrieval
and recomputation cases across the stated sizes and access patterns, including
cases outside calibration. Sweep uncertain delays and rates around the crossover;
if the winner changes within plausible ranges, report an unresolved choice.

An inexpensive implementation could store artifact metadata and a handful of
events instead of materializing its bytes. This preserves size and readiness
accounting for this question; it cannot prove state contents are correct. A
separate small numerical comparison can check reuse semantics. Host execution
cost still needs measurement once implemented.
