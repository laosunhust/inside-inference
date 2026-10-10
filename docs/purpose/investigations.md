# Investigations and improvement

Inside Inference should help people understand a real inference problem, narrow
its possible causes, and decide what to measure or change next. Its ontology is
the foundation for that investigation: responsibilities, state, dependencies,
resource constraints, and observable boundaries. Labs are instruments for testing
explanations and interventions. Their number or novelty is not the objective.

This is intended direction, not a claim that automated diagnosis, hardware
calibration, or fleet optimization is implemented. The [purpose overview](README.md#learning-and-decision-goals)
owns P0/P1/P2; [milestones](milestones.md) own delivery order. This page establishes
why those instruments are needed, without adding executable ontology authority.

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

## Why separate execution phases or hardware pools?

Disaggregated inference is a question to test under constraints. Compare a colocated
baseline with separated phases while preserving model behavior and user requirements.
Investigate whether specialization and reduced interference outweigh handoff costs,
extra queues, state capacity, compatibility costs and stranded capacity. An advantage
is durable only over an evidenced range of workload mixes, context lengths, traffic,
resource ratios and failure conditions; a favorable point is not a universal result.

AMD's [Helios/Cerebras announcement](https://ir.amd.com/news-events/press-releases/detail/1293/amd-and-cerebras-announce-industry-leading-ultra-low-latency-and-high-throughput-ai-inference-solution)
describes a combined disaggregated inference workflow. Treat that as motivation for
investigating complementary resources and phase placement. The announcement does
not establish our model's parameter values or validate a predicted advantage.
The initial ResourceGraph can describe hypothetical locations and links; execution
placement, compatibility and calibrated hardware profiles remain unimplemented.
