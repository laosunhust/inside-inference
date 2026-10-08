# Repository guidance

## Purpose and authority

- Read [docs/purpose/README.md](docs/purpose/README.md) for learning goals and the
  request journey; read [README.md](README.md) for purpose and philosophy and
  [docs/development.md](docs/development.md) for workflows.
  [catalog/stack.json](catalog/stack.json) owns the area index and lab metadata;
  [catalog/README.md](catalog/README.md) defines the extension contract.
- Read [docs/ontology/README.md](docs/ontology/README.md) before defining simulation
  concepts. It owns shared meanings and abstraction/evidence contracts; it does
  not establish that any particular model is representative or inexpensive.
- Specify the question and applicable abstraction contract before implementing a
  simulator. Evaluate validity and execution cost separately; narrow scope rather
  than silently dropping relevant behavior to meet an execution budget.
- Training is checkpoint preparation, not a research focus. Follow
  docs/implementation/model-preparation.md; retain necessary correctness and
  provenance checks without expanding into training-method experiments.
- The observatory covers the entire inference stack. The tiny GPT is one
  instrument, not the boundary of the project. Indexing new areas and adding
  independent mechanical labs need not wait for the GPT training path.
- Personal learning is the primary goal; public usefulness is welcome. Do not
  make competition, differentiation, audience growth, or launch readiness gates
  for worthwhile experiments. Existing explainers are references to learn from.
- [docs/purpose/original-lab-plan.md](docs/purpose/original-lab-plan.md) preserves
  the original tiny-GPT proposal; `make design` prints it. Its deadlines, release
  prerequisites, and project-wide scope are historical. The original DOCX is not
  present in this checkout.
- Connect local mechanisms to the request journey: routing, admission, queues,
  scheduling, state residency, prefill/decode, transfers, and shared constraints.
  Do not require every lab to implement the whole journey; link affected stages
  and distinguish implemented effects from proposed system experiments.
- Distinguish working demos, planned labs, cost simulations, and real-system
  measurements. Never present an indexed idea as an implemented experiment.
- Keep one source of truth: docs/purpose/README.md owns purpose, README introduces purpose and philosophy, docs/development.md owns workflows,
  the ontology owns shared meanings and experiment contracts, the
  catalog owns classification, executable code owns implemented behavior, and
  this file owns contributor instructions.
  Generated intro pages are disposable outputs, not editable authorities.

## Implementation

- Preserve a single source of truth. Fail explicitly on invalid or unsupported
  behavior; do not hide errors behind alternate implementations or defaults.
  Defaults may establish initial configuration, not override failed configuration.
- Follow the fixed-vocabulary contract in docs/purpose/README.md and the budget
  research it references: 384 total IDs is frozen. Preserve the planned reversible
  UTF-8 byte/hex fallback and trace its decisions; it is intentional encoding,
  not error recovery. Do not silently normalize, drop, or truncate input.
  Keep vocabulary identity fixed in controlled comparisons.
- Follow docs/architecture/inspection.md for the three inspection levels and
  computation/simulation boundaries. Mechanism controls must execute supported
  configurations and expose actual traces, not change only the visualization.
- Prefer cohesive responsibilities, focused modules, and clear interfaces. Split
  by responsibility, not line counts. Keep the core simple and place experimental
  mechanisms behind explicit interfaces with consistent trace semantics.
- Prioritize correctness over backward compatibility. Remove superseded code and
  update callers, contracts, documentation, and generated artifacts together.
  Keep interfaces suitable for the planned experiments without building them early.
- Bind inspectable visual objects to canonical ontology terms. Render definitions
  from their owning source and provide navigation both ways. Show modeled state,
  transition rules, and assumptions alongside interactions; do not infer hidden
  state in the renderer or disguise caller labels as different simulated behavior.
- Expose the actual computation through a first-class trace API. Do not invent
  explanations in a separate calculation that can drift from model execution.
- Distinguish storage dtype, compute dtype, accumulation dtype, and printed
  precision. Extra displayed digits do not imply extra numerical accuracy.
- Follow the baseline-first order in docs/purpose/milestones.md and the naïve
  contract in docs/implementation/naive-inference.md. Existing advanced side labs
  do not make their mechanisms prerequisites. Introduce one tested change at a time.
- For the tiny-GPT instrument, keep the baseline faithful to a decoder-only GPT.
  Avoid optimizations and framework conveniences that conceal required states.

## Experiments and evidence

- Treat abstraction design and validity as core work. Follow the distinction in
  [purpose](docs/purpose/README.md#the-abstraction-is-the-core-work): running code,
  a correct implementation, and a representative model are separate achievements.
- Before implementing a lab, state its question, claim, regime, preserved causal
  relationships, and omissions. Validate the abstraction for that claim using
  appropriate analytical or empirical evidence; implementation tests alone are
  insufficient. Report unsupported conclusions as unresolved hypotheses.
- Probe counterexamples, boundaries, and sensitivity. Use cases beyond calibration
  data for empirical claims. Fix or withdraw known misleading abstractions;
  disclaimers, attractive visuals, and game scoring do not justify false lessons.

- For system simulations, declare the workload, resource constraints, policy,
  service-time model, and transfer assumptions. Show a baseline request timeline
  and replay controlled interventions. Distinguish per-request latency from
  aggregate throughput; do not claim to model constraints that are absent.

- Give each innovation a stable ID, one primary area, and related-area links.
  Define its invariant, observable mechanics, baseline, tradeoffs, and limits.
- State false-positive and false-negative risks. Separate mechanical fidelity
  from quality and performance transfer. Tiny successes or failures do not rank
  real models, frameworks, hardware, or serving systems.
- Use external measurements or explicitly parameterized simulations where the
  tiny model cannot represent the mechanism faithfully. Cite primary sources for
  named innovations and distinguish the published system from our simplification.

- Change one mechanism at a time. Hold tokenizer, corpus, checkpoint, and workload
  fixed where applicable, and explicitly record any differences.
- Record seeds, serialized configuration, code revision, input identities,
  precision choices, and checkpoint identity so results can be reproduced.
- Explain each optimization at three levels: math; information retained, lost,
  or routed; and operations, bytes, or latency. Label simulated costs separately
  from measured timings and state the assumptions.
- Diagnose from original inputs, tensors, gradients, updates, and raw traces.
  Summaries and screenshots are not substitutes for computational evidence.
  Report missing evidence before drawing conclusions.
- Search ignored outputs with scoped `rg --hidden --no-ignore` when needed.
- Put temporary runs, traces, generated checkpoints, and reports under
  `out/experiments/`. Treat `out/` as disposable; keep required datasets, maintained
  fixtures, and irreplaceable state elsewhere. Add ignore rules when outputs are
  introduced. Keep concise findings in docs and only necessary fixtures in tests.

## Validation and workflows

- Use the root Makefile as the public workflow entry point. Add targets when their
  implementations exist; do not create successful no-op build or test targets.
- Use docs/purpose/milestones.md to assess milestone completion. Report unmet
  targets and missing evidence; do not confuse bootstrap checks with trained-model
  success or change acceptance thresholds after seeing results without recording it.
- Run `make check` for documentation/catalog changes and `make intro-page` for
  page changes. Run `make test` for implementation changes. Catalog validation
  does not establish model correctness or validate external research claims.
- With implementation changes, add and run focused correctness checks against
  independent reference calculations. Prioritize tokenizer round trips, causality,
  forward/gradient correctness, parameter updates, and trace fidelity.
- Extend `make test` with meaningful independent checks as implementations arrive.
  Add integration workflows when needed. Do not weaken checks to get green.
- Fix change-induced failures and rerun affected checks. Broaden or repeat passing
  checks only for subsequent changes or unresolved concerns. Report exactly what
  was checked and any remaining blockers or untested behavior.

## Documentation and commits

- Give every document a distinct purpose. Remove redundant or obsolete guidance
  and repair links when ownership or behavior changes.
- Reference executable configuration rather than copying its settings into docs.
- Keep the bootstrap small; add services, toolchains, or directory structures
  only when this repository needs them.
- Commit only when asked. Use descriptive messages with a short body for behavior
  changes or nontrivial diffs.
