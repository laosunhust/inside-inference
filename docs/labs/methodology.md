# Experimental method and evidence

[Purpose](../purpose/README.md) owns why the laboratory exists. This page owns
how to choose an instrument, preserve meaningful mechanisms, and bound its claims.

## Fixed language, inspectable computation

The nano-GPT vocabulary is **frozen at 384 total token IDs**, including lexical
entries, punctuation, control tokens, and fallback symbols. Smallness makes every
logit and embedding row inspectable; it does not freeze attention, serving, or
resource experiments. Vocabulary changes require an explicit contract revision
and separately identified experiments.

Everyday words inspired by a three-year-old's language form a deliberately bounded
lexicon, not a developmental model or a promise of conversational competence.
Unfamiliar text is also instructive: reversible UTF-8 byte fallback exposes the
sequence expansion and context cost of names, foreign scripts, and large words.
Representability does not establish learned meaning. Normalization, truncation,
and output repair must not silently conceal what the model consumed or emitted.

The [vocabulary audit](../research/vocabulary-budget.md) owns the rationale;
the [tokenizer manifest](../../data/tokenizer/README.md),
[codec](../implementation/tokenizer.md), and [corpus](../../data/corpus/README.md)
own preparation details and known limitations.

Input representability does not imply learned meaning or multilingual ability.
The baseline selects the highest raw logit across all 384 IDs, with lowest-ID
tie-breaking. It imposes no lexical grammar, token mask, output repair, or forced
spacing. Accepted runs stop only on a selected TURN_END or the requested token
budget; prompt-plus-budget capacity is checked before execution. The complete
output ID sequence remains inspectable, including byte/hex/control IDs and
malformed encodings. Diagnostic token markers are not claims of decoded speech.
Any future constrained-decoding experiment requires explicit authorization and a
separate declared policy; it must not silently replace this baseline.

Small vocabulary is intentional: readers should be able to inspect every logit,
embedding row, and token decision. It does not freeze attention, state mechanisms,
precision, scheduling, or resource experiments. The wider system observatory
remains in scope around this bounded numerical instrument.

Use three connected zoom levels: **customer journey → execution steps → mechanism
configuration and numerical detail**. Prefill and decode both expose the model's
internal operations, including embeddings and attention. Selecting an attention
alternative must eventually run real computation and reveal its trace, rather
than merely change the diagram. See the [inspection architecture](../architecture/inspection.md)
for code boundaries and the incremental implementation path.

## The abstraction is the core work

The central artifact is a justified abstraction of the problem. Code makes that
abstraction executable; visualization and game interactions make it inspectable.
A working, engaging simulation can still teach the wrong causal model.

Keep three questions separate:

| Question | Evidence needed | What it does not establish |
| --- | --- | --- |
| Can it run? | Browser/backend execution, responsiveness, bounded resource use. | Correct computation or a representative abstraction. |
| Did we implement the specified model correctly? | Independent calculations, invariant checks, reference comparisons, and trace checks. | Whether the specified model captures the real question. |
| Is the abstraction adequate for this question? | A justified mapping to the target system, preserved causal dependencies, and analytical or empirical validation over stated conditions. | Validity for other questions, workloads, or scales. |

Validity belongs to a claim under conditions, not to a simulator as a whole.
A cache model may establish correct reuse while saying nothing reliable about
latency. A recurrence demo may compute exact state updates while saying nothing
about learned semantic features or model quality. Passing tests for either does
not validate a larger inference-system explanation.

Before choosing a visualization or implementing a simulator, state the question,
the proposed conclusion, and the regime in which it should hold. Identify the
state, constraints, and causal relationships needed to answer it. Explain what
is omitted and why that omission should not change the answer. If it could change
the answer, include it, narrow the claim, or leave the answer unresolved.

For example, a question about whether retrieving a cached prefix is faster than
recomputing it cannot be answered by showing a cache-hit animation. The abstraction
must account for the relevant residency, dependencies, retrieval path, waiting,
and recomputation work under the chosen workload. Representing tiers with a few
parameters is a hypothesis to validate for that question, not sufficient evidence
that real storage behavior has been represented.

Choose validation appropriate to the claim: derivation for an idealized property,
an independent implementation for algorithmic behavior, or reference measurements
and traces for empirical timing claims. If parameters are fitted to measurements,
check additional cases not used for fitting. Probe boundary cases, counterexamples,
and sensitivity to uncertain assumptions. Agreement on one example, or matching
one aggregate number, is insufficient evidence for general behavior.

A visible warning cannot repair an invalid abstraction. Unsupported predictions
must remain hypotheses; omit a numerical verdict or winning policy when the model
cannot support one. If a known simplification teaches the wrong mechanism, fix it
or withdraw that explanation. Do not present known errors as acceptable toy behavior.

The game should reward investigating and explaining consequences within a stated
model. Its scoring, animation, and progression must not introduce fictional causal
rules that readers could mistake for inference behavior. An illustrative analogy
can orient a reader, but it is not experimental evidence.

The [ontology](../ontology/README.md) defines the shared entities and experiment
contracts used to put this principle into practice. Its
[abstraction contract](../labs/README.md#abstraction-contract) separates
the evidence for representativeness from the measured cost of execution.

## Use the right instrument

The tiny GPT is one instrument for studying inference arithmetic and learned behavior. It need not
simulate every part of a serving system. Use small state machines for cache
semantics, event simulations for queues and scheduling, analytical resource models
for hardware thought experiments, and real traces when execution details matter.

An intended reusable artifact is a tiny reference model for testing inference
changes cheaply with real, inspectable computation. Its checkpoint, tokenizer,
inputs, and traces could support reproducible correctness tests and connect to
explicit system simulations. This is a step between a mathematical proposal and
deployment evidence, not a replacement for calibrated hardware models, realistic
workloads, or cluster measurements. Fewer parameters than another tiny model is
not a success criterion; preserving the mechanism under study is.

The central configurable object is the inference system: input preparation,
model computation, serving policies, state placement, and resource constraints.
A worker is one execution location inside it. Start with one selected client
workload and expose more internal detail as needed, including tokenization,
embeddings, layer computation, logits, token selection, and output decoding.
The nano-GPT must supply real numerical traces for those stages; visualization
is an inspection surface for computation and simulation.

A first connected simulator should be deliberately small: a reproducible request,
bounded execution resources, prefix-state residency, and explicit service
and transfer assumptions. Add queues and competing requests when studying contention. First make its baseline timeline inspectable. Then
change one policy and replay the same workload. The main-page
[KV residency experiment](../../data/experiments/catalog.yaml) implements a bounded,
idealized instance of this direction. It is not a production serving engine
or a validated predictor of real-system timings.

Simulation must expose its assumptions: arrival times, input/output lengths,
shared prefixes, policy, resource capacity, memory budget, transfer bandwidth and
latency, and how service times are obtained. Introduce power, cooling, topology,
and failure constraints when they answer a concrete learning question. Avoid
implying that an unmodeled data-center limit has been accounted for.

## What counts as learning evidence

Keep four kinds of evidence distinct: mathematical properties, measured toy
behavior, simulated system behavior, and external measurements. Record conditions
and sources. Animations should display computed transitions or clearly identify
an illustrative analogy; visual polish is not validation.

Tiny experiments and simulations can produce false positives and false negatives.
A toy success may disappear with different training, scale, arrivals, or hardware;
a toy failure may conceal a useful real-world technique. State specifically what
could reverse the apparent result. Never use uncalibrated simulator timings as
claims about real deployments.

Success means being able to explain a transition, predict an intervention's
consequence, and identify the assumptions on which that prediction depends.
Public feedback can improve the explanation, but audience metrics do not decide
whether an experiment was worthwhile. The [milestones and acceptance criteria](../implementation/milestones.md)
define the first instrument’s measurable targets and separate them from the current
bootstrap checkpoint. Targets are not claims of results already achieved.
