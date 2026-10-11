# Similar products and reuse

Inside Inference should connect the request journey to inspectable computation
and its system consequences. Existing tools already cover much of each piece.
Reuse their work where it fits; build the missing connections and the minimal
instruments needed to understand them. Personal learning remains sufficient
reason to implement a small reference calculation.

The [survey](survey.md) records sources, overlaps, and evidence limits, reviewed
2026-10-08. It does not establish that our intended integration is unique.
[Known gaps, 2026-10-08](known-gaps-2026-10-08.md) extends it to heterogeneous
deployments and proposes the resulting focus.

## Where to look before building

| Need | First candidates | Preferred use |
| --- | --- | --- |
| Explain tensors and model operations | Transformer Explainer; Bycroft LLM Visualization | Inspect reusable rendering components; link existing lessons. |
| Explain a named innovation | Attention Lab; Rudrite Research | Link their explanation from the relevant lab; add our own controlled experiment where useful. |
| Check cache and serving mechanics | nano-vLLM; Mini-SGLang | Inspect code and compare compatible state transitions; use executable references where feasible. |
| Simulate queues, memory admission, and scheduling | InferScale-Sim; Vidur; Frontier; BLIS | Evaluate a narrow adapter or exported scenario before building another serving engine. |
| Explore hardware and transfer detail | LLMServingSim; TokenSim | Use specialist models when their assumptions match the lab. |

In the [constrained-fleet scenario](../labs/constrained-fleet.md), step cost depends
on placement, batch composition, and routing. Profiled primitives can participate
in such a coupled simulation when composed dynamically: [Frontier](https://github.com/NetX-lab/Frontier)
models interacting runtime behavior, [AISimulate](https://github.com/ai-dynamo/aisimulate)
predicts and searches deployment configurations offline, and LLMServingSim 2.0
models heterogeneous accelerators and memory tiers. Their suitability for that
scenario, including real routing traces and mixed-vendor instances, is unestablished,
not disproven. Evaluate them against it before building a separate simulator.

These are investigation choices, not approved dependencies. Source links and
assessment limits belong to the survey. The next serving implementation should
start by testing one candidate against one concrete lab question, rather than
integrating this whole list.

## What the connection must preserve

A useful first connection follows the existing [baseline-first milestones](../implementation/milestones.md):
naïve execution, then KV reuse, a lossless state handoff, ordinary multi-head
attention, and MQA.
For each experiment, connect the relevant evidence:

```text
identified workload and model execution
  → actual operations, tensors, and retained state
  → explicit mapping to resource quantities
  → declared serving policies and cost assumptions
  → simulated request events and observable consequences
```

A future MHA/MQA comparison could feed calculated KV storage into a memory-admission
scenario. Fewer KV bytes may permit more concurrent sequences; lower TTFT does
not follow automatically. It also depends on arrivals, scheduling, other memory,
and the service-time model. Keep each dependency inspectable. Neither arbitrary
MHA/MQA weights nor their outputs are expected to be equivalent.

The tiny model can supply numerical traces and logical tensor sizes. Python object
memory is not accelerator KV allocation; real layouts, padding, dtype, and allocator
overhead need an explicit mapping. A specialist simulator can consume that mapping
without being presented as executing the model's tensors. Simulated timelines must
remain distinguishable from the current execution-order trace.

## Reuse without losing the explanation

For a concrete adoption, record the upstream revision and applicable license,
why the component fits the question, and what the adapter preserves or omits in
the consuming lab. Preserve attribution and required notices. Reuse can mean
linking a lesson, importing a fixture, running a reference, or adapting code; it
need not mean taking on an entire framework.

An adapter should map into the existing [data model](../../data-model/README.md)
and [ontology](../ontology/README.md), preserving workload identity, units,
configuration, and provenance. Extend those authorities only for behavior the
experiment actually needs. Fail on unsupported semantics; do not quietly translate
away inconvenient state. Exercise the same adapter headlessly and interactively.

Comparing simulators checks consistency under matched assumptions. Real-system
claims need measurements and validation for the stated regime; one simulator's
predictions are not calibration measurements for another. A component that cannot
expose the required transitions may still be a useful external reference.

Keep new local implementations small and justified by inspectability, missing
semantics, or the learning exercise. Avoid a general serving engine, visualization
framework, or copied paper catalog without a concrete need. No runtime adoption
or end-to-end mechanism-to-serving integration is claimed by these documents.

## Local source references

The root [Makefile](../../Makefile) owns `_references`: fetch or verify pinned
source checkouts in gitignored `references/`. They are optional reading material,
not build dependencies; no upstream packages or code are installed or executed.
Existing modified or differently pinned checkouts fail verification rather than
being overwritten. Pins are declared only in Makefile. Upstream notices remain
inside each checkout; inspect file-specific terms before copying code or assets.

Source review for connected inspection (2026-10-10):

| Checkout | Files inspected | Decision |
| --- | --- | --- |
| `llm-viz` | `src/llm/Interaction.ts`, `GptModelLayout.ts` | Reuse the dependency-navigation approach: follow an operation to its inputs. Its cell-index mappings and WebGL layout are model-specific; our existing observations already supply operation dependencies. No source copied. MIT code; asset exceptions remain applicable. |
| `transformer-explainer` | `src/utils/data.ts`, `src/components/Operation.svelte` | ONNX execution supplies intermediate outputs to a Svelte interface. Retain our actual Python trace as the authority rather than introducing another model/runtime. No source copied. MIT. |
| `nano-vllm` | `nanovllm/layers/attention.py` | Real prefill/decode and KV slot mapping are useful subsequent runtime references. FlashAttention/Triton execution is not an adapter for this scalar baseline. No runtime integration in the inspection repair. MIT. |

This review supports an operation-level connection, not a claim of Bycroft's
cell-level explanation depth. Scalar operand/index tracing remains additional
work; clickable operation dependencies alone do not establish it.
