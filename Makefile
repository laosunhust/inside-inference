SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

PYTHON ?= python3
DESIGN_DOC := docs/purpose/original-lab-plan.md

.PHONY: help design check intro-page test vocabulary-study tokenizer-example dataset-audit

help: ## List available developer workflows.
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

design: ## Print the original laboratory plan in Markdown.
	@cat "$(DESIGN_DOC)"

intro-page: ## Build the offline inference atlas and linked labs in out/intro-page/.
	@$(PYTHON) -m scripts.intro_page

vocabulary-study: ## Reproduce the vocabulary-budget audit under out/experiments/.
	@mkdir -p out/experiments/vocabulary-study
	@$(PYTHON) -m scripts.vocabulary_study > out/experiments/vocabulary-study/report.json
	@printf '%s\n' 'Wrote out/experiments/vocabulary-study/report.json'

tokenizer-example: ## Export exact token IDs and byte/word decisions for a small input.
	@mkdir -p out/experiments/tokenizer-dataset
	@$(PYTHON) -m scripts.inspect_tokenizer --text 'cat Cat café 你好' > out/experiments/tokenizer-dataset/example.json
	@printf '%s\n' 'Wrote out/experiments/tokenizer-dataset/example.json'

dataset-audit: ## Build the bounded corpus, split/coverage audit, and selected tokenizer traces.
	@$(PYTHON) -m scripts.prepare_corpus

test: ## Run numerical, tokenizer/corpus, catalog, and generated-site checks.
	@$(PYTHON) -m unittest discover -s tests -v

check: ## Validate catalog, required documents, and diff whitespace.
	@for file in README.md AGENTS.md Makefile LICENSE docs/development.md docs/implementation/model-preparation.md docs/implementation/naive-inference.md docs/architecture/inspection.md docs/ontology/README.md docs/ontology/inference.md docs/ontology/experiment.md docs/purpose/README.md docs/purpose/milestones.md catalog/stack.json catalog/README.md "$(DESIGN_DOC)"; do \
		test -s "$$file" || { printf 'Missing or empty required file: %s\n' "$$file" >&2; exit 1; }; \
	done
	@$(PYTHON) -m scripts.intro_page --check
	@git diff --check
	@git diff --cached --check
	@printf '%s\n' 'Repository checks passed. Use make test for implementation checks.'
