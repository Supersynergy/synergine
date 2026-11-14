# Dashboard Services — Quick Start

## Start Mission Control

```bash
# 1. Copy environment template
cp env.example .env

# 2. Generate strong secrets (in .env, replace CHANGE_ME values)
openssl rand -base64 32  # for CUBE_API_SECRET, etc.

# 3. Start with dashboard services
docker compose --profile dashboard up -d

# OR start everything (core + all optional services + dashboard)
docker compose --profile gateway --profile search --profile monitoring \
  --profile workflows --profile storage --profile email --profile dashboard up -d

# 4. Wait for services to be healthy
docker compose ps  # Monitor startup (health checks run 30s intervals)
```

## Access Services

| Service | URL | Port | Notes |
|---------|-----|------|-------|
| Cube.js API | `http://localhost:4000` | 4000 | Semantic analytics engine |
| Cube.js Playground | `http://localhost:4001` | 4001 | Interactive query builder |
| Dozzle Logs | `http://localhost:9999` | 9999 | Real-time Docker logs |
| Portainer | `https://localhost:9443` | 9443 | Container management (HTTPS, self-signed cert) |

**Via Reverse Proxy (if gateway started):**
```
http://localhost/cube        → Cube.js API
http://localhost/logs        → Dozzle
http://localhost/containers  → Portainer
```

## First-Time Setup

### Portainer
1. Visit `https://localhost:9443`
2. Accept self-signed certificate warning
3. Create admin user
4. Select "Docker (local)" connection
5. Done! You have full container management

### Cube.js
1. Visit `http://localhost:4001` (Playground)
2. Query pre-built cubes: `Agents`, `Tasks`, `Companies`, `Deals`
3. Build dashboards and export queries
4. Copy API queries to your frontend apps using REST API at port 4000

### Dozzle
1. Visit `http://localhost:9999`
2. No setup needed! Automatically shows all container logs
3. Use search/filter to find logs from specific containers
4. Live streaming shows real-time output

## Quick Commands

```bash
# View all dashboard container logs
docker logs superstack-cube
docker logs superstack-dozzle
docker logs superstack-portainer

# Health check specific service
docker exec superstack-cube curl -f http://localhost:4000/readyz

# Restart dashboard services
docker compose restart cube dozzle portainer

# Stop only dashboard (keep core running)
docker compose stop cube dozzle portainer

# Remove dashboard services
docker compose down --remove-orphans

# Check resource usage
docker stats superstack-cube superstack-dozzle superstack-portainer
```

## Example Cube.js Queries

### Via REST API
```bash
# Get all agents with activity > 0.5
curl -H "Authorization: Bearer YOUR_CUBE_API_SECRET" \
  "http://localhost:4000/api/v1/load?query={
    \"measures\": [\"Agents.count\"],
    \"dimensions\": [\"Agents.role\"],
    \"filters\": [{
      \"member\": \"Agents.status\",
      \"operator\": \"equals\",
      \"values\": [\"active\"]
    }]
  }"

# Get top deals by value
curl -H "Authorization: Bearer YOUR_CUBE_API_SECRET" \
  "http://localhost:4000/api/v1/load?query={
    \"measures\": [\"Deals.totalValue\"],
    \"dimensions\": [\"Deals.stage\"],
    \"order\": [[\"Deals.totalValue\", \"desc\"]],
    \"limit\": 10
  }"
```

### Via Playground
1. Open `http://localhost:4001`
2. Select cube from dropdown (e.g., "Deals")
3. Choose measures (Total Value, Count, etc.)
4. Add dimensions (Stage, Owner, etc.)
5. Apply filters (Status = Won)
6. Click "Draw" to visualize
7. Copy SQL or JSON for use in apps

## Environment Variables in .env

```bash
CUBE_PORT=4000
CUBE_PLAYGROUND_PORT=4001
CUBE_API_SECRET=your-secret-here            # Use openssl rand -base64 32

DOZZLE_PORT=9999                            # No auth needed

PORTAINER_PORT=9443                         # HTTPS, self-signed OK
```

## Resource Monitoring

Check what resources dashboard services are using:

```bash
# Real-time resource stats
docker stats --no-stream superstack-cube superstack-dozzle superstack-portainer

# Memory limits set in docker-compose.yml
# Cube.js: 1GB limit, 512MB reserved
# Dozzle: 128MB limit
# Portainer: 256MB limit
```

## Troubleshooting

**Cube.js not starting?**
```bash
docker logs superstack-cube
# Check for CUBEJS_API_SECRET issues or schema file errors
# Verify curl command availability in container
```

**Portainer won't connect to Docker?**
```bash
# Verify socket is accessible
docker exec superstack-portainer ls -l /var/run/docker.sock

# Restart Portainer
docker compose restart portainer
```

**Dozzle shows no logs?**
```bash
# Check socket mount
docker exec superstack-dozzle ls -l /var/run/docker.sock

# View Dozzle's own logs
docker logs superstack-dozzle
```

**Caddy routes not working?**
```bash
# Verify Caddy is running and healthy
docker ps | grep caddy

# Check Caddyfile
docker logs superstack-caddy | grep -i error

# Reload Caddy if modified Caddyfile
docker exec superstack-caddy caddy reload --config /etc/caddy/Caddyfile
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MISSION CONTROL PLANE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cube.js     │  │  Dozzle      │  │  Portainer   │      │
│  │  (Analytics) │  │  (Logs)      │  │  (Containers)│      │
│  │  4000/4001   │  │  9999        │  │  9443        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   Caddy GW     │                        │
│                    │   (Proxy)      │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │ External Access   │
                    │ localhost/cube    │
                    │ localhost/logs    │
                    │ localhost/...     │
                    └───────────────────┘
```

## Next: Production Deployment

When moving to production:

1. **Secrets Management:**
   - Use external secret store (Vault, AWS Secrets Manager)
   - Never commit `.env` to git
   - Rotate `CUBE_API_SECRET` regularly

2. **TLS/SSL:**
   - Configure real certificates in Caddy (let's Encrypt)
   - Replace Portainer's self-signed cert

3. **Authentication:**
   - Implement reverse proxy auth for Dozzle if exposed
   - Set Portainer RBAC for team access

4. **Monitoring:**
   - Connect to SigNoz for health checks
   - Set up Uptime Kuma for availability monitoring
   - Enable Portainer's internal monitoring

5. **Database:**
   - Configure Cube.js to connect to your production database
   - Create data warehouse optimized schemas
   - Add proper indexes on fact/dimension tables

---

**Ready to go! Start with** `docker compose --profile dashboard up -d`
