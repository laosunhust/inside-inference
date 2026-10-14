# KV reuse with explicit capacity and physical residency

The [KV residency experiment](../../data/experiments/catalog.yaml) connects actual tiny-model
computation to bounded cache retention, admission, and transfers. It answers one
question: what changes when an exact prefix is local, offloaded, or absent?
This is a completed checkpoint within the authorized two-hour window, not a
calibrated accelerator simulator. No architecture or training changes were needed.

## Numerical and system evidence

Configuration: 384 IDs, one block/head, width 8, FFN width 16, context 128,
binary64, 8,168 parameters. Both seeded weights and the
[trained pilot](checkpoint-pilot-2026-10-09.md) were exercised. Each work item checks
every returned logit against full-prefix scalar computation, with predeclared
absolute tolerance 1e-10 and relative tolerance 1e-9. Greedy token IDs must also
agree. The four trained CUDA integration scenarios had maximum absolute logit
error **3.997e-15**, rounded upward.

| Intervention | Observed consequence |
| --- | --- |
| Repeat the same prompt with sufficient device capacity | First request misses; second reuses the retained prefix and skips its computation. |
| Constrain device KV capacity to 1,024 bytes; retain host capacity | `the ball`, `the cup`, `the ball` causes two misses then a host hit with explicit retrieval. |
| Set host KV capacity to zero in that scenario | Evicted state is discarded; the third request misses and recomputes it. |
| Admit two requests with room for only one reservation | The second waits for capacity release. With sufficient capacity, both are active and alternate work items. |
| Change declared service rates | Virtual completion times change while numerical outputs remain unchanged. |

For `the ball` with two selections, full-prefix recomputation requires **111,136
dense-matmul FLOPs**. Cached execution performs **58,976** on a cold request and
**14,816** on a warm one. This excludes scalar operations, inspection, and the
independent reference checks. Six retained positions occupy **768 logical bytes**;
the maximum active reservation is **1,024 bytes**. These counts are arithmetic
under the lab contract, not measured memory traffic or a speedup claim.

M2's fixed-model numerical acceptance passes: chunked and single-token continuations,
actual K/V comparison, absolute positions and masks, explicit reset, detached state,
identity/shape/nonfinite rejection, and the context boundary. CUDA checks compare
K/V against the scalar reference and verify retention and pinned-host round trips.
Missing VRAM state cannot be consumed through its CPU inspection snapshot.

## Measured local differences

The separate physical probe used seeded weights on the NVIDIA RTX 3080 Ti, with
PyTorch 2.14.1+cu130 / CUDA 13.0 and driver 595.84. Active K/V lived in VRAM;
offloaded K/V lived in pinned DRAM. Both K and V were copied and synchronized,
with destination allocation excluded. Each direction had two warmups and five
recorded samples. Round trips preserved all payload values bit for bit.

Observed at **2026-10-09 14:42:56 UTC**:

| Positions | Payload | Median VRAM → pinned DRAM | Median pinned DRAM → VRAM |
| --- | --- | --- | --- |
| 4 | 512 bytes | 18.184 μs | 17.213 μs |
| 32 | 4,096 bytes | 18.585 μs | 17.824 μs |
| 120 | 15,360 bytes | 18.545 μs | 18.555 μs |

The weak size dependence is consistent with dispatch/synchronization overhead
dominating these tiny copies. It does not measure bulk bandwidth or justify
mapping this GPU to another accelerator. Virtual service rates were not fitted
to these timings. Computation samples in the interactive lab also include tensor
capture and readback; independent reference-check time is reported separately.

The probe peaked at **965,648,384 bytes process RSS**, **9,677,824 bytes CUDA
allocation**, and **23,068,672 bytes CUDA reservation**. GPU inventory showed
759 MiB total device use, including other processes/runtime overhead. Process
swap was zero before and after the probe; these samples do not establish a
continuous system-wide swap bound. No inference KV file path exists. Checkpoints,
environments, and saved evidence still use disk.

## Verification and reproduction

- `make test-integration`: 80 light checks, seven HTTP checks, five baseline
  browser cases, and four cache cases passed using the default reference setup.
- The same full harness with the isolated CUDA Python and the trained checkpoint
  passed eight cache cases (four per backend), alongside the baseline cases.
- `make _test-cache-cuda`: two hardware checks passed, including actual residency,
  payload equality, retention, cached logits, and replay.
- `make _test-preparation`: eight existing preparation checks passed after sharing
  the tensor equations with the inference backend. No new training was performed.

Cache cases compare direct execution, CLI, HTTP, browser-native export, and replay.
Only local wall-clock samples may differ. Browser checks inspect actual attention
values, cache state, invalid-input behavior, and offline/mobile presentation.
An independent hand calculation checks the cold/warm virtual schedule at
**334.144 μs** under its declared rates, including retention-copy service.

The Makefile owns setup and execution. On this machine:

```sh
make serve-intro PYTHON=out/experiments/kv-cuda-venv/bin/python CHECKPOINT=out/experiments/model-preparation/final/checkpoint.json
```

Open `http://127.0.0.1:8000/kv-cache.html`. The ordinary `make serve-intro` uses
the reference environment; the offline build allows inspection of a recorded run.

Local disposable evidence lives in `out/experiments/integration/`,
`out/experiments/checkpoint-integration/`, and `out/experiments/kv-cache/hardware.json`.
The integration directories contain accepted specifications, raw runs, exported
browser runs, screenshots, and pass/fail summaries. Source identity for the final
cache evidence is
`66903035705f58f53d607a6e62bf4f2b28f8a778b5bc0313f76f616558ea28b3`.
Raw physical samples and probe identity are in the hardware report.

## Remaining boundaries

The lab has whole-prefix reuse and serialized compute/transfer service, with
concurrent request lifetimes. It does not implement partial-prefix lookup,
continuous batching, overlapped kernels/transfers, TP/PP, MoE, distributed failure
handling, or G1's lossless layout conversion between explicit endpoints. Its KV
budgets exclude weights, workspace, allocator overhead, and inspection copies.
The E1 interaction-latency and full-workload memory gates were not evaluated here.

Candidate filtering on other hardware remains an unvalidated hypothesis. A next
experiment should preserve this numerical oracle while adding one declared
boundary or resource effect. Kubernetes deployment integration can remain an
adapter to the domain contracts; it is unnecessary for the current admission and
cache-policy experiment.
