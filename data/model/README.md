# Shipped model

`checkpoint.bin` is the retained preparation and KV-reference checkpoint: gzip-compressed JSON
using the existing `ModelArtifact` declaration, with unchanged binary64 weights.
Compression preserves every value while keeping this durable fixture below its
size limit. The runtime's shared loader is `inside_inference.model.default_checkpoint`;
missing or corrupt weights fail rather than falling back to initialization.

This is the multiword run's selected step 1800: one block, one head, width 8,
384 IDs, context 128. See the [evaluation](../../docs/research/multiword-checkpoint-2026-10-10.md)
for sources, training configuration, numerical verification and limits. Development
readability was 60/60 and accepted-answer accuracy 45/60; location was only 5/15.
These synthetic results do not establish general language understanding.

The KV lab loads these weights by default. The main page uses the separate
[model inventory](../models/README.md), initially selecting its 4M artifact. Explicit checkpoint
injection remains available for numerical experiments and tests; random initialization
is only an explicit preparation/test operation. Original training recipes and
historical evaluations remain available; superseded saved weights are retired.

This reference workload uses an allowance of 11 selections:

> ann has the cup. ben has the book. who has the cup?

The expected output is `ann has the cup.` with real SPACE IDs, nine selections
including TURN_END. No output repair or decoding filter is applied.

Cutover verification: `make test` passed 92 tests (7.32 seconds total);
`make test-integration` passed, including 25 integration tests and browser/headless
parity (86.48 seconds total). At that historical checkpoint, the restarted server's embedded model and
live response matched this checkpoint; the example above produced the expected
nine IDs. Eighteen superseded checkpoint/optimizer files and the temporary preview
site were removed. Historical reports remain; reproducing old training runs requires
regenerating their weights from the retained recipes.

The model-family spike migrated this artifact to `naive-gpt-checkpoint-v2`: block
tensors now have a leading layer axis, with unchanged numerical values and training
provenance. This is a representation migration, not a newly trained default.
[Migration evidence](../preparation/model-family/migration.json) records exact equality
of 1,035,648 development logits with the pre-migration engine and artifact.
Newly trained family members remain separate until reviewed.
