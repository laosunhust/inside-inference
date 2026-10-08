# Numerical implementation

These documents own the small instrument's concrete behavior. They do not define
the whole observatory or establish production representativeness.

| Topic | Contract |
| --- | --- |
| Exact input encoding, framing, byte fallback, and trace decisions | [Tokenizer](tokenizer.md) |
| Decoder block, full-prefix recomputation, numerical precision, selection | [Naïve inference](naive-inference.md) |
| Obtaining compatible weights as supporting infrastructure | [Model preparation](model-preparation.md) |

Read [architecture](../architecture/README.md) for workload and presentation boundaries,
and [milestones](../purpose/milestones.md) for implementation order and acceptance.
