# Corpus recipe and coverage probes

Status: initial, untrained dataset checkpoint. This directory owns maintained
corpus inputs and their provenance. Generated JSONL and reports are rebuildable
with `make dataset-audit`; they live under `out/experiments/tokenizer-dataset/`.
No external story dataset, model output, or pretrained weights were imported.
These authored fixtures and generator are part of this repository under its
[license](../../LICENSE).

## What question can this corpus answer?

After training, can the bounded GPT use stated relationships and later updates
to select the answer, rather than produce plausible-looking text? Correct answers
are deliberately simple. The task supports inspection of input-dependent behavior;
it is not a benchmark of general reasoning, childhood language, or model quality
at scale. Before training, it only tests data construction and tokenization.

`recipe.json` owns entity inventories, split sizes, surface variants, deterministic
selection seed, and the context budget used for the audit. The
[generator](../../observable_gpt/corpus.py) defines four task families:

- Location: retrieve the explicitly stated place of an object, with a distractor.
- Ownership: retrieve the stated owner, with a distractor object and owner.
- Negation: distinguish one desired object from an explicitly rejected object.
- Correction: retrieve the latest stated location despite an earlier location and
  another object's location. One rendering places the distractor after the update.

Locations are mutually exclusive symbolic labels for this task, not a physical
containment hierarchy. `in the house` does not imply another recorded room. The
last explicit assignment wins; there are no implicit movements, beliefs, or
unstated facts. Objects, people, and places are finite inventories. Each example
has two user turns, an `okay.` acknowledgment, and a short assistant answer.
The acknowledgment is authored corpus content, never a substituted model reply.

## Splits, scoring, and leakage limits

The generator enumerates symbolic scenarios, derives their answers from explicit
events, ranks them by SHA-256 of seed plus canonical scenario, then allocates
groups per answer label to train, development, and test. Surface variants of the
same scenario stay in one split. IDs are derived from scenario identity and variant;
the full group hash is retained. Output file hashes identify exact generated data.

The current recipe yields 400 training, 60 development, and 100 test examples.
The test set has 25 cases in each family, balanced over five answer labels.
Both renderings appear in training and are alternated by scenario/label in the
development and test sets; test renderings are **not** held-out templates.
An initial draft used only one test rendering; this was changed before training
because answer position was predictable. Some entities, individual relations, and answer strings recur across
splits. The split tests new complete combinations within these templates; it
does not establish transfer to new words, linguistic forms, or task families.

Audits reject duplicate prompts and groups crossing splits. Tests independently
extract facts from rendered text and compare answers, rather than trusting only
the generator's event labels. `contrast-pairs.json` supplies hand-authored probes
where contexts contain the same bag of words but the required answer changes.
Those probes are not a separate held-out benchmark; they may overlap task relations.

Accepted responses are enumerated per example before any training, including the
bare answer and specific natural short forms. The scorer ignores only surrounding
ASCII whitespace. It does not accept substring matches, extra alternatives, or
answers containing both a correct and an incorrect location. Full model evaluation
and constrained generation are not implemented. A context-blind majority baseline
uses only training label frequencies (alphabetical tie break) and scores 20/100
on this balanced test set. This is not a measured model score. The shuffled-context
model baseline required by L1 remains to be implemented before model evaluation.
The audit also compares first/last-mentioned answer guesses, choosing the policy
per family using development cases only. These ignore relationships and negation.
Their test scores diagnose position shortcuts; passing that check does not rule
out more complicated template shortcuts.

## Coverage probes are separate

`dialogues.json` contains 24 new everyday dialogues authored by the coding agent
after the vocabulary candidate was selected. These probe ordinary words,
contractions, polite requests, and clarification. They are not independent human
review or sampled conversations. They are excluded from all training/dev/test
exports, so auditing them does not silently expand the training task.

V1 covered 17/24 complete dialogues and 39/48 utterances without fallback. V2
exchanged eight lexical entries using those observations and now covers 24/24.
The report reproduces the original result with the archived manifest and labels
the current result as an in-sample repair. `probes-v2.json` contains 12 further
familiar recombinations and four deliberate topic extensions, authored with the
vocabulary visible. The four extensions require `knee`, `lonely`, `heavy`, and
`wipe`, which remain unlisted. These are controlled probes, not independent
samples from real conversations or a justification for claiming broad coverage.

## Separate language-exposure seed

`language-seed.json` adds 54 short, agent-authored dialogues. A separate exporter
combines these with the original vocabulary-budget dialogues, preserving source
paths, record IDs, source hashes, and original audit partitions as provenance.
The original `design`/`probe` labels are **not model-training/evaluation splits**:
both partitions influenced vocabulary work. Of the 48 source dialogues, 47 are
exported as training candidates. One has a confirmed semantic overlap with a
held-out task and is explicitly excluded. The source research fixture remains
unchanged.

`language-seed.jsonl` is separate from `train.jsonl`, `development.jsonl`, and
`test.jsonl`. There is no automatic mixture or training run. It contains 101
dialogues, with all 352 lexical entries observed and 168 observed only once.
This supplies initial language exposure, not adequate evidence for learning all
words or conversing. Repeating a single example is not equivalent to diverse
examples. The first coverage probes and v2 probes remain excluded from exports.

The exporter rejects unknown words in this declared direct-lexicon seed and exact
prompt matches against development/test task examples. It reports source counts,
token counts, word frequencies, and conflicting responses to identical prompts.
Manual review caught `memory-1` from the old budgeting fixture: its bear-in-box,
ball-on-bed question repeats an entire held-out scenario with different wording
and turn structure. [language-exclusions.json](language-exclusions.json) records
the source record hash, held-out group identity, and reason. A changed source or
held-out grouping fails the audit until the exclusion is reviewed, rather than
silently dropping unrelated data. Original texts and the test case are preserved.
This removes one confirmed leak, not proof of exhaustive semantic isolation.
A future training mixture must disclose this limitation
and be reviewed before treating held-out task scores as evidence of generalization.

## Limits and next decisions

Only a small subset of the 352 lexical entries appears in the controlled training
corpus. The audit lists unseen words explicitly. Repeating this corpus many times
would not teach those unused words or broader conversation. A future preparation
corpus needs varied contexts beyond the sparse language seed if we want those
capabilities. More template permutations alone are not sufficient.

Do not claim L1 or T1 complete from this checkpoint: learned behavior is untested
and everyday topic extensions still expose gaps. Authored probes are not
independent language samples. The 128-token audit budget is a planning choice, not an implemented model
context or a production workload distribution. Export complete examples without
truncation; any future packing, padding, loss masks, and split changes need their
own declared rules and tests.

False positives: template memorization, answer-position shortcuts, limited entity
sets, and selection into a narrow language world can inflate apparent competence.
False negatives: failure on an unfamiliar rendering or word says little about
correctness of attention, KV reuse, or other numerical mechanisms. Use this corpus
as one reproducible instrument, not a substitute for arithmetic validation or
real-system workload evidence.
