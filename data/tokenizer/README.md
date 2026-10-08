# Vocabulary candidate v2

`vocabulary.json` is the complete, ordered 384-ID candidate manifest consumed by
the codec. IDs, kinds, pieces, and curation groups are explicit. The hash is
recorded by every encoding and pinned in the tokenizer tests. The total size is
frozen by project purpose; this lexical selection is a reviewable second candidate,
not a claim of sufficient conversational coverage.

The first 259 word entries are the distinct written words in the earlier
[authored budgeting dialogues](../../research/vocabulary/dialogues.json), ordered
alphabetically. Those dialogues were used in selection, not held out. A further
93 entries were manually selected by conversational function: grammar and repair,
people and ownership, places and objects, actions and feelings, and world/time.
Selection is visible in each entry's `group`; runtime never learns or expands it.
The actual allocation is in the manifest, not duplicated in another word list.

The [v2 revision record](revision-v2.json) identifies eight explicit exchanges,
their IDs, and both file hashes. `shelf`, `window`, `basket`, `truck`, `four`,
`five`, `evening`, and `fish` were exchanged for `fell`, `coats`, `fill`, `done`,
`white`, `out`, `draw`, and `listen`. The first pass preserved those optional
topic/counting words but missed common actions and forms. This repair favors
the observed everyday exchanges while narrowing other topics; the removed words
now use fallback. This is not a universal ranking of child-language vocabulary.
The original [v1 manifest](history/v1.json) remains an executable historical
fixture. Tests verify the exact exchanges and reproduce its coverage failures.

The first [coverage probes](../corpus/dialogues.json) were authored after v1
was selected. They exposed missing ordinary words and informed v2. Their 24/24
coverage under v2 is an in-sample fit, not held-out success. Additional
[v2 probes](../corpus/probes-v2.json) include familiar recombinations and deliberate
topic extensions; some still require fallback. Do not silently
replace the probe wording, retrofit the manifest, or label that later fit as
held-out success. A revision should record which words were exchanged and why,
preserve the measured v1 result in the checkpoint note, and use a new hash.
There is no trained checkpoint whose IDs need migration yet. Mechanism comparisons
must use the same manifest identity, including when a prompt happens to encode to
the same IDs under both manifests.

This is an agent-authored lexical selection, not a child-language corpus or a
developmentally validated list. Known entries cover inflected forms separately.
Unknown spelling, case, and scripts remain exactly encodable through the
[codec contract](../../docs/implementation/tokenizer.md), at an explicit sequence
cost. New words cannot be inferred from the ID budget alone.
