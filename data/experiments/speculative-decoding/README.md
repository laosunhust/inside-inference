# Initial greedy speculative-decoding qualification

The retained browser experiment results are the unmodified experiment branch of the
passing shared browser harness. Both target-only and 0.5M-draft/4M-target paths selected
the same 32 tokens for the catalog workload. The speculative run used 12 target rounds,
48 draft calls and accepted 20 of 48 proposals. Each retained round includes its
proposals, target choices, accepted prefix, verified output and actual forward work.

This is functional qualification, not a repeated timing benchmark. Durations belong
to these browser-worker executions; no speedup or production-capacity claim follows.
The ordinary and speculative paths were also exercised interactively, with exact
output parity against these headless calls. The harness checks proposal-length edits,
exported round evidence, cold resets, and explicit mode exit.

- [Retained experiment observations](browser-experiments.json)
- [Qualified site identity and scope](qualification.json)
- [Evaluation and limitations](../../../governance/evaluations/results/2026-10/14/performance/decoding-experiments.yaml)
- [Execution and publication semantics](../../../docs/architecture/inspection.md#greedy-speculative-decoding)

The root Makefile owns the unit and integration workflows; the browser experiment
checks live in `scripts/check/story_models/experiments.mjs`.
