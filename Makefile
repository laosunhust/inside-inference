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

intro-page: _governance-check _data-models-check ## Build the offline laboratory at out/intro-page/index.html.
	@$(PYTHON) -m scripts.build.intro_page

serve-intro: _governance-check _data-models-check ## Build and serve live inference on localhost; restart after code changes.
	@$(PYTHON) -m scripts.dev.serve_intro $(if $(CHECKPOINT),--checkpoint "$(CHECKPOINT)",)

check: _governance-check _make-check _layout-check _data-models-check ## Reject ontology/declaration drift, prose-only ontology files, invalid catalog entries, and whitespace errors.
	@$(PYTHON) -m scripts.build.intro_page --check
	@git diff --check
	@git diff --cached --check

test: _governance-check _make-check _layout-check _data-models-check ## Light harness: contract and correctness tests; no browser or HTTP server.
	@$(PYTHON) -m unittest discover -s tests/unit -v

# Optional CHECKPOINT=path.json binds both embedded and live execution for serve-intro
# and runs browser parity on that artifact in test-integration (default stays untrained).
# Full harness includes the light checks, then real transport/browser parity.
# Missing Chrome/Node support is a failure, never a silently skipped test.
# Evidence: out/experiments/integration/ (workloads, run records, screenshots, result).
test-integration: check test ## Full harness: reproduce interactive runs through headless, CLI, HTTP, and browser.
	@$(PYTHON) -m unittest discover -s tests/integration -v
	@$(PYTHON) -m scripts.check.browser_check $(if $(CHECKPOINT),--checkpoint "$(CHECKPOINT)" --output out/experiments/checkpoint-integration,)

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

# Optional checkpoint preparation; binary64 CPU training stays outside inference setup.
_preparation-setup:
	@$(PYTHON) -m pip install -r requirements-preparation.txt

_test-preparation: _data-models-check
	@$(PYTHON) -m unittest discover -s tests/preparation -v

_prepare-checkpoint: _test-preparation
	@$(PYTHON) -m scripts.experiments.prepare_checkpoint $(ARGS)

.PHONY: _preparation-setup _test-preparation _prepare-checkpoint

_verify-checkpoint: _data-models-check
	@$(PYTHON) -m scripts.check.checkpoint --checkpoint "$(CHECKPOINT)" --output out/experiments/model-preparation/verification

.PHONY: _verify-checkpoint

# Optional physical VRAM/pinned-DRAM lab. The isolated environment leaves the CPU
# setup untouched. Use its Python for serve-intro or test-integration to expose CUDA.
_cache-cuda-setup:
	@python3 -m venv out/experiments/kv-cuda-venv
	@out/experiments/kv-cuda-venv/bin/python -m pip install -r requirements-cache-cuda.txt

_test-cache-cuda: _data-models-check
	@out/experiments/kv-cuda-venv/bin/python -m unittest discover -s tests/cuda -v

_cache-example: _data-models-check
	@$(PYTHON) -m scripts.experiments.run_cache $(ARGS)

.PHONY: _cache-cuda-setup _test-cache-cuda _cache-example

_measure-cache-hardware: _data-models-check
	@out/experiments/kv-cuda-venv/bin/python -m scripts.check.cache_hardware

.PHONY: _measure-cache-hardware

# Governance lock updates require explicit owner authorization; checks never refresh hashes.
# Review governance/approval-lock.yaml, then use sha256sum on approved changed paths.
_governance-check:
	@$(PYTHON) -m scripts.check.governance

.PHONY: _governance-check
