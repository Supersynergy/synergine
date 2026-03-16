# SuperStack

**Universal Open-Source AI Company Infrastructure**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SurrealDB](https://img.shields.io/badge/SurrealDB-1.0+-FF00CC?logo=surrealdb&logoColor=white)](https://surrealdb.com/)
[![Dragonfly](https://img.shields.io/badge/Dragonfly-Redis--Compatible-E8472F?logo=redis&logoColor=white)](https://www.dragonflydb.io/)

SuperStack is a production-ready, modular infrastructure framework for building AI-powered companies. It provides a unified platform for data persistence, caching, messaging, search, monitoring, and workflow automation—all orchestrated through a clean TypeScript SDK.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for SDK development)
- macOS/Linux (Colima recommended for macOS)

### Launch the Stack

```bash
# Clone the repository
cd /Users/master/superstack

# Start core services (SurrealDB, Dragonfly, NATS)
./scripts/start.sh core

# Or start development stack (recommended)
./scripts/start.sh dev

# Check service status
./scripts/status.sh

# Stop services
./scripts/stop.sh
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                         │
│              (Next.js, Node.js, Python, External APIs)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   SUPERSTACK SDK        │
                    │  (TypeScript/ESM)       │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    ┌──────────────┐      ┌──────────────┐     ┌──────────────┐
    │  SurrealDB   │      │  Dragonfly   │     │    NATS      │
    │   (Graph DB) │      │   (Redis)    │     │  (Streaming) │
    └──────────────┘      └──────────────┘     └──────────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   CADDY GATEWAY         │
                    │  (Reverse Proxy)        │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
    │ Meilisearch  │     │   Monitoring │    │  Workflows   │
    │   (Search)   │     │  (SigNoz)    │    │  (Windmill)  │
    └──────────────┘     └──────────────┘    └──────────────┘
```

## Stack Components

| Service | Port | Purpose | Profile |
|---------|------|---------|---------|
| **SurrealDB** | 8000 | Graph database with record linking | core, all |
| **Dragonfly** | 6379 | In-memory cache (Redis-compatible) | core, all |
| **NATS** | 4222 | Message streaming & task queue | core, all |
| **Caddy** | 80/443 | Reverse proxy & SSL termination | dev, monitoring, full, all |
| **Meilisearch** | 7700 | Full-text search engine | dev, full, all |
| **SigNoz** | 3301 | Application monitoring & traces | monitoring, full, all |
| **Uptime Kuma** | 3200 | Uptime monitoring & alerting | monitoring, full, all |
| **Beszel** | 8090 | System resource monitoring | monitoring, full, all |
| **Windmill** | 8100 | Workflow automation engine | full, all |
| **Langfuse** | 3100 | LLM observability & analytics | all |
| **Umami** | 3500 | Privacy-focused analytics | all |
| **SeaweedFS** | 8888 | Distributed file storage | all |
| **Listmonk** | 9000 | Email marketing platform | all |
| **Coolify** | 3000 | Deployment & container management | all |

## Profiles

Choose a profile based on your needs:

### `core`
**Minimal production foundation**
- SurrealDB (data)
- Dragonfly (cache)
- NATS (messaging)
- RAM: 4GB | CPU: 2 cores

Use for: Microservices, API servers, lightweight deployments

```bash
./scripts/start.sh core
```

### `dev` (Recommended)
**Full development environment**
- All core services
- Caddy (reverse proxy)
- Meilisearch (search)
- RAM: 8GB | CPU: 4 cores

Use for: Local development, prototyping, testing

```bash
./scripts/start.sh dev
```

### `monitoring`
**Observability-focused deployment**
- All core services
- SigNoz (tracing & metrics)
- Uptime Kuma (uptime monitoring)
- Beszel (system metrics)
- RAM: 12GB | CPU: 4 cores

Use for: Observability platforms, incident response systems

```bash
./scripts/start.sh monitoring
```

### `full`
**Complete production stack**
- All core + monitoring services
- Caddy (reverse proxy)
- Meilisearch (search)
- Windmill (workflows)
- RAM: 16GB | CPU: 8 cores

Use for: Production deployments, enterprise systems

```bash
./scripts/start.sh full
```

### `all`
**Everything enabled**
- All services including optional ones
- Langfuse, Umami, SeaweedFS, Listmonk, Coolify
- RAM: 24GB | CPU: 12 cores

Use for: Self-hosted platforms, full feature evaluation

```bash
./scripts/start.sh all
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# SurrealDB
SURREALDB_USER=root
SURREALDB_PASSWORD=root
SURREALDB_NAMESPACE=superstack
SURREALDB_DATABASE=default

# NATS
NATS_AUTH_TOKEN=your_secure_token_here
NATS_ADMIN_PASSWORD=admin_password
NATS_APP_PASSWORD=app_password
NATS_MONITOR_PASSWORD=monitor_password

# Email (for Listmonk/notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASSWORD=your_password

# Monitoring
ACME_EMAIL=admin@example.com
SENTRY_DSN=your_sentry_dsn_here

# Workflow Engine (Windmill)
WINDMILL_SUPERADMIN_SECRET=change_me_in_production
WINDMILL_JWT_SECRET=change_me_in_production
```

### Caddyfile Customization

The Caddyfile (`config/Caddyfile`) manages all service routing:

```
# Route all /api/search requests to Meilisearch
http://localhost/api/search {
    reverse_proxy http://meilisearch:7700
}

# Add custom routes for your services
http://localhost/custom {
    reverse_proxy http://your-service:port
}
```

### NATS Configuration

`config/nats.conf` defines messaging behavior:

```yaml
jetstream {
    max_memory_store: 512M      # In-memory message storage
    max_file_store: 2G          # Disk-based persistence
    store_dir: /data/jetstream
}

# Define authorization users and permissions
authorization {
    users: [
        { user: admin, permissions { publish: ">", subscribe: ">" } },
        { user: app, permissions { publish: "app.>", subscribe: "app.>" } }
    ]
}
```

### SurrealDB Schema

Initialize the database schema:

```bash
# Edit services/surrealdb/init.surql with your tables
./scripts/start.sh core

# Schema will auto-load on startup
```

Example schema:

```surql
-- Define a companies table
DEFINE TABLE companies SCHEMALESS;
DEFINE INDEX uk_company_name ON companies COLUMNS name UNIQUE;

-- Define relationships
DEFINE TABLE deals SCHEMALESS;
DEFINE FIELD company ON deals TYPE RECORD(companies);

-- Create a full-text search index
DEFINE INDEX ft_companies ON companies COLUMNS name, description SEARCH ANALYZER LIKE;
```

## SDK Usage

The SuperStack SDK provides unified client libraries for all services.

### Installation

```bash
npm install @superstack/sdk
```

### SurrealDB Client

```typescript
import { SurrealDB } from "@superstack/sdk/db";

const db = new SurrealDB({
  url: "http://localhost:8000",
  namespace: "superstack",
  database: "default",
  auth: { user: "root", password: "root" }
});

// Create a record
const company = await db.create("companies", {
  name: "Acme Corp",
  revenue: 1000000,
  founded: "2020-01-01"
});

// Query with relations
const deals = await db.query(
  `SELECT * FROM deals WHERE company = ${company.id}`
);

// Update nested fields
await db.update(company.id, {
  metadata: { tier: "enterprise" }
});
```

### Dragonfly (Redis) Client

```typescript
import { Dragonfly } from "@superstack/sdk/cache";

const cache = new Dragonfly({
  host: "localhost",
  port: 6379
});

// Set with TTL
await cache.set("user:123", { name: "John" }, 3600);

// Get
const user = await cache.get("user:123");

// Atomic operations
await cache.incr("request_count");
await cache.lpush("task_queue", { id: 1, task: "process_data" });
```

### NATS Messaging

```typescript
import { NATS } from "@superstack/sdk/queue";

const nats = new NATS({
  servers: ["nats://localhost:4222"],
  auth: { token: "your_auth_token" }
});

// Publish a message
await nats.publish("company.created", {
  id: "company:123",
  name: "Acme Corp"
});

// Subscribe to messages
const sub = nats.subscribe("company.*", async (msg) => {
  console.log("Received:", msg.data);
});

// Request-reply pattern
const reply = await nats.request("ai.analyze", { text: "..." }, 5000);
```

### Meilisearch

```typescript
import { Meilisearch } from "@superstack/sdk/search";

const search = new Meilisearch({
  url: "http://localhost:7700",
  apiKey: "your_api_key"
});

// Index documents
await search.index("companies").addDocuments([
  { id: 1, name: "Acme Corp", industry: "Technology" },
  { id: 2, name: "Beta Inc", industry: "Finance" }
]);

// Search
const results = await search.index("companies").search("technology");

// Configure filters
await search.index("companies").updateFilterableAttributes(["industry", "founded"]);
```

### Combined Example: Agent System

```typescript
import { SurrealDB, Dragonfly, NATS, Meilisearch } from "@superstack/sdk";

class AIAgent {
  constructor(private db: SurrealDB, private cache: Dragonfly, private nats: NATS) {}

  async processTask(taskId: string) {
    // Get task from DB
    const task = await this.db.select(taskId);

    // Cache task state
    await this.cache.set(`task:${taskId}:state`, "processing");

    // Publish event
    await this.nats.publish("task.started", { id: taskId });

    // Process...
    const result = await this.runTask(task);

    // Update DB with result
    await this.db.update(taskId, { result, status: "completed" });

    // Publish completion
    await this.nats.publish("task.completed", { id: taskId, result });
  }

  private async runTask(task: any) {
    // Your implementation
    return { status: "success" };
  }
}
```

## Resource Requirements

Choose based on your profile and use case:

| Profile | RAM | CPU | Storage | Use Case |
|---------|-----|-----|---------|----------|
| core | 4GB | 2 | 20GB | Microservices, APIs |
| dev | 8GB | 4 | 50GB | Local development |
| monitoring | 12GB | 4 | 100GB | Observability |
| full | 16GB | 8 | 200GB | Production |
| all | 24GB | 12 | 500GB | Self-hosted platforms |

### Colima Setup (macOS)

SuperStack works perfectly with Colima for lightweight virtualization:

```bash
# Install Colima (if not already installed)
brew install colima

# Start Colima with recommended settings for SuperStack
colima start --memory 16 --cpu 8 --disk 200

# Verify Docker access
docker ps

# Start SuperStack
cd /Users/master/superstack
./scripts/start.sh dev
```

Monitor resource usage:

```bash
colima stat
```

## Scaling Guide

### Adding More Agent Containers

To run multiple agent workers processing tasks from NATS:

```yaml
# docker-compose.override.yml
version: '3.9'
services:
  agent-worker-1:
    image: your-agent-image:latest
    environment:
      NATS_URL: nats://nats:4222
      WORKER_ID: 1
    depends_on:
      - nats
      - surrealdb

  agent-worker-2:
    image: your-agent-image:latest
    environment:
      NATS_URL: nats://nats:4222
      WORKER_ID: 2
    depends_on:
      - nats
      - surrealdb
```

Start with override:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### Horizontal Scaling Patterns

**NATS Consumer Groups**: Distribute tasks across workers

```typescript
// Multiple workers reading from same queue
const sub = await nc.subscribe("tasks.work", {
  queue: "workers",  // All workers share this queue
  durable: "task_processor"  // Persist delivery state
});
```

**Database Sharding**: Split data by company/tenant

```typescript
const shard = Math.hash(companyId) % SHARD_COUNT;
const dbUrl = `http://surrealdb-${shard}:8000`;
```

**Cache Warming**: Pre-load frequently accessed data

```typescript
// Warm cache on startup
for (const company of companies) {
  await cache.set(`company:${company.id}`, company, 86400);
}
```

## Monitoring & Dashboards

### SigNoz (Application Performance)

```
http://localhost:3301
```

Monitor traces, metrics, and logs across all services.

### Uptime Kuma (Availability)

```
http://localhost:3200
```

Define monitors for critical endpoints and receive alerts.

### Beszel (System Resources)

```
http://localhost:8090
```

Real-time CPU, memory, disk, and network monitoring.

### Langfuse (LLM Analytics)

```
http://localhost:3100
```

Track LLM API calls, costs, and model performance.

### Umami Analytics

```
http://localhost:3500
```

Privacy-preserving website analytics without cookies.

### NATS Monitoring

```
http://localhost:8222
```

View message flow, queue stats, and server health.

## Development

### Building the SDK

```bash
cd /Users/master/superstack
npm install
npm run build

# Watch mode for development
npm run dev

# Run tests
npm run test
```

### Initialize Database Schema

```bash
npm run init-db
```

This runs all SQL/SurQL files to set up tables and indexes.

## Production Deployment

### Environment Setup

```bash
# Use a strong password for SurrealDB
export SURREALDB_PASSWORD=$(openssl rand -base64 32)

# Generate NATS tokens
export NATS_AUTH_TOKEN=$(openssl rand -hex 32)

# Store in .env file (never commit)
echo "SURREALDB_PASSWORD=$SURREALDB_PASSWORD" >> .env.production
echo "NATS_AUTH_TOKEN=$NATS_AUTH_TOKEN" >> .env.production
```

### Persistent Data

Map volumes for production:

```yaml
# docker-compose.override.yml
services:
  surrealdb:
    volumes:
      - surrealdb-data:/var/lib/surrealdb

  nats:
    volumes:
      - nats-data:/data/jetstream

volumes:
  surrealdb-data:
  nats-data:
```

### SSL Certificates

Caddy handles automatic certificate generation:

```
# config/Caddyfile - production
{
  email admin@yourdomain.com
  acme_ca https://acme-v02.api.letsencrypt.org/directory
}

https://api.yourdomain.com {
  reverse_proxy http://surrealdb:8000
}
```

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backups/superstack"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup SurrealDB
docker exec superstack-surrealdb \
  surql export /backup/surrealdb-$TIMESTAMP.sql

# Backup NATS JetStream
docker exec superstack-nats \
  tar czf /backup/jetstream-$TIMESTAMP.tar.gz /data/jetstream

# Sync to remote
aws s3 sync $BACKUP_DIR s3://backups.example.com/superstack/
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs -f surrealdb

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Test SurrealDB connectivity
curl http://localhost:8000/health

# Test NATS connectivity
docker run --network superstack-net natsio/nats-box nats-sub -s nats:4222 ">"
```

### High Memory Usage

Reduce in-memory store sizes:

```yaml
# config/nats.conf
jetstream {
  max_memory_store: 256M  # Reduce from 512M
  max_file_store: 1G      # Reduce from 2G
}
```

### Network Issues

Verify Docker network:

```bash
docker network inspect superstack-net
```

Recreate if needed:

```bash
docker network rm superstack-net
docker network create superstack-net
```

## License

MIT License © SuperSynergy. See LICENSE for details.

---

**Documentation:** See `docs/ARCHITECTURE.md` for detailed data flow and design patterns.

**SDK Source:** `package.json` and SDK modules in the main package.

**Support:** Open issues on the repository or check the documentation.
