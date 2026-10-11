# The operator improvement loop

The [purpose](README.md) introduces the operator's reasoning-and-action cycle.
This document owns its two investigation workflows and the evidence needed to
choose the next action. Ontology supplies the responsibilities, state, resource
constraints, and observable boundaries; labs are instruments for testing them.

This is intended direction, not a claim that automated diagnosis, hardware
calibration, or fleet optimization is implemented. The [purpose overview](README.md)
owns P0/P1/P2 and the input/system/output framing; [milestones](../implementation/milestones.md)
own delivery order. This page defines the investigation workflow without adding
executable ontology authority or an autonomous deployment policy.

## Two improvement loops

**User-driven:** customer report or feature request → testable hypothesis and
acceptance criteria → controlled reproduction → system evidence → intervention →
verification under the reproduced condition against the predeclared acceptance
criteria. This closes the lab investigation, not the original customer issue.
Confirming that the original customer's need is met requires evidence from outside
the lab, such as a check in the affected deployment or customer confirmation.
Without that evidence, the customer outcome remains unverified.

Adjust input conditions as evidence narrows the question, recording each changed
workload rather than silently changing the comparison. A feature request expresses
a desired outcome; it need not imply a current defect.

**Operator-driven:** proposed software or hardware change → baseline and fixed
workload → predicted customer benefit and regression criteria → controlled
comparison → adopt, reject, or obtain more evidence. Define explicit feedback
(such as a reported stall or satisfaction judgment) and implicit signals (such as
completion, cancellation, retries, or latency) before examining results. An implicit
signal is a proxy with alternative explanations: cancellation alone does not prove
dissatisfaction. Simulated outcomes do not establish actual customer benefit.

For each comparison, hold input and relevant conditions fixed, including resource
budgets and model requirements, and identify the intentional intervention. If the
intervention is hardware, declare what changes and the comparison constraints;
identical requests alone do not make a fair comparison. Check displaced costs,
quality, availability, and effects on other requests as well as the desired gain.
Evidence may justify only a real-hardware trial, not production adoption.

The operator uses execution evidence to choose the next experiment. An inspection
click or configuration preview is not an executed intervention. Neither loop
automatically authorizes deployment. The [ontology terminology](../ontology/README.md#experiment-harness-and-system-under-test)
separates experiment configuration, request input, and execution evidence.

## Reproduce without the original input

Original requests may be unavailable for privacy or other reasons. Construct a
controlled workload from the conditions relevant to the claim: for example,
context length, arrival pattern, shared prefixes, cancellation, or client read
behavior. Record which conditions are known, which are synthesized, and which
remain unknown. Preserve the instantiated inputs so another operator can reproduce
the experiment; a transformation recipe alone is insufficient execution evidence.

A synthetic reproduction can expose a plausible mechanism without proving the
cause of the reported incident. Failure to reproduce means unresolved under the
tested conditions, not that the customer was wrong. Distinguish reports by evidence
and reproducibility rather than volume or confidence. Repeated complaints can
motivate investigation but do not alone establish prevalence or a common cause.

## Start with a real question

| Starting point | Investigation | Useful outcome |
| --- | --- | --- |
| Customer: “My chat gets slow or stuck when the conversation gets long.” | Locate where progress stops; distinguish client, interaction, transport, admission, computation, and state dependencies. | An evidence-backed explanation, or a smaller set of hypotheses and the next observation needed to separate them. |
| Vendor: “Our hardware makes LLM serving much faster.” | Identify the changed mechanism, its baseline, workload, compatibility requirements, and limiting resources. | A conditional assessment and a real-hardware experiment that could support or contradict the claim. |
| Operator: “I have hardware X/Y/Z and this network; serve models A/B/C for these users.” | Explore placement, parallelism, phase separation, state movement, scheduling, and resource contention under service requirements. | Feasible candidates, reasons for exclusion, sensitivity to assumptions, and a shortlist for measurement. |

For a fixed fleet, explore software and deployment choices (P1). When hardware
may change, explore hardware/software combinations (P2). Understanding the causal
mechanism (P0) remains necessary in both. No feasible candidate is a valid result;
show which constraint binds and what evidence or permitted change could alter it.

An agent is an important source of workloads: tool waits, follow-up invocations,
shared context, cancellation, retries, and bursty concurrency. We do not need to
build an agent platform to study their hosting consequences. Client rendering,
external tools, and account policy can also cause symptoms; retain these as
possible external causes rather than assuming every complaint is an inference
failure. Not every external component needs an internal simulator.

## From a symptom to a discriminating experiment

1. Preserve the reported symptom, environment, and available evidence. Separate
   the reporter's explanation from observed behavior. Public issue reports supply
   failure stories and counterexamples, not verified diagnoses or prevalence.
2. Map plausible explanations to system responsibilities and dependencies. An
   explanation without an adequate ontology binding exposes a modeling gap;
   do not force it into a generic system concept.
3. Locate the last evidenced progress and the next dependency for the same
   invocation and attempt. Distinguish request submission, admission, execution,
   output publication, receipt, and consumption. Connect retries and follow-up
   requests without treating them as one uninterrupted invocation.
4. Choose the observation or controlled intervention that separates competing
   explanations. Hold relevant workload and correctness requirements fixed.
5. Reproduce the mechanism with the appropriate instrument, compare against the
   baseline, and record what remains unresolved. A reproduced local failure does
   not establish the cause of a proprietary service's incident.
6. Test a proposed improvement across the journey, including displaced costs,
   effects on other requests, and conditions that could reverse the result.

For a long-conversation freeze, independently examine displayed history, actual
input tokens, uncached prefix length, retained KV state, and client consumption.
These can grow together while affecting different mechanisms. If identified output
has reached the client but is not visible, failure to generate that output cannot
explain that interval. That observation does not prove the rest of the system is
healthy. Missing telemetry leaves a cause unknown; it does not rule it out.

Ontology should support this reasoning through relationships and invariants as
well as nouns: who produces state, who consumes it, what waits on what, which
resources are shared, and how failure or cancellation propagates. Add or revise a
concept when a concrete question needs that distinction, with owned declarations
and observations. A complaint, product name, or schema record alone does not
justify a new concept. The [ontology](../ontology/README.md) owns executable meanings.

## Hardware claims and heterogeneous fleets

A device's marketing name is not a resource model. A scenario may propose MI455X,
Vera Rubin, or other devices without implying that their behavior is implemented
or validated here. Declare the capabilities relevant to the question: supported
numerical execution, memory capacity and traffic, compute service, state formats,
transfer paths, and compatibility constraints. Attribute parameters to a source,
measurement, or explicit hypothesis; preserve uncertainty and unmodeled effects.

Network labels also need interpretation. Record bits versus bytes, direction,
per-link versus aggregate capacity, topology, latency, and shared bottlenecks.
Do not silently equate 100 GB/s with 800 Gb/s of usable payload throughput, or
treat a link advertised as 1.6 Tb/s as a contention-free end-to-end path. Protocol
overhead, concurrent traffic, and endpoint limits may matter to the question.

Fix workload distributions, model requirements, and latency, throughput, quality,
availability, and cost constraints before comparing candidates. Separate hardware
choices from placement and inference policies. Preserve actual state dependencies
when testing prefill/decode handoff, tensor or pipeline parallelism, or expert
dispatch. Unsupported execution or state-format combinations must remain infeasible
or unresolved, rather than becoming valid because a bandwidth parameter was entered.

Use tiny-model execution to test numerical mechanics and state transitions;
use explicit resource simulation to explore their conditional system consequences.
Check sensitivity and compare with independent measurements where possible.
Configuration alone does not establish directional accuracy. Reuse established
engines, traces, and simulators when their assumptions fit; the
[reuse assessment](../similar-products/README.md) owns that investigation.

## Judge progress by the investigation it enables

Before implementing an investigation, declare its baseline, success criteria,
failure cases, and evidence requirements. Useful evaluations include:

- **Diagnostic discrimination:** controlled cases produce similar visible symptoms
  through different injected causes; observations distinguish those causes.
- **Honest uncertainty:** withholding a necessary observation leaves the result
  unresolved instead of producing a confident but unsupported diagnosis.
- **Investigation effort:** measure time or observation steps to a justified next
  action against a declared baseline, without rewarding confident wrong answers.
- **Improvement validity:** an intervention preserves required correctness and
  improves the stated objective under the tested conditions; regressions elsewhere
  remain visible.
- **Screening usefulness:** when external evidence exists, compare candidate
  inclusion and exclusion against it, reporting both false positives and false
  negatives on cases beyond those used for calibration.

These are evaluation directions, not achieved scores or fixed numerical targets.
The first useful result may be “measure this boundary next.” Faster diagnosis
means reaching a justified decision with less uncertainty or effort, not merely
displaying a likely-sounding explanation sooner.
