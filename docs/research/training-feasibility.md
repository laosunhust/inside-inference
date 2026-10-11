# Training and interpretation with a 384-ID vocabulary

Scope: checkpoint-preparation feasibility, not a training-research agenda. See
[model preparation](../implementation/model-preparation.md) for the current boundary.

Date: 2026-10-08. Analytical forecast and design recommendation; no training run,
wall-time benchmark, or language-quality result exists in this repository yet.
The [vocabulary audit](vocabulary-budget.md) supports investigating 384 IDs, not
freezing a complete model or asserting that it learns useful conversation.

**Decision update:** the user has now frozen vocabulary size at 384 total IDs.
The [current purpose](../purpose/README.md#scope-and-boundaries)
owns that decision and the planned byte/hex fallback. Candidate recommendations
below preserve the reasoning before that decision; other model dimensions remain
experimental. This study does not establish trained-model quality.

## What Karpathy actually uses

| Example | Vocabulary | Model/task distinction |
| --- | ---: | --- |
| [microGPT](https://karpathy.github.io/2026/02/12/microgpt/) | 27 | 26 characters plus a boundary token; names generation; width 16, one layer, four heads, context 16, 4,192 parameters. |
| [nanoGPT Shakespeare character preparation](https://github.com/karpathy/nanoGPT/blob/master/data/shakespeare_char/prepare.py) | 65 | Distinct characters in the dataset, not 65 allowed words. |
| [llama2.c stories260K](https://huggingface.co/karpathy/tinyllamas/blob/main/stories260K/readme.md) | 512 | Released approximately 260K-parameter story model with a custom tokenizer; five layers and shared K/V. |
| [nanoGPT Shakespeare configuration](https://github.com/karpathy/nanoGPT/blob/master/config/train_shakespeare_char.py) | Uses dataset vocabulary | Six layers, width 384, six heads, context 256. Here 384 is hidden width, not vocabulary size. |
| [nanoGPT default model configuration](https://github.com/karpathy/nanoGPT/blob/master/model.py) | 50,304 matrix rows | GPT-2's 50,257-entry vocabulary padded for efficiency; the separate [Shakespeare BPE preparation](https://github.com/karpathy/nanoGPT/blob/master/data/shakespeare/prepare.py) uses GPT-2 tokenization. |

Sources inspected on the date above; repository master branches can change.
The [follow-up inventory](small-vocabulary-models.md) also examines MacroStories
with 378 entries and ByT5 with 384 entries. Hundreds of token IDs are not a gap
in existing models; architecture, token units, and intended behavior differ.
MicroGPT demonstrates complete learning machinery with scalar Python autograd;
it does not demonstrate dialogue understanding. Its scalar execution is explicitly
less efficient than tensor operations. NanoGPT supports several configurations,
so there is no one nanoGPT vocabulary size.

Thus others do use fewer than 384 IDs. A character inventory can compose many
words, whereas our candidate allocates most entries to identifiable whole words.
Larger subword inventories trade embedding/output size for shorter sequences and
broader coverage. Our engineering inference is that a few hundred whole-word
entries suit a deliberately bounded learning world, but would badly restrict
open-domain language. This does not establish why every project chose its size.

## Separate the four budgets

1. Vocabulary determines embedding/output dimensions and lexical representation.
2. Width, depth, context, and training-token exposure govern much of training cost.
3. Dataset quality and task diversity determine what useful learning is possible.
4. Trace granularity and retention determine much of observability overhead.

A 384-ID vocabulary does not require a 384-wide hidden state. Nor does it imply
384 concepts, an easy training problem, or readable meanings in individual neurons.

## Conditional compute forecast

Illustrative decoder-only GPT configurations, not adopted repository presets:
V=384, learned positions up to T=128, tied embedding/output weights, FFN width=4d,
ordinary dense causal attention, and no bias/norm parameters in the approximate
count. Positional strategy, tying, precision, and dimensions must become explicit
configuration when implemented.

| Role to investigate | Width d | Layers L | Approx. parameters | FP32 parameter/gradient/Adam arrays | Approx. training work for 10M token presentations |
| --- | ---: | ---: | ---: | ---: | ---: |
| Arithmetic inspection | 16 | 1 | 11,264 | 0.172 MiB | 0.80 trillion FLOPs |
| First language pilot | 64 | 2 | 131,072 | 2.00 MiB | 9.34 trillion FLOPs |
| Capacity comparison | 128 | 4 | 851,968 | 13.00 MiB | 58.00 trillion FLOPs |

These memory figures are NOT total process memory. They exclude activations,
attention arrays, framework/runtime overhead, workspaces, retained traces, and
input data. FP32 arrays here are a forecast assumption, not an assertion that the
historical FP16 proposal was implemented. Scalar objects can cost much more than
packed numeric arrays.

Reproduce the arithmetic with Python; a multiply-add counts as two FLOPs:

```python
V, T, N = 384, 128, 10_000_000
for d, L in [(16, 1), (64, 2), (128, 4)]:
    P = V*d + T*d + 12*L*d*d
    F_per_token = 6*(V*d + 12*L*d*d) + 12*L*T*d
    print(d, L, P, 16*P / 2**20, N*F_per_token / 1e12)
```

P counts token/position embeddings and attention/FFN weights. FLOPs approximate
forward plus backward matrix operations, including full T-by-T attention, and
exclude softmax, normalization, nonlinearities, optimizer, tracing, and data work.
The estimate assumes full training positions, with no padding savings or optimized
triangular attention. Small models can be dominated by these omitted overheads;
FLOPs are not a runtime forecast without applicable throughput measurements.

Ten million token presentations is an illustrative experiment budget, not a
predicted convergence requirement or a requirement for ten million unique tokens.
With batch 16 and length 128 it is about 4,883 steps. Repeating a small dataset
counts toward this total but adds no new examples.

| Measured end-to-end throughput, if achieved | Time for 10M token presentations |
| ---: | ---: |
| 1,000 tokens/s | 2 h 47 min |
| 10,000 tokens/s | 16 min 40 s |
| 100,000 tokens/s | 1 min 40 s |

These are conditional divisions, NOT measured rates or assigned hardware speeds.
They do not include extra evaluation or checkpoint time unless that time is
included in throughput. The local interpreter lacks NumPy/PyTorch and no model
training engine exists here, so this study did not benchmark a substitute engine.
Do not derive wall time from an accelerator's peak FLOP specification.

The scale is consistent with a single-machine experiment rather than a cluster
requirement, assuming efficient numeric arrays and bounded traces; actual host
feasibility still needs measurement. Start with a short pilot, measure full training
steps and memory, and extrapolate only within the same configuration.

## Observability can cost more than the vocabulary

At batch 16, length 128, two heads, two layers, one retained attention array
contains 16*2*2*128*128 FP32 entries: 4 MiB. Saving it for 5,000 steps takes about
19.5 GiB before saving scores, gradients, Q/K/V, or other tensors. The full
batch logits add 3 MiB per step. This is storage arithmetic, not a full memory
profile; gradient tapes may retain additional arrays.

Keep every required state inspectable without persisting all states from all
steps. Use the same implemented math with trace capture configured explicitly:
selected examples/steps get detailed tensors and gradients; ordinary training
records compact metrics and periodic resumable checkpoints. Trace selection must
not alter computation. State exactly which evidence was retained; do not claim
missing history can be recovered unless configuration, RNG, input order, optimizer
state, and numerical replay conditions permit reproduction.

Vectorized operations can expose their operands, results, gradients, and selected
scalar dot products without constructing a Python object graph per multiplication.
Choose primitives that preserve required intermediate states; add independent
reference checks. A separate scalar reference is for verification, not an alternate
visual explanation that silently differs from the trained model.

## What can become explainable?

Computational explanation is achievable by construction: exact inputs, weighted
sums, normalization, attention/state updates, loss, gradients, and optimizer steps.
Semantic interpretation requires evidence from a trained checkpoint and controlled
inputs. Useful initial questions are whether changing an object's location changes
the next-token distribution, whether a later correction supersedes an earlier
statement, and whether a cached prefix preserves the same computation.

Do not label embedding coordinate 3 as “happiness” because a few examples look
suggestive. [Toy Models of Superposition](https://transformer-circuits.pub/2022/toy_model/index.html)
shows how small networks can encode multiple features in shared dimensions.
Our inference: shrinking width is not a guarantee of simpler semantics. Attribute
behavior using controlled contrasts, interventions, and held-out combinations;
attention pictures alone are not a causal explanation.

Width 4 remains useful for hand-verifiable arithmetic. No evidence here establishes
it can learn the proposed dialogue world. Start a language pilot at width 64/two
layers as a hypothesis; compare a smaller arithmetic profile and a wider profile
using the same engine. Do not insert scripted responses when a model fails. Report
whether failure reflects memorization, corpus coverage, optimization, or inadequate
capacity where evidence permits; otherwise leave the cause unresolved.

## Experiment costs and suitability

| Experiment | Training implication | Supported learning goal |
| --- | --- | --- |
| Inspect embeddings, logits, gradients | Reuse checkpoints; compute selected traces | Actual numerical mechanics, with learned meanings investigated separately. |
| Temperature or sampling changes | Usually no retraining | Distribution versus chosen output under an identified decoding rule. |
| Exact KV/prefix reuse | Reuse the same checkpoint | Compare cached and recomputed outputs; cost simulation remains separate. |
| Post-training quantization | Reuse checkpoint for initial comparison | Numerical error and behavior; calibration or fine-tuning, if used, is additional work. |
| Change attention family, width, or depth | Normally matched training runs | Arithmetic/state differences first; quality comparisons need compatible training. |
| Routing, scheduling, memory tiers | Usually replay/simulate workloads | Dependency and resource hypotheses, not device timing inferred from the tiny GPT. |

An attention comparison with two variants and three seeds requires six training
runs, plus evaluation. A large sweep can dominate the project even when one run
is cheap. Keep vocabulary, workload, and corpus fixed; account for changed
parameter counts and state representations. Do not assume KDA can use a baseline
attention checkpoint unchanged or that short-context language quality ranks
real-world attention systems. Its state mechanics can be studied independently
with the existing recurrence lab.

## Proposed next decision

384 remains a sensible vocabulary candidate for this project's bounded world.
It is neither a semantic guarantee nor the main reason training might become
slow. The next useful evidence is a complete, traceable forward/backward path,
then a short width-64/two-layer pilot with deliberately controlled dialogue tasks.
Require held-out behavior above trivial/memorized baselines, measurable training
cost, and faithful numerical traces before broad mechanism sweeps. Revisit model
capacity, context, corpus, or vocabulary according to the observed failure; avoid
making a frozen number more authoritative than the learning goal.

## Local capacity inspection (2026-10-08)

Read-only inspection found an RTX 3080 Ti with 12 GiB VRAM (about 11 GiB free),
a Ryzen 7 5800X with 8 cores/16 threads, about 31 GiB usable RAM (27 GiB available),
and about 138 GiB free on the workspace NVMe filesystem. The inspected cgroup
ancestry had no CPU quota or RAM cap; all 16 threads were accessible. CUDA driver
initialization and device discovery succeeded, reporting compute capability 8.6.
The current Python 3.12 interpreter had no NumPy or PyTorch installation.

This supports capacity planning for the proposed mini-models; it is not a training
benchmark, a device-allocation test for the future framework, or evidence of any
particular throughput. No packages were installed and no training or disk-speed
benchmark was run. Available capacity is a point-in-time observation. Use explicit
trace-retention budgets; model weights are unlikely to be the dominant storage cost.
