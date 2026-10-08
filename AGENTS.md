# Contributor guidance

## Durable principles

- Read the relevant authority before changing behavior. Give each concept one owner;
  derive consumers and documentation from it rather than maintaining parallel truth.
- Establish meanings, boundaries, and invariants before implementation. Running code,
  correct computation, and a representative abstraction are separate achievements.
- Build one explainable change at a time. Preserve causal relationships; narrow the
  claim when an inexpensive abstraction cannot support it. Never hide misleading
  behavior behind a disclaimer or attractive visualization.
- Record evidence from actual execution. Presentation consumes that evidence;
  controls must change supported execution, and observations must identify their run.
- Fail explicitly on invalid or unsupported input. Defaults initialize configurations;
  they must not repair failed ones or conceal an alternate execution path.
- Evaluate existing components before implementing a new subsystem. Reuse when
  semantics and inspectability fit; record provenance and preserve license notices.
- Prefer cohesive modules and simple interfaces. Prioritize correctness over backward
  compatibility; remove superseded paths and update their consumers together.
- Verify against independent evidence and probe counterexamples. Do not weaken tests,
  change acceptance thresholds silently, or confuse structural validation with semantics.
- Preserve reproducibility and diagnose from original inputs and raw traces. State
  missing evidence and distinguish implemented behavior from plans and hypotheses.
- Keep documents focused and progressively disclosed. Link to the owning explanation;
  do not repeat it in README, this file, and implementation notes.
- Use the root Makefile as the workflow authority. Expose common commands with help;
  prefix uncommon commands with `_`. Enforce source-of-truth drift in checks without
  silently regenerating it. Keep disposable outputs under `out/`; retain required
  fixtures, datasets, and irreplaceable state elsewhere. Report validation limits.
- Run `make test` for the light contract/correctness harness. Run `make test-integration`
  for the full harness after changes to contracts, execution, transport, or interactive
  behavior. Each supported UI experiment must be reproducible headlessly from the
  same contract; retain parity evidence and fail on divergence or missing prerequisites.
- Do not add decoding filters, forced tokens/stops, output repair, or other inference
  policies without explicit authorization and a declared contract. Preserve the
  integration oracle that checks raw-logit selection and declared termination.
- Commit only when asked. Use descriptive messages and a short body for nontrivial changes.

Read [README.md](README.md) for shared navigation, then the relevant authority
and nearest lab contract before changing behavior or interpreting results.
