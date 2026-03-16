.PHONY: help setup start stop restart status clean health backup restore upgrade \
        dev monitoring full all logs logs-% shell-% shell-surreal shell-dragonfly \
        init-db seed-db build-sdk test push pull version upgrade-dry

# ============================================================================
# SuperStack Makefile
# ============================================================================
# Quick reference for all common SuperStack operations.
# Usage: make <target> [ARGS=value]
#
# Setup & Lifecycle:
#   make setup          Full one-command setup (<3 min)
#   make start          Start services (default: dev profile)
#   make stop           Stop all services
#   make restart        Restart all services
#   make status         Show running services
#   make clean          Remove containers, networks, volumes
#
# Profiles:
#   make dev            Start dev stack (core + gateway + search)
#   make monitoring     Start with monitoring (+ signoz, uptime-kuma, beszel)
#   make full           Complete stack (dev + monitoring + workflows)
#   make all            Everything (+ optional services)
#
# Maintenance:
#   make health         System health check
#   make backup         Create backup
#   make restore        Restore from backup (use BACKUP=file)
#   make upgrade        Upgrade to latest versions
#   make upgrade-dry    Preview upgrade without changes
#
# Database:
#   make init-db        Initialize SurrealDB schema
#   make seed-db        Load seed data
#
# Logs & Debugging:
#   make logs           Follow all service logs
#   make logs-SERVICE   Follow specific service (e.g., make logs-surrealdb)
#   make shell-surreal  Interactive SurrealDB shell
#   make shell-dragonfly Interactive Dragonfly/Redis shell
#
# Docker:
#   make pull           Pull latest images
#   make push           Push images to registry
#   make build-sdk      Build SDK artifacts
#
# Utilities:
#   make version        Show service versions
#   make test           Run tests
#   make help           Show this help

# ============================================================================
# Configuration
# ============================================================================

SHELL := /bin/bash
PROJECT_ROOT := $(shell pwd)
SCRIPTS_DIR := $(PROJECT_ROOT)/scripts
DOCKER_COMPOSE := docker-compose
DOCKER := docker

# Color output
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
RED := \033[0;31m
NC := \033[0m

# ============================================================================
# Help Target
# ============================================================================

help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║$(NC) SuperStack Make Targets"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Lifecycle:$(NC)"
	@echo "  make setup              Full setup (checks deps, pulls images, init DB)"
	@echo "  make start              Start dev profile (core + gateway + search)"
	@echo "  make stop               Stop all services"
	@echo "  make restart            Stop and start all services"
	@echo "  make status             Show running containers"
	@echo "  make clean              Remove containers, volumes, networks"
	@echo ""
	@echo "$(GREEN)Profiles:$(NC)"
	@echo "  make dev                Start dev stack (recommended for development)"
	@echo "  make monitoring         Start with observability services"
	@echo "  make full               All core + gateway + search + monitoring + workflows"
	@echo "  make all                Everything including optional services"
	@echo ""
	@echo "$(GREEN)Maintenance:$(NC)"
	@echo "  make health             Check system health (endpoints, disk, memory)"
	@echo "  make backup             Create timestamped backup"
	@echo "  make restore            Restore from backup (BACKUP=file.tar.gz)"
	@echo "  make upgrade            Upgrade to latest service versions"
	@echo "  make upgrade-dry        Preview upgrade without changes"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make init-db            Initialize SurrealDB schema"
	@echo "  make seed-db            Load seed data"
	@echo ""
	@echo "$(GREEN)Logs & Debugging:$(NC)"
	@echo "  make logs               Follow logs from all services"
	@echo "  make logs-SRVCS         Follow specific service (make logs-surrealdb)"
	@echo "  make shell-surreal      Connect to SurrealDB interactive shell"
	@echo "  make shell-dragonfly    Connect to Dragonfly interactive shell"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make pull               Pull latest images from registry"
	@echo "  make push               Push local images to registry"
	@echo "  make build-sdk          Build SDK artifacts"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make version            Show all service versions"
	@echo "  make test               Run test suite"
	@echo "  make help               Show this help"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make setup              # First time setup"
	@echo "  make start              # Start dev environment"
	@echo "  make logs-meilisearch   # Watch Meilisearch logs"
	@echo "  make health             # Check if all services are up"
	@echo "  make backup             # Create backup before changes"
	@echo ""

# ============================================================================
# Setup & Installation
# ============================================================================

setup:
	@echo "$(BLUE)Starting SuperStack setup...$(NC)"
	@bash $(SCRIPTS_DIR)/setup.sh
	@echo "$(GREEN)✓ Setup complete!$(NC)"

setup-no-seed:
	@bash $(SCRIPTS_DIR)/setup.sh --no-seed

setup-offline:
	@bash $(SCRIPTS_DIR)/setup.sh --offline

# ============================================================================
# Service Lifecycle
# ============================================================================

start: start-dev

start-core:
	@echo "$(BLUE)Starting core services (SurrealDB, Dragonfly, NATS)...$(NC)"
	@bash $(SCRIPTS_DIR)/start.sh core

start-dev:
	@echo "$(BLUE)Starting dev stack...$(NC)"
	@bash $(SCRIPTS_DIR)/start.sh dev

dev: start-dev

monitoring:
	@echo "$(BLUE)Starting with monitoring...$(NC)"
	@bash $(SCRIPTS_DIR)/start.sh monitoring

full:
	@echo "$(BLUE)Starting full stack...$(NC)"
	@bash $(SCRIPTS_DIR)/start.sh full

all:
	@echo "$(BLUE)Starting all services...$(NC)"
	@bash $(SCRIPTS_DIR)/start.sh all

stop:
	@echo "$(BLUE)Stopping all services...$(NC)"
	@bash $(SCRIPTS_DIR)/stop.sh
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: stop start
	@echo "$(GREEN)✓ Services restarted$(NC)"

status:
	@echo "$(BLUE)Service Status:$(NC)"
	@bash $(SCRIPTS_DIR)/status.sh

ps: status

# ============================================================================
# Maintenance & Operations
# ============================================================================

health:
	@bash $(SCRIPTS_DIR)/health.sh

health-verbose:
	@bash $(SCRIPTS_DIR)/health.sh --verbose

health-json:
	@bash $(SCRIPTS_DIR)/health.sh --json

backup:
	@bash $(SCRIPTS_DIR)/backup.sh

backup-upload:
	@bash $(SCRIPTS_DIR)/backup.sh --upload

backup-keep:
	@bash $(SCRIPTS_DIR)/backup.sh --keep $(ARGS)

restore:
	@bash $(SCRIPTS_DIR)/backup.sh --restore $(BACKUP)

upgrade:
	@bash $(SCRIPTS_DIR)/upgrade.sh

upgrade-dry:
	@bash $(SCRIPTS_DIR)/upgrade.sh --dry-run

upgrade-service:
	@bash $(SCRIPTS_DIR)/upgrade.sh --service $(SERVICE)

upgrade-no-backup:
	@bash $(SCRIPTS_DIR)/upgrade.sh --skip-backup

# ============================================================================
# Database Management
# ============================================================================

init-db:
	@echo "$(BLUE)Initializing SurrealDB schema...$(NC)"
	@bash $(SCRIPTS_DIR)/init-db.sh
	@echo "$(GREEN)✓ Schema initialized$(NC)"

init-db-with-seed: seed-db

seed-db:
	@echo "$(BLUE)Loading seed data...$(NC)"
	@bash $(SCRIPTS_DIR)/init-db.sh --seed
	@echo "$(GREEN)✓ Seed data loaded$(NC)"

# ============================================================================
# Logs & Debugging
# ============================================================================

logs:
	@echo "$(BLUE)Following logs from all services (Ctrl+C to stop)...$(NC)"
	@$(DOCKER_COMPOSE) logs -f

logs-%:
	@echo "$(BLUE)Following logs from $* (Ctrl+C to stop)...$(NC)"
	@$(DOCKER_COMPOSE) logs -f $*

log-tail:
	@$(DOCKER_COMPOSE) logs --tail=100

# ============================================================================
# Interactive Shells
# ============================================================================

shell-surreal:
	@echo "$(BLUE)Connecting to SurrealDB shell...$(NC)"
	@echo "$(YELLOW)Commands: SELECT * FROM table; INFO FOR DB; SHOW TABLES;$(NC)"
	@echo ""
	@surreal sql --endpoint http://localhost:8000 --user root --password root

shell-dragonfly:
	@echo "$(BLUE)Connecting to Dragonfly (Redis) shell...$(NC)"
	@echo "$(YELLOW)Commands: PING; KEYS *; INFO; FLUSHALL;$(NC)"
	@echo ""
	@redis-cli -p 6379

shell-nats:
	@echo "$(BLUE)NATS Monitoring UI: http://localhost:8222$(NC)"
	@echo "$(BLUE)Or use: nats server list --servers nats://localhost:4222$(NC)"

shell-meilisearch:
	@echo "$(BLUE)Meilisearch UI: http://localhost:7700$(NC)"

# ============================================================================
# Docker Operations
# ============================================================================

pull:
	@echo "$(BLUE)Pulling latest images...$(NC)"
	@$(DOCKER_COMPOSE) pull
	@echo "$(GREEN)✓ Images pulled$(NC)"

pull-service:
	@$(DOCKER_COMPOSE) pull $(SERVICE)

push:
	@echo "$(BLUE)Pushing images to registry...$(NC)"
	@$(DOCKER_COMPOSE) push
	@echo "$(GREEN)✓ Images pushed$(NC)"

build-sdk:
	@echo "$(BLUE)Building SDK artifacts...$(NC)"
	@if [ -f "scripts/build-sdk.sh" ]; then \
		bash scripts/build-sdk.sh; \
	else \
		echo "$(YELLOW)No SDK build script found$(NC)"; \
	fi

# ============================================================================
# Cleaning & Utilities
# ============================================================================

clean:
	@echo "$(YELLOW)⚠ This will remove all containers, volumes, and networks$(NC)"
	@echo -n "Continue? [y/N] " && read -r ans && [ "$${ans:-N}" = "y" ] || exit 1
	@echo "$(BLUE)Cleaning up...$(NC)"
	@$(DOCKER_COMPOSE) down -v
	@docker network rm superstack-net 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

clean-containers:
	@$(DOCKER_COMPOSE) down

clean-volumes:
	@$(DOCKER) volume prune -f

clean-networks:
	@docker network prune -f

version:
	@echo "$(BLUE)Service Versions:$(NC)"
	@echo ""
	@$(DOCKER_COMPOSE) images

test:
	@echo "$(BLUE)Running tests...$(NC)"
	@if [ -f "package.json" ]; then \
		if command -v bun >/dev/null 2>&1; then \
			bun test; \
		else \
			npm test; \
		fi \
	else \
		echo "$(YELLOW)No test configuration found$(NC)"; \
	fi

lint:
	@echo "$(BLUE)Running linter...$(NC)"
	@if [ -f "package.json" ]; then \
		if command -v bun >/dev/null 2>&1; then \
			bun run lint; \
		else \
			npm run lint; \
		fi \
	else \
		echo "$(YELLOW)No lint configuration found$(NC)"; \
	fi

# ============================================================================
# Development Shortcuts
# ============================================================================

dev-quick: clean start init-db-with-seed health
	@echo "$(GREEN)✓ Development environment ready$(NC)"

dev-logs:
	@make logs

dev-reset: clean setup start
	@echo "$(GREEN)✓ Full reset complete$(NC)"

# ============================================================================
# Documentation & Help
# ============================================================================

docs:
	@echo "$(BLUE)SuperStack Documentation:$(NC)"
	@echo "  README.md              - Overview and quick start"
	@echo "  CONFIG.md              - Configuration reference"
	@echo "  QUICK_START.md         - Common tasks and examples"
	@echo "  SDK.md                 - SDK documentation"
	@echo "  SDK-ARCHITECTURE.md    - SDK architecture details"
	@echo ""
	@echo "$(BLUE)Documentation URLs:$(NC)"
	@echo "  SurrealDB:   https://surrealdb.com/docs"
	@echo "  Dragonfly:   https://dragonflydb.io/"
	@echo "  NATS:        https://docs.nats.io/"
	@echo "  Meilisearch: https://docs.meilisearch.com/"
	@echo "  Caddy:       https://caddyserver.com/docs"
	@echo ""

# ============================================================================
# Error Handling
# ============================================================================

.DEFAULT_GOAL := help

# Display error if target doesn't exist
%:
	@echo "$(RED)✗ Unknown target: $@$(NC)"
	@echo "$(BLUE)Run 'make help' for available targets$(NC)"
	@exit 1
