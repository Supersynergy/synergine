# SuperStack Quick Commands Cheatsheet

Get started and manage SuperStack in 30 seconds.

## Setup (First Time)

```bash
cd /path/to/superstack
make setup              # Complete setup in <3 minutes
```

That's it. Everything is automated.

## Daily Use

```bash
make start              # Start dev environment
make status             # Check what's running
make health             # Verify all services
make stop               # Stop everything
```

## Check Logs

```bash
make logs               # Follow all logs (Ctrl+C to stop)
make logs-surrealdb     # Follow specific service
make log-tail           # Show last 100 lines
```

## Before Making Changes

```bash
make backup             # Create timestamped backup
# ... make your changes ...
make restore BACKUP=superstack_backup_20240316_134200.tar.gz  # If needed
```

## Database Operations

```bash
make init-db            # Initialize schema
make seed-db            # Load sample data
make shell-surreal       # Interactive SQL shell
```

## System Health

```bash
make health             # Quick health check
make health-verbose     # With error details
make health-json        # JSON for monitoring
```

## Docker Management

```bash
make version            # Show all service versions
make pull               # Pull latest images
make upgrade            # Upgrade all services
make upgrade-dry        # Preview upgrade (no changes)
make clean              # Remove everything (careful!)
```

## Interactive Shells

```bash
make shell-surreal      # SurrealDB SQL terminal
make shell-dragonfly    # Dragonfly (Redis) terminal
make shell-nats         # NATS monitoring info
```

## Profiles

```bash
make start-core         # Core only (SurrealDB, Dragonfly, NATS)
make dev                # Dev stack (core + gateway + search)
make monitoring         # + monitoring services
make full               # + workflows
make all                # Everything
```

## Advanced

```bash
# Backup & upload
make backup-upload              # Create & upload to SeaweedFS
make backup-keep ARGS=5         # Keep only last 5 backups

# Service-specific upgrade
make upgrade-service SERVICE=meilisearch

# Full reset
make clean && make setup

# Follow dev logs
make dev-logs

# Build SDK
make build-sdk

# Run tests
make test
```

## Help

```bash
make help               # Show all targets
./scripts/setup.sh -h   # Setup script help
./scripts/health.sh -h  # Health script help
./scripts/backup.sh -h  # Backup script help
./scripts/upgrade.sh -h # Upgrade script help
```

## Common Issues

**Services not starting?**
```bash
make clean && make setup
```

**Disk space full?**
```bash
make clean-volumes
make backup-keep ARGS=3  # Keep only last 3
```

**Need to restore?**
```bash
ls .backups/superstack_backup*.tar.gz    # List backups
make restore BACKUP=.backups/superstack_backup_20240316_130000.tar.gz
```

**Service not responding?**
```bash
make health-verbose     # See what's down
make restart            # Restart everything
make logs               # Check for errors
```

---

## Service URLs (When Running)

| Service | URL |
|---------|-----|
| SurrealDB | http://localhost:8000 |
| Meilisearch | http://localhost:7700 |
| NATS Monitor | http://localhost:8222 |
| Caddy | http://localhost:80 |
| SigNoz | http://localhost:3301 |
| Uptime Kuma | http://localhost:3200 |
| Windmill | http://localhost:8100 |
| Langfuse | http://localhost:3100 |

---

See **DEVELOPER_TOOLKIT.md** for complete documentation.
