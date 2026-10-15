# Execution, evidence storage, and presentation

Owns operation and evidence boundaries.
[Ontology](../ontology/README.md) owns concepts;
[execution operations](../../data-model/execution.yaml) own operation names and
request/response declarations. [Website architecture](website.md) owns placement.

## One browser execution path

The site is static assets. Its generated client validates requests and sends them
to a worker. One Python engine in that worker executes every declared operation:
model inference, tokenization, resource simulation and evidence tooling. The
renderer neither computes model values nor constructs transport messages. Request
admission uses generated declarations; complete response validation belongs to the harness.

Preparation tokenizes, admits configuration and returns a session ID without a forward pass. Token operations reference that session and carry only dynamic token IDs. Execution produces
real numerical observations. Both use the same operation interface; there is no
HTTP compute service or native fallback. Headless integration drives those same
operations in Chromium and compares them with interactive execution.

## Evidence

The main page exports `GenerationEvidence`: original input/workload, selected
model descriptor, and its accepted `GenerationPrediction`. The prediction retains
the consumed raw prefix, model/tokenizer identities, contract identity, output IDs,
logits and available tensor observations. Timing is an observation, not part of numerical
replay equality. To reproduce evidence, prepare its recorded input to obtain a fresh session, then execute `generateToken` with that session and the recorded prefix/output IDs. The same release and matching loaded artifacts are required for comparison; session IDs are excluded from numerical equality.
This export does not embed large weights or promise replay across changed runtimes.

The main page retains one accepted prediction in memory. Reset or model/input
changes invalidate it and disable export. There is no evidence-restoration adapter
between two landing-page protocols. The optional resource experiment exports `ResourceExecution`, retaining the same
submitted `GenerationInput`, numerical cache run and decoded outputs. Reset and
configuration edits invalidate this evidence as well. There is no receipt store
or artifact-restoration API without a consumer.

## Native boundary

Native Python is build, preparation and component-test tooling, not an alternative
website runtime. Native computation, CUDA, and an HTTP compute service are not
needed to study KV reuse, eviction, resource contention or simulated transfers.

A future native path requires a named investigation and evidence that the browser
cannot support it, such as measuring an actual device. Existing code, potential
speedups, or a hypothetical future consumer do not justify that path.

## Model assets

[ModelSources](../../data-model/domains/model-family.yaml) governs the authored
[model inventory](../../data/models/models.yaml). Build-time inspection of its
weight files derives the exact dimensions, counts, sizes and digests into one
`ModelCatalog`. The static `models/catalog.json` is the runtime authority; the UI
obtains it through `modelCatalog`, not a separate fetch or handwritten model list.

The asset reader resolves the declared storage prefix and relative artifact path,
fetches without credentials, and verifies byte count and SHA-256 before admitting
weights or a tokenizer. The same reader handles local static files and public
HTTPS object storage. Missing files, CORS denial, incorrect metadata and corrupt
bytes fail explicitly. A failed load clears execution eligibility; no old model
or native engine supplies a fallback answer.

S3 is an asset host, not a compute service. A deployment must expose the referenced
objects, allow browser GET requests from the site origin, and preserve artifact
bytes. Use a release-specific immutable object prefix; only versioned artifacts
should receive immutable caching. Catalog updates must reference already-published
artifacts. A stale cached artifact fails digest verification rather than silently
executing different weights. Its HTTPS/CORS/cache configuration still needs deployed smoke checks.
The release build accepts storage configuration through the [Makefile](../../Makefile).
Only this environment configuration differs between a local asset origin and a
hosted one. Promote the locally tested release bytes. The integration harness
executes through a second local origin with CORS and also verifies rejection when
CORS is absent; it does not claim to have tested a live S3 bucket.

Each explicit load admits an identified model and its matching tokenizer. A prepared `GenerationAdvance` carries a session reference, raw prefix and prior outputs. The resulting evidence expands these into a `GenerationStep` with the admitted `ExecutionSpec` and generation policy. `GenerationInput` binds that execution configuration to a
`Workload`; ordinary generation rejects multiple requests and nonzero arrivals. Resource
simulation consumes chronological arrivals under its declared scheduling policy.
Generation returns actual selected IDs, logits and model identities.
The inspectable model also returns executed tensor observations; larger models do
not fabricate equivalent small-model tensors. The current main page retains its latest computation in memory; export is explicit.

Main-page generation uses the shared unmasked greedy selector after the decoder
produces logits. Probability normalization runs in binary64 through that selector;
this does not change the larger model's binary32 matrix computation. The tiny story model stops on
its trained EOS ID; the larger family stops on its trained story separator/BOS or
EOS. Budget and context exhaustion also stop continuation. Every stop ID is declared in the model
catalog. Incomplete tiny byte triples remain visible as decoding diagnostics,
with the full token stream available; generated tokens are never repaired.

Local browser timing is separate from simulated hardware timing. Every model can
recompute the prefix or reuse KV state, as selected by `ExecutionSpec`. `GenerationWork`
records the actual processed and retained positions and matrix-operation counts.
The 8K model captures tensors; larger models expose logits. Capture overhead and
precision still prevent treating their timings as an isolated size comparison.

The optional KV residency experiment runs from the main page using its selected
8K weights and the same BOS-plus-text encoding and EOS termination. It does not
load `data/model/checkpoint.bin` into the browser. Recorded reference fixtures
remain component-test oracles, not website execution paths.
