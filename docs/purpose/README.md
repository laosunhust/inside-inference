# Purpose: understand and improve inference systems

> What happens if you change this?

Teams improve systems by interpreting feedback, choosing an action, observing its
consequences, and revising their judgment. The same discipline can guide a human
operator, an agent, or both working together. Inside Inference makes that cycle
inspectable through controlled inference experiments. We call this a **ReAct loop
for inference system operators**: reasoning and action informed by observations,
not a requirement to use a particular agent or prompting algorithm.

Understanding is the first step; justified improvement is the intended outcome.
Personal learning remains a primary motivation. Helping others is welcome;
audience growth, commercial success, and an unoccupied niche are not prerequisites.

## Why this laboratory

A customer reports a stall, a vendor claims faster hardware, or an operator must
serve workloads on a constrained fleet. Each needs a way to connect an observed
or desired outcome to mechanisms that can be inspected and changed. A collection
of isolated technique demonstrations is insufficient for that question.

Model execution and serving constrain each other: attention determines retained
state, placement determines movement, and scheduling changes execution shapes and
resource contention. Existing systems study these connections too; we do not claim
that the field ignores them or that our approach is unique. Our intended contribution
is an approachable, reproducible investigation connecting real numerical work to
explicit system assumptions and customer-facing outcome measures.

Real-hardware experiments can be costly. Tiny-model execution with explicit
resource simulation may help narrow which experiments are worth running. Logical
resemblance and measured local behavior provide limited evidence; directional
screening accuracy still needs validation against the target regime.

## Learning and decision goals

| Priority | Question | Intended outcome |
| --- | --- | --- |
| P0 · Understand | What changes mechanically, and why does it affect the request journey? | Inspectable computation, state, and declared resource effects. |
| P1 · Prioritize experiments | With requirements and hardware fixed, which optimizations merit real-hardware trials? | A conditional shortlist and the measurements that could change it. |
| P2 · Explore deployments | With requirements fixed and hardware variable, which combinations merit evaluation? | Feasible alternatives and tradeoffs to inform stack and procurement investigation. |

Inference is a constrained optimization problem: service requirements must fit
available capacity, cost, and policy limits. Large shared fleets may smooth
independent demand across tenants; smaller or dedicated regions have less room
to absorb peaks and failures, making placement and hardware choices consequential.
Averaging does not remove correlated peaks or binding constraints.

P0 supplies the understanding needed for P1. When no candidate on the fixed fleet
satisfies requirements, an empty P1 shortlist becomes a P2 question: what hardware
or topology change could make a feasible deployment possible?

Understanding supports both decision goals. A justified rejection or a precise
next measurement is useful progress; a simulator need not force a winner. These
are intended capabilities, not established production rankings or procurement
recommendations. The [constrained-fleet scenario](../labs/constrained-fleet.md)
illustrates the questions.

## Input, system, and output

| Surface | Purpose |
| --- | --- |
| Input · Reproduce | Construct controlled workloads to test a claim, including synthetic reproduction when private original input is unavailable. |
| System · Experiment | Inspect and vary inference mechanisms, software, hardware, and topology against an understood baseline. |
| Output · Evaluate | Connect customer operational issues and feature requests to observable outcomes and acceptance criteria. |

Customer feedback is a claim or need; execution output is evidence. The output
surface brings them together without treating them as the same thing. A synthetic
reproduction can support a possible explanation without establishing the cause of
the original incident. Failure to reproduce leaves the claim unresolved under the
tested conditions; it does not establish that the customer was wrong.

Experiment configuration determines what is tested; request input supplies the
controlled conditions, and execution evidence records what actually happened.
The [operator loop](operator-loop.md) owns the user-driven and operator-driven
investigation workflows, their comparison conditions, and evidence requirements.

## Scope and boundaries

The scope spans inference: client interaction, tokenization, model computation,
caching, scheduling, state movement, and resource constraints. A naïve decoder-only
Transformer establishes an inspectable reference before more advanced mechanisms.
The tiny model's vocabulary is fixed at **384 total token IDs**, including controls
and fallback symbols. It is a numerical instrument, not a useful assistant or a
model of a child's development. Training supplies compatible weights as supporting
work; training research is outside the mission. Small, inspectable model families
can support comparisons of behavior and inference cost. Better answers help readers,
but do not establish execution correctness.

The focus is connecting runtime and serving across boundaries. KV reuse and state
handoff establish groundwork for heterogeneous execution, parallelism, and MoE.
Hardware and data-center simulations should represent the constraints relevant to
a question, not imply that every real limitation is modeled. Many connected labs
may become useful; their count and novelty are not success criteria.

Correct execution, representative abstraction, and production benefit are separate
achievements. Preserve mathematical evidence, measured toy behavior, simulated
system behavior, and external measurements as distinct evidence. A warning cannot
repair a wrong abstraction. Unsupported conclusions remain unresolved; apparent
wins and losses may reverse at another scale or under different conditions.
The [experimental method](../labs/methodology.md) develops these boundaries.

## Presentation and reuse

Let readers observe a mechanism, locate it in the system, and follow its consequences:
**request journey → execution step → mechanism and numbers**. Show computed changes;
reveal equations, assumptions, and traces on demand. Configuration previews must not
appear to be executed experiments. Visual polish is an inspection aid, not evidence.

Reuse established explainers, engines, and simulators where their semantics fit;
keep small reference implementations where inspectability warrants them. The
[similar-products assessment](../similar-products/README.md) owns reuse choices and
presentation references. The intended public home is **insideinference.dev**;
registration and deployment are not established by this document.

The root [documentation map](../../README.md#start-exploring) identifies the owners
of design, declarations, implementation, acceptance criteria, and historical context.
