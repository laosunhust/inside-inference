# Execution, evidence storage, and presentation

Owns delivery boundaries, not numerical semantics or deployment infrastructure.
[Ontology](../ontology/README.md) owns concepts; [delivery declarations](../../data-model/domains/delivery.yaml)
own the storage projection and API shapes. These boundaries are independent of
where computation runs. The [website architecture](website.md) owns the primary
browser-execution hypothesis, its feasibility spike and deployment parity.
The implementation described below currently serves native Python execution;
a separate browser feasibility harness now executes the same engine, but the
production browser transport is not yet implemented.

## Responsibilities

| Part | Responsibility |
| --- | --- |
| Numerical engine | Execute the declared workload or token step and record actual observations. |
| Delivery service | Persist evidence successfully, then return an ExecutionReceipt. |
| Artifact store | Retain immutable, content-addressed JSON objects for the declared store lifetime. |
| HTTP application | Apply generated OpenAPI admission and response policy around the delivery service. |
| Runtime bridges | Adapt sockets or Lambda Function URL events to the same WSGI application. |
| Frontend | Resolve declared artifacts, validate identity and shape, and inspect the resulting evidence. |

The compute response identifies the execution and its archive. It carries no model
weights or numerical tensors. Artifact retrieval is a separate declared API. File,
in-memory and S3-backed stores share canonical bytes and keys. Storage here is
application evidence storage; it is not the simulated model's KV cache or memory.
Browser placement must retain declared execution and artifact interfaces rather
than expose mutable engine internals. In-memory storage does not promise survival
across reloads; explicit export retains evidence outside the execution session.
A failed write cannot produce a successful receipt. Missing or corrupted evidence
fails explicitly instead of triggering a new inference run.

## Lossless representation

An ExecutionArchive retains the run or token-step structure and a TensorTable
reference. Stored observations refer to table rows; identical canonical rows are
stored once. Selection logits reference the same row as the executed output
projection. Checkpoint and vocabulary references address separate reusable assets.
Schema ownership stays with the original numerical concepts; storage projections
are serialization records, not additional ontology concepts. Regression admission
checks that unchanged projection fields retain their original declarations.

Deduplication does not change the engine's computation, recorded steps, or resource
claims. The naïve model still recomputes the prefix. Two observations can reference
identical stored values without establishing reuse during inference. No numerical
rounding or replacement with illustrative values is allowed.

The browser caches fetched immutable objects. Current inspection reconstructs the
complete record from unique evidence; it does not yet retrieve individual tensors
on demand. This reduces repeated transfer and separates compute from storage, but
does not bound browser memory for arbitrarily large experiments. Per-observation
retrieval belongs to a subsequent inspection change, not a claim of this slice.

Self-contained export remains explicit: reconstruct the expanded record for CLI
replay. Browser export preserves original number lexemes with native
[JSON source access](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
and [raw JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON),
rather than rounding through a second numeric serialization. Unsupported browser
export fails visibly. An offline snapshot bundles the same objects; it does not
use a separate numerical implementation.

## Current native execution and evidence

`inside_inference/delivery/application.py` is the sole HTTP application for both
runtimes, with numerical dispatch in `service.py`. Lambda uses an injected
S3-compatible store, selected from EVIDENCE_BUCKET
in the deployed entry point; PUBLIC_ORIGIN supplies the admitted website origin. Its handler has no dependence on local website
assembly or process-resident execution state. Numerical workloads and exact-prefix
steps remain independently reproducible through the CLI.

Tests compare reconstructed records with headless computation and browser exports,
exercise the Lambda v2 envelope with base64 and plain bodies, and verify persistence
across file-store instances. S3 adapter tests use a deterministic client double;
they are not evidence of a deployed AWS service, IAM policy, latency, or availability.
The Lambda adapter is retained code, not a selected public-site deployment.
Remote hosting work is deferred under the browser-first hypothesis.

The existing KV-residency endpoint still returns its CacheRun directly. Its measured
hardware path is not made Lambda-compatible by the delivery adapter. The website
still builds an offline snapshot; the successful browser feasibility spike supports
proceeding to a declared worker transport and independent frontend assembly before
static hosting. No cloud resources are provisioned.
