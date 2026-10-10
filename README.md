# Inside Inference

> What happens if you change this?
>
> Understand what changed in AI inference. See the mechanism. Find its place in the stack.

Inside Inference is a laboratory for understanding inference systems, built in
public. Follow a workload from a chat, agent, or application through an inference
system. Change one thing, observe what happens, and investigate why.

Real problems drive the work: explain a stalled request, evaluate a hardware
claim, or explore how to serve workloads on a constrained fleet. Labs are
instruments for these [investigations](docs/purpose/investigations.md), and the
ontology supplies the boundaries, dependencies, and observations needed to
connect symptoms to mechanisms and test possible improvements.

An inference system is a constrained optimization problem. Decisions from hardware
planning to per-step scheduling must satisfy capacity, latency, quality, availability,
and policy constraints while trading cost, service, and resilience against each other.
Large public regions absorb much of this through statistical averaging across many
tenants. Smaller regions, such as sovereign or dedicated deployments, often cannot:
demand peaks, failures, residency rules, and mixed hardware become binding.
The [ontology roadmap](docs/ontology/README.md#system-optimization-direction) distinguishes
these planned optimization inputs and objectives from executable declarations.

The intended outcome is an explanation you can inspect: where an innovation acts,
what computation or state it changes, and which consequences follow under the
experiment's assumptions. Explore **the request journey → an execution step → its
mechanism and numbers**.

The scope spans the inference system, from tokenization and model computation to
caching, scheduling, and data movement. A tiny GPT makes numerical work inspectable;
explicit resource simulations explore system questions. Understanding mechanisms
comes first, and it serves exploration: real-hardware experiments are slow and
costly, so the laboratory aims to rule out infeasible options, expose crossover
conditions, and identify which measurements matter before hardware is committed.
With justified assumptions and evidence, it should help shortlist optimizations
for an existing hardware pool, or hardware/software combinations worth testing.
These are conditional candidates for real-hardware evaluation, not established
production performance or procurement recommendations. Choosing abstractions that
preserve the relevant behavior is the core work.

Our current focus is the boundary between model execution and serving: what happens
when state or computation moves between devices, runtimes, or nodes? Make those
dependencies observable, reuse established tools, and add one explainable change
at a time. Heterogeneous execution and mixture-of-experts are directions to explore;
they are not capabilities already implemented here.

## Start exploring

| I want to… | Start here |
| --- | --- |
| Run the visual laboratory | `make help` → [Makefile](Makefile) |
| Understand the mission and expected outcomes | [Purpose](docs/purpose/README.md) |
| Find existing tools and reuse opportunities | [Similar products](docs/similar-products/README.md) |
| Understand the words and boundaries | [Ontology](docs/ontology/README.md) |
| Follow how the system is designed | [Architecture](docs/architecture/README.md) |
| Inspect declared inputs, outputs, and generated models | [Data model](data-model/README.md) |
| Find an innovation and its lab | [Lab catalog](catalog/README.md) |
| Inspect the tiny model's mechanics | [Implementation](docs/implementation/README.md) |
| Assess progress and acceptance criteria | [Milestones](docs/purpose/milestones.md) |
| Inspect build limits and evaluation criteria | [Limits](governance/limits.yaml) · [Approval locks](governance/approval-lock.yaml) · [Evaluation](governance/evaluations.yaml) |
| Contribute code or documentation | [Contributor guidance](AGENTS.md) |

Workflow code follows the same boundaries: [build generators](scripts/build/),
[checks](scripts/check/), [local development](scripts/dev/), and
[experiment entry points](scripts/experiments/). Numerical and simulation behavior
lives in [inside_inference/](inside_inference/); [web/](web/) presents its evidence.
The [Makefile](Makefile) owns commands and setup. Use `make help`; uncommon
maintenance targets begin with `_`.

The laboratory is evolving. The [milestone scorecard](docs/purpose/milestones.md)
distinguishes working instruments, planned experiments, and missing evidence.
The intended public home is **insideinference.dev**; this is not a deployment announcement.

[MIT license](LICENSE).
