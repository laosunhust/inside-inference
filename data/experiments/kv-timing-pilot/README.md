# Browser KV timing pilot

The pilot resolved a KV-reuse latency reduction at all three declared contexts in the sealed browser-worker implementation. This is a local measurement of the 4M model, not a GPU or production-serving result.

The [protocol](protocol.yaml) was frozen before execution. Each context used two warm-up pairs and six measured pairs, alternating execution order. Each trial reset the request prefix, kept the model/runtime loaded, and generated eight tokens naturally. The prompt was an explicitly declared slice of prepared token IDs, including BOS.

Values below are the median of six trial means over decode steps 2–8, in milliseconds. Prefill is excluded. “Off” recomputes the prefix; “on” reuses its K/V. Browser intervals cover output-only publication in the headless harness, without the interactive inspector.

| Initial positions | Decoder off → on | Service off → on | Browser interval off → on |
| --- | ---: | ---: | ---: |
| 8 | 213.3 → 19.8 | 215.2 → 21.7 | 229.2 → 35.5 |
| 32 | 661.7 → 19.7 | 663.5 → 21.5 | 677.8 → 35.4 |
| 96 | 1790.4 → 20.0 | 1792.4 → 21.8 | 1807.2 → 36.4 |

All 48 trials completed with eight tokens. Every pair passed work checks, selected-token agreement and numerical comparison; the maximum absolute difference between retained logits was zero. Each cold first step reused zero positions. Cached decode processed one new position; recomputation processed the full growing sequence.

Each of the nine context/metric results met the preregistered descriptive rule: all six measured pairs, at least five same-sign differences, median absolute paired difference at least 0.2 ms and 10% of the off baseline, and greater than three times the median absolute deviation of paired differences. All six pairs agreed in every case. This rule is not a confidence interval, p-value or claim of population significance.

Context runs took 18.75, 50.92 and 132.95 seconds, respectively, including warm-ups and retention overhead; each stayed below its 180-second cap. The fixed service/transport costs did not hide the measured decoder difference in this setup. That observation does not generalize to other models, implementations or context ranges.

## Evidence and applicability

- [Summary and paired observations](summary.json) contain every derived value, including warm-up comparisons.
- [Raw trials and logits](observations/) retain per-step ledgers and binary32 logits with hashes; no run was discarded or replaced.
- [Manifest](manifest.json), [browser/model identity](environment.json), and [observed wall times](wall-times.json) identify the execution and sealed release.
- The root [Makefile](../../../Makefile) owns the one-shot pilot and retained-evidence analysis workflows. The runner refuses to overwrite retained observations.

Only one model, Chrome version and host execution were sampled. Contexts ran in fixed ascending order, and prefixes are synthetic token slices. Balanced pair order limits one source of bias but does not establish environmental isolation. Browser measurements omit the full inspector and physical paint. The pilot warrants considering further work under a separately reviewed workload and budget; it does not automatically start Phase 2.

The executed launcher source is retained in [execution-source/run.py](execution-source/run.py) with its original manifest hash. Subsequent layout checks required moving the browser/serving adapter to scripts/check/pilots; experiment logic and analysis remain under scripts/experiments. No measurement was rerun or altered for that relocation.
