# SuperStack Configuration Guide

This document describes the configuration files and management scripts for the SuperStack project.

## Configuration Files

### 1. Caddyfile (`config/Caddyfile`)

**Purpose:** Reverse proxy configuration for routing traffic to all services.

**Key Features:**
- Global ACME email configuration (from `ACME_EMAIL` environment variable)
- Self-signed certificate support for local development
- CORS headers middleware for API routes
- Rate limiting snippet for DDoS protection
- Service routes with automatic request forwarding

**Service Routes:**
```
localhost:80 / localhost:443    → Main dashboard (port 3000)
/api/surreal                     → SurrealDB (port 8000)
/api/search                      → Meilisearch (port 7700)
/nats                            → NATS monitoring (port 8222)
/monitoring                      → SigNoz (port 3301)
/langfuse                        → Langfuse (port 3100)
/windmill                        → Windmill (port 8100)
/uptime                          → Uptime Kuma (port 3200)
/analytics                       → Umami (port 3500)
```

**Configuration Patterns:**
- Response compression (gzip)
- JSON logging to stdout
- X-Forwarded headers for upstream service transparency
- Streaming support for WebSocket and streaming protocols
- Health check proxying

**Environment Variables:**
- `ACME_EMAIL` - Email for ACME certificate registration (default: admin@example.com)

**Usage:**
The Caddyfile is automatically loaded by the Caddy container via docker-compose. To apply changes:
```bash
docker-compose restart caddy
```

---

### 2. NATS Configuration (`config/nats.conf`)

**Purpose:** NATS server configuration with JetStream persistence and security.

**Key Features:**
- JetStream enabled for persistent message streaming
- Token-based authorization
- Cluster support for high availability
- Comprehensive logging
- Connection limits and payload restrictions

**JetStream Settings:**
- Max memory store: 512 MB (in-memory messages)
- Max file store: 2 GB (persistent storage)
- Storage directory: `/data/jetstream`

**Network Ports:**
```
4222   - Client connections
6222   - Cluster communication
8222   - HTTP monitoring dashboard
```

**Authorization:**
Uses environment variables for credentials:
- `NATS_AUTH_TOKEN` - Default token for clients
- `NATS_ADMIN_PASSWORD` - Admin user password
- `NATS_APP_PASSWORD` - Application user password
- `NATS_MONITOR_PASSWORD` - Monitoring user password

**Default Users:**
1. **admin** - Full permissions (publish/subscribe to all topics)
2. **app** - Restricted to `app.*` topics
3. **monitor** - Read-only system monitoring

**Performance Settings:**
- Max payload: 1 MB
- Max connections: 1024
- Ping interval: 2 minutes
- Write deadline: 10 seconds

**Usage:**
The NATS config is mounted from `config/nats.conf` in the container. To update:
```bash
# 1. Edit config/nats.conf
vim config/nats.conf

# 2. Restart NATS
docker-compose restart nats
```

---

## Management Scripts

### 1. Start Script (`scripts/start.sh`)

**Purpose:** Unified service startup with profile selection.

**Usage:**
```bash
./start.sh [profile]
```

**Available Profiles:**
- **core** - Foundation services only (SurrealDB, Dragonfly, NATS)
- **dev** - Development stack (core + Caddy + Meilisearch) - *recommended*
- **monitoring** - Observability (core + SigNoz, Uptime Kuma, Beszel)
- **full** - Complete stack (core + gateway + search + monitoring + workflows)
- **all** - Everything including optional services

**Default Profile:** dev

**Examples:**
```bash
# Start development stack
./start.sh dev

# Start with monitoring
./start.sh monitoring

# Start everything
./start.sh all

# Start with default (dev)
./start.sh
```

**What It Does:**
1. Validates Docker and Docker Compose installation
2. Checks project configuration files
3. Creates superstack-net Docker network if needed
4. Starts selected services
5. Waits for services to be ready (port check)
6. Displays service URLs and port mappings

**Service Readiness Checks:**
- SurrealDB: port 8000
- NATS: port 4222
- Meilisearch: port 7700
- Caddy: port 80

---

### 2. Stop Script (`scripts/stop.sh`)

**Purpose:** Graceful shutdown of all services with optional data cleanup.

**Usage:**
```bash
./stop.sh [OPTIONS]
```

**Options:**
- `--clean` - Remove Docker volumes (WARNING: destructive, removes all data)
- `--force` - Force stop without waiting for graceful shutdown (useful for hung containers)
- `-h, --help` - Show help

**Examples:**
```bash
# Graceful shutdown (data preserved)
./stop.sh

# Force stop all containers immediately
./stop.sh --force

# Stop and remove all volumes and data
./stop.sh --clean

# Force stop and remove volumes
./stop.sh --force --clean
```

**What It Does:**
1. Checks prerequisites (Docker, docker-compose)
2. Displays currently running services
3. Gracefully stops all services (60 second timeout)
4. Optionally removes volumes (with confirmation prompt)
5. Cleans up dangling containers
6. Displays final status and next steps

**Data Preservation:**
- Without `--clean`: All data is preserved in Docker volumes
- With `--clean`: All data is permanently deleted (requires confirmation)

---

### 3. Status Script (`scripts/status.sh`)

**Purpose:** Monitor service health, port mappings, and resource usage.

**Usage:**
```bash
./status.sh [OPTIONS]
```

**Options:**
- `--detailed` - Show detailed resource usage and recent logs
- `--watch` - Continuously update status (refresh every 2 seconds)
- `-h, --help` - Show help

**Examples:**
```bash
# Show current status
./status.sh

# Show with detailed stats and logs
./status.sh --detailed

# Monitor in real-time
./status.sh --watch

# Watch with detailed info (piped)
./status.sh --watch | grep -A5 "SurrealDB"
```

**What It Shows:**

**Overall Status Section:**
- Service state (running/paused/stopped)
- Health status (healthy/unhealthy/none)
- Total, running, and stopped service counts

**Port Mappings Section:**
- Container names with status indicators
- Mapped ports for each service
- Protocol/port associations

**Network Status Section:**
- Docker network existence and connectivity
- Connected containers and IP addresses

**Resource Usage Section:**
- CPU usage per container
- Memory usage and limits
- Sortable by service name

**Recent Logs (--detailed only):**
- Last 5 log lines per service
- Useful for debugging startup issues

---

## Configuration Workflow

### Initial Setup

```bash
# 1. Navigate to project
cd /Users/master/superstack

# 2. Start development stack
./scripts/start.sh dev

# 3. Check status
./scripts/status.sh

# 4. View service URLs (printed by start.sh)
open http://localhost/
```

### Development Usage

```bash
# Monitor services in real-time
./scripts/status.sh --watch

# View logs with details
./scripts/status.sh --detailed

# Make configuration changes
vim config/Caddyfile
vim config/nats.conf

# Restart affected service
docker-compose restart caddy
docker-compose restart nats

# Stop for the day
./scripts/stop.sh
```

### Troubleshooting

```bash
# Check detailed status
./scripts/status.sh --detailed

# Force stop hung containers
./scripts/stop.sh --force

# Start fresh (removes all data)
./scripts/stop.sh --clean
./scripts/start.sh dev

# View specific service logs
docker-compose logs -f surrealdb

# Access service directly
curl http://localhost:8000/health     # SurrealDB
curl http://localhost:8222/varz       # NATS
curl http://localhost:7700/health     # Meilisearch
```

---

## Environment Variables

Create a `.env` file in the project root for configuration:

```bash
# ACME Configuration
ACME_EMAIL=admin@example.com

# NATS Authentication
NATS_AUTH_TOKEN=your_default_token_here
NATS_ADMIN_PASSWORD=admin_password_here
NATS_APP_PASSWORD=app_password_here
NATS_MONITOR_PASSWORD=monitor_password_here

# Service Ports (optional overrides)
SURREALDB_PORT=8000
NATS_PORT=4222
MEILISEARCH_PORT=7700
CADDY_HTTP_PORT=80
CADDY_HTTPS_PORT=443
```

---

## Service-Specific Configuration

### SurrealDB
- **Port:** 8000
- **Features:** Multi-model database with SQL, graph, and document capabilities
- **Storage:** Persisted in Docker volume `superstack_surrealdb`
- **Configuration:** Edit docker-compose.yml environment section

### Dragonfly (Redis)
- **Port:** 6379
- **Features:** Redis-compatible in-memory cache
- **Use Cases:** Session storage, caching, pub/sub
- **Configuration:** Via docker-compose environment

### NATS
- **Ports:** 4222 (client), 8222 (monitoring), 6222 (cluster)
- **Config File:** config/nats.conf
- **Features:** JetStream, clustering, authorization
- **Monitoring:** http://localhost:8222 or http://localhost/nats

### Caddy
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Config File:** config/Caddyfile
- **Features:** Automatic TLS, reverse proxy, rate limiting
- **Management API:** http://localhost:2019 (localhost only)

### Meilisearch
- **Port:** 7700
- **Features:** Full-text search, faceted search, typo tolerance
- **API Route:** http://localhost/api/search

### Monitoring Stack
- **SigNoz:** http://localhost:3301 or http://localhost/monitoring
- **Uptime Kuma:** http://localhost:3200 or http://localhost/uptime
- **Beszel:** http://localhost:8090

---

## Port Reference

| Service | Port | Type | Route | Status |
|---------|------|------|-------|--------|
| Dashboard | 3000 | HTTP | `/` | app-specific |
| SurrealDB | 8000 | HTTP | `/api/surreal` | core |
| Meilisearch | 7700 | HTTP | `/api/search` | dev+ |
| NATS Client | 4222 | TCP | `nats://` | core |
| NATS Cluster | 6222 | TCP | internal | core |
| NATS Monitor | 8222 | HTTP | `/nats` | core |
| Dragonfly | 6379 | TCP | direct | core |
| Caddy HTTP | 80 | HTTP | reverse proxy | dev+ |
| Caddy HTTPS | 443 | HTTPS | reverse proxy | dev+ |
| Caddy API | 2019 | HTTP | internal | dev+ |
| SigNoz | 3301 | HTTP | `/monitoring` | monitoring+ |
| Uptime Kuma | 3200 | HTTP | `/uptime` | monitoring+ |
| Beszel | 8090 | HTTP | direct | monitoring+ |
| Windmill | 8100 | HTTP | `/windmill` | full+ |
| Langfuse | 3100 | HTTP | `/langfuse` | full+ |
| Umami | 3500 | HTTP | `/analytics` | full+ |

---

## Performance Tuning

### Memory Limits
Edit docker-compose.yml `deploy.resources.limits`:
```yaml
services:
  nats:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### CPU Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
    reservations:
      cpus: '1'
```

### NATS JetStream Storage
Adjust in `config/nats.conf`:
```
jetstream {
    max_memory_store: 1G      # Increase for more cached messages
    max_file_store: 5G        # Increase for more historical data
}
```

### Caddy Rate Limiting
Adjust in `config/Caddyfile`:
```
rate_limit {
    zone general {
        key {remote_host}
        rate 1000r/s            # Increase request limit
    }
}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000    # Replace with your port

# Kill process
kill -9 <PID>

# Or restart Docker
docker-compose down
docker-compose up -d
```

### Service Won't Start
```bash
# Check logs
docker-compose logs surrealdb    # Replace with service name

# Check resource limits
./scripts/status.sh --detailed

# Increase Docker memory/CPU limits in Docker Desktop settings
```

### NATS Connection Refused
```bash
# Verify NATS is running
./scripts/status.sh | grep nats

# Check auth configuration
cat config/nats.conf | grep -A5 authorization

# Verify credentials match environment variables
env | grep NATS
```

### Caddy SSL Errors (localhost)
For local development with self-signed certs:
```bash
# Trust the certificate (macOS)
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem
```

---

## Backup & Restore

### Backup All Data
```bash
docker-compose exec surrealdb tar czf - /data > surrealdb.tar.gz
docker-compose exec nats tar czf - /data/jetstream > jetstream.tar.gz
```

### Restore Data
```bash
docker-compose exec -T surrealdb tar xzf - < surrealdb.tar.gz
docker-compose exec -T nats tar xzf - < jetstream.tar.gz
```

### Clean Reset
```bash
# Stop and remove all volumes
./scripts/stop.sh --clean

# Start fresh
./scripts/start.sh dev
```

---

## Security Notes

### Production Deployment
1. Change all default passwords in `.env`
2. Enable TLS with valid certificates (not self-signed)
3. Use strong NATS authentication tokens
4. Restrict Caddy admin API to localhost only
5. Enable CORS only for trusted origins
6. Use Docker network isolation (superstack-net)

### Credential Management
- Never commit `.env` to version control
- Use a secrets manager (Vault, AWS Secrets, etc.)
- Rotate credentials regularly
- Use different credentials for different environments

---

## Support & Documentation

For detailed documentation on each service:
- **SurrealDB:** https://surrealdb.com/docs
- **NATS:** https://docs.nats.io/
- **Caddy:** https://caddyserver.com/docs
- **Meilisearch:** https://docs.meilisearch.com/
- **SigNoz:** https://signoz.io/docs/

For SuperStack specific issues:
1. Check service logs: `./scripts/status.sh --detailed`
2. Verify network connectivity: `./scripts/status.sh`
3. Review configuration files in `config/`
