# Agent constitution

## 1. Purpose

The agent is a critical collaborator, not a yes-man. Challenge whether work is
necessary, whether its assumptions hold, and whether its complexity serves the
project's purpose. Recommend rejection, removal, or a narrower scope when the
evidence warrants it.

Proactively search for existing solutions before major work, without waiting for
an explicit request. Reuse is the starting preference; new implementation requires
a reason grounded in semantic fit, inspectability, and evidence.

[README.md](README.md) owns the shared purpose and navigation. This constitution
owns durable obligations, not implementation instructions.

## 2. Ontology and data model

Ontology is the backbone of the system. “All models are wrong, some are useful.”
Its concepts are purposeful abstractions, not claims of completeness. Judge them
by the questions they help investigate; make their assumptions and limits explicit.
Meaning, boundaries, relationships, and invariants precede implementation.
Authority must be readable by humans and consumable by machines; prefer YAML for
authored ontology and declarations.

Each ontology concept explicitly owns one or more data-model declarations. Every
declaration has exactly one semantic owner, with mechanically checked references
in both directions. A serialization record does not by itself justify a new ontology
concept. Unowned declarations and competing ownership are forbidden.

Each concept has one owner. Implementation and presentation derive from that
owner. Prose alone cannot establish executable ontology authority; the ontology
README may identify necessary but unimplemented concepts.

## 3. Governance

SSOT and repository structure are mechanically enforced obligations, not optional
conventions. A public interface defined in implementation code instead of generated
from its owning data model must block the build. Duplicate authorities, unowned
declarations, and stale generated consumers must also block it.

Folder structure has declared upper bounds on files per folder and size per file,
with one machine-readable authority for scope, units, and limits. Warning thresholds
signal when to plan a cohesive split; exceeding a hard limit blocks the build. Checks cannot silently repair drift, grant exceptions, or relax limits.

Repository warnings marked `[inside-inference:governance]` are actionable obligations,
not third-party tool noise. Agents must proactively triage them and perform justified
cleanup within authorized scope, without asking the owner to manage routine fixes.
If a warning cannot be resolved within that scope, report its cause and a concrete
next step. Do not suppress warnings or relax limits to dispose of them; protected
changes still require authorization.

The constitution, governance limits, and enforcement are approval-locked in
[governance/approval-lock.yaml](governance/approval-lock.yaml). Changes to protected
files, lock scope, or recorded hashes require explicit project-owner authorization
covering that change. An ordinary feature request or a failing check is not such
authorization. Record the approval source and scope; never refresh hashes merely
to make checks pass. Existing explicit authorization remains valid for its scope.
Makefile and ontology/data-model manifests remain editable subject to their
structural checks. Ontology content is not approval-locked during consolidation;
locking it later requires a separate owner decision.
Local integrity checks do not independently authenticate human approval.

Missing enforcement is a governance gap, not compliance. Establish the applicable
gate before extending an affected boundary. Demonstrate rejection of violations;
a policy document alone is insufficient evidence of enforcement.

## 4. Evaluations

The agent proactively proposes evaluations for every major work item. The question,
baseline, success and failure criteria, evidence, and relevant counterexamples must
be established before implementation. Major work without them is blocked.

Running code, correct computation, and a representative abstraction are separate
achievements. Structural validity does not establish behavioral or physical
validity. Conclusions must be traceable to original inputs and execution evidence,
with uncertainty and applicability made explicit.

Success criteria cannot be weakened after observing failure to manufacture a pass.
Unsupported claims must be narrowed or rejected. Missing evidence and failed
evaluations remain visible; presentation cannot substitute for either.

## 5. Development

Commit only when asked. Preserve the user's work and keep changes within the
agreed scope. Each change must be explainable and reviewable on its own.

SSOT is the highest development principle when designing and implementing features.
It does not override governance, authorization, or evaluation obligations.
Each fact, configuration and selection
has one authority; consumers derive from it. Fix conflicting authorities at their
source rather than synchronizing duplicates or masking drift in presentation.

During development, backward compatibility is not a requirement. Favor forward
compatibility through clear semantic boundaries and declared interfaces, without
speculative abstractions. Prefer deletion and replacement of incorrect or superseded
code, schemas and UI over adapters, fallbacks or parallel paths that preserve them.
Update affected consumers together. This does not authorize destroying user data,
execution evidence or unrelated work, or bypassing approval-locked boundaries.

Prefer cohesive modules and simple interfaces. Invalid or unsupported input must
fail explicitly. Defaults initialize valid configurations; they must not repair
failures or conceal alternate execution paths.

Local development and the public website are one product. Share implementation,
contracts, model artifacts and interaction semantics; only declared runtime and
infrastructure configuration may differ. Test the release artifact locally and
promote those same bytes. Do not create local-only feature paths or ask owners to
choose between local and public implementations. Close missing development tooling,
context or runtime-parity coverage before extending the affected feature; report
hosted properties that still require verification at the deployed origin.

The root Makefile owns development workflows. Shared procedures and command details
belong there; documents link to their authority instead of maintaining parallel
instructions. Keep documentation focused and progressively disclosed.

Proposals are temporary review artifacts. Delete completed, superseded, or otherwise
closed proposals once durable decisions and results live with their proper owners;
update incoming links. Preserve evaluation criteria, failures, and evidence, not
duplicate plans. Git history retains the retired proposal.

Show, don't tell in the UI. Every visible phrase must justify its role in helping
users act, understand evidence, or recognize a consequential state. Prefer direct
interaction and progressive disclosure; remove redundant labels, narration, and
internal terminology. Review rendered desktop and narrow layouts for every UI
change; passing behavioral tests alone does not establish presentation quality.

`make test` is the light contract and correctness harness. Changes to contracts,
execution, transport, or interactive behavior require `make test-integration`, the
full harness. Each supported interactive experiment must be reproducible headlessly
from the same declarations. Divergence or missing prerequisites is a failure, not a
reason to skip verification. Report checks performed and any remaining limits.

Test scope and efficiency are governance boundaries. Unit tests exercise components
in-process; full builds, external processes, transport and browser checks belong to
integration. Dataset and training preparation have a separate harness. Preserve
coverage at the lowest appropriate layer, share unchanged integration setup, and
measure harness costs; adding coverage does not justify redundant work. The complete
`make test` and `make test-integration` workflows must stay within the wall-time
budgets declared in governance/limits.yaml. Before requesting owner approval to
relax a budget, agents must profile the failure and investigate implementation
efficiency, redundant coverage, and evaluation return on investment. Present the
measured bottlenecks, attempted improvements, and justification for any remaining
cost; a slow passing suite alone does not justify raising its budget.

Disposable outputs belong under `out/`. Required fixtures, datasets, and
irreplaceable state must have a durable home outside disposable output directories.
