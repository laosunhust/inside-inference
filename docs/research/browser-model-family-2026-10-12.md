# Three browser model roles

The model-size lab now executes three identified checkpoints in the same static
product. This establishes an inspection fixture and two story-continuation
comparisons, not a scaling law or a reasoning benchmark.

| Role | Parameters | Token IDs | Execution / inspection |
| --- | ---: | ---: | --- |
| TinyLLM-8K | 8,168 | 384 | Existing scalar Python model; real tensor observations |
| TinyLLM-0.5M | 475,712 | 4,096 | Upstream llama2.c WebAssembly; logits and token sequence |
| TinyLLM-4.3M | 4,262,144 | 4,096 | Same compiled runtime and tokenizer as 0.5M |

The [model inventory](../../data/models/README.md) owns artifacts and attribution;
[delivery architecture](../architecture/delivery.md) owns loading and execution.
The existing landing-page Q/A checkpoint remains separate. No default checkpoint
was silently replaced. All optional model loads require an explicit action.

## Preparation and numerical evidence

The smallest model preserves the original architecture and tokenizer. Its one
fixed seed7 training run used 2,000 training stories and 100 development stories,
4,000 updates, and 16,384,000 sampled training tokens. Minimum development token
loss selected step 3,800: 6.0352 initially, 1.2535 selected. Export to the scalar
engine differed by at most 1.854e-14 on the recorded comparison. Preparation took
154 seconds including tokenization. These losses cannot be compared with the
4,096-ID models. Read the frozen [configuration](../../data/preparation/story-models/training.yaml),
[admission](../../data/preparation/story-models/admission.json), and
[result](../../data/preparation/story-models/result.json).

The larger models reuse the independent study's seed1337 checkpoints, selected
before previewing this lab's output. No larger model was retrained for this work.
[Export evidence](../../data/preparation/story-models/export.json) retains source
identities, tokenizer cases and original FP32 reference locations. Six shared
prefix comparisons in Chromium had maximum absolute logit error 2.170e-5; all
argmax choices matched, with no near-ties under the declared error bound. Ten
handpicked tokenizer cases cover repeated spaces, newlines and byte fallback.
This is a bounded comparison, not a proof for every prefix or browser.

The eight-token illustration beginning `a little cat had a red ball.` gives:

- 8K: ` Th`, followed by an incomplete byte-triple diagnostic.
- 0.5M: ` The cat loved to play with it.`
- 4.3M: ` The cat liked to play with the ball`

The 8K model remains visibly poor at stories. Its role is inspectability, and
quality was not an acceptance gate. An incomplete byte sequence is disclosed;
the UI never inserts missing spaces or repairs output. Eight tokens are also
not equal amounts of text across these tokenizers. These examples do not establish
a general quality ordering between the larger models.

## Browser and storage checks

[Browser evidence](../../data/preparation/story-models/browser.json) records actual
load and computation timings, selected IDs, numerical comparisons and rejected
storage failures. Measurements are from desktop Chromium on this machine; narrow
viewport checks are layout checks, not mobile-device performance measurements.
The initial browser runtime takes roughly three seconds to become ready locally.
Optional weights then load separately. Warm computation medians were below the
predeclared 500 ms limit for all models.

These timings exclude message validation and rendering. The small engine
recomputes the prefix and captures tensors; the larger compiled engine uses KV
reuse and returns logits. Their timings are not a controlled size-speed comparison.
Network download times on a public host remain unknown.

The integration harness exercises the same generated browser interface as the UI:
actual continuation, model switching, reset, input replacement during model load,
stop, token/logit/tensor agreement, and desktop/narrow layouts. A second local
origin serves the exact artifact bytes with CORS. Missing assets, corrupt bytes,
and absent CORS fail explicitly; failed loading cannot reuse an old model.
Actual hosted TLS, CDN caching and S3 configuration still require deployment checks.

## Corrections retained

- Preparation initially lacked jsonschema, and export lacked protobuf. Both failed
  explicitly before their corresponding work completed; dependencies were supplied
  in the preparation environment, not added to browser execution.
- Raw upstream C tokenization did not reproduce SentencePiece's repeated-space
  normalization. Applying the model's recorded normalization before upstream encode
  corrected the mismatch; fixed cases verify it.
- An initial integration timing check inherited Chromium's virtual clock from
  unrelated replay checks, reporting 77,760,000 ms. Running the latency check before
  virtual-time tests fixed the measurement. Its threshold was not relaxed.
- Editing an opening during model loading initially discarded the successful load.
  Model-load lifetime and request lifetime now have separate cancellation counters;
  an integration regression exercises this case.

The bound [evaluation result](../../governance/evaluations/results/2026-10/browser-model-family.yaml)
records final harness outcomes. No cloud deployment or commit is part of this work.
