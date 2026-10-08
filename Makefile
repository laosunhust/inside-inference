SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

# Host prerequisites: GNU Make, Git, Python 3 with venv, Node and npm.
# Browser checks additionally require installed Chrome/Chromium and Node WebSocket.
# Dependency versions belong to requirements.txt and package-lock.json.
PYTHON ?= .venv/bin/python

# Only common workflows carry ## help. Internal workflows start with _.
# Help and visibility checks consume the same declarations; no separate command list.
help: ## Show common workflows; start with make setup, then make serve-intro.
	@python3 -m scripts.check.make_interface --help-targets

setup: ## Install locked Python and build-tool dependencies locally.
	@python3 -m venv .venv
	@.venv/bin/python -m pip install -r requirements.txt
	@npm ci --ignore-scripts

intro-page: _data-models-check ## Build the offline laboratory at out/intro-page/index.html.
	@$(PYTHON) -m scripts.build.intro_page

serve-intro: _data-models-check ## Build and serve live inference on localhost; restart after code changes.
	@$(PYTHON) -m scripts.dev.serve_intro

check: _make-check _layout-check _data-models-check ## Reject contract drift, invalid catalog entries, and whitespace errors.
	@$(PYTHON) -m scripts.build.intro_page --check
	@git diff --check
	@git diff --cached --check

test: _make-check _layout-check _data-models-check ## Light harness: contract and correctness tests; no browser or HTTP server.
	@$(PYTHON) -m unittest discover -s tests/unit -v

# Full harness includes the light checks, then real transport/browser parity.
# Missing Chrome/Node support is a failure, never a silently skipped test.
# Evidence: out/experiments/integration/ (workloads, run records, screenshots, result).
test-integration: check test ## Full harness: reproduce interactive runs through headless, CLI, HTTP, and browser.
	@$(PYTHON) -m unittest discover -s tests/integration -v
	@$(PYTHON) -m scripts.check.browser_check

# Explicit regeneration is separate from validation: checks never repair stale files.
_data-models:
	@$(PYTHON) -m scripts.build.generate_data_models --write

_data-models-check:
	@$(PYTHON) -m scripts.build.generate_data_models --check

_make-check:
	@python3 -m scripts.check.make_interface --check

_layout-check:
	@python3 -m scripts.check.layout

# Maintainer experiments. Outputs under out/ are disposable, never authorities.
_inference-example: _data-models-check
	@$(PYTHON) -m scripts.experiments.run_inference

_measure-inference: _data-models-check
	@$(PYTHON) -m scripts.experiments.measure_inference

_vocabulary-study:
	@mkdir -p out/experiments/vocabulary-study
	@$(PYTHON) -m scripts.experiments.vocabulary_study > out/experiments/vocabulary-study/report.json
	@printf '%s\n' 'Wrote out/experiments/vocabulary-study/report.json'

_tokenizer-example:
	@mkdir -p out/experiments/tokenizer-dataset
	@$(PYTHON) -m scripts.experiments.inspect_tokenizer --text 'cat Cat café 你好' > out/experiments/tokenizer-dataset/example.json
	@printf '%s\n' 'Wrote out/experiments/tokenizer-dataset/example.json'

_dataset-audit:
	@$(PYTHON) -m scripts.experiments.prepare_corpus

.PHONY: help setup intro-page serve-intro check test test-integration
.PHONY: _data-models _data-models-check _make-check _layout-check
.PHONY: _inference-example _measure-inference _vocabulary-study _tokenizer-example _dataset-audit
