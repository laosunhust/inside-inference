SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

# Host prerequisites: GNU Make, Git, Python 3 with venv, Node and npm.
# serve-intro also requires lsof; it terminates existing TCP listeners on port 8000.
# Browser checks additionally require installed Chrome/Chromium and Node WebSocket.
# Dependency versions belong to requirements.txt and package-lock.json.
PYTHON ?= .venv/bin/python

# Only common workflows carry ## help. Internal workflows start with _.
# Help descriptions come from these rules; governance freezes the public names.
help:
	@python3 -m scripts.check.make_interface --help-targets

setup: ## Install locked Python and build-tool dependencies locally.
	@python3 -m venv .venv
	@.venv/bin/python -m pip install -r requirements.txt
	@npm ci --ignore-scripts

_intro-page: _governance-check _data-models-check
	@$(PYTHON) -m scripts.build.intro_page

serve-intro: _governance-check _data-models-check ## Replace the listener on port 8000 and serve live inference locally.
	@$(PYTHON) -m scripts.dev.serve_intro $(if $(CHECKPOINT),--checkpoint "$(CHECKPOINT)",)

_check: _governance-check _make-check _layout-check _data-models-check
	@$(PYTHON) -m scripts.build.intro_page --check
	@git diff --check
	@git diff --cached --check

test: ## Light harness: contract and correctness tests; no browser or HTTP server.
	@$(PYTHON) -m scripts.check.governance.budget test

_test: _governance-check _make-check _layout-check _data-models-check
	@$(PYTHON) -m scripts.check.governance.harness

# Optional CHECKPOINT=path.json binds both embedded and live execution for serve-intro
# and runs browser parity on that artifact in test-integration (default stays untrained).
# Full harness runs unit checks once, then composition and real adapter/browser parity.
# Component invariants belong in unit tests; integration compares complete records
# against checked references and owns transport, export/replay and rendered wiring.
# Missing Chrome/Node support is a failure, never a silently skipped test.
# Evidence: out/experiments/integration/ (workloads, run records, screenshots, result).
test-integration: ## Full harness: reproduce interactive runs through headless, CLI, HTTP, and browser.
	@$(PYTHON) -m scripts.check.governance.budget test-integration

# Private workflows share prerequisites; public wrappers time the complete work.
_test-integration: _check _test
	@$(PYTHON) -m scripts.check.browser_check --integration-tests $(if $(CHECKPOINT),--checkpoint "$(CHECKPOINT)" --output out/experiments/checkpoint-integration,)

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

# Read-only diagnosis against the running local page; uses optional preparation
# dependencies to reproduce response supervision, but never trains a model.
_diagnose-word-separator:
	@$(PYTHON) -m scripts.experiments.diagnose_word_separator $(ARGS)

.PHONY: _diagnose-word-separator

.PHONY: help setup _intro-page serve-intro _check test test-integration _test _test-integration
.PHONY: _data-models _data-models-check _make-check _layout-check
.PHONY: _inference-example _measure-inference _vocabulary-study _tokenizer-example _dataset-audit

# Optional checkpoint preparation; binary64 CPU training stays outside inference setup.
_preparation-setup:
	@$(PYTHON) -m pip install -r requirements-preparation.txt

# Dataset generation, vocabulary research, and training checks are preparation work.
# Run when those inputs or implementations change; inference harnesses exclude them.
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

# Optional, gitignored upstream source references; no installs or upstream execution.
# Pins live here. Existing altered checkouts fail instead of being reset or updated.
_references:
	@$(PYTHON) -m scripts.dev.references llm-viz https://github.com/bbycroft/llm-viz.git 9da93742382f1bf36c020c38a1ace454e82c4490
	@$(PYTHON) -m scripts.dev.references transformer-explainer https://github.com/poloclub/transformer-explainer.git bfe50afba10b9b560b84143ee1107d977defa74f
	@$(PYTHON) -m scripts.dev.references nano-vllm https://github.com/GeeeekExplorer/nano-vllm.git bb823b3e06983d71485a8e1f23715ebd87d98ef8

.PHONY: _references
