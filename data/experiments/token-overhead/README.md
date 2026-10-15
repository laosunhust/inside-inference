# Token delivery overhead investigation

These records diagnose the implementation at commit `6b8e1da`; they are not a model benchmark or a prediction for another device. Both models use the prompt “Once upon a time, there was a little dog.” and a 32-token budget. The retained browser user-agent identifies the runtime. Each reported median excludes the first token (prefill), leaving 31 cached decode deliveries.

| Interactive median, ms | 0.5M | 4M |
| --- | ---: | ---: |
| Decoder | 2.2 | 7.7 |
| Service, including decoder | 4.1 | 9.5 |
| Operation input validation | 3.7 | 3.6 |
| Execution control validation/projection | 3.1 | 3.1 |
| Response JSON serialization | 5.5 | 5.5 |
| Python entry point, including the above | 16.7 | 22.1 |
| Inter-token interval | 19.6 | 24.9 |
| Synchronous observer update | 3.2 | 3.5 |

Both cached runs compute one position after prefill. Median responses contain about 172,000 UTF-8 bytes, including 4,096 logits and 4,096 probabilities. Input validation plus serialization takes approximately 12 ms per token, outside the old service timer. This is measured overhead large enough to obscure the small decoder's work. Observer updates overlap worker execution; they must not be added to worker durations or called the entire remaining interval. Medians of components also need not sum to the median total.

[Operation-only samples](baseline-operations.json) use the same browser worker without the Interaction render loop. [Interactive samples](baseline-interactive.json) include the exported input, model identity, token ledger and final output (the final prediction vocabulary arrays are omitted because timing attribution does not use them) and one diagnostic profile per token. Wrappers around `validate_operation_input`, `resolve_execution`, `decode_json` and `canonical` measured `perf_counter` durations; a wrapper around `execute_json` recorded total entry duration and response byte count. A disposable copy of the generated worker returned the small profile alongside the original response, and its client retained it. Production source was not modified for these baseline probes. The wrappers and debug metadata add overhead, and this was one sequential run per model, not a randomized timing study.

[Recomputation diagnostic](recomputation-diagnostic.json) preserves the initial interactive run whose default KV setting was off. Its work counters exposed the mismatch; it was excluded from the cached comparison, not relabeled or overwritten. Worker debugging attachment attempts produced no measurements and were replaced by the disposable diagnostic probes.

The owner's measurements on a different machine were approximately 45/56 ms inter-token and 3.2/12.3 ms decoder. These local results explain a mechanism, not an exact allocation of that machine's missing time.

The production instrumentation added after this diagnosis retains Python validation, control resolution, serialization and response size alongside worker and browser durations in each token's ledger. Its contract is owned by `PythonExecutionTiming`, `BrowserExecutionTiming` and `BrowserTokenTiming`. The Interaction **Delivery breakdown** and Download evidence consume that same ledger. The full shared-path verification workflow is [`make test-integration`](../../../Makefile).

Next optimization candidates are duplicate execution-control admission and eager full-vocabulary response serialization. Input rejection and inspectable numerical evidence must survive either change. No optimization or speedup is claimed by this investigation.

## Production-instrumented confirmation

[Instrumented interactive samples](instrumented-interactive.json) use the unmodified built release after the timing changes, without diagnostic monkey-patching. Both models reproduce their baseline 32-token outputs exactly, and all post-prefill steps compute one position.

| Median, ms (tokens 2–32) | 0.5M | 4M |
| --- | ---: | ---: |
| Decoder | 2.2 | 7.7 |
| Operation input admission | 3.6 | 3.4 |
| Control validation/projection | 3.1 | 2.9 |
| JSON encoding | 5.6 | 5.5 |
| Python bridge, inclusive | 17.4 | 22.4 |
| Browser round trip, inclusive | 18.5 | 23.6 |
| Response JSON parsing | 0.4 | 0.3 |
| Parsed return to output DOM publication | 0.1 | 0.1 |
| Inter-token interval | 19.1 | 24.3 |

Median worker wait and browser request validation rounded to zero at this browser's timer resolution; that is not a claim of zero work. The close baseline and instrumented results are descriptive, not a controlled estimate of instrumentation overhead. Worker execution and page observers can overlap. The measured leading costs are Python admission and response serialization, not browser JSON parsing or output publication.
