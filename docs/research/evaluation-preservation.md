# Evaluation history preservation and return to the labs

Date: 2026-10-10. This addresses the evaluation overwrite exposed by the
[word-separator diagnosis](word-separator-diagnosis.md).

## What changed and what was recovered

[Evaluation admission](../../governance/evaluations.yaml) is now an active-record
index. Criteria and results live in separate dated folders below
[governance/evaluations](../../governance/evaluations/). Every criteria record is
checked, not just the active one. Results reference the exact criteria file and
its SHA-256, plus maintained evidence. Amendments use a new file with an explicit
`supersedes` link to criteria for the same work item.

The four committed legacy snapshots were recovered byte-for-byte: four-pillars
admission, tokenizer/backend/provenance consolidation, detached-control removal,
and control-plane cards/source application. They remain historical criteria;
recovery does not retrospectively certify their outcomes. The separator diagnosis
criteria were preserved separately, with a result linked to its maintained report.

The gate walks reachable Git history from HEAD and requires the owner-approved
migration anchor in its ancestry. It rejects removed or modified committed criteria
and results, even when a changed version has already been committed. Moving the
active pointer does not remove historical records. Missing required history fails
explicitly, rather than initializing a new empty ledger. Approval-lock updates cover
only the authorized checker, lock inventory and regression tests.

These are local integrity checks. They cannot recover uncommitted content that was
never recorded, prevent a person from rewriting Git ancestry, authenticate approval,
or establish that evidence supports a claimed outcome. New entries remain editable
until committed. Results bind criteria bytes; a path to an evidence document is not
an immutable snapshot of every underlying artifact. Important measured findings
must remain in maintained reports, with disposable details identified as such.

## Verification

The final light workflow passed in **7.32 seconds** (91 tests). The full workflow passed in
**76.15 seconds**, including 90 unit tests, 25 integration tests and browser parity.
After extending missing-field, duplicate-work-item and shallow-history cases,
the light workflow was rerun; the real Git adapter test also passed in 0.053 seconds. Tests demonstrate rejection of deleted or rewritten criteria,
rewrites paired with refreshed result hashes, invalid active references, malformed
criteria, missing evidence, symlinks, cyclic supersession, duplicate work items without
supersession, shallow history and changed results.
A temporary real Git repository demonstrates detection of a rewrite already
committed into HEAD, plus failure when required history is unavailable.

The SPACE denominator in the counter-proposal now explicitly counts complete
prompt-plus-response sequences including framing. Multi-word supervision and BPE
remain deferred; no additional training or default-checkpoint change was made.

## M2 audit and next lab

The [M2 acceptance](../purpose/milestones.md#m2--reuse-state-without-changing-the-answer)
remains supported for the fixed one-block/head width-8 binary64 instrument:

| Acceptance | Inspected current evidence |
| --- | --- |
| All continuation logits and cached K/V match the uncached reference | `tests/unit/test_kv_cache.py`: chunked and single-token continuation; every logit at atol 1e-10, rtol 1e-9; full K/V equality |
| Masks, positions, reset, context boundaries and invalid state | Same component suite: explicit masks/positions, detached state/reset, identity/shape/nonfinite rejection and 128-position boundary |
| Retained bytes and avoided work | `inside_inference/kv_runtime.py` counts binary64 payload bytes; `inside_inference/cache_lab.py` records actual new computation and independently checks every cached logit against full-prefix execution |
| End-to-end reuse and residency | `tests/integration/test_cache_lab.py`: cold/local/remote hits, eviction, reservations, backpressure, replay; full browser harness checks cache controls and recorded observations |

This audit reran the standard reference harness. It did not repeat the historical
trained-checkpoint or optional physical CUDA measurements; those remain scoped to
[their existing evidence](kv-residency-2026-10-09.md). Logical bytes and hypothetical
service rates are not accelerator performance predictions.

[G1](../purpose/milestones.md#g1--inspect-a-state-handoff) remains unimplemented.
The current reference transfer reconstructs `KVState` in another logical pool and
removes the source entry. It has no serialized layout conversion or endpoint import
protocol, so it is not G1 evidence.

The next lab should reuse M2's state and oracle: one request, two logical endpoints,
explicit lossless K/V layout conversion, detached imported storage, producer retention
until successful import, malformed/incompatible payload rejection, and comparison
of every resumed logit. Expose the same declared operation headlessly and in the UI.
Review its declarations and evaluation before implementing it; preserve model,
precision and token history. Training and real network scheduling are unnecessary
for this first handoff boundary.
