# Prepared token delivery: 0.5 ms target evaluation

**The implementation passes correctness checks; the 0.5 ms overhead criterion fails.** Being local does not remove worker scheduling, Python/JavaScript conversion, dynamic token admission or observer costs.

The [protocol](protocol.json) fixes one warm-up plus three measured interactive runs per model, using the retained input and 32-token output budget. Incremental KV reuse is enabled. Prefill is excluded from latency summaries; every later step computes one position. All output IDs and text equal the previous implementation's retained output. Normal page observers remain active.

| Model | Median interval by run, ms | Median residual by run, ms | Pooled median residual | Pooled p90 residual |
| --- | --- | --- | ---: | ---: |
| 0.5M | 4.2, 3.7, 4.0 | 2.0, 1.6, 1.6 | 1.7 ms | 6.4 ms |
| 4M | 9.4, 9.8, 9.3 | 1.6, 1.7, 1.6 | 1.6 ms | 8.8 ms |

Residual means current publication minus previous publication minus the current token's independently measured decoder duration. It is not an isolated stage measurement, cannot allocate scheduling delay by itself, and is not a per-token upper bound. The earlier JSON implementation observed 19.1/24.3 ms median intervals on this machine; those were single-run descriptive baselines with a different viewport, not a randomized speedup study. The current environment and exact per-run numbers are retained in [summary.json](summary.json); raw ledgers, inputs and final outputs are in [observations/](observations/). [qualification.json](qualification.json) identifies the built site and verifies the shared static-browser path; its `passed` field does not assert the latency criterion passed.

Changes:

- Preparation owns admission and retains private copies of the execution configuration and generation policy. Token requests carry only a session reference and dynamic token IDs. New preparation/model loading invalidates old sessions. Compact dynamic input checks, vocabulary/context checks and stopping checks remain.
- The worker retains the Python entry callable rather than evaluating a Python source string per operation. Normal operations use structured input/output. Vocabulary arrays cross as transferred typed buffers; the client materializes declared arrays for inspection. Raw JSON is produced only when explicitly requested at the operation boundary or by evidence export.
- Greedy selection and probability calculation share one NumPy implementation. This removes per-vocabulary Python loops while retaining finite-logit rejection and smallest-ID ties. Binary64 softmax rounding can differ in the last bits; existing numerical tolerances and exact selected-token checks pass.
- Timing contracts now name input admission, operation execution, worker wait/bridge, buffer conversion, numeric buffer bytes and browser round trip. No JSON-time label is repurposed for another stage. The same per-token ledger drives the UI and export.

[Pyodide documents](https://pyodide.org/en/stable/usage/type-conversions.html#buffers) that `toJs()` copies NumPy buffers into typed arrays. Those independent buffers are transferred; the WASM heap is never transferred. Converted `None` values preserve declared nulls, and Python proxies are released after delivery.

A representative measured run shows approximately 0.4 ms compact Python admission and 0.1 ms worker buffer conversion. The remaining round-trip cost includes callable/worker scheduling, structured delivery and client materialization. Observer updates took roughly 4–6 ms in these runs and overlap worker execution; they cannot simply be added to every token's residual. Eager observer work (including hidden evidence/table rebuilding) and compact-token admission are concrete remaining optimization candidates. No generic local-IPC lower bound is claimed.

The full harness passed 124 unit tests and 21 integration tests plus browser checks, including cached/recomputed logits, speculative output, stale sessions, malformed inputs, exported observations, model switching and branching. Desktop/narrow Delivery breakdown layouts were reviewed. Reproduce through [`make _token-overhead`](../../../Makefile); this reuses the integration browser setup and ordinary product operations. There is no fast benchmark-only engine.
