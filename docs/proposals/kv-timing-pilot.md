# Bounded KV timing pilot

Status: deferred pending a preregistered pilot evaluation. Composition repair and
single-run measurement are implemented separately; this proposal adds no UI.

Before running a pilot, record exact model/context/output workloads, repetitions,
a wall-time cap and a minimum resolvable difference with a variability criterion
in its evaluation record. A proposed cap is three minutes per context length;
this is not an approved execution budget. Use the shared browser worker and
existing model capture capability. Do not substitute native Python timing for
browser timing or add a capture toggle.

Compare decoder, service and browser observations with the executed work counters.
Retain raw observations and failures. The [catalog](../../data/experiments/catalog.yaml)
owns any supported experiment question/regime/limits; [lab methodology](../labs/methodology.md)
owns the general evidence rules. This is not the resource-residency simulation.

If timing cannot resolve the mechanism, report that work counters explain it and
stop. Only a justified pilot may lead to a separately declared repeated comparison
through the same worker/declarations under scripts/experiments and the Makefile.
Repetition scheduling stays headless. A comparison viewer is a separate decision.

Open decision: exact workload, resolution criterion and pilot budget. No speedup
is required. Delete this proposal after its decision and evidence have durable owners.
