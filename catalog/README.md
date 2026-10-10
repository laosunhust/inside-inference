# Lab catalog

`stack.json` is the source of truth for classification and lab metadata.
`make _intro-page` validates it and builds a portable site under `out/intro-page/`.
Edit sources, never generated HTML. The site's presentation lives in `web/` and
its generator in `scripts/build/intro_page.py`. The visual landing page inspects actual
GPT runs from `inside_inference/generation.py`; the catalog is rendered at `atlas.html`.
The separate `request-cost.html` replays bounded cost traces from `inside_inference/labs/journey.py`.

The request playground also generates an ontology view from
the YAML modules in `docs/ontology/`. Selectable visual objects reference canonical terms;
phase explanations use recorded event rules and state snapshots. Keep these
connections intact when adding visual mechanisms.

## Connect to the request journey

Follow [the current purpose](../docs/purpose/README.md). The area map locates a
mechanism; a request timeline should show how its effects reach other areas.
For connected simulations, describe arrivals, queues, routing, cache residency,
worker and link limits, and service-time assumptions. Compare the same workload
under a controlled policy change. Local operation savings do not by themselves
establish better request latency or system throughput.

## Areas are responsibilities

Area IDs describe durable boundaries, not vendors, products, or a claim that the
stack is strictly linear. Keep an area's invariant stable as mechanisms change.
Each area describes what to observe, example innovation families, potential gains,
costs, and the limits of tiny experiments. Add an area only for a distinct
responsibility; classify cross-cutting innovations with related-area links.

Training and post-training are provenance for the model, not experimentation
areas in this repository. Evaluation, quality,
latency, throughput, memory, energy, and economics are comparison axes across
areas, rather than additional execution layers.

## Add an innovation

Add one entry to `innovations` with:

- A unique, permanent lowercase hyphenated `id` and a readable `name`.
- One `primary` area ID and zero or more `related` area IDs.
- `journey_steps`: nonempty unique phase IDs (`prefill`, `decode`) for current
  step-to-lab navigation. Extend supported steps with their first navigation
  consumer. A link means relevance, not integration into that phase.
- `ontology_binding`: one primary ontology concept and unique related concepts.
  Bind the concrete lab question and inspected mechanisms, not every dependency or
  every topic in its source paper. Related links refer to the same experiment.
  For example, our KDA recurrence lab does not implement Kimi Linear’s hybrid architecture.
- `status`: `planned` for a brief, or `mechanical-demo` for a wired executable demo.
- `summary`, `mechanism`, `benefit`, `cost`, `limit`, and the `question` to investigate.
- `sources`: primary-source objects with `title` and HTTPS `url`. Cite a paper or
  author implementation for specific named research. Unresearched generic lab
  plans can start with an empty list; they must not assert published results.

Every entry receives `labs/<id>.html` and appears under its primary and related
areas. A planned entry remains readable and explicitly says it has no experiment.
Step-level lab links and ontology-owner lab links require an implemented
(`mechanical-demo`) entry whose primary ontology binding matches that owner.
Related-only and planned entries do not count; a step with none shows
“No primary lab yet” without a link. Catalog browsing retains labeled related
references and planned entries for discovery.
For an executable demo, add its computation and page rendering, register its ID
in the generator's validation, and add independent correctness checks. Do not
change only the status. More evidence types can be introduced with their actual
implementations; unknown statuses fail validation today.

## Lab evidence contract

Use the [inference ontology](../docs/ontology/README.md) for shared terms and
attach the [abstraction contract](../docs/labs/README.md#abstraction-contract)
to each implemented lab's specification. The ontology owns those meanings; the
catalog locates labs and does not redefine them. Record execution cost separately
from evidence that the abstraction is adequate for its question.

Use the distinction between feasibility, implementation correctness, and
[abstraction validity](../docs/purpose/README.md#the-abstraction-is-the-core-work).
The catalog's `planned` / `mechanical-demo` status describes implementation
availability only. It is not a validity grade or a statement of real-world fidelity.

Every implemented lab should provide:

1. Inputs, configuration, the baseline, and the specific changed mechanism.
2. Inspectable transitions computed by the implementation, with raw evidence.
3. Controlled comparisons; explain math, information flow, and systems effects
   only to the extent each is represented.
4. Clear labels for mathematical properties, toy observations, simulated costs,
   and external measurements. Source external results and record their conditions.
5. Advantages, disadvantages, failure cases, and what this lab cannot establish.
6. False-positive and false-negative risks, including scale, training, shape,
   workload, hardware, and implementation mismatches.
7. A claim-specific abstraction argument: target question and regime, mapping to
   the real system, preserved relationships, omitted effects, and why those
   omissions are acceptable for this question.
8. Separate evidence for implementation correctness and abstraction validity,
   including counterexamples, sensitivity checks, and unresolved discrepancies.
   Identify comparisons performed and predictions that remain unvalidated.

For example, the KDA demo varies only manually selected decay gates with identical
inputs. Its trace validates a recurrent update, not model quality. A trained
attention comparison needs matched training; framework comparisons need real
execution traces and representative shapes; topology studies need explicit
transfer and queueing assumptions.

Run `make _check`, `make test`, and `make _intro-page` before completing a lab change.
Check browser behavior when changing interactive controls. Preserve existing IDs
so links from the atlas, other labs, and external discussions remain useful.

The reader-facing concept index includes only subjects bound to a current or
planned lab. Ontology membership alone does not create a learning topic: experiment
envelopes, inspection state, and API bookkeeping belong in the declaration
reference. Bind labs to the inference mechanism or system behavior being studied.

Requested generation behavior and backend execution strategy are different
boundaries. A token budget or selection rule belongs to GenerationPolicy;
speculative drafting and verification belong to Decoding and must preserve
the declared output semantics. Bind the mechanism a lab changes, not a similarly
named request setting. Related subjects need an actual inspected relationship.

InferenceSystem is composition, not the default owner of a mechanism. A lab about
forward arithmetic binds to ModelExecution; cache retention and eviction to
KVCache; a state handoff to StateTransfer. InferenceResponse describes output
publication/completion, so merely producing output does not justify associating a
numerical lab with it. A related binding needs a concrete inspected relationship.
