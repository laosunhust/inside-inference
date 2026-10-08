# Lab catalog

`stack.json` is the source of truth for classification and lab metadata.
`make intro-page` validates it and builds a portable site under `out/intro-page/`.
Edit sources, never generated HTML. The site's presentation lives in `web/` and
its generator in `scripts/build/intro_page.py`. The visual landing page inspects actual
GPT runs from `inside_inference/generation.py`; the catalog is rendered at `atlas.html`.
The separate `request-cost.html` replays bounded cost traces from `inside_inference/labs/journey.py`.

The request playground also generates an ontology view from
`docs/ontology/inference.md`. Selectable visual objects reference canonical terms;
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
- `status`: `planned` for a brief, or `mechanical-demo` for a wired executable demo.
- `summary`, `mechanism`, `benefit`, `cost`, `limit`, and the `question` to investigate.
- `sources`: primary-source objects with `title` and HTTPS `url`. Cite a paper or
  author implementation for specific named research. Unresearched generic lab
  plans can start with an empty list; they must not assert published results.

Every entry receives `labs/<id>.html` and appears under its primary and related
areas. A planned entry remains readable and explicitly says it has no experiment.
For an executable demo, add its computation and page rendering, register its ID
in the generator's validation, and add independent correctness checks. Do not
change only the status. More evidence types can be introduced with their actual
implementations; unknown statuses fail validation today.

## Lab evidence contract

Use the [inference ontology](../docs/ontology/inference.md) for shared terms and
attach the [abstraction contract](../docs/ontology/experiment.md#abstraction-contract)
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

Run `make check`, `make test`, and `make intro-page` before completing a lab change.
Check browser behavior when changing interactive controls. Preserve existing IDs
so links from the atlas, other labs, and external discussions remain useful.
