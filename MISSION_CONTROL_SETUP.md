# Mission Control Setup — Synergine Framework Update

## Overview

Added Mission Control visualization and container management services to the Synergine framework with Cube.js semantic analytics, Docker log aggregation, and container lifecycle management.

**Profile:** `dashboard` (optional, starts with `--profile dashboard`)

## Services Added

### 1. Cube.js (Semantic Analytics Layer)
- **Container:** `superstack-cube`
- **Image:** `cubejs/cube:latest`
- **Ports:** 4000 (API), 4001 (Playground)
- **Profile:** `dashboard`
- **Purpose:** Semantic data modeling and OLAP analytics layer for cross-stack insights
- **Features:**
  - Pre-aggregated schema for agents, tasks, companies, and deals
  - Real-time query engine
  - Playground UI for ad-hoc analytics
  - API-first architecture

**Environment Variables:**
```bash
CUBE_PORT=4000                          # API port
CUBE_PLAYGROUND_PORT=4001              # Playground port
CUBE_API_SECRET=superstack-cube-secret # API authentication secret
```

**Access:**
- API: `http://localhost:4000` or via Caddy reverse proxy at `/cube`
- Playground: `http://localhost:4001`

### 2. Dozzle (Real-Time Log Viewer)
- **Container:** `superstack-dozzle`
- **Image:** `amir20/dozzle:latest`
- **Port:** 9999
- **Profile:** `dashboard`
- **Purpose:** Real-time Docker log aggregation and visualization
- **Features:**
  - Live log streaming from all containers
  - Docker socket integration
  - Lightweight, read-only access
  - No authentication required (runs in read-only mode)

**Environment Variables:**
```bash
DOZZLE_PORT=9999  # Web UI port
```

**Access:**
- UI: `http://localhost:9999` or via Caddy reverse proxy at `/logs`

### 3. Portainer CE (Container Management UI)
- **Container:** `superstack-portainer`
- **Image:** `portainer/portainer-ce:latest`
- **Port:** 9443 (HTTPS)
- **Profile:** `dashboard`
- **Volume:** `portainer-data` (persistent storage)
- **Purpose:** Full-featured container, image, and volume management
- **Features:**
  - Docker container lifecycle management
  - Image registry management
  - Volume and network management
  - User/team management
  - RBAC support
  - Persistent configuration via named volume

**Environment Variables:**
```bash
PORTAINER_PORT=9443  # HTTPS API/UI port
```

**Access:**
- UI: `https://localhost:9443` (self-signed certificate)
- Setup admin user on first visit
- Via Caddy reverse proxy at `/containers` (if SSL configured)

**First-Time Setup:**
1. Visit `https://localhost:9443`
2. Accept self-signed certificate warning
3. Create admin user
4. Select Docker (local connection) or connect to remote Docker daemon

## Cube.js Schema Files

Located in `/services/cube/schema/`:

### Agents.js
- **Measures:** count, activeCount, inactiveCount, avgActivityScore, etc.
- **Dimensions:** id, name, role, status, model, tier, createdAt, updatedAt, lastActiveAt
- **Pre-aggregations:** by status, by role

### Tasks.js
- **Measures:** count, completedCount, failedCount, runningCount, avgDuration, totalDuration, successRate
- **Dimensions:** id, name, type, status, priority, agentId, dates (createdAt, startedAt, completedAt)
- **Pre-aggregations:** by status, by type, by agent

### Companies.js
- **Measures:** count, activeCount, leadCount, customerCount, avgEmployeeCount, totalRevenue, avgRevenue
- **Dimensions:** id, name, website, status, industry, size, country, employeeCount, annualRevenue, dates
- **Pre-aggregations:** by status, by industry, by size

### Deals.js
- **Measures:** count, wonCount, lostCount, activeCount, totalValue, avgDealSize, maxDealSize, minDealSize, avgSalesCycle
- **Dimensions:** id, title, companyId, status, stage, amount, currency, probability, ownerId, dates
- **Pre-aggregations:** by status, by stage, by owner, forecast view

## Caddyfile Routes Added

Three new reverse proxy routes added to `/config/Caddyfile`:

```caddyfile
# Cube.js semantic analytics layer
http://localhost/cube, https://localhost/cube → http://cube:4000

# Dozzle — Docker log viewer
http://localhost/logs, https://localhost/logs → http://dozzle:8080

# Portainer — Container management
http://localhost/containers, https://localhost/containers → http://portainer:9443
```

All routes include:
- CORS headers (except Portainer, which has more restrictive security)
- X-Forwarded-* headers for proper request context
- Streaming support (for real-time features)
- Gzip compression

## Usage

### Start Full Stack with Dashboard Services

```bash
# Copy and configure environment
cp env.example .env
# Edit .env and set secrets (CUBE_API_SECRET, DOZZLE_, PORTAINER_)

# Start core + gateway + dashboard services
docker compose --profile gateway --profile dashboard up -d

# Or start all services (core, gateway, search, monitoring, workflows, storage, email, dashboard)
docker compose --profile gateway --profile search --profile monitoring \
  --profile workflows --profile storage --profile email --profile dashboard up -d
```

### Start Just the Dashboard (requires core)

```bash
docker compose --profile dashboard up -d
```

### Access Services

**After starting with `--profile gateway`:**
- Cube.js API: `http://localhost/cube`
- Cube.js Playground: `http://localhost:4001` (direct, not proxied)
- Logs: `http://localhost/logs`
- Containers: `http://localhost/containers`

**Without gateway (direct access):**
- Cube.js: `http://localhost:4000`, `http://localhost:4001`
- Dozzle: `http://localhost:9999`
- Portainer: `https://localhost:9443`

## Resource Requirements

Total additional resource allocation:

| Service    | CPU Limit | Memory Limit | Memory Reserved |
|-----------|-----------|--------------|-----------------|
| Cube.js   | 1.0 core  | 1 GB         | 512 MB          |
| Dozzle    | 0.25 core | 128 MB       | (minimal)       |
| Portainer | 0.5 core  | 256 MB       | (minimal)       |
| **Total** | **1.75**  | **1.38 GB**  | **512 MB**      |

Recommended minimum: 4 CPU cores, 4 GB RAM (for core + all optional services)

## Environment Variables Required

Add to `.env`:

```bash
# Cube.js
CUBE_PORT=4000
CUBE_API_SECRET=CHANGE_ME_run_openssl_rand_base64_32

# Dozzle
DOZZLE_PORT=9999

# Portainer
PORTAINER_PORT=9443
```

## Troubleshooting

### Cube.js Health Check Fails
- Verify network connectivity: `docker exec superstack-cube curl -f http://localhost:4000/readyz`
- Check logs: `docker logs superstack-cube`
- Ensure `curl` is available in container (may need base image change if using slim variant)

### Portainer Can't Connect to Docker Socket
- Verify socket mount: `ls -l /var/run/docker.sock`
- Check container has socket access: `docker exec superstack-portainer ls -l /var/run/docker.sock`
- On Windows/Mac with Docker Desktop, socket mount location may differ

### Dozzle Shows No Logs
- Verify socket mount: same as Portainer
- Dozzle runs in read-only mode; this is expected for security
- Check container logging: `docker logs superstack-dozzle`

### Reverse Proxy Routes Not Working
- Verify Caddy container is running: `docker ps | grep caddy`
- Check Caddyfile syntax: `docker logs superstack-caddy | grep -i error`
- Verify service containers are on superstack network: `docker network inspect superstack`

## Next Steps

### 1. Configure Cube.js Database Connection

For PostgreSQL:
```javascript
// In cube environment
CUBEJS_DB_HOST=surrealdb
CUBEJS_DB_PORT=8000
CUBEJS_DB_NAME=your_database
CUBEJS_DB_USER=your_user
CUBEJS_DB_PASS=your_password
```

### 2. Create Additional Cube.js Cubes

Based on your specific data models (e.g., Projects, Issues, Metrics, Pipelines)

### 3. Set Up Portainer Teams

For multi-user access with role-based permissions

### 4. Configure Dozzle Authentication

If exposing externally, implement authentication via reverse proxy or Dozzle's built-in features

### 5. Monitoring Integration

- Connect SigNoz (monitoring profile) to track health of dashboard services
- Set up Langfuse for LLM-based analytics (if using AI-driven insights)
- Link Uptime Kuma to monitor dashboard availability

## Files Modified

1. **docker-compose.yml**
   - Added `cube`, `dozzle`, `portainer` services (lines 1105-1182)
   - Added `portainer-data` volume (line 82)

2. **config/Caddyfile**
   - Added routes for `/cube`, `/logs`, `/containers` (lines 208-254)

3. **env.example**
   - Added `CUBE_*`, `DOZZLE_*`, `PORTAINER_*` variables (lines 170-197)

4. **services/cube/schema/**
   - Created `Agents.js` (agent metrics and dimensions)
   - Created `Tasks.js` (task execution analytics)
   - Created `Companies.js` (company/business data)
   - Created `Deals.js` (sales pipeline analytics)

## Schema Extensibility

The Cube.js schemas are templates. To customize:

1. **Add new measures:** Insert under `measures:` object with type (count, sum, avg, max, min)
2. **Add new dimensions:** Insert under `dimensions:` object with SQL column references
3. **Add pre-aggregations:** Optimize query performance by materializing common aggregate patterns
4. **Connect to other cubes:** Use `${OTHER_CUBE}.dimension` for cross-cube analysis

Example:
```javascript
cube(`CustomMetric`, {
  sql: `SELECT * FROM my_table`,
  measures: {
    myMetric: { type: `sum`, sql: `${CUBE}.value` }
  },
  dimensions: {
    category: { sql: `${CUBE}.category`, type: `string` }
  }
});
```

---

**Last Updated:** March 16, 2026
**Framework Version:** Synergine 1.0+
**Status:** Production-Ready
