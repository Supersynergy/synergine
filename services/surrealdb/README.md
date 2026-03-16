# SurrealDB Setup for SuperStack AI Framework

Quick reference for initializing and working with the SurrealDB instance.

## Files Overview

- **`init.surql`** — Complete database schema (363 lines)
  - 12 tables (agent, task, memory, CRM)
  - 30+ indexes (B-tree + MTREE vector)
  - 3 event triggers
  - 2 utility functions

- **`seed.surql`** — Sample data for development (634 lines)
  - 5 agents (researcher, scraper, outreach, analyst, orchestrator)
  - 3 sample companies with contacts and deals
  - 5 agent memories with vector embeddings
  - 2 agent tasks with execution logs

- **`../../scripts/init-db.sh`** — Automated initialization script (362 lines)
  - Health checks, error handling, retries
  - Optional seed data import
  - Verification and summary output

- **`SCHEMA.md`** — Complete technical documentation
  - Table specifications with examples
  - Query patterns and optimization tips
  - Relationship graph and indexes
  - Permission model and authentication

## Quick Start (30 seconds)

### 1. Start SurrealDB

```bash
# Docker (recommended)
docker run -d \
  --name surrealdb \
  -p 8000:8000 \
  surrealdb/surrealdb:latest \
  start --log debug

# Or locally if installed
surreal start --log debug
```

### 2. Initialize Database

```bash
# From superstack directory
./scripts/init-db.sh --seed

# Output:
# [SUCCESS] SurrealDB is healthy
# [SUCCESS] Successfully imported init.surql
# [SUCCESS] Schema verification passed
# [SUCCESS] Successfully imported seed.surql
# [SUCCESS] Seed data verification passed
# [SUCCESS] SurrealDB Initialization Complete
```

### 3. Access Database

```bash
# Web UI
open http://localhost:8000/studio
# Credentials: admin / admin123

# Command line
surreal sql -e http://localhost:8000 -u admin -p admin123

# From application
curl -X POST http://localhost:8000/sql \
  -u admin:admin123 \
  -H "Content-Type: application/sql" \
  -d "SELECT * FROM agent LIMIT 5;"
```

## Common Commands

### Check Schema Status

```bash
# Using CLI
surreal sql -e http://localhost:8000 -u admin -p admin123

# Inside REPL
INFO FOR DB;
INFO FOR TABLE agent;
SHOW INDEXES;

# Count records
SELECT count() FROM agent;
SELECT count() FROM company;
SELECT count() FROM agent_memory;
```

### Query Sample Data

```sql
-- List all agents
SELECT id, name, role, status, model FROM agent;

-- Find high-value companies
SELECT id, name, lead_score, revenue FROM company
WHERE lead_score >= 70
ORDER BY lead_score DESC;

-- Get agent task stats (7 days)
SELECT
  agent_id,
  count() as total_tasks,
  count(WHERE status = 'completed') as completed,
  count(WHERE status = 'failed') as failed,
  sum(cost_usd) as total_cost
FROM agent_task
WHERE created_at > time::now() - 86400 * 7
GROUP BY agent_id;

-- Deal pipeline view
SELECT stage, count() as count, sum(value) as total_value
FROM deal
GROUP BY stage
ORDER BY count DESC;
```

### Insert Test Data

```sql
-- Create a new agent
CREATE agent:custom_agent SET
  name = 'Custom Agent',
  role = 'researcher',
  model = 'sonnet',
  status = 'active',
  config = { temperature: 0.5, max_tokens: 2048 },
  capabilities = ['web_search', 'data_analysis'];

-- Create a task
CREATE agent_task SET
  agent_id = agent:custom_agent,
  task_type = 'test_task',
  status = 'completed',
  input = { test: true },
  output = { result: 'success' },
  tokens_used = { input_tokens: 100, output_tokens: 50 },
  cost_usd = 0.0001;

-- Add memory
CREATE agent_memory SET
  agent_id = agent:custom_agent,
  content = 'Test memory content',
  memory_type = 'long_term',
  importance_score = 0.5,
  vector_embedding = [0.1, 0.2, 0.3, ...];
```

## Advanced Usage

### Vector Semantic Search

Find memories by semantic similarity:

```sql
-- Search for memories similar to a concept
-- Using 1536-dim embeddings (OpenAI standard)
SELECT
  id, agent_id, content, importance_score,
  vector::similarity::cosine(vector_embedding, $query_vector) as similarity
FROM agent_memory
WHERE agent_id = agent:researcher
ORDER BY similarity DESC
LIMIT 5;
```

### Agent Coordination Graph

```sql
-- Show agent hierarchy
SELECT
  id, name,
  (SELECT <- in FROM coordinates WHERE out = agent.id AND relationship_type = 'supervisor') as supervisor,
  (SELECT -> out FROM coordinates WHERE in = agent.id AND relationship_type = 'supervisor') as team
FROM agent;

-- Find what orchestrator coordinates
SELECT -> out as agent FROM coordinates WHERE in = agent:orchestrator;

-- Get messages between agents
SELECT * FROM agent_message
WHERE from_agent = agent:orchestrator
OR to_agent = agent:orchestrator
ORDER BY created_at DESC
LIMIT 20;
```

### CRM Pipeline Analysis

```sql
-- Revenue by deal stage
SELECT
  stage,
  count() as deal_count,
  math::sum(value) as total_value,
  math::sum(value * probability / 100) as expected_revenue,
  math::avg(probability) as win_probability
FROM deal
GROUP BY stage
ORDER BY expected_revenue DESC;

-- Company lead scoring
SELECT
  id, name, industry, employees,
  lead_score,
  (SELECT count() FROM has_contact WHERE in = company.id) as contact_count,
  (SELECT count() FROM deal WHERE company_id = company.id) as deal_count,
  (SELECT count() FROM activity WHERE company_id = company.id) as activity_count
FROM company
WHERE lead_score >= 50
ORDER BY lead_score DESC;

-- Activity timeline for a deal
SELECT
  type, subject, direction, outcome, agent_id,
  created_at
FROM activity
WHERE deal_id = deal:techcorp_main
ORDER BY created_at DESC;
```

### Cost Tracking

```sql
-- Agent cost analysis
SELECT
  agent_id,
  model,
  count() as task_count,
  math::sum(tokens_used.input_tokens) as total_input_tokens,
  math::sum(tokens_used.output_tokens) as total_output_tokens,
  math::sum(cost_usd) as total_cost,
  math::avg(cost_usd) as avg_cost_per_task,
  math::max(cost_usd) as max_task_cost
FROM agent_task
WHERE status = 'completed'
GROUP BY agent_id, model;

-- Monthly spending
SELECT
  math::sum(cost_usd) as total_cost,
  count() as task_count,
  count(WHERE status = 'completed') as completed,
  count(WHERE status = 'failed') as failed
FROM agent_task
WHERE created_at > time::now() - 86400 * 30;

-- Cost per task type
SELECT
  task_type,
  count() as task_count,
  math::avg(cost_usd) as avg_cost,
  math::sum(cost_usd) as total_cost
FROM agent_task
WHERE status = 'completed'
GROUP BY task_type;
```

## Configuration

### Environment Variables

```bash
# Set in .env or export before running init script
export SURREAL_URL=http://localhost:8000
export SURREAL_USER=admin
export SURREAL_PASS=admin123

# Then run script
./scripts/init-db.sh --seed
```

### Init Script Options

```bash
# Full help
./scripts/init-db.sh --help

# Basic initialization
./scripts/init-db.sh

# With seed data
./scripts/init-db.sh --seed

# Custom URL
./scripts/init-db.sh --url http://localhost:8000 --seed

# Custom credentials
./scripts/init-db.sh \
  --url http://db.example.com:8000 \
  --user admin \
  --pass secret123 \
  --seed

# Verbose output
./scripts/init-db.sh --seed --verbose

# Test mode (no actual import)
./scripts/init-db.sh --seed --dry-run
```

## Troubleshooting

### SurrealDB won't start

```bash
# Check if port is in use
lsof -i :8000

# Kill existing process
pkill surrealdb

# Clean Docker container
docker rm surrealdb
docker run -d --name surrealdb -p 8000:8000 surrealdb/surrealdb:latest start
```

### Import fails

```bash
# Check SurrealDB logs
docker logs surrealdb

# Verify connectivity
curl http://localhost:8000/health

# Test SQL manually
surreal sql -e http://localhost:8000 -u admin -p admin123
# Then: SELECT 1;
```

### Authentication issues

```bash
# Reset password in schema
DEFINE USER admin ON DB PASSWORD "newpassword" ROLES owner;

# Test login
surreal sql -e http://localhost:8000 -u admin -p newpassword
```

### Query performance

```sql
-- Check query plan
EXPLAIN SELECT * FROM agent_memory WHERE agent_id = ?;

-- Rebuild indexes if slow
REBUILD INDEX idx_agent_memory_agent_id;

-- Check table stats
STATS FOR TABLE agent_memory;
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  surrealdb:
    image: surrealdb/surrealdb:latest
    command: start --log debug
    ports:
      - "8000:8000"
    environment:
      SURREAL_USER: admin
      SURREAL_PASS: admin123
    volumes:
      - surrealdb_data:/var/lib/surrealdb
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 5s
      timeout: 2s
      retries: 5
      start_period: 10s

  init:
    image: surrealdb/surrealdb:latest
    depends_on:
      surrealdb:
        condition: service_healthy
    entrypoint: |
      bash -c "
        surreal import -e http://surrealdb:8000 \
          --user admin --pass admin123 \
          /init/init.surql && \
        surreal import -e http://surrealdb:8000 \
          --user admin --pass admin123 \
          /init/seed.surql
      "
    volumes:
      - ./services/surrealdb:/init

volumes:
  surrealdb_data:
```

## Performance Notes

- **Vector Search:** MTREE index optimized for cosine distance on 1536-dim embeddings
- **Batch Queries:** Group semantic searches to reduce API calls
- **Indexes:** 30+ indexes for <5ms lookups on common queries
- **Cost Tracking:** All token usage denormalized for instant reporting
- **Archive Strategy:** Move old task records monthly to archive table

## Related Files

- `../../docs/` — Architecture and design docs
- `../../config/` — Environment configuration
- `SCHEMA.md` — Detailed technical documentation (read this for deep dives)
- `init.surql` — Full schema definition
- `seed.surql` — Sample data

## Support

For detailed documentation, see `SCHEMA.md` in this directory. It includes:

- Complete table specifications with examples
- Query patterns for common tasks
- Relationship graph visualization
- Permission model and security
- Index strategy and optimization
- Function documentation

---

**Created:** March 16, 2026
**SurrealDB Version:** 3.0+
**Last Updated:** Today
