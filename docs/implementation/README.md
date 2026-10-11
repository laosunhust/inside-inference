# Numerical implementation

These documents explain numerical mechanisms and model preparation within the
[purpose](../purpose/README.md). They own implementation detail, not project mission,
shared domain meanings, or interface declarations. [Ontology](../ontology/README.md)
and [data models](../../data-model/README.md) remain authoritative for those meanings
and shapes. Describing a working implementation does not establish its production
representativeness.

| Topic | Implementation or evidence |
| --- | --- |
| Exact input encoding, framing, byte fallback, and trace decisions | [Tokenizer](tokenizer.md) |
| Decoder block, full-prefix recomputation, numerical precision, selection | [Naïve inference](naive-inference.md) |
| Cached continuation, exact prefix reuse, residency and resource evidence | [KV residency lab](../labs/kv-residency.md) |
| Obtaining compatible weights as supporting infrastructure | [Model preparation](model-preparation.md) |

Read [architecture](../architecture/README.md) for workload and presentation boundaries,
and [milestones](milestones.md) for implementation order and acceptance.
