# First checkpoint pilot

Status: protocol frozen before training, 2026-10-09. This is checkpoint preparation,
not a new training research track. The four-hour work window began at 05:42 UTC
and ends at 09:42 UTC. No process may be left training beyond that deadline.
[Model preparation](model-preparation.md) owns the broader boundary.

## Purpose and fixed choices

Prepare weights that make bounded context-dependent inference inspectable before
KV-cache and state-handoff experiments. Preserve the current generated architecture
(one block/head, width 8, FFN 16, context 128, binary64), vocabulary identity, and
unmasked greedy decoding. Do not enlarge the instrument if this pilot fails.

Use only the controlled recipe's 400 training and 60 development examples. Do not
read or score the test export during preparation. Language-exposure seeds and
coverage probes remain excluded. This pilot cannot teach the 322 lexical entries
absent from the controlled task corpus or establish conversational usefulness.

The existing UI accepts one user turn. Project each controlled example into one
user turn by joining its user texts with one ASCII space, retaining all facts,
updates, and the final question in order. Omit only the authored `okay.` assistant
acknowledgment and intermediate role framing. The response is the original final
assistant text. Keep original case/group IDs, split, and accepted response forms;
record projected examples and their hashes. This is an explicit presentation
transformation, not a change to the frozen tokenizer or source split.

Encode the entire prompt through the existing codec. Train teacher-forced causal
next-token prediction on the final response and TURN_END only; no loss on prompt,
PAD, role headers, or EOS. Right-pad batches; causal attention prevents future
padding from affecting valid positions. Reject overflow, never truncate or pack
unrelated examples. Batch loss is the mean over supervised target tokens.

## Correctness before training

Use a separate PyTorch preparation implementation with the exact forward equations
and parameter orientation of the inspectable standard-library engine. Export its
parameters into the existing checkpoint format. Binary64 forward/logit comparison:
absolute tolerance 1e-10, relative tolerance 1e-9 for the tested inputs. Compare
selected parameter gradients to central finite differences of the independent
reference loss (absolute 2e-6, relative 2e-4). Check an AdamW update against its
scalar equations. Save/resume must reproduce the uninterrupted next update exactly
on deterministic CPU, including optimizer and sampler state. Test padding/loss
boundaries and checkpoint isolation. Passing these tests is required before pilot
optimization; tiny synthetic update tests are correctness checks, not the pilot.

## Bounded run and evaluation

[data/preparation/pilot.json](../../data/preparation/pilot.json) owns executable
preparation settings; the values below record this first protocol.

One configuration, seed 7: AdamW learning rate 0.003, betas (0.9, 0.999), epsilon
1e-8, weight decay 0.01, batch 16, CPU binary64, one PyTorch thread. Sample training
examples uniformly with replacement from a separately seeded deterministic sampler.
No clipping, dropout, learning-rate schedule, decoding filter, or response repair.
Initial run: up to 4,000 updates or 30 minutes of training-loop wall time, whichever
comes first. Save latest and best development-loss states every 200 updates and
at orderly termination; record throughput, resident memory, and elapsed time.
The pilot measures actual cost before any continuation is considered. No sweeps.

Evaluate the initialization and saved checkpoints on development data. Report
response loss, exact accepted-answer accuracy by family, TURN_END rate within the
existing 8-token budget, and responses with at least two nonterminal tokens followed
by TURN_END. Preserve raw generated IDs and diagnostic text, including failures.

Context interventions use the same model and final question: (a) question alone,
(b) rotate the complete fact context among examples within the same family by one
case in stable ID order. For correction examples, retain all update text in the
fact context, not in the question. Score against the original example and report
accidental answer matches in the rotated contexts. These are development probes,
not independent held-out validation or proof against all template shortcuts.

Predeclared provisional instrument criteria: at least 48/60 accepted answers,
at least 9/15 in each family, at least 90% TURN_END and multi-token termination,
and at least 20 percentage points accuracy above both context interventions.
These are development screening criteria, not L1 completion or a claim of language
quality. Existing L1 test gates are unchanged and are not evaluated overnight.
Select the exported checkpoint by lowest development response loss (earliest step
wins ties), not by looking at test results. Report unmet criteria without changing
them. Stop after this bounded pilot if evidence suggests architecture/data limits.

## Handoff

Keep configs, source/data identities, metrics, resumable states, exported weights,
reference inference traces, and a concise report under
`out/experiments/model-preparation/`. No checkpoint is published or committed.
Report trained artifact replay/integration evidence separately from learned task
behavior and from absent hardware-performance claims. No architecture, vocabulary,
or policy changes; no deployment or commit.
