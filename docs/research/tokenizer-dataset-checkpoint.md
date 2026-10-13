# Tokenizer and dataset: first experiment checkpoint

Follow-up: the [missing-space diagnosis](word-separator-diagnosis.md) and
[multi-word pilot](multiword-checkpoint-2026-10-10.md) retained this codec.
The superseded BPE proposal was retired without running that experiment.

Date: 2026-10-08. Scope: the first part of the requested four-hour experiment,
before a trainer or GPT implementation. Commands: `make _tokenizer-example`,
`make _dataset-audit`, `make test`, `make _check`.

## What exists

- A [384-entry candidate](../../data/tokenizer/README.md), with explicit word,
  control, space, punctuation, and byte/hex roles; no runtime vocabulary fitting.
- A [reversible codec](../implementation/tokenizer.md) and structured conversation
  framing. Actual encoding decisions carry byte/token spans and source identities.
- A [maintained corpus recipe](../../data/corpus/README.md), independent rendered
  fact checks, counterfactual fixtures, and a reproducible export/audit workflow.

The baseline will be real decoder-only numerical computation, with simulation
used separately for resource/system effects. This checkpoint implements neither
the neural model nor such a resource simulation.

## First-pass observations (v1)

| Observation | Evidence and limit |
| --- | --- |
| Controlled corpus | 400 training, 60 development, 100 test examples; test has 25 per family and five examples per answer label. |
| Exact framing | Complete examples contain 39–64 IDs, including role and boundary tokens; no truncation. |
| Direct vocabulary coverage | Controlled examples have no fallback, but use only 30 lexical entries. **322 of 352 words are unseen in this training recipe.** |
| New everyday probes | 17/24 complete dialogues and 39/48 utterances avoid fallback. Missing words: `coats`, `done`, `draw`, `fell`, `fill`, `listen`, `out`, `white`. |
| Answer-frequency baseline | Training-derived majority guesses score 20/100 on test. This is not model performance. |
| Position shortcut diagnostic | First/last mention policy chosen separately per family on development scores 52/100 on test. More sophisticated shortcuts remain possible. |
| Fallback expansion | `cat` uses one ID, `Cat` nine, `café` fifteen, and `你好` eighteen. These costs are specific to the declared codec. |

The initial test draft used only one surface variant. Inspection found that answer
position was predictable. Before training, the recipe was changed to alternate
variants within held-out splits, and position baselines were added. This removes
that particular deterministic cue; it does not establish general linguistic
understanding or a representative distribution of real requests.

The v1 manifest candidate's byte identity is
`1c163b6adb70b6e80bb46920c611ceb403929897e614058d09f1b1ba421e4e61`.
Full current source hashes, code revision/dirty state, recipe, dataset hashes,
per-case token IDs, and selected raw traces are generated in
`out/experiments/tokenizer-dataset/`. The source recipe and maintained fixtures
are sufficient to rebuild disposable exports.

## Second pass: explicit revision and language exposure

The archived v1 manifest and unchanged probe texts still reproduce the first-pass
failures. V2 makes eight explicit lexical exchanges, recorded with IDs and hashes
in [revision-v2.json](../../data/tokenizer/revision-v2.json). Its identity is
`e5edde07a3002a8f1343f99f7664f45b76d33077fd90a9f71991b6d346ce3477`.
Both manifests retain 384 total entries. The original probes now have 24/24 direct
dialogue coverage: this is a measured fit to observed gaps, not new validation.
Removed words become fallback input rather than aliases or silently normalized
spellings. Existing tests check their expansion and exact reconstruction.

Sixteen new agent-authored probes include 12 familiar recombinations and four
deliberate topic extensions. The extensions need `knee`, `lonely`, `heavy`, and
`wipe`; those failures remain visible. The probes are neither random samples nor
independent human review.

A separate language-exposure export starts from the 48 original budgeting dialogues
and 54 new authored dialogues. It covers all 352 lexical entries; **168 words occur
once.** This repairs
the total absence of most vocabulary from candidate preparation data, but does
not establish sufficient diversity or learned competence. It is not automatically
mixed into the controlled training split. Exact held-out task prompt overlaps
are checked. A manual semantic review found one overlap the exact-text check
missed: `memory-1` repeats a complete held-out bear/ball location scenario.
That record is now excluded with a source hash, target group ID, and explicit
reason; neither original source nor held-out case was rewritten. The resulting
language export has 101 dialogues. Full semantic isolation remains unresolved.

## What this does not finish

T1 is partial: exact encoding/framing checks pass, but everyday topic extensions
have failures and lexical curation remains under review. M1–M4, L1, and E1 remain
unassessed as complete milestones. No learned outputs, neural correctness checks,
GPU throughput, closed-lexicon sampler, or production performance claim exists.

The controlled tasks and sparse language seed are useful starting points for the
planned inference test model. Before training, review the language mixture and
its evaluation overlap, and check examples beyond selection data. Repeating
these templates alone does not establish conversation ability.

A future Hugging Face release could package the verified model, exact vocabulary,
checkpoint, trace examples, and evaluations for its intended test-model use.
It should document both supported mechanical claims and excluded system/quality
claims. [Hugging Face's model-card guidance](https://huggingface.co/docs/hub/model-cards)
asks for intended uses, limitations, training data, and evaluation details.
There is no model artifact to publish in this checkpoint.
