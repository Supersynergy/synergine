# SuperStack Developer Toolkit

Comprehensive guide to the SuperStack automation scripts and Makefile for frictionless developer experience.

---

## Quick Start (30 seconds)

```bash
cd /path/to/superstack
make setup              # One-command setup (<3 minutes)
make start              # Start dev environment
make health             # Verify everything is running
```

---

## Overview

SuperStack includes **5 powerful automation scripts** + **Makefile** covering:

1. **setup.sh** — Complete initialization with one command
2. **health.sh** — Real-time system health monitoring
3. **backup.sh** — Automated backup & restore with rollback
4. **upgrade.sh** — Safe service upgrades with validation
5. **Makefile** — Quick shortcuts for all common tasks

---

## setup.sh - Complete One-Command Setup

### Purpose
Fully automated initialization targeting **<3 minutes** with parallel operations.

### Features
- **OS Detection** — Automatic macOS/Linux configuration
- **Architecture Detection** — arm64 vs amd64 support
- **Docker Prerequisite Check** — With Colima recommendation for macOS
- **Secure Passwords** — Auto-generates 13 secure environment variables
- **Parallel Image Pulls** — Speeds up Docker setup
- **NPM/Bun Detection** — Automatic package manager selection
- **Database Initialization** — Runs schema + optional seed data
- **Health Validation** — Confirms all services are operational

### Usage

```bash
# Full setup with seed data
./scripts/setup.sh

# Setup without seed data (faster)
./scripts/setup.sh --no-seed

# Setup with cached images (offline)
./scripts/setup.sh --offline

# From Makefile
make setup              # Full setup
make setup-no-seed      # Skip seed data
make setup-offline      # Use cached images
```

### What It Does

1. ✓ Checks prerequisites (Docker, git, Node/Bun, curl)
2. ✓ Creates `.env` from template
3. ✓ Generates 13 secure random passwords
4. ✓ **Pulls all Docker images in parallel**
5. ✓ Installs npm/bun dependencies
6. ✓ Starts SurrealDB and initializes schema
7. ✓ Optionally loads seed data
8. ✓ Validates all services
9. ✓ Prints completion report with URLs

### Output Example

```
╔════════════════════════════════════════════════════════════════╗
║ 🚀 SuperStack Setup
╚════════════════════════════════════════════════════════════════╝

🔍 Checking Prerequisites
...
✓ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setup completed in 87 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
  Start services: ./scripts/start.sh dev
  Check status:   ./scripts/status.sh

Key Resources:
  SurrealDB:    http://localhost:8000
  Dragonfly:    redis://localhost:6379
  NATS:         nats://localhost:4222
```

---

## health.sh - System Health Monitoring

### Purpose
Continuous health monitoring across all services with response time tracking.

### Features
- **Service Endpoint Checks** — Pings all 15 services
- **Response Time Tracking** — Millisecond precision
- **Database Connectivity** — Validates SurrealDB, Dragonfly, NATS
- **System Resources** — Disk/memory usage monitoring
- **Docker Health** — Daemon status and container count
- **Health Score** — Calculated percentage (0-100%)
- **JSON Output** — For monitoring integrations
- **Verbose Mode** — Detailed failure diagnostics

### Usage

```bash
# Quick health check
./scripts/health.sh

# With failure details
./scripts/health.sh --verbose

# JSON output for monitoring
./scripts/health.sh --json | jq .

# From Makefile
make health             # Quick check
make health-verbose     # With details
make health-json        # JSON format
```

### Monitored Services

```
Service Health:
  ✓ SurrealDB        [45ms]
  ✓ Dragonfly        [12ms]
  ✓ NATS             [8ms]
  ✓ Meilisearch      [23ms]
  ✓ Caddy            [18ms]
  ✓ SigNoz           [156ms]
  ⚠ Uptime Kuma      [timeout]
  ✓ Beszel           [67ms]
  ...

System Resources:
  ✓ Disk usage: 45% (healthy)
  ✓ Memory usage: 62% (healthy)
  ✓ Docker daemon is running
    → 8 container(s) running

Summary:
  Service Health:  13/15 checks passed
  Health Score:    87%
  Score Bar:       █████████████░░░░░░░░░░░░ 87%

⚠ Most systems operational (some issues detected)
```

### Response Times

- `<50ms` — Excellent
- `50-200ms` — Good
- `200-1000ms` — Acceptable (network latency)
- `timeout` — Service down

### JSON Output

```json
{
  "timestamp": "2024-03-16T13:42:00Z",
  "health_score": 87,
  "services": {
    "passed": 13,
    "failed": 2,
    "total": 15
  },
  "details": {
    "SurrealDB": { "status": "ok", "response_time_ms": 45 },
    "Uptime_Kuma": { "status": "fail", "response_time_ms": null }
  }
}
```

---

## backup.sh - Automated Backup & Restore

### Purpose
Complete backup of all services with restore capability and optional cloud upload.

### Features
- **SurrealDB Export** — Full table dumps to JSON
- **Dragonfly RDB Snapshot** — Redis-compatible snapshot
- **NATS JetStream Backup** — Stream & consumer data
- **Meilisearch Dumps** — Full search index backup
- **Docker Volume Backups** — Persistent volume snapshots
- **Timestamped Archives** — Automatic tar.gz compression
- **Manifest Generation** — Restore instructions included
- **SeaweedFS Upload** — Optional S3-compatible cloud backup
- **Automatic Cleanup** — Removes old backups (configurable retention)

### Usage

```bash
# Create backup
./scripts/backup.sh

# Create and upload to SeaweedFS
./scripts/backup.sh --upload

# Keep only last 5 backups
./scripts/backup.sh --keep 5

# Restore from backup
./scripts/backup.sh --restore superstack_backup_20240316_134200.tar.gz

# From Makefile
make backup             # Create backup
make backup-upload      # Upload to cloud
make restore BACKUP=file.tar.gz  # Restore
```

### Backup Structure

```
.backups/
└── superstack_backup_20240316_134200/
    ├── surreal/
    │   └── data_export_20240316_134200.json
    ├── dragonfly/
    │   └── dump_20240316_134200.rdb
    ├── nats/
    │   ├── jetstream_20240316_134200.json
    │   └── jetstream_store_20240316_134200/
    ├── meilisearch/
    │   └── dump_20240316_134200.dump
    ├── volumes/
    │   └── superstack-data_20240316_134200.tar.gz
    ├── logs/
    └── MANIFEST.txt

superstack_backup_20240316_134200.tar.gz  (compressed)
```

### Manifest Example

```
SuperStack Backup Manifest
==========================
Timestamp: 2024-03-16T13:42:00Z
Hostname: dev-machine

Included:
  - SurrealDB tables export
  - Dragonfly RDB snapshot
  - NATS JetStream data
  - Meilisearch dumps
  - Docker volume snapshots

Restore:
  ./scripts/backup.sh --restore superstack_backup_20240316_134200.tar.gz

Size: 245 MB
```

### Restoration Process

1. Extract backup archive
2. Restore SurrealDB from JSON exports
3. Copy Dragonfly RDB file
4. Restore NATS JetStream
5. Restore Meilisearch index
6. Restore Docker volumes

### Retention Policy

Default: Keep last 7 backups
```bash
make backup-keep ARGS=14   # Keep last 14
```

---

## upgrade.sh - Safe Service Upgrades

### Purpose
Rolling upgrades with health validation, automatic rollback on failure.

### Features
- **Image Comparison** — Shows which services have updates
- **Pre-upgrade Backup** — Automatic snapshot before changes
- **Rolling Restart** — One service at a time
- **Health Validation** — Confirms each service is healthy after restart
- **Automatic Rollback** — Restores backup on failure
- **Dry-run Mode** — Preview without changes
- **Service-specific Upgrade** — Update single service or all
- **Detailed Logging** — Track upgrade progress

### Usage

```bash
# Preview upgrade without changes
./scripts/upgrade.sh --dry-run

# Upgrade all services
./scripts/upgrade.sh

# Upgrade specific service
./scripts/upgrade.sh --service meilisearch

# Skip backup (fast, risky)
./scripts/upgrade.sh --skip-backup

# From Makefile
make upgrade            # Full upgrade
make upgrade-dry        # Preview
make upgrade-service SERVICE=meilisearch  # Single service
make upgrade-no-backup  # Fast upgrade
```

### Upgrade Process

```
[1/8] Upgrading: surrealdb
  → Restarting surrealdb...
  → Waiting for surrealdb to become healthy...
  ✓ surrealdb upgraded and healthy

[2/8] Upgrading: dragonfly
  → Restarting dragonfly...
  → Waiting for dragonfly to become healthy...
  ✓ dragonfly upgraded and healthy

[3/8] Upgrading: nats
  ...

✓ Upgrade completed successfully

Upgraded services:
  - surrealdb
  - dragonfly
  - nats
  - meilisearch
  - caddy

Rollback:
  ./scripts/backup.sh --restore superstack_backup_20240316_140000.tar.gz
```

### Dry-run Output

```
╔════════════════════════════════════════════════════════════════╗
║ 🚀 SuperStack Service Upgrade
╚════════════════════════════════════════════════════════════════╝

Service Versions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
surrealdb:      v1.4.2
dragonfly:      v0.18.0
nats:           v2.9.21
meilisearch:    v1.7.0
...

[DRY-RUN] Would pull: docker-compose pull
[DRY-RUN] Would create backup
[DRY-RUN] Would restart: surrealdb
[DRY-RUN] Would restart: dragonfly
...

DRY-RUN: No changes were made
```

---

## Makefile - Quick Reference

### Quick Commands

```bash
# Setup & Start
make setup              # Full one-command setup
make start              # Start dev environment (same as 'make dev')
make dev                # Start: core + gateway + search
make monitoring         # Start: + observability services
make full               # Start: + workflows
make all                # Start: everything

# Control
make stop               # Stop all services
make restart            # Restart all
make status             # Show service status

# Maintenance
make health             # Health check
make backup             # Create backup
make restore BACKUP=file.tar.gz  # Restore
make upgrade            # Upgrade services
make upgrade-dry        # Preview upgrade

# Database
make init-db            # Initialize schema
make seed-db            # Load seed data

# Logs
make logs               # Follow all logs
make logs-surrealdb     # Follow SurrealDB logs only
make log-tail           # Show last 100 lines

# Shells
make shell-surreal      # Interactive SurrealDB SQL shell
make shell-dragonfly    # Interactive Redis shell
make shell-nats         # NATS monitoring info

# Docker
make pull               # Pull latest images
make version            # Show all service versions

# Cleanup
make clean              # Remove containers, volumes, networks
make clean-containers   # Remove containers only
make clean-volumes      # Prune volumes

# Info
make docs               # Documentation links
make help               # Show all targets
```

### Advanced Commands

```bash
make health-verbose     # Health with error details
make health-json        # JSON format (for monitoring)
make backup-upload      # Backup and upload to SeaweedFS
make backup-keep ARGS=14  # Keep last N backups
make upgrade-service SERVICE=meilisearch  # Upgrade one service
make dev-reset          # Full clean and reset
make dev-logs           # Follow dev environment logs
```

### Profile Targets

```bash
make start-core         # Core services only
make start-dev          # Recommended for development
make monitoring         # Add monitoring to core
make full               # Core + Gateway + Search + Monitoring + Workflows
make all                # Everything (including optional)
```

---

## Common Workflows

### First-Time Setup

```bash
cd /path/to/superstack
make setup              # One-command setup
# ... grabs coffee while it installs ...
make status             # Verify everything
make health             # Check all services
```

### Daily Development

```bash
# Start with one command
make start

# Check health
make health

# Follow logs from specific service
make logs-surrealdb

# When done
make stop
```

### Before Making Changes

```bash
# Create backup first
make backup

# Do your work...

# If something breaks, restore
make restore BACKUP=superstack_backup_20240316_134200.tar.gz
```

### Upgrading Services

```bash
# Preview what will change
make upgrade-dry

# Create backup automatically
make upgrade

# Or skip backup for speed
make upgrade-no-backup
```

### Database Management

```bash
# Initialize schema
make init-db

# Load seed data
make seed-db

# Interactive SQL queries
make shell-surreal
```

### Monitoring & Debugging

```bash
# Quick health check
make health

# Verbose with error details
make health-verbose

# JSON for integrations
make health-json | jq .health_score

# Watch logs
make logs
make logs-surrealdb
make logs-caddy

# Interactive shell
make shell-dragonfly
```

---

## Environment Variables

### Generated by setup.sh

- `SURREALDB_PASSWORD` — Database password
- `DRAGONFLY_PASSWORD` — Cache/broker password
- `MEILI_MASTER_KEY` — Search engine API key
- `SIGNOZ_CLICKHOUSE_PASSWORD` — Monitoring database
- `LANGFUSE_NEXTAUTH_SECRET` — LLM monitoring auth
- `LANGFUSE_SALT` — LLM monitoring encryption
- `LANGFUSE_INIT_USER_PASSWORD` — LLM monitoring admin
- `WINDMILL_SECRET` — Workflow engine secret
- `WINDMILL_DB_PASSWORD` — Workflow database
- `LISTMONK_DB_PASSWORD` — Newsletter database
- `LISTMONK_ADMIN_PASSWORD` — Newsletter admin
- `UMAMI_APP_SECRET` — Analytics secret
- `UMAMI_DB_PASSWORD` — Analytics database

All other variables use safe defaults or are optional.

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| SurrealDB | 8000 | http://localhost:8000 |
| Dragonfly | 6379 | redis://localhost:6379 |
| NATS | 4222 | nats://localhost:4222 |
| NATS Monitor | 8222 | http://localhost:8222 |
| Meilisearch | 7700 | http://localhost:7700 |
| Caddy | 80/443 | http://localhost:80 |
| SigNoz | 3301 | http://localhost:3301 |
| Uptime Kuma | 3200 | http://localhost:3200 |
| Beszel | 8090 | http://localhost:8090 |
| Windmill | 8100 | http://localhost:8100 |
| Langfuse | 3100 | http://localhost:3100 |
| Listmonk | 9000 | http://localhost:9000 |
| Umami | 3500 | http://localhost:3500 |
| SeaweedFS Master | 9333 | http://localhost:9333 |
| SeaweedFS Volume | 8080 | http://localhost:8080 |
| SeaweedFS S3 | 8333 | http://localhost:8333 |

---

## Troubleshooting

### Setup Takes Too Long

```bash
# Use offline mode if images are cached
make setup-offline

# Skip seed data (adds ~30 seconds)
make setup-no-seed

# Check what's running
make status

# Follow startup logs
make logs
```

### Service Not Responding

```bash
# Check health status
make health-verbose

# Look at logs
make logs-SERVICE_NAME

# Restart service
make restart

# For persistent issues, check disk/memory
df -h
free -m
```

### Need to Restore

```bash
# List available backups
ls -lah .backups/superstack_backup*.tar.gz

# Restore specific backup
make restore BACKUP=.backups/superstack_backup_20240316_130000.tar.gz
```

### Clean Everything

```bash
# Full cleanup (removes all data)
make clean

# Then setup fresh
make setup
```

### Database Locked

```bash
# Reinitialize schema
make init-db

# Restart SurrealDB
make restart
docker-compose up -d surrealdb
```

---

## Performance Tips

### Parallel Operations

- `setup.sh` pulls all images in parallel (much faster than sequential)
- `backup.sh` backs up multiple services concurrently
- `upgrade.sh` does rolling restarts (fast + safe)

### Disk Space

Regular cleanup of old backups:

```bash
# Keep only last 5 backups
make backup-keep ARGS=5
```

### Network Optimization

For slow internet, use cached images:

```bash
make setup-offline
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Setup SuperStack
  run: make setup

- name: Health Check
  run: make health-json | jq .health_score

- name: Run Tests
  run: make test

- name: Create Backup
  run: make backup

- name: Upgrade Services
  run: make upgrade --dry-run
```

### Monitoring Integration

```bash
# Get JSON health for monitoring systems
./scripts/health.sh --json | curl -X POST \
  -H "Content-Type: application/json" \
  -d @- \
  https://monitoring.example.com/api/health
```

---

## Contributing

These scripts and Makefile are designed to be:
- **Maintainable** — Clear structure, extensive comments
- **Extensible** — Easy to add new services or targets
- **Robust** — Error handling, health validation, rollback

To add a new script:

1. Create `/scripts/new-script.sh` with proper error handling
2. Add corresponding Makefile target
3. Update DEVELOPER_TOOLKIT.md with usage
4. Test thoroughly before committing

---

## Support & Documentation

- **General Help**: `make help`
- **Script Help**: `./scripts/setup.sh -h`
- **Configuration**: See `CONFIG.md`
- **Quick Start**: See `QUICK_START.md`
- **SDK Details**: See `SDK.md`

---

**Last Updated:** March 16, 2024
**SuperStack Version:** 1.0+
