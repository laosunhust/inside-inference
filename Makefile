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
	@$(PYTHON) -m scripts.build.browser_runtime

_intro-page: _governance-check _data-models-check
	@$(PYTHON) -m scripts.build.intro_page $(if $(CHECKPOINT),--checkpoint "$(CHECKPOINT)",) $(if $(MODEL_ASSET_BASE),--model-asset-base "$(MODEL_ASSET_BASE)",)

serve-intro: _intro-page ## Replace the listener on port 8000 and serve the static browser application.
	@$(PYTHON) -m scripts.dev.serve_intro

_check: _governance-check _make-check _layout-check _data-models-check
	@$(PYTHON) -m scripts.build.intro_page --check
	@git diff --check
	@git diff --cached --check

test: ## Light harness: contract and correctness tests; no browser or HTTP server.
	@$(PYTHON) -m scripts.check.governance.budget test

_test: _governance-check _make-check _layout-check _data-models-check
	@$(PYTHON) -m scripts.check.governance.harness

# Optional CHECKPOINT=path.json binds embedded preparation and packaged browser weights
# and runs browser parity on that artifact (default is the shipped trained checkpoint).
# Full harness runs unit checks once, then static serving and browser-worker parity.
# Component invariants belong in unit tests; integration compares complete records
# against checked references and owns transport, export/replay and rendered wiring.
# Missing Chrome/Node support is a failure, never a silently skipped test.
# Evidence: out/experiments/integration/ (workloads, run records, screenshots, result).
test-integration: ## Full harness: reproduce interactive runs through headless and interactive calls in the browser.
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

.PHONY: help setup _intro-page serve-intro _check test test-integration _test _test-integration
.PHONY: _data-models _data-models-check _make-check _layout-check
.PHONY: _vocabulary-study _tokenizer-example _dataset-audit

# Optional checkpoint preparation; binary64 CPU training stays outside inference setup.
_preparation-setup:
	@$(PYTHON) -m pip install -r requirements-preparation.txt

# Dataset generation, vocabulary research, and training checks are preparation work.
# Run when those inputs or implementations change; inference harnesses exclude them.
_test-preparation: _data-models-check
	@$(PYTHON) -m unittest discover -s tests/preparation -v

# Requires a preparation interpreter with PyTorch/CUDA, NumPy, PyArrow and YAML.
# ARGS supplies --source PATH and optionally --train; refuses to overwrite evidence.
_lexical-study:
	@$(PYTHON) -m scripts.experiments.story_models.lexical $(ARGS)

.PHONY: _lexical-study

_prepare-checkpoint: _test-preparation
	@$(PYTHON) -m scripts.experiments.prepare_checkpoint $(ARGS)

.PHONY: _preparation-setup _test-preparation _prepare-checkpoint

_verify-checkpoint: _data-models-check
	@$(PYTHON) -m scripts.check.checkpoint --checkpoint "$(CHECKPOINT)" --output out/experiments/model-preparation/verification $(ARGS)

.PHONY: _verify-checkpoint

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

# Bounded family spike: frozen cases and matrix live under data/preparation/model-family.
# Training reserves 30 minutes before the approved deadline for browser checks/reporting.
_model-family-benchmark: _data-models-check
	@$(PYTHON) -m scripts.experiments.model_family.benchmark

_model-family-train: _data-models-check
	@$(PYTHON) -m scripts.experiments.model_family.train

.PHONY: _model-family-benchmark _model-family-train

_model-family-evaluate: _data-models-check
	@$(PYTHON) -m scripts.check.model_family.evaluate

.PHONY: _model-family-evaluate

# Optional model assets use the same verified HTTP reader locally and from S3/CDN.
# MODEL_ASSET_BASE is a URL prefix ending in /; defaults come from data/models/models.yaml.
# Example deployment configuration: MODEL_ASSET_BASE=https://assets.example/models/
# Publish the tested static release and exact artifact bytes; never upload visitor input.
# Retained TinyStories checkpoints are preparation inputs, not serving dependencies.
# Preparation uses the study environment: torch, numpy, pyarrow, sentencepiece,
# protobuf, PyYAML and jsonschema. Supply STORY_PYTHON and STORY_STUDY explicitly.
# The training target is the retained bounded spike, not an open-ended trainer.
STORY_PYTHON ?= $(PYTHON)
_story-models-check: _intro-page
	@$(PYTHON) -m scripts.check.story_models.browser

_story-models-export:
	@$(STORY_PYTHON) -m scripts.experiments.story_models.export --study "$(STORY_STUDY)"

_story-models-train:
	@$(STORY_PYTHON) -m scripts.experiments.story_models.train --study "$(STORY_STUDY)"

.PHONY: _story-models-check _story-models-export _story-models-train

# AWS delivery: qualify once locally, deploy the same bytes to dev, then verify.
# RELEASE is the SHA256SUMS digest printed by _release-package; never inferred as latest.
# Environment/account/hostnames belong to infrastructure/aws/deployment.yaml.
_release-package: test-integration
	@$(PYTHON) -m scripts.build.hosting.release

_hosting-create: _governance-check
	@$(PYTHON) -m scripts.build.hosting.aws infrastructure --environment "$(ENVIRONMENT)"

_hosting-status:
	@$(PYTHON) -m scripts.build.hosting.aws status --environment "$(ENVIRONMENT)"

_serve-release:
	@$(PYTHON) -m scripts.build.hosting.release --verify "$(RELEASE)"
	@$(PYTHON) -m scripts.dev.serve_intro --directory "out/releases/$(RELEASE)/site"

# Restore retained bytes and their local qualification after disposable out/ is cleaned.
# Rollback uses restore and _deploy-dev with an explicit prior RELEASE.
_release-restore:
	@$(PYTHON) -m scripts.build.hosting.aws restore --environment "$(ENVIRONMENT)" --release "$(RELEASE)"

_deploy-dev: _governance-check
	@$(PYTHON) -m scripts.build.hosting.aws deploy --environment dev --release "$(RELEASE)"
	@$(MAKE) --no-print-directory _verify-hosted ENVIRONMENT=dev RELEASE="$(RELEASE)"

_verify-hosted:
	@$(PYTHON) -m scripts.check.hosting.verify --environment "$(ENVIRONMENT)" --release "$(RELEASE)"

# One local-to-dev workflow, matching CNCRover's staging deployment boundary.
deploy-dev: test-integration ## Validate, package, deploy to dev and verify; no release ID required.
	@release="$$( $(PYTHON) -m scripts.build.hosting.release )"; \
	$(MAKE) --no-print-directory _deploy-dev RELEASE="$$release"

_hosting-disable: _governance-check
	@$(PYTHON) -m scripts.build.hosting.aws disable --environment "$(ENVIRONMENT)"

.PHONY: _release-package _hosting-create _hosting-status _serve-release _release-restore _deploy-dev _verify-hosted deploy-dev _hosting-disable

# Bounded experiment; protocol owns release, workload, resolution and wall-time cap.
_kv-timing-pilot: _governance-check _data-models-check
	@$(PYTHON) -m scripts.check.pilots.kv_timing
	@$(PYTHON) -m scripts.experiments.kv_timing.analyze
.PHONY: _kv-timing-pilot

# Recompute the retained pilot result without rerunning inference or replacing evidence.
_kv-timing-analyze:
	@$(PYTHON) -m scripts.experiments.kv_timing.analyze
.PHONY: _kv-timing-analyze

# Interactive same-workload delivery evaluation; no alternative execution path.
_token-overhead: _check
	@$(PYTHON) -m scripts.check.browser_check --token-overhead --output out/experiments/token-overhead

.PHONY: _token-overhead
