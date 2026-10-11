# Execution, evidence storage, and presentation

Owns operation and evidence boundaries.
[Ontology](../ontology/README.md) owns concepts;
[execution operations](../../data-model/execution.yaml) own operation names and
request/response declarations. [Website architecture](website.md) owns placement.

## One browser execution path

The site is static assets. Its generated client validates requests and sends them
to a worker. That worker runs the existing Python engine through Pyodide. Generated
declarations validate engine inputs and outputs. The renderer neither computes
model values nor constructs transport messages.

Preparation tokenizes and validates without a forward pass. Execution produces
real numerical observations. Both use the same operation interface; there is no
HTTP compute service or native fallback. Headless integration drives those same
operations in Chromium and compares them with interactive execution.

## Evidence

The worker retains immutable, content-addressed JSON objects in memory. A receipt
identifies an execution archive; artifacts hold shared checkpoints and tensor rows.
Deduplicating identical rows does not imply model-level reuse. The naive model
still recomputes its prefix.

The UI reconstructs observations and verifies artifact identity. Missing or corrupt
evidence fails explicitly; it never triggers replacement inference. Inspection
currently restores a complete record, not individual tensors on demand.

Exports preserve original JSON numeric lexemes. Replay accepts the exported JSON
as text, avoiding an intermediate JavaScript numeric serialization. The browser
worker re-executes it using the recorded sources, weights and runtime. Browser
reload discards the in-memory store; export is the persistence mechanism.
The unused file and remote storage backends are removed.

## Native boundary

Native Python is build, preparation and component-test tooling, not an alternative
website runtime. Native computation, CUDA, and an HTTP compute service are not
needed to study KV reuse, eviction, resource contention or simulated transfers.

A future native path requires a named investigation and evidence that the browser
cannot support it, such as measuring an actual device. Existing code, potential
speedups, or a hypothetical future consumer do not justify that path.
