
SHELL = /bin/bash
.SHELLFLAGS = -o pipefail -c
DOCKER_COMPOSE ?= $(shell if docker compose version >/dev/null 2>&1; then printf 'docker compose'; elif command -v docker-compose >/dev/null 2>&1; then printf 'docker-compose'; else printf 'docker compose'; fi)
DEV_COMPOSE = $(DOCKER_COMPOSE) -f compose.dev.yaml

.PHONY: help
help: ## Print info about all commands
	@echo "Helper Commands:"
	@echo
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[01;32m%-20s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "NOTE: dependencies between commands are not automatic. Eg, you must run 'deps' and 'build' first, and after any changes"

.PHONY: build
build: ## Compile all modules
	yarn build

.PHONY: test
test: ## Run tests
	yarn type-check

.PHONY: run-dev-server
run-dev-server: ## Run a "development environment" shell
	yarn dev

.PHONY: dev-stack-check
dev-stack-check: ## Verify sibling repositories required by the Docker dev stack
	bash scripts/dev-stack/check-sibling-atproto.sh

.PHONY: dev-stack-up
dev-stack-up: dev-stack-check ## Run the coordinated Docker Compose dev stack with file watching
	$(DEV_COMPOSE) up --build --watch

.PHONY: dev-stack-up-once
dev-stack-up-once: dev-stack-check ## Run the coordinated Docker Compose dev stack without file watching
	$(DEV_COMPOSE) up --build

.PHONY: dev-stack-down
dev-stack-down: ## Stop the coordinated Docker Compose dev stack
	$(DEV_COMPOSE) down

.PHONY: dev-stack-logs
dev-stack-logs: ## Follow logs for the coordinated Docker Compose dev stack
	$(DEV_COMPOSE) logs -f

.PHONY: dev-stack-smoke
dev-stack-smoke: ## Verify the coordinated Docker Compose dev stack is reachable
	bash scripts/dev-stack/smoke.sh

.PHONY: dev-stack-reset
dev-stack-reset: ## Remove Docker Compose dev stack containers and volumes
	$(DEV_COMPOSE) down -v --remove-orphans

.PHONY: lint
lint: ## Run style checks and verify syntax
	yarn lint

.PHONY: deps
deps: ## Installs dependent libs using 'yarn install'
	yarn install --frozen-lockfile

.PHONY: nvm-setup
nvm-setup: ## Use NVM to install and activate node+yarn
	nvm install 20
	nvm use 20
	npm install --global yarn
