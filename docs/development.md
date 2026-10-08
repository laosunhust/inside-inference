# Development workflows

This document owns setup, commands, generated outputs, and entry points.
The root [README](../README.md) introduces the purpose and philosophy;
[AGENTS.md](../AGENTS.md) owns contributor instructions.

## Run the current playground

With GNU Make, Python 3, and Git installed, run from the repository root:

```sh
make intro-page       # Generate the offline site
make check            # Validate required docs, catalog, and diff whitespace
make test             # Run implemented numerical, audit, and generated-site checks
make vocabulary-study # Reproduce the vocabulary-budget audit
make tokenizer-example # Export actual word/byte decisions for a small input
make dataset-audit    # Rebuild the bounded corpus, coverage report, and traces
make design           # Read the historical laboratory plan
make                  # List available workflows
```

Open `out/intro-page/index.html` in a browser. The generated site works offline;
external research links require internet. Its current implementation uses the
Python standard library and browser JavaScript, with no hosted service or
third-party runtime dependency. Re-run `make intro-page` after source changes.
These requirements describe the current site, not a future model execution engine.

## Entry points and evidence

- `out/intro-page/index.html`: one request through an inference system with an
  idealized cost model. Play, pause, step, inspect ontology definitions, and change
  prefix reuse or resource rates. Chat/Agent/App are caller labels; source-specific
  workloads are not implemented. See the [lab contract](labs/request-playground.md).
- `out/intro-page/atlas.html`: the area index and linked labs generated from
  [catalog/stack.json](../catalog/stack.json). Follow the
  [extension contract](../catalog/README.md) to add a mechanism.
- `out/intro-page/labs/kimi-delta-attention.html`: an executable recurrence on
  hand-selected inputs. It is not a trained Kimi model, integrated attention
  switch, or hardware benchmark.
- `out/experiments/vocabulary-study/report.json`: reproducible word/token budget
  accounting. See the [research](research/vocabulary-budget.md); this is not the
  eventual tokenizer or a language-quality test.
- `out/experiments/tokenizer-dataset/`: the implemented tokenizer's example,
  selected raw traces, three corpus splits, source/file identities, and coverage
  report. See the [codec contract](implementation/tokenizer.md) and
  [corpus contract](../data/corpus/README.md). This is an untrained checkpoint with
  known vocabulary gaps, not a learned conversation demo.
  The [first checkpoint findings](research/tokenizer-dataset-checkpoint.md)
  distinguish passing mechanics from unfinished language coverage.

Inspect arbitrary input without changing vocabulary:

```sh
python3 -m scripts.inspect_tokenizer --text 'cat Cat café 你好'
python3 -m scripts.inspect_tokenizer --file path/to/input.txt --context-limit 128
```

The file path reads exact UTF-8 bytes. Overflow and malformed input fail explicitly.
The command prints JSON; it does not modify the input file or train a model.

The [milestone scorecard](purpose/milestones.md) owns capability status and
acceptance criteria. Passing these workflows establishes only the checks they
perform, not a representative real-system simulation or a working language model.

## Source ownership and outputs

Presentation lives in `web/`; `scripts/intro_page.py` generates the site from its
sources, ontology definitions, and catalog metadata. The
[architecture](architecture/inspection.md) describes the computation/simulation
boundary and future module responsibilities.

Generated pages, temporary traces, research downloads, and disposable runs belong
under ignored `out/`. Do not edit generated HTML or commit those outputs.
Maintained fixtures, datasets, and irreplaceable checkpoints require explicit
versioned locations outside `out/`; add them only when needed.

The [original lab plan](purpose/original-lab-plan.md) preserves the DOCX proposal
in Markdown. The DOCX is absent from this checkout. Its old vocabulary, deadlines,
and broader training agenda are historical, not implementation requirements.
