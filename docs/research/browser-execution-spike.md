# Browser execution feasibility spike

Historical snapshot: the native comparison driver and its private Make target were
retired after browser-only product integration. Their source remains in Git at
`11ec96a`. Current execution and checks are described in the
[website architecture](../architecture/website.md). The findings below retain
their original scope.

Date: 2026-10-11. Result: **feasible for the tested reference model and KV simulation**.
This supports the [browser-first architecture](../architecture/website.md); it does
not complete a production worker interface or migrate the website.

## Question and method

Can the same Python model, validation and resource-simulation code execute in a
browser without a compute server, while retaining inspectable numerical evidence?
The [predeclared evaluation](../../governance/evaluations/records/2026-10/browser-execution-spike.yaml)
owns acceptance thresholds and counterexamples. The private workflow in the
[Makefile](../../Makefile) prepares pinned static assets, runs native reference
cases, starts Chromium and compares the actual worker results. Its implementation
is under `scripts/experiments/browser_spike/`.

The browser ran Pyodide 0.27.7 / CPython 3.12.7 in a dedicated Web Worker, compared
with native CPython 3.12.3 on the same Linux workstation. Chrome was
144.0.7559.132 in headless mode. This Pyodide release was chosen to stay within the
existing Python 3.12 line; it is not a claim that it is the latest release.

Both paths used identical repository Python source, trained checkpoint and tokenizer
bytes. The reference model was not rewritten in JavaScript. Contract validation
remained enabled. The browser used the Pyodide distribution's pinned dependencies,
including jsonschema 4.21.1, versus native jsonschema 4.26.0; this is tested
compatibility, not identical dependency environments. The asset inventory records
all downloaded package versions and hashes. A production release must qualify its
chosen pinned environment.

The necessary runtime change was explicit packaged provenance: a release without
Git reads its supplied revision label, while still hashing the actual source files.
Missing or empty labels fail. Backend provenance now identifies `linux` or
`emscripten`, so browser evidence is not presented as native-host execution.

## Results

Nine cases covered the shipped default workload, an exact-prefix token step, five
KV scenarios and two invalid inputs. Model tensors and metadata were compared;
selected token IDs and stopping agreed. Cache event dependencies were compared by
event position and state aliases, retaining original runtime-bound identities in
the complete records. Physical timings were kept separate from virtual time.

| Check | Observed result |
| --- | --- |
| Numerical comparison | Largest absolute difference 3.55e-15 across 260,041 compared numeric fields; within the predeclared 1e-10 absolute + 1e-10 relative bound |
| Default output | `ann has the cup.` followed by TURN_END; same nine selected IDs |
| Virtual schedules | All compared event fields agreed within the declared timing tolerance |
| Export/reconstruction | Canonical record preserved exactly within the browser runtime |
| Replay | Workload, step and successful KV cases replayed inside the worker |
| Invalid inputs | Insufficient capacity and malformed workload rejected |
| Network | Browser capture: 32 static GETs, including worker requests; none during execution with the static server disabled |
| Cancellation/restart | Terminated pending work; a fresh worker reproduced the same step record |
| Missing asset | Worker startup failed explicitly |

The resource interventions changed actual simulated behavior:

| Scenario | Completion, virtual microseconds | Consequence |
| --- | ---: | --- |
| Baseline KV | 334.144 | Retained prefix reused locally |
| Compute rate reduced to 1 FLOP/us | 73,793.536 | Longer compute service |
| Memory rate reduced to 1 byte/us | 334,144 | Longer memory service |
| Device KV capacity reduced to 1,024 bytes | 371.040 | Local reuse became a host-tier transfer |
| Same capacity, transfer reduced to 1 byte/us | 1,891.680 | Transfer added further delay |

These are predictions of the existing abstraction, not measurements of accelerator
performance. The tested memory budget applies to logical KV payload, not model
weights, workspace or total process memory. It does not yet establish the proposed
MoE expert-residency simulation.

## Execution costs on this workstation

| Measurement | Observed |
| --- | ---: |
| Static asset inventory, without HTTP compression | 14,346,484 bytes, about 13.7 MiB |
| Fresh-profile worker initialization over loopback | 1.73 s |
| Repeat worker initialization | 1.55 s |
| Default nine-selection execution | 2.76 s |
| Default artifact round trip / replay | 1.72 s / 5.64 s |
| One token-step execution | 0.15 s |
| Each successful KV scenario execution | 0.55–0.58 s |
| Largest observed WebAssembly linear memory | 59.9 MiB |
| Largest main-page heartbeat gap during cases | 10.5 ms |

The roughly ten-second full workload check includes execution, evidence
serialization/reconstruction, validation and replay. It is not ten seconds of
inference alone. Linear memory excludes JavaScript objects and other browser
process memory. Loopback initialization does not predict public-network download
time; no mobile-device or cross-browser performance claim follows.

## Asset-size follow-up

The 13.7 MiB figure is the static file inventory, not compressed network traffic.
Compressing each inventoried file with Node's default gzip yields 6,317,051 bytes
(6.0 MiB), versus 14,346,484 raw bytes. This is a local compression measurement,
not a deployed CDN result; the spike server does not serve those compressed bytes.
It is the size of this pinned Python distribution, not an unavoidable WASM minimum.

| Asset | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Python/WASM runtime | 10,105,545 | 3,243,286 |
| Python standard library ZIP | 2,360,737 | 2,323,383 |
| Runtime JavaScript | 1,255,688 | 237,121 |
| Engine, checkpoint and tokenizer ZIP | 151,776 | 149,572 |

The runtime dominates. Pruning the engine archive cannot materially fix first-load
cost. Reuse the pinned runtime and validation dependencies before considering a
custom Python distribution. Release delivery should support compressed assets and
versioned caching, with decoded bytes retaining their existing integrity identity.

The [website architecture](../architecture/website.md#loading-and-asset-delivery)
owns the proposed loading experience and delivery policy.

## Limits and next decision

The spike demonstrates that the browser can execute this slice without a remote
compute API. It does not validate arbitrary topology, MoE, CUDA, large sweeps or
production performance predictions. It does not exercise the existing product UI
through a browser execution adapter. The worker's case-index messaging is research
instrumentation, not an admitted production protocol.

The next implementation step is a declared browser execution transport over the
existing domain requests, receipts and artifact interfaces, with lifecycle and
storage semantics governed before UI integration. Keep the native execution path
for headless checks and physical labs. No result here provides a reason to deploy
Lambda for the reference website.

Full native/browser records, asset inventory, CDP network observations, timings
and comparison results are regenerable under `out/experiments/browser-spike/`.
Initial comparison-driver mistakes (record nesting and nullable cache-build
selection) were corrected against the existing schemas; no numerical algorithm,
acceptance tolerance or failure threshold was changed.
