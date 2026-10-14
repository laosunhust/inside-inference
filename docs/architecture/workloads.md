# Workloads and execution evidence

Owns the input/output boundary. [Ontology](../ontology/README.md) owns meanings;
[data models](../../data-model/declarations.yaml) own shapes and
[operations](../../data-model/execution.yaml) own the browser interface.

`GenerationInput` joins an `ExecutionSpec` with a `Workload`. The former composes
ontology-bound interventions; the latter supplies chronological, identified
requests with text, arrival times and per-request generation settings.
Configuration does not imply that an execution supports every possible workload.

Ordinary token generation admits one request arriving at zero. Preparation
encodes its input without a forward pass. A `GenerationStep` carries the selected
prefix, prior output IDs and configuration; `GenerationPrediction` records the
actual computation, selected ID and output. A terminal ID is selected but not
rendered as customer text. Byte decoding diagnostics remain explicit; there is no
output repair. [Delivery](delivery.md) owns artifact loading and export.

The optional cache, scheduling, transfer and compute-service interventions runs the same main-page workload through
bounded resource simulation. It currently requires the selected 8K artifact and
KV reuse. Larger-model state formats and uncached resource scheduling are not
implemented; unsupported combinations fail rather than substitute a model.
There is no separate cache-page configuration or hidden checkpoint.

`ResourceExecution` retains the submitted input, the `CacheRun` and decoded
outputs. The run binds the actual model, tokenizer, resource configuration and
workload. It records causal cache events in virtual microseconds, actual forward
computations, KV snapshots, completion outcomes and separate local measurements.
The simulation starts with an empty cache. Its scheduling, transfer and memory
assumptions belong to the [KV residency experiment](../../data/experiments/catalog.yaml).
Host time, virtual time and animation time must not be substituted for one another.

Request IDs must be unique; arrival times must be nondecreasing. Event causes
refer to earlier events, not merely adjacent records. Client receipt and network
acknowledgments are not implemented. Dependent agent arrivals and speculative
proposal/verification/rollback require new declarations and evaluations before
execution; neither is inferred from a fixed-arrival workload.

Domain interfaces use JSON Schema with generated Python models and browser
validators. Shape validation does not prove numerical fidelity or causality;
component and browser tests check those separately. Kubernetes is not required
to simulate scheduling.
