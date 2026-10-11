# Inside Inference

> What happens if you change this?
>
> Understand what changed in AI inference. See the mechanism. Find its place in the stack.

Inside Inference is a laboratory for understanding inference systems, built in
public. Follow a workload from a chat, agent, or application through an inference
system. Change one thing, observe what happens, and investigate why.

Real problems drive the work: explain a stalled request, evaluate a hardware
claim, or explore how to serve workloads on a constrained fleet. Labs are
instruments for these [operator loops](docs/purpose/operator-loop.md), and the
ontology supplies the boundaries, dependencies, and observations needed to
connect symptoms to mechanisms and test possible improvements.

The [purpose](docs/purpose/README.md) explains why constrained fleets motivate
these investigations and how understanding supports deployment decisions.

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

Each topic has one documentation owner. Other pages introduce it or link to it;
they do not redefine its mission, scope, or rules. Historical plans and research
reports preserve their original context, not current policy.

| Topic | Authority and boundary |
| --- | --- |
| Mission, priorities, and project scope | [Purpose](docs/purpose/README.md): why and high-level what. |
| Investigation workflows | [Operator loop](docs/purpose/operator-loop.md): user/operator loops and decision evidence. |
| Meanings and ownership | [Ontology](docs/ontology/README.md): executable semantic authority. |
| Field shapes and generated interfaces | [Data model](data-model/README.md): declarations, not duplicate domain meanings. |
| System design | [Architecture](docs/architecture/README.md): component boundaries and interactions. |
| Numerical mechanisms and preparation | [Implementation](docs/implementation/README.md): how the instruments work within declared scope. |
| Delivery order and completion | [Milestones](docs/implementation/milestones.md): milestone-specific acceptance and status. |
| Experiment validity | [Lab guidance](docs/labs/README.md): claim-specific assumptions and evidence. |
| Lab discovery | [Catalog](catalog/README.md): indexing and links to owning labs. |
| Prior work and reuse | [Similar products](docs/similar-products/README.md): assessments and source limitations. |
| Research findings | [Research](docs/research): dated investigations and results, not standing requirements. |
| Historical proposals | [History](docs/history): superseded context, not delivery commitments. |
| Development workflows | `make help` → [Makefile](Makefile): commands and prerequisites. |
| Governance | [AGENTS.md](AGENTS.md): durable agent obligations; [limits](governance/limits.yaml), [locks](governance/approval-lock.yaml), and [evaluations](governance/evaluations.yaml): enforced bounds and work-item evidence. |

Workflow code follows the same boundaries: [build generators](scripts/build),
[checks](scripts/check), [local development](scripts/dev), and
[experiment entry points](scripts/experiments). Numerical and simulation behavior
lives in [inside_inference/](inside_inference); [web/](web) presents its evidence.
The [Makefile](Makefile) owns commands and setup. Use `make help`; uncommon
maintenance targets begin with `_`.

The laboratory is evolving. The [milestone scorecard](docs/implementation/milestones.md)
distinguishes working instruments, planned experiments, and missing evidence.
The intended public home is **insideinference.dev**; this is not a deployment announcement.

[MIT license](LICENSE).
