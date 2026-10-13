# Execution, evidence storage, and presentation

Owns operation and evidence boundaries.
[Ontology](../ontology/README.md) owns concepts;
[execution operations](../../data-model/execution.yaml) own operation names and
request/response declarations. [Website architecture](website.md) owns placement.

## One browser execution path

The site is static assets. Its generated client validates requests and sends them
to a worker. That worker dispatches to the model's declared numerical runtime. The
inspectable engine runs through Pyodide; larger models run the
pinned upstream C engine compiled to WebAssembly. Generated
declarations validate engine inputs and outputs. The renderer neither computes
model values nor constructs transport messages.

Preparation tokenizes and validates without a forward pass. Execution produces
real numerical observations. Both use the same operation interface; there is no
HTTP compute service or native fallback. Headless integration drives those same
operations in Chromium and compares them with interactive execution.

## Evidence

The main page exports `GenerationEvidence`: original input/workload, selected
model descriptor, and its accepted `GenerationPrediction`. The prediction retains
the consumed raw prefix, model/tokenizer identities, contract identity, output IDs,
logits and available tensor observations. Timing is an observation, not part of numerical
replay equality. The worker executes `generateToken` from the recorded request;
the same release and matching loaded artifacts are required for comparison.
This export does not embed large weights or promise replay across changed runtimes.

The main page retains one accepted prediction in memory. Reset or model/input
changes invalidate it and disable export. There is no evidence-restoration adapter
between two landing-page protocols. The retained checkpoint-preparation operations
and KV lab have their own evidence formats; they do not configure the main page.

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

Each explicit load admits an identified model and its matching tokenizer. Each
`GenerationStep` declares its `GenerationExperiment`, raw prefix, prior outputs
and per-request generation policy. `GenerationInput` binds that experiment to a
`Workload`; unsupported request counts or nonzero arrivals fail explicitly. It returns actual selected IDs, logits and model identities.
The inspectable model also returns executed tensor observations; larger models do
not fabricate equivalent small-model tensors. The current main page retains its latest computation in memory; export is explicit.

Main-page generation uses the shared unmasked greedy selector after each runtime
produces logits. Probability normalization runs in binary64 through that selector;
this does not change the larger model's binary32 matrix computation. The tiny story model stops on
its trained EOS ID; the larger family stops on its trained story separator/BOS or
EOS. Budget and context exhaustion also stop continuation. These differ from the
existing chat lab's TURN_END framing. Every stop ID is declared in the model
catalog. Incomplete tiny byte triples remain visible as decoding diagnostics,
with the full token stream available; generated tokens are never repaired.

Local browser timing is separate from simulated hardware timing. The small engine
recomputes prefixes and captures tensors; the compiled larger engine retains KV
and exposes logits. Their measured speeds are not an isolated size comparison.
