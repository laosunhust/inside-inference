# ObservableGPT — original laboratory plan

> Historical plan, converted from `ObservableGPT.docx` on
> 2026-10-08. Content is preserved; headings, tables, lists, and diagrams are
> reformatted for GitHub and agent use. This is not a current delivery commitment.
> [Current purpose](../purpose/README.md) supersedes its project scope, competition framing,
> weekend schedule, release prerequisites, and 100-ID vocabulary. The original
> DOCX is not present in this checkout; use this Markdown edition for references.

ObservableGPT

An end-to-end explainable LLM laboratory

Weekend MVP scope + long-term experiment roadmap

> Core idea
>
> Build a GPT small enough that every important state can be inspected exactly, then use the same model as a simulator for real optimization mechanisms: tokenization, latent width, attention, FFN, backpropagation, post-training, quantization, KV/prefix caching, sparse/recurrent memory, MoE, and memory-tier economics.

Baseline: V=100 • d=4 initially • Lmax=32 • FP16 • 1 layer • 1 head

## 1. Executive summary

A single weekend is enough for a credible v0 if the goal is a complete, observable vertical slice — not the full roadmap.

> Weekend verdict
>
> YES for: custom tokenizer → embedding → causal Transformer → next-token pretraining → exact forward trace → exact backward trace → one quantization comparison. NO for: MoE, MLA/KDA/CSA, full post-training stack, realistic serving engine, and HBM/HBF simulations all at once.

The project should be open-sourced early, after one polished end-to-end example is demonstrably useful. The differentiation is not parameter count; it is continuity of explanation from math to information flow to systems cost.

```text
One model, one corpus, one terminology:

text
  → tokenizer
  → embeddings
  → attention
  → residual
  → FFN
  → logits / loss
  → gradients / parameter update
  → quantized variants
  → KV / prefix-cache variants
  → serving + memory-tier simulation
```

## 2. Product thesis and design principles

ObservableGPT is a microscope, not a benchmark model. It should make a modern LLM mechanically inspectable while preserving enough architectural fidelity that later optimizations are meaningful.

| Principle | Implication |
| --- | --- |
| Ground truth must be inspectable | Every weight, activation, attention score, gradient, and cache entry can be printed for the baseline model. |
| Real architecture, tiny scale | Use the GPT skeleton rather than inventing a different toy neural network. |
| One optimization at a time | Each experiment changes one mechanism while holding tokenizer, corpus, checkpoint, or workload fixed where possible. |
| Three-level explanation | For every optimization explain: (1) math changed, (2) information retained/lost/routed, (3) systems effect on FLOPs/bytes/latency. |
| Exact before approximate | Start with dense FP16 and exact attention; only then add quantization, sparse/recurrent memory, and caches. |
| Simulation over production engineering | Count operations and bytes; do not turn v0 into a CUDA/kernel project. |

## 3. Baseline model contract

| Parameter | Baseline | Status / rationale |
| --- | --- | --- |
| Vocabulary V | 100 | Fixed for the initial laboratory. Small enough to inspect completely. |
| Latent width d_model | 4 | Initial experiment setting only; later sweep 4 → 8 → 16 → 32. |
| Maximum context Lmax | 32 tokens | Large enough for short stories, still easy to visualize; later sweep upward. |
| Precision | FP16 storage baseline | Realistic reference point; arithmetic traces may retain extra printed digits for pedagogy. |
| Layers | 1 | Start with one complete Transformer block. |
| Heads | 1 | Avoid multi-head complexity until single-head attention is fully understood. |
| FFN width | 8 initially | Tiny 4 → 8 → 4 network, with every activation inspectable. |
| Training objective | Next-token prediction | Canonical autoregressive pretraining. |

The baseline is deliberately underpowered. That is useful: width, depth, context and precision become controlled experimental variables rather than fixed facts.

## 4. Tokenizer and 3-year-old world

The tokenizer is part of the experiment, not hidden infrastructure.

Vocabulary allocation:

| Bucket | Count | Examples / role |
| --- | --- | --- |
| Control | 4 | &lt;BOS&gt;, &lt;EOS&gt;, &lt;SP&gt;, &lt;BYTE&gt; |
| Punctuation | 10 | .,!? punctuation and separators |
| Common words | 60 | the, cat, dog, mom, dad, eat, milk, red, big, happy, ... |
| Reusable chunks | 10 | s, ed, ing, in, on, up, down, and, because, ... |
| Hex symbols | 16 | 0–9, A–F for byte fallback |

Fallback rule: if no vocabulary item matches, encode the next UTF-8 byte as &lt;BYTE&gt; + two hexadecimal symbols. This preserves arbitrary input while making unfamiliar strings deliberately expensive.

```text
Example:
"cats"  → cat | s
"eated" → eat | ed
rare UTF-8 byte 0xE4 → <BYTE> | E | 4

Tokenizer = symbol compression.
Transformer = contextual semantic reconstruction.
```

## 5. Pretraining corpus and curriculum

The corpus should model a small, controllable conceptual world rather than natural-web complexity. The objective is not realism of language distribution; it is causal inspectability of learning.

| Curriculum stage | Examples | What it should teach |
| --- | --- | --- |
| A. Local syntax | the cat ate fish . | word order, punctuation, short next-token dependencies |
| B. Categories | the cat is small . / the dog is big . | shared representations among animals, sizes, properties |
| C. Relations | the ball is on the table . | position and simple relational structure |
| D. Cause / desire | the baby is hungry because baby did not eat . | longer dependencies and causal cues |
| E. Short stories | mom gave baby milk . baby is happy . | context integration across clauses/sentences |
| F. Corruption tests | eated, ciphers, unknown strings | tokenizer robustness vs model-level inference |

Keep a deterministic tiny training set and a deterministic held-out set so that every architectural change can be compared against exactly the same examples.

## 6. Core model: the first complete vertical slice

```text
token IDs
  ↓
Embedding[V × d]
  ↓
Position representation
  ↓
Norm
  ↓
Q, K, V projections
  ↓
causal attention
  ↓
residual add
  ↓
Norm
  ↓
FFN 4 → 8 → 4
  ↓
residual add
  ↓
LM head → 100 logits
  ↓
softmax / cross-entropy
```

The first implementation should stay structurally compatible with a real decoder-only GPT. Optimized kernels, fused projections, and framework conveniences should be avoided whenever they hide a state we want to inspect.

## 7. The observability contract — the project’s differentiator

Trace mode should be a first-class API, not debugging print statements.

| Trace stage | Must expose |
| --- | --- |
| Tokenizer | input spans, token IDs, fallback decisions |
| Embedding | selected rows and position contribution |
| Attention input | normalized residual state |
| Q/K/V | every vector and projection matrix |
| Scores | QKᵀ, scale factor, causal mask, softmax probabilities |
| Attention output | weighted V contribution from every source token |
| Residual | before, delta, after |
| FFN | pre-activations, nonlinear activations, output contribution per neuron |
| Prediction | logits, probabilities, target, loss |
| Backward | gradient at every stage plus parameter deltas |
| Optimizer | raw gradient vs optimizer-adjusted update |

> Definition of success
>
> Given “the cat ate”, the user can point to a final probability for “fish” and trace it all the way backward to specific embedding coordinates, attention scores, FFN activations, and learned parameter updates.

## 8. Training lifecycle experiments

Training should be observable as a sequence of state transitions, not a single train() call.

| Stage | Purpose | Initial implementation |
| --- | --- | --- |
| Pretraining | Learn the tiny world/language prior | Next-token cross-entropy on the 3-year-old corpus |
| SFT | Teach interaction/interface behavior | Prompt/answer examples over the same world |
| Preference optimization | Shape preferred outputs | Small chosen/rejected pairs; DPO-like experiment later |
| Distillation | Study transfer/compression | Train d=16 teacher, distill into d=4 student |

Post-training is not weekend-critical. The first release only needs pretraining plus a clean hook for later SFT/preference experiments.

## 9. Experiment axes after v0

| Axis | Baseline | Experiments |
| --- | --- | --- |
| Width | d=4 | 4 / 8 / 16 / 32; feature interference vs cleaner latent geometry |
| Depth | 1 layer | 1 / 2 / 4; sequential refinement and circuit depth |
| Context | 32 | 8 / 16 / 32 / 64 / 128; long-range retrieval and cost |
| Precision | FP16 | FP8, FP4, INT8, INT4; identify where prediction diverges |
| Attention | Dense MHA, 1 head | multi-head, GQA, MLA-like compression, sparse, KDA-like recurrent state |
| FFN | dense 4→8→4 | wider FFN, gating, SwiGLU, MoE routing |
| Position | simple baseline | learned positions vs RoPE |
| Training | pretrain | SFT, preference, distillation |
| Memory | full KV | KV quantization, prefix reuse, windowing, recurrent state |
| Serving | single request | batching, cache-aware scheduling, agent turns |
| Hardware model | single fast memory | HBM / HBF / DRAM / SSD hierarchy |

## 10. Quantization experiments

Quantization should be taught by preserving the same checkpoint and workload, then showing exactly where numerical approximation changes the computation.

```text
FP16 baseline
  ↓ quantize same weights / activations
FP8
  ↓
FP4 or INT4
  ↓
compare:
  • embedding geometry
  • Q/K dot products
  • attention ranking
  • FFN activations
  • logits / probabilities
  • accuracy / loss
  • bytes moved
```

The primary question is not “does 4-bit work?” but “which information survives the approximation, and why does the final decision often remain unchanged?”

## 11. Agentic serving and prompt-cache simulator

Agentic workloads add a separate optimization problem: repeated long prefixes with small incremental updates. This should become a simulator layer around the same tiny model.

```text
stable system prompt
+ stable tool schema
+ stable project context
+ append-only conversation
+ latest tool result / observation
        ↓
prefix-KV reuse
        ↓
compute only the delta
```

The simulator should distinguish:

- No cache: recompute the whole prefix.

- Exact prefix KV cache: reuse neural intermediate state.

- Cache-aware prompt layout: most stable tokens first, volatile fields last.

- Cache-aware scheduling: choose a worker based on compute availability plus cache locality.

- Value-aware eviction: reuse probability × recompute cost rather than pure LRU.

## 12. Memory hierarchy and HBF thought experiments

A later simulator should treat cached latent/KV state as a first-class data-center object.

```text
HBM  → active decode / active KV / hottest prefixes
HBF  → warm reusable prefixes and agent-turn checkpoints
DRAM → larger warm pool
SSD  → cold persistent cache
```

The goal is not to model a specific future device perfectly. It is to let users vary bandwidth, latency, capacity, write cost and endurance assumptions and observe when “retrieve cached state” becomes cheaper than “recompute prefix.”

Core metric:

```text
cache_value
≈ reuse_probability × avoided_recompute
  - storage_cost
  - transfer_cost
  - write_cost
```

## 13. One-weekend implementation plan

> Hard rule
>
> A weekend release is successful only if one complete path is polished. Do not trade vertical completeness for a long list of half-built optimizations.

| Block | Deliverable | Exit criterion |
| --- | --- | --- |
| Day 1 — model contract | 100-token tokenizer, byte fallback, deterministic corpus/config | All tokenizer examples round-trip; config is frozen and serialized |
| Day 1 — forward path | embedding, position, norm, causal attention, residual, FFN, LM head | One sentence produces logits and a complete human-readable forward trace |
| Day 1/2 — learning | cross-entropy, backward graph/autograd, optimizer step | One training example changes parameters; traced gradients explain the change |
| Day 2 — tiny pretraining | train on the toy corpus; save checkpoints | Loss drops and held-out predictions become visibly better |
| Day 2 — quantization demo | one 4-bit experiment against FP16 | Trace shows where numbers diverge and whether top prediction changes |
| Day 2 — packaging | README, one notebook/script, deterministic test | A new user can run the canonical “the cat ate → fish” experiment end-to-end |

For an AI-native agent workflow, this is realistic because coding agents can generate boilerplate, tests, docs and refactors while the human keeps the invariants, trace semantics and experiment design fixed.

A reasonable stretch goal is a minimal prefix-cache simulator. It should be dropped immediately if it risks the quality of the core trace.

## 14. Explicitly out of scope for the first weekend

- High-performance CUDA kernels, FlashAttention implementation, torch.compile tuning, distributed training.

- Full RLHF stack or production DPO pipelines.

- Faithful implementations of MLA, KDA, CSA, or production MoE.

- Real HBF hardware emulation or exact vendor-specific timing models.

- Large datasets, benchmark chasing, or parameter-count competition.

- Sophisticated UI before the trace format and model semantics stabilize.

## 15. Suggested open-source repository shape

```text
observablegpt/
  core/
    tokenizer.py
    tensor.py            # traced scalar/tensor abstraction
    embedding.py
    attention.py
    ffn.py
    transformer.py
    loss.py
    optimizer.py

  trace/
    forward.py
    backward.py
    explain.py

  data/
    vocab.json
    toddler_corpus.txt
    sft_examples.jsonl

  experiments/
    width/
    context/
    quantization/
    attention/
    moe/
    kv_cache/
    prefix_cache/
    memory_tiers/

  simulator/
    cost_model.py
    scheduler.py
    memory_hierarchy.py

  tests/
  examples/
    cat_ate_fish.py
```

Keep the core boring and stable. Most novelty should live in experiments that plug into the same trace interface.

## 16. Open-source release strategy

Release after the first complete vertical slice, not after the full roadmap.

| Release | What it should prove |
| --- | --- |
| v0.1 — Microscope | A user can train the tiny model and explain one prediction plus one gradient update exactly. |
| v0.2 — Numerics | Same checkpoint can be compared across FP16/FP8/FP4/INT4-style simulations. |
| v0.3 — Memory | KV, prefix-cache, sliding/sparse/recurrent memory can be compared on identical workloads. |
| v0.4 — Agent serving | Repeated agent turns expose cache hit-rate, recompute, placement and memory-tier tradeoffs. |
| v0.5 — Training lifecycle | SFT, preferences and distillation are observable on the same tiny world. |

Positioning: “An observable end-to-end LLM laboratory” is stronger than “the smallest GPT.” The latter competes directly with microGPT; the former connects algorithm, learning, numerics, memory and serving.

## 17. Success metrics

| Dimension | Question v0 must answer |
| --- | --- |
| Correctness | Does the implementation match a reference calculation and deterministic unit tests? |
| Observability | Can every intermediate tensor and gradient be inspected without patching the code? |
| Explainability | Can a user explain why one output probability changed after one training or quantization step? |
| Comparability | Can two experiments run from the same checkpoint/corpus and produce a structured diff? |
| Pedagogy | Can a technically strong user move from hand math to code without a conceptual discontinuity? |
| Extensibility | Can an optimization swap one module without breaking trace semantics? |

## 18. Research questions this lab can eventually probe

- Does increasing d from 4→8→16 produce cleaner, more reusable latent features on a fixed micro-world?

- Does cleaner latent representation make attention routing more selective or stable?

- When does a category such as ANIMAL emerge, and is it encoded in embeddings, FFN features, attention circuits, or distributed across them?

- Which operations are most sensitive to FP4/INT4 approximation?

- Does long-context retrieval degrade before local syntax under aggressive quantization?

- When do sparse/recurrent memories fail because exact addressability is required?

- How much of post-training changes knowledge versus selection/expression of existing knowledge?

- For agent loops, when is moving cached KV across a memory hierarchy cheaper than recomputation?

## 19. Decisions to freeze now

| Decision | Choice |
| --- | --- |
| Project purpose | End-to-end explainable LLM laboratory |
| Vocabulary | V=100, custom toddler vocabulary + UTF-8 byte fallback |
| Initial width | d=4; explicitly an experiment baseline, not a capability target |
| Context | Lmax=32 |
| Precision | FP16 baseline storage |
| Initial model | 1 layer, 1 head, dense attention, tiny FFN |
| Initial training | next-token pretraining |
| First release bar | forward + backward observability and one quantization comparison |
| Reference projects | microGPT for minimal algorithm; nanoGPT for realistic GPT skeleton; serving projects for later systems modules |

## 20. Bottom line

> Recommendation
>
> Start now. Treat the weekend as a v0 vertical-slice sprint, then open-source once the canonical example is polished. The full opportunity is larger than a tiny GPT: it is a common substrate for understanding model mechanics, learning, quantization, memory, and agent-serving optimization without changing conceptual worlds.

The project succeeds if someone can begin with “what is a token?” and eventually reason about “why does HBF change the economics of a 96% prefix-cache hit-rate agent workload?” using the same tiny model and the same observability vocabulary.
