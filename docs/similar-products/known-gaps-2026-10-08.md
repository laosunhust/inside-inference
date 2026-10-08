# Known gaps: heterogeneous inference, 2026-10-08

Question: when one request's inference is split across different accelerators
and vendors, which coupling between model computation and serving is publicly
explained, and what can this repository showcase that is not already available?

The [survey](survey.md) covers single-system explainers, engines, and simulators.
This snapshot covers heterogeneous deployments: what is announced, published, or
shipped; what remains undisclosed; and the resulting focus. It records public
sources as of the review date. Vendor figures are their claims, not results we
reproduced. Use a newer dated snapshot for later developments. Review corrections below
clarify arithmetic and claim scope without treating new capabilities as implemented.

## Why these questions need a joint model

A serving simulator can represent a model through conditional step-latency profiles
and KV bytes per token. A fixed profile becomes insufficient when retained state or activations cross
a device boundary, when the receiving tier has small capacity, when per-layer
work alternates over a link, or when producer and consumer runtimes disagree on
state representation. Existing joint models are references for representing those dependencies.

Worked arithmetic, not a measurement. KV bytes per token are
`2 × layers × KV heads × head dim × bytes per element` for equal K/V widths.
For compressed MLA, use `layers × (latent width + cached positional-key width)
× bytes per element`; include any additional state the implementation retains.
For exactly 32,768 tokens, bf16 storage (2 bytes), decimal GB, and an assumed
effective payload bandwidth of 50 GB/s:

| Attention (illustrative dimensions) | KV per token | 32k-token handoff | Transfer at 50 GB/s |
| --- | --- | --- | --- |
| MHA: 80 layers, 64 KV heads, dim 128 | ≈ 2.6 MB | ≈ 86 GB | ≈ 1.7 s |
| GQA: same with 8 KV heads | ≈ 330 KB | ≈ 10.7 GB | ≈ 215 ms |
| MLA: 61 layers, 512 latent + 64 positional-key values | ≈ 70 KB | ≈ 2.3 GB | ≈ 46 ms |

These example configurations differ by about 37.3×, but layer count changes too:
this is not “attention choice alone.” Holding 61 layers fixed with the illustrated
64-head MHA instead gives 65.5 GB / 1.31 s versus 2.30 GB / 46.1 ms, about 28.4×.
These are storage comparisons, not functionally equivalent model substitutions.
The compressed-cache representation is illustrated by the
[DeepSeek reference implementation](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py).

`payload bytes / effective bandwidth` excludes startup, conversion, contention,
and possible overlap with prefill. It is not necessarily added end-to-end latency.
For an assumed sequential attention–FFN split with two dependent one-way crossings
per layer, `2 × 61 × 2 µs = 244 µs` is the startup-latency contribution per decoded
token. This assumes all 122 crossings lie on that token's dependency path. Payload
serialization and computation add costs; pipelining other requests may improve
throughput without eliminating this dependency. It is not a universal AFD floor.

## What is publicly known

| System | Division of work | What crosses the boundary | Disclosed | Not disclosed or unverified |
| --- | --- | --- | --- | --- |
| NVIDIA Vera Rubin + Groq 3 LPX | GPU prefill with LPU decode; attention–FFN disaggregation (AFD) of decode; LPU drafting with GPU verification. | Prefill KV; per-layer activations under AFD; draft tokens. | NVIDIA states Dynamo orchestrates AFD, routing decode attention over KV to Rubin and FFN to LPX ([NVIDIA](https://developer.nvidia.com/blog/how-the-nvidia-vera-rubin-platform-is-solving-agentic-ais-scale-up-problem/), [Hot Chips 2026](https://www.servethehome.com/nvidias-groq-3-lpu-accelerators-for-heterogeneous-ai-compute-at-hot-chips-2026/)). | Public Dynamo LPX interface; per-layer link latency; independent throughput. The ≈500 MB SRAM per chip figure is [secondary](https://www.spheron.network/blog/nvidia-groq-3-lpu-explained/). |
| AWS Trainium + Cerebras CS-3 | Trainium prefill; wafer-scale decode; announced for Bedrock, availability not verified here. | KV cache over EFA, per [Cerebras](https://www.cerebras.ai/blog/cerebras-is-coming-to-aws). | Announced 2026-03-13 ([Amazon](https://www.aboutamazon.com/news/aws/aws-cerebras-ai-inference)). | KV format and conversion; where long-context KV resides during decode; independent results for the claimed 5×. |
| AMD Helios (MI455X) + Cerebras | Helios prefill and long context; wafer-scale decode. | Model state; mechanism unstated. | Announced July 2026 for Cerebras Cloud in 2H 2026 ([eWeek](https://www.eweek.com/news/amd-cerebras-disaggregated-inference/)). | Interconnect, KV format, supported models, end-to-end benchmarks. Its 5× tokens/s/W figure is internal modeling on Kimi K2.6. |
| NVIDIA Dynamo, NIXL, KVBM | Orchestration, P/D, KV-aware routing, tiered KV offload, KV transfer. | KV blocks between workers and tiers. | Open source with release notes ([repository](https://github.com/ai-dynamo/dynamo), [v1.4.0](https://docs.nvidia.com/dynamo/reference/releases/v1-4-0)). | Its cross-vendor KV representation behavior was not established in this review. |
| llm-d / vLLM NixlConnector | P/D on Kubernetes; decode pulls prefill KV by RDMA. | KV blocks, gated by a compatibility hash at handshake ([llm-d](https://llm-d.ai/blog/networking-for-distributed-inference-llm-d)). | [Three-vendor routing experiment](https://llm-d.ai/blog/heterogeneous-inference-3-vendor-sovereign-cluster); the authors explicitly list cross-accelerator P/D as future work in that report. | This report does not demonstrate mixed-vendor P/D format conversion. |
| SGLang + Mooncake on ROCm | P/D on AMD Instinct. | KV via Mooncake transfer engine ([ROCm](https://rocm.docs.amd.com/projects/ai-developer-hub/en/v14.0/notebooks/inference/SGlang_PD_Disagg_On_AMD_GPU.html)). | Documented same-vendor path. | Cross-vendor operation. |
| [HMA-Serve](https://arxiv.org/abs/2606.29986) (paper) | GDDR prefill, HBM decode. | Quantized KV, pipelined per layer, dequantized on decode. | Mechanisms and authors' goodput results. | Independent reproduction. |
| [Heterogeneous PD design space](https://arxiv.org/abs/2606.29708) (paper) | Accelerator, precision, interconnect, KV residency axes. | Boundary decisions: compute placement, KV representation, KV ownership. | Transfer engines move bytes, not tensor semantics. | No released tool was established in this review. |
| [MegaScale-Infer](https://arxiv.org/abs/2504.02263) (paper) | Homogeneous AFD for MoE with ping-pong micro-batches. | Per-layer activations. | Authors' throughput results. | Not a heterogeneous vendor pairing. |

Research and planning simulators in the [survey](survey.md), such as LLMServingSim
2.0 and Frontier, model heterogeneous hardware or disaggregation through profiles
and byte counts. We did not establish that any checks whether transferred state
still yields the same model computation.

## Questions not resolved for the named pairings in this review

- How KV layout, precision, and paging map between vendor runtimes, and whether
  conversion happens on the sender, the receiver, or in transit.
- For pairings whose placement is undisclosed, where decode KV resides when it
  exceeds SRAM. This is not unknown for every pairing: NVIDIA describes decode
  attention/KV on Rubin and FFN on LPX in the AFD arrangement linked above.
- The link latency and overlap that bound per-layer AFD round trips.
- Who owns KV reservation, release, and failure recovery across two vendors' stacks.
- How prefix caching, speculative decoding, chunked prefill, and tiered offload
  compose when their state spans heterogeneous pools.
- How handoff traffic contends with other requests on shared multi-node fabrics.
- Independent end-to-end measurements of any announced pairing.

These are review limits, not proof that public answers do not exist. HMA-Serve
already describes one cross-vendor precision/transfer strategy, and llm-d documents
KV ownership and composition for its supported connector. This repository cannot
infer undisclosed deployment details from those examples. It can make each one an
explicit, inspectable assumption with visible consequences.

## Candidate learning experiments (G1–G5)

| ID | Gap | Showcase | Evidence boundary |
| --- | --- | --- | --- |
| G1 | Make state semantics inspectable across a declared boundary in this repository. | See the [G1 milestone](../purpose/milestones.md#g1--inspect-a-state-handoff) for scope and acceptance. | Real tiny-model computation. Says nothing about real-device timing. |
| G2 | Follow attention–FFN crossings back to actual layer computation. | Split each layer's attention and FFN across declared devices; trace every crossing and its bytes; verify equivalence. | Real computation; crossing latency is a declared parameter. |
| G3 | Connect disclosed model configuration to boundary traffic under stated assumptions. | Parameterize published architectures, such as GQA, MLA, and MoE configs, into handoff bytes, SRAM fit, and per-token crossing costs under an explicit dependency and overlap model for each announced pairing. | Conditional arithmetic; undisclosed values remain explicit assumptions. |
| G4 | Inspect interactions between techniques across declared pools. | Add prefix reuse, speculative decoding, and offload tiers to the same declared boundary; show which state moves, is reused, or is discarded. | Mechanics are real for the tiny model; costs are simulated. |
| G5 | Connect model-state traffic to multi-node contention in one inspectable experiment. | Replay a workload through a declared topology using an existing simulator where it fits, fed by G3 quantities. | Simulated behavior; never a vendor performance claim. |

These IDs name candidate labs, not proven gaps in all existing tools. No directly
matching educational tool was established by this limited review; G1 is not a claim
that cross-vendor KV conversion or correctness checking is new.

A showcase may present a vendor pairing as a named scenario with its sources and
assumptions. It must not present simulated timings as that vendor's performance.

## Proposed focus

The [milestones](../purpose/milestones.md#build-order-establish-the-reference-before-changing-it)
own acceptance and ordering: establish M2, then the bounded lossless G1 handoff,
then M3/M4. Precision conversion is a separate follow-up. G2–G5 remain candidate
questions, not a mandatory chain or commitments to implement every vendor scenario.
Before expanding, evaluate a reusable engine or simulator against the specific lab
question, following the [reuse guidance](README.md).

Refresh this snapshot when one of the announced pairings publishes its interconnect,
KV format, or independent measurements, or before starting G3.
