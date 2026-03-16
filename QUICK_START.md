# SuperStack Quick Start Guide

## Installation & First Run

### Prerequisites
- Docker & Docker Compose installed
- Git (for cloning the project)
- Terminal/Shell access

### First Run (2-3 minutes)

```bash
# 1. Navigate to SuperStack directory
cd /Users/master/superstack

# 2. Start the development stack (default profile)
./scripts/start.sh dev

# 3. Wait for services to be ready (~30-60 seconds)
# The script will show "Service URLs" when complete

# 4. Open your browser
open http://localhost/

# 5. Access individual services
# SurrealDB:   http://localhost:8000
# Meilisearch: http://localhost:7700
# NATS:        http://localhost:8222
# SigNoz:      http://localhost:3301
```

---

## Daily Workflow

### Morning Startup
```bash
cd /Users/master/superstack
./scripts/start.sh dev
./scripts/status.sh --watch    # Monitor in another terminal
```

### Monitor Status
```bash
# Quick status check
./scripts/status.sh

# Real-time monitoring
./scripts/status.sh --watch

# Detailed with logs
./scripts/status.sh --detailed
```

### Check Service Health
```bash
# SurrealDB health
curl http://localhost:8000/health

# NATS status
curl http://localhost:4222

# Meilisearch health
curl http://localhost:7700/health
```

### Evening Shutdown
```bash
./scripts/stop.sh

# Or with confirmation to remove data
./scripts/stop.sh --clean
```

---

## Common Tasks

### Restart a Service
```bash
# Restart NATS
docker-compose restart nats

# Restart Caddy
docker-compose restart caddy

# Restart SurrealDB
docker-compose restart surrealdb
```

### View Service Logs
```bash
# Last 50 lines
docker-compose logs -n 50 surrealdb

# Follow logs in real-time
docker-compose logs -f nats

# All services
docker-compose logs
```

### Start Specific Services Only
```bash
# Just the core (database, cache, messaging)
./scripts/start.sh core

# Core + development tools
./scripts/start.sh dev

# Full stack with monitoring
./scripts/start.sh full
```

### Access Service Data

#### SurrealDB
```bash
# Query via HTTP (requires surql-cli or similar)
curl -X POST http://localhost:8000/sql \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users"}'
```

#### NATS JetStream
```bash
# Access via NATS CLI
nats --server=nats://localhost:4222 --creds=<creds_file> stream list

# Or use the web dashboard
open http://localhost:8222
```

#### Meilisearch
```bash
# List indexes
curl http://localhost:7700/indexes

# Search
curl http://localhost:7700/multi-search \
  -H "Content-Type: application/json" \
  -d '{"queries": [{"indexUid": "products", "q": "laptop"}]}'
```

---

## Available Profiles

```bash
# Foundation services only
./scripts/start.sh core          # SurrealDB, Dragonfly, NATS

# Development (recommended)
./scripts/start.sh dev           # core + Caddy + Meilisearch

# With monitoring
./scripts/start.sh monitoring    # core + SigNoz, Uptime Kuma, Beszel

# Complete stack
./scripts/start.sh full          # core + dev + monitoring + Windmill

# Everything
./scripts/start.sh all           # All optional services included
```

---

## Service URLs Reference

| Service | Local URL | Via Caddy |
|---------|-----------|-----------|
| **Dashboard** | http://localhost:3000 | http://localhost/ |
| **SurrealDB** | http://localhost:8000 | http://localhost/api/surreal |
| **Meilisearch** | http://localhost:7700 | http://localhost/api/search |
| **NATS Monitoring** | http://localhost:8222 | http://localhost/nats |
| **SigNoz** | http://localhost:3301 | http://localhost/monitoring |
| **Uptime Kuma** | http://localhost:3200 | http://localhost/uptime |
| **Windmill** | http://localhost:8100 | http://localhost/windmill |
| **Langfuse** | http://localhost:3100 | http://localhost/langfuse |
| **Umami** | http://localhost:3500 | http://localhost/analytics |

---

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check logs
./scripts/status.sh --detailed

# Force restart
./scripts/stop.sh --force
./scripts/start.sh dev
```

### Port conflicts
```bash
# Find what's using a port (e.g., port 8000)
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use Docker to free ports
docker-compose down
```

### Service health check fails
```bash
# View full logs for a service
docker-compose logs surrealdb

# Check resource usage
./scripts/status.sh --detailed

# Increase Docker memory/CPU in Docker Desktop
```

### Network issues
```bash
# Check if Docker network exists
docker network ls | grep superstack

# Restart network
docker-compose down
docker-compose up -d

# View network status
./scripts/status.sh | grep -A 5 "Network Status"
```

### Clean slate (WARNING: loses all data)
```bash
./scripts/stop.sh --clean
./scripts/start.sh dev
```

---

## Configuration

### Edit Caddy Proxy Rules
```bash
vim config/Caddyfile
docker-compose restart caddy
```

### Edit NATS Settings
```bash
vim config/nats.conf
docker-compose restart nats
```

### Environment Variables
Create `.env` file:
```bash
ACME_EMAIL=your-email@example.com
NATS_ADMIN_PASSWORD=your_password
NATS_APP_PASSWORD=your_app_password
```

---

## Performance

### Monitor CPU & Memory
```bash
./scripts/status.sh --watch
```

### Increase Storage (NATS JetStream)
```bash
vim config/nats.conf

# Edit these lines:
# max_memory_store: 512M  → 1G or 2G
# max_file_store: 2G      → 5G or 10G

docker-compose restart nats
```

### Increase Caddy Rate Limits
```bash
vim config/Caddyfile

# Find rate_limit section and adjust:
# rate 100r/s  → 1000r/s (or higher)

docker-compose restart caddy
```

---

## Tips & Tricks

### Continuous monitoring
```bash
./scripts/status.sh --watch
```

### View logs while services start
```bash
# In one terminal
./scripts/start.sh dev

# In another
docker-compose logs -f
```

### Test connectivity to services
```bash
# Test all ports
for port in 8000 4222 7700 80; do
  nc -zv localhost $port
done
```

### Backup before major changes
```bash
# Stop services but keep data
./scripts/stop.sh

# Or clean up and start fresh
./scripts/stop.sh --clean
./scripts/start.sh dev
```

---

## Getting Help

### Check documentation
```bash
# Full configuration guide
cat CONFIG.md

# View a service's health
curl http://localhost:8000/health    # SurrealDB
curl http://localhost:7700/health    # Meilisearch
```

### View logs
```bash
# Most recent logs
docker-compose logs -n 100

# Specific service
docker-compose logs surrealdb

# Follow in real-time
docker-compose logs -f nats
```

### Status summary
```bash
./scripts/status.sh --detailed
```

---

## Next Steps

1. **Explore the dashboard**: http://localhost/
2. **Set up your database**: http://localhost:8000
3. **Configure search**: http://localhost:7700
4. **Monitor health**: http://localhost:8222 (NATS)
5. **Read full docs**: See CONFIG.md for detailed configuration

---

**Happy developing! 🚀**
