# Speculative decoding — planned lab

Question: what happens if a cheap draft proposes several tokens before the target
model verifies them? Where is work saved, and what happens to a rejected suffix?
This is indexed for future exploration; no speculative execution is implemented.

The first experiment should compare greedy target-only decoding with a draft and
an explicit target verification rule, holding target weights, tokenizer, prompt,
and output policy fixed. Its claim is exact agreement with that greedy baseline.
A deliberately poor draft is an essential counterexample: discarded work must
remain visible. Include first-token rejection, full acceptance, terminal tokens,
and budget/context boundaries before claiming equivalence.

A later distribution-preserving sampler is a different experiment. Its acceptance
and correction distributions must implement and validate the published rule;
matching a few decoded strings or sharing a random seed does not establish the
same output distribution. The canonical reference is
[Leviathan, Kalman, and Matias, ICML 2023](https://proceedings.mlr.press/v202/leviathan23a.html).

The [workload/event boundary](../architecture/workloads.md) separates model computation, selection,
and delivery. Add explicit proposal, verification, and acceptance events, draft and
target identities, and state reuse/rollback when implementing this lab. Neither
proposed nor rejected tokens count as delivered output. Rejected work still counts
as operations and bytes. Preserve one accepted prefix shared by the computation
and every inspection level.

The tiny instrument can expose exact arithmetic, accepted prefixes, and wasted
work. It cannot predict real accelerator speedup from Python timings. A cost model
would need separate draft/target resource demand, verification batching, state
capacity, transfers, and scheduling assumptions, validated for its stated regime.
False positives include ignoring draft overhead and rejected-state traffic; false
negatives include serial Python execution hiding efficient parallel verification.
Acceptance rate alone is not a performance result.

Implement after the naïve reference and the prerequisites of the chosen claim.
This planned lab does not advance the baseline-first milestone order.
