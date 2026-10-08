# Related tools survey

Review date: 2026-10-08. Purpose: avoid unnecessary duplication while keeping
personal learning as the project's primary goal. This is a landscape review,
not proof of novelty, an accuracy audit of other tools, or a domain valuation.

Reuse decisions live in [README](README.md). Entries describe documented scope,
not an adoption decision. The original review included the hands-on observations
explicitly noted below; this update inspected primary documentation, not running
engines or their complete implementations.

## Conclusion

There is substantial overlap with this project's individual pieces. Browser
transformer execution, inspectable tiny models, attention explainers, KV-cache
visualization, serving simulators, and even game-like cluster learning already
exist. We should not claim any of those categories are missing.

The narrower opportunity is an integrated, incremental learning path connecting
one request and its concrete numerical trace to a controlled intervention and
its state/resource consequences. We did not establish an exact substitute that
combines all three inspection levels with the same run and explicit abstraction
boundaries. This is a promising integration hypothesis, not evidence that no one
has built it. The current repository does not deliver that integration yet.

## Closest numerical and educational offerings

| Tool | Documented overlap | Implication for us |
| --- | --- | --- |
| [EngineersUniverse Transformer Model Lab](https://engineersuniverse.com/labs/ai-computing/neural-networks/transformer-model) and [Inference Lab](https://engineersuniverse.com/labs/ai-computing/neural-networks/llm-inference) | The pages describe a trained miniature transformer, token/activation inspection, cached generation, numerical operation walkthroughs, and controlled ablations. | Very close to our initial model-inspection milestones. Those alone are not a public gap. |
| [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) / [source](https://github.com/poloclub/transformer-explainer) | Live GPT-2 execution with interactive internal-operation and sampling explanations. Source repository identifies an MIT license. | Strong reference for navigation and revealing actual computation. Investigate its code before building generic visualization infrastructure. |
| [Brendan Bycroft's LLM Visualization](https://bbycroft.net/llm) / [source](https://github.com/bbycroft/llm-viz) | The repository describes a working tiny GPT-style model sorting A/B/C sequences with 3D numerical visualization. Code is MIT with explicit exceptions for personal/third-party assets. | Tiny real computation made visual already exists; evaluate reusable rendering ideas rather than rebuilding them for novelty. |
| [Attention Lab](https://divagr.com/attention-lab) | Eight mechanism guides, organized partly by bottleneck, including GQA, KDA, and paged attention. | Mechanism selection and placing techniques by problem are already served. Learn from the presentation; independently validate any numerical or semantic interpretation we implement. |
| [Rudrite Research](https://research.rudrite.com/) | A broad interactive paper-explainer collection with guided tracks, including serving and memory topics. | A broad innovation index is also established. Prefer links over rewriting paper explanations that do not answer a new local experiment. |

Browser inspection reached an access-purchase screen for the EngineersUniverse
Transformer Model Lab. Its interactive numerical claims above are from its public
description, not independently executed or verified. No purchase was made and no
code-reuse license was established for it. The distinction matters: it is a close
product match on documented scope, not a verified reference implementation.

## System behavior, cache, and game-like learning

| Tool | Documented overlap | Implication for us |
| --- | --- | --- |
| [LLM Cluster Simulator](https://github.com/zhebrak/llm-cluster-simulator) / [live site](https://simulator.zhebrak.io/) | Browser analytical resource/parallelism planning, structured learning tasks, and a narrative game. Its README explicitly lists omissions, including prefix caching and disaggregated prefill/decode. MIT repository. | The browser game idea is not unique. Useful interaction and analytical-model reference; not a substitute for inspecting a trained tiny model's token arithmetic. |
| [InferScale-Sim](https://huggingface.co/spaces/ArchitSharma/InferScale-Sim/blob/main/README.md) | Python discrete-event simulation runs in the browser through Pyodide; documented batching, paging, prefix reuse, P/D disaggregation, stateful sessions, and measurement-import hooks. README declares MIT. Bundled hardware profiles are analytical, not benchmarks; session simulation isolates state/routing from full dynamic batching. | First candidate to inspect for a small serving adapter. Do not describe calibration hooks as evidence of measured calibration. |
| [Vidur](https://github.com/microsoft/vidur) | Profile-informed inference-system simulation, scheduling/configuration experiments, and exported timelines. MIT repository. | Reuse or compare against an established simulator when questions require serving performance. Do not build a broad performance engine merely to populate a diagram. |
| [BLIS](https://github.com/inference-sim/inference-sim) | Configurable admission, routing, scheduling, KV dynamics, and tiered offload in a CPU-only discrete-event simulator. Apache-2.0 repository. | Strong reference for state transitions, workloads, and policy experiments; investigate trace adapters when that milestone arrives. |
| [Doubleword Inference Lab](https://github.com/doublewordai/inference-lab) | Serving simulation with scheduler/KV behavior and an explicitly described roofline cost model. | Relevant comparison for parameterized costs and declared omissions. Its estimates are not measurements of our model or machine. |
| [LMCache KV-cache visualizations](https://kvcache.io/) / [source](https://github.com/LMCache/kvcache-view) | Memory, architecture, tiering, and cache-economics explorations. | Cache visualization is an existing category; focus on connecting actual state to controlled experiments. Inspect file-specific licenses before reusing assets or code. |
| [KV Cache Visualizer](https://github.com/GandholiSarat/kv-cache-visualizer) | Conceptual browser simulation of paging, prefill/decode, and continuous batching; explicitly not real inference. | Useful conceptual reference, with a different evidence boundary from actual tensor execution. |
| [Backpressure](https://backpressure.systems/plans) | Describes a visual serving/load simulator with queues, latency, throughput, and reproducible runs. | Request/system-level “what if” interaction is not unoccupied either. This review did not independently validate its engine. |

The LLM Cluster Simulator loaded in a headless browser with inference settings
and Learn/Play controls. This verifies an accessible UI, not its numerical
accuracy or calibration. Other system entries were reviewed through their official
pages/repositories, not benchmarked. Published performance assertions are their
authors' claims, not conclusions of this review.

## What is still worth building?

A proposed connected exercise:

1. Run a fixed prompt through the naïve tiny GPT and inspect a selected output.
2. Enable KV reuse with the same parameters and token history; inspect equivalent
   logits, retained K/V, and the computations actually avoided.
3. Later change multi-head K/V sharing, with explicit compatible parameters; inspect
   changed tensors and state bytes without pretending outputs must stay identical.
4. Relate those measured quantities to a declared storage/transfer or scheduling
   scenario. Display where measured numerical evidence ends and simulated costs begin.

The possible contribution is maintaining this connection as mechanisms change,
with shared identities and clear limits. An ontology document alone is not a gap
filled; it earns its place when it makes that experiment easier to inspect and
harder to misinterpret. A 384-entry vocabulary is an instrument choice, not by
itself a distinctive public offering.

## Readable engines and further simulator candidates

| Tool | Documented scope | Reuse assessment |
| --- | --- | --- |
| [nano-vLLM](https://github.com/GeeeekExplorer/nano-vllm) | Compact real inference engine with prefix caching, tensor parallelism, Torch compilation, and CUDA graphs; repository lists MIT. | Inspect cache state and scheduling code as an independent reference. Its GPU execution stack is not a drop-in browser engine or a compatible implementation of our tiny GPT. |
| [Mini-SGLang](https://github.com/sgl-project/mini-sglang) | Compact serving engine with radix caching, chunked prefill, overlap scheduling, and tensor parallelism. README requires Linux/CUDA-specific kernels. | Reference for later serving transitions; inspect selected files and their license before extracting code. Do not import the runtime merely to draw those transitions. |
| [LLMServingSim 2.0](https://github.com/casys-kaist/LLMServingSim) | Profile-driven serving with a Python frontend and ASTRA-Sim network backend, heterogeneous hardware and memory tiers. | Consider exported scenarios when hardware/network questions justify its setup. Published accuracy does not transfer automatically to our model or workload. |
| [TokenSim](https://github.com/pku-lemonade/TokenSim) | Distributed inference simulation with operator-level hooks and memory modeling. | Candidate for hardware/software experiments; not evaluated for integration, cost, or file-level licensing. |
| [Frontier](https://github.com/NetX-lab/Frontier) | CPU-executable discrete-event serving simulator, operator/communication/KV models, disaggregated execution, and runtime optimizations; README declares MIT and distinguishes analytical smoke runs from profiles. | Relevant to the mechanism-to-system connection itself. Inspect model/operator extension points before building our own general simulator. |
| [KernelSight-LM](https://arxiv.org/abs/2606.28565) | Paper describes kernel-level inference simulation. | Research lead only; executable interface, license, and suitability have not been assessed here. |

This list is deliberately broader than the adoption shortlist. Repository license
labels are preliminary signals; check the selected revision, files, dependencies,
and asset notices when actually reusing material. No external code or dependency
was adopted in this review. Maintenance quality, performance, and compatibility
were not independently established.
