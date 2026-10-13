# Browser model artifacts

[models.yaml](models.yaml) owns model membership, roles and storage configuration.
The builder validates it against `ModelSources`, derives dimensions and parameter
counts from the actual weights, and emits a validated `ModelCatalog`. Do not copy
counts or asset digests into UI code. [Model ontology](../../docs/ontology/model.yaml)
owns these declarations.

`artifacts/` is the durable release input. Binary files have a separately approved
size allowance; they are not generated validators and do not belong under `out/`.
The build copies the same bytes into the static release. The declared storage base
may point at that release or a public HTTPS object-storage prefix. Model input and
computation remain in the browser.

The small story checkpoint has the existing 384-ID tokenizer and scalar model
architecture. [Preparation evidence](../preparation/lexical-training/README.md) records
the matched sentence-filtering experiment and export verification. The released 8K
weights are its covered-sentence checkpoint. Repetition and early EOS remain;
foreign text is encodable, but comprehension is not established. The main page now selects from this inventory, starting with the 4M model;
[initial.yaml](initial.yaml) owns its initial choice and workload. The previous
Q/A checkpoint remains a preparation/KV reference, not a fourth landing-page choice.
The 8K artifact is an inspection instrument, not a capable storyteller.

The two larger checkpoints come from the retained seed1337 runs of the independent
TinyStories size study. [Export evidence](../preparation/story-models/export.json)
records their source checkpoint identities and original numerical references.
Their legacy llama2.c binaries include unused RoPE-table slots required by that
format; download bytes therefore exceed parameter bytes. The browser executes
unmodified upstream numerical code, compiled with a small lifecycle bridge.

## Sources and attribution

- Model and C inference implementation: [Karpathy llama2.c](https://github.com/karpathy/llama2.c),
  revision `350e04fe35433e6d2941dce5a1f53308f87058eb`,
  [retained MIT license](LICENSE-llama2c.txt).
- Training corpus: [Karpathy TinyStories GPT-4 Clean](https://huggingface.co/datasets/karpathy/tinystories-gpt4-clean),
  revision `0397e27157956705a0260709da3095bb9c43d6a7`, distributed under
  [CDLA-Sharing-1.0](https://cdla.dev/sharing-1-0/). The corpus is not copied here.
- Research context: [TinyStories, Eldan and Li](https://arxiv.org/abs/2305.07759).
- Browser compilation precedent: [llama2.c-web](https://github.com/dmarcos/llama2.c-web).
  We use Emscripten for this Linux build, not that project's Mac-specific setup.

Workflow commands and environment arguments belong to the root [Makefile](../../Makefile).

[Browser evaluation](../../docs/research/browser-model-family-2026-10-12.md) records
what was measured, rejected, and left unproven.

Three size tiers are the current offering, not a hard maximum on checkpoint
variants. An MoE checkpoint would have its own artifact identity; TP/PP placement
belongs to execution configuration, not a copy of the model. No such variants
or placement simulations are implemented by this selector.

[Main-page consolidation evidence](evaluations/2026-10-13-consolidation.json) records
current browser checks and their limits; the earlier browser evaluation above
retains the history of the now-removed standalone page.
