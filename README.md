# Inside Inference

> What happens if you change this?
>
> Understand what changed in AI inference. See the mechanism. Find its place in the stack.

Inside Inference is a personal learning project, built in public. Follow a request
from a chat, agent, or application through an inference system. Change one thing,
observe what happens, and investigate why.

The observatory covers the entire inference journey: how input becomes tokens,
how a model computes a response, and how caching, scheduling, data movement, and
hardware constraints affect that work. A tiny language model makes computation
inspectable; focused simulations let us explore questions beyond that model.

The experience should invite three levels of exploration: **follow the request →
inspect a step → change a mechanism and examine its computation**. Someone curious
about an attention mechanism should be able to find where it acts, see what it
retains or discards, and understand which tradeoffs the experiment can demonstrate.

Our central work is choosing abstractions that preserve the behavior being
studied. Visuals make those abstractions approachable and testable. The ontology
gives the visuals precise meanings. Both must stay connected to executable evidence.

Our philosophy:

- **Learning first.** Personal understanding is the goal; public usefulness is
  welcome. Competition and audience growth do not decide what is worth exploring.
- **Evidence before claims.** Running software, correct computation, and a
  representative abstraction are separate achievements.
- **Expose the mechanism.** Let readers inspect inputs, state changes, assumptions,
  and consequences rather than accept an animation as an explanation.
- **One source of truth.** The computation owns its results. Documentation and
  visuals must not invent a second account of what happened.
- **Change one thing at a time.** Keep comparisons controlled, reproducible, and
  honest about what they establish.
- **Keep the limits visible.** Tiny successes and failures may not transfer to
  real systems. A useful experiment explains where its conclusions apply.

The intended public home is **insideinference.dev**; this is a working assumption,
not a deployment announcement.

The project is at an early bootstrap stage, with a visual request-cost playground
and a standalone attention recurrence lab. The connected model instrument is
still being built.

[Try the playground and development workflows](docs/development.md) ·
[Scope and learning goals](docs/purpose/README.md) ·
[Architecture](docs/architecture/inspection.md) ·
[Ontology](docs/ontology/README.md) ·
[Milestones](docs/purpose/milestones.md)

[MIT license](LICENSE).
