# SuperStack — Agent Resource Guide

> Single source of truth for AI agents (Claude Code, Cursor, Copilot) and human developers.
> Load this file as context before working with any SuperStack project.

---

## What Is SuperStack

SuperStack is a universal open-source AI company infrastructure framework that bundles everything a modern AI-first company needs into a single `docker-compose.yml` with zero vendor lock-in and $0/month infrastructure cost. The core stack is SurrealDB 2.x (multi-model: relational + vector + graph + realtime subscriptions) backed by RocksDB, Dragonfly (25x faster than Redis, drop-in compatible), NATS JetStream (sub-millisecond pub/sub messaging with guaranteed delivery), Caddy (auto-HTTPS via Let's Encrypt), and Meilisearch (instant typo-tolerant search). Optional profiles add full observability (SigNoz, Langfuse, Beszel, Uptime Kuma), workflow automation (Windmill), email marketing (Listmonk), S3-compatible object storage (SeaweedFS), and privacy-first analytics (Umami) — all self-hosted, all composable.

---

## Quick Reference

### Connection Strings (from .env defaults)

| Service      | URL / Connection String          | Default Port | Recommended Client    | Protocol        |
|-------------|----------------------------------|-------------|-----------------------|-----------------|
| SurrealDB   | `ws://localhost:8000/rpc`        | 8000        | `surrealdb` (npm)     | WebSocket / HTTP |
| Dragonfly   | `redis://localhost:6379`         | 6379        | `ioredis` (npm)       | Redis protocol  |
| NATS        | `nats://localhost:4222`          | 4222        | `nats` (npm)          | NATS protocol   |
| NATS Monitor| `http://localhost:8222`          | 8222        | Browser / HTTP        | HTTP            |
| Meilisearch | `http://localhost:7700`          | 7700        | `meilisearch` (npm)   | HTTP REST       |
| Caddy HTTP  | `http://localhost:80`            | 80          | Any HTTP client       | HTTP            |
| Caddy HTTPS | `https://localhost:443`          | 443         | Any HTTP client       | HTTPS / HTTP3   |
| SigNoz UI   | `http://localhost:3301`          | 3301        | Browser               | HTTP            |
| OTLP gRPC   | `http://localhost:4317`          | 4317        | OpenTelemetry SDK     | gRPC            |
| OTLP HTTP   | `http://localhost:4318`          | 4318        | OpenTelemetry SDK     | HTTP            |
| Langfuse    | `http://localhost:3100`          | 3100        | `langfuse` (npm/py)   | HTTP REST       |
| Beszel      | `http://localhost:8090`          | 8090        | Browser               | HTTP            |
| Uptime Kuma | `http://localhost:3200`          | 3200        | Browser               | HTTP            |
| Windmill    | `http://localhost:8100`          | 8100        | Browser / REST        | HTTP            |
| Listmonk    | `http://localhost:9000`          | 9000        | Browser / REST        | HTTP            |
| SeaweedFS S3| `http://localhost:8333`          | 8333        | AWS SDK / mc / rclone | S3 API          |
| Umami       | `http://localhost:3500`          | 3500        | Browser / REST        | HTTP            |

### Start Commands

```bash
# Core only — SurrealDB + Dragonfly + NATS (foundation, always starts)
./scripts/start.sh core

# Dev stack — core + Caddy + Meilisearch (recommended for development)
./scripts/start.sh dev
# or equivalently:
docker compose --profile gateway --profile search up -d

# Monitoring stack — core + SigNoz + Langfuse + Beszel + Uptime Kuma
./scripts/start.sh monitoring

# Full stack — core + gateway + search + monitoring + Windmill
./scripts/start.sh full

# Everything — all 14+ services including email, storage, analytics
./scripts/start.sh all

# Direct docker compose (fine-grained control)
docker compose up -d                                                     # core only
docker compose --profile gateway up -d                                   # + Caddy
docker compose --profile search up -d                                    # + Meilisearch
docker compose --profile monitoring up -d                                # + observability
docker compose --profile workflows up -d                                 # + Windmill
docker compose --profile storage up -d                                   # + SeaweedFS + Umami
docker compose --profile email up -d                                     # + Listmonk

# Stop everything
docker compose --profile gateway --profile search --profile monitoring \
  --profile workflows --profile storage --profile email down

# Check status
./scripts/status.sh

# Health check (SurrealDB)
curl http://localhost:8000/health
```

### SDK Quick Start (TypeScript)

```typescript
import { createSuperStackSDK } from "@superstack/sdk";

// Auto-reads from environment variables
const sdk = await createSuperStackSDK();

const db    = sdk.getDB();      // SurrealDBClient
const cache = sdk.getCache();   // DragonflyCache
const queue = sdk.getQueue();   // NatsClient
const search = sdk.getSearch(); // MeilisearchClient

// Health check all services
const health = await sdk.healthCheck();
// { database: true, cache: true, queue: true, search: true }

await sdk.close();
```

**SDK environment variables:**

```bash
SURREALDB_URL=ws://localhost:8000
SURREALDB_USER=root
SURREALDB_PASSWORD=your_password
SURREALDB_NAMESPACE=superstack
SURREALDB_DATABASE=agents
DRAGONFLY_URL=localhost:6379
DRAGONFLY_PASSWORD=your_password
NATS_URL=nats://localhost:4222
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=your_master_key
```

---

## SurrealDB — The Universal Database

### Why One DB Rules Them All

| Use Case           | Traditional Tool | SurrealDB Equivalent                                       |
|--------------------|-----------------|-------------------------------------------------------------|
| Relational tables  | PostgreSQL       | `DEFINE TABLE ... SCHEMAFULL` with typed fields            |
| Vector search      | pgvector / Pinecone | `DEFINE INDEX ... MTREE DIMENSION 1536 DIST COSINE`     |
| Graph traversal    | Neo4j            | `RELATE agent -> coordinates -> agent`, multi-hop via `->` |
| Real-time push     | Redis Pub/Sub    | `LIVE SELECT * FROM agent WHERE status = 'active'`         |
| Full-text search   | Elasticsearch    | `DEFINE ANALYZER`, `DEFINE INDEX ... SEARCH ANALYZER`      |
| Document store     | MongoDB          | Schemaless tables, nested objects, flexible fields          |
| Time-series        | InfluxDB         | `ORDER BY created_at DESC LIMIT 1000`, built-in `time::now()` |

### Namespace / Database Structure

```
superstack (namespace)
  └── agents (database)
        ├── agent          — AI agents registry
        ├── agent_memory   — Long-term memory with vector embeddings
        ├── agent_task     — Task execution logs and metrics
        ├── agent_message  — Inter-agent communication
        ├── company        — CRM companies / prospects
        ├── contact        — People at companies
        ├── deal           — Sales pipeline opportunities
        ├── activity       — Interactions (emails, calls, meetings)
        ├── coordinates    — Edge: agent ↔ agent coordination
        ├── assigned_to    — Edge: agent → task assignment
        ├── remembers      — Edge: agent → memory recall tracking
        ├── has_contact    — Edge: company → contact
        ├── has_deal       — Edge: contact → deal
        └── has_activity   — Edge: deal → activity
```

### Full Schema Reference

#### Table: `agent`

| Field          | Type     | Constraint / Default                                             |
|----------------|----------|------------------------------------------------------------------|
| id             | string   | PRIMARY KEY                                                      |
| name           | string   | ASSERT len > 0                                                   |
| role           | string   | ASSERT IN ['researcher','scraper','outreach','analyst','orchestrator','supervisor','custom'] |
| status         | string   | DEFAULT 'idle' — IN ['active','idle','error','disabled']         |
| model          | string   | DEFAULT 'haiku' — IN ['haiku','sonnet','opus','gemma','kimi','custom'] |
| config         | object   | Agent-specific config (temperature, max_tokens, etc.)            |
| capabilities   | array    | DEFAULT [] — e.g. ['web_search','email','code_execution']        |
| health_status  | object   | {last_heartbeat, error_count, avg_response_time_ms}              |
| created_at     | datetime | DEFAULT time::now()                                              |
| updated_at     | datetime | DEFAULT time::now()                                              |

Indexes: `idx_agent_status`, `idx_agent_role`

#### Table: `agent_memory`

| Field             | Type         | Notes                                                    |
|-------------------|--------------|----------------------------------------------------------|
| id                | string       | PRIMARY KEY                                              |
| agent_id          | record<agent>| ASSERT != NONE                                           |
| content           | string       | Raw memory text (facts, learnings, patterns)             |
| summary           | string       | Short summary for quick retrieval                        |
| vector_embedding  | array<float> | 1536-dim OpenAI embedding (or custom dim)                |
| memory_type       | string       | IN ['short_term','long_term','episodic','semantic','procedural'] |
| importance_score  | float        | DEFAULT 0.5 — 0.0 to 1.0                                |
| tags              | array        | Labels: ['company:TechCorp','deal:D123','pattern:cold_outreach'] |
| metadata          | object       | {source, context, conversation_id}                       |
| expires_at        | datetime     | Optional TTL for auto-cleanup                            |

Indexes: `idx_agent_memory_agent_id`, `idx_agent_memory_type`, `idx_agent_memory_tags`, `idx_agent_memory_importance`, `idx_agent_memory_vector` (MTREE)

#### Table: `agent_task`

| Field          | Type          | Notes                                                   |
|----------------|---------------|---------------------------------------------------------|
| id             | string        | PRIMARY KEY                                             |
| agent_id       | record<agent> | ASSERT != NONE                                          |
| task_type      | string        | research, email, scrape, analyze, etc.                  |
| description    | string        | Human-readable description                              |
| input          | object        | Task parameters                                         |
| output         | object        | Results / response                                      |
| status         | string        | IN ['pending','running','completed','failed','cancelled'] |
| started_at     | datetime      |                                                         |
| completed_at   | datetime      |                                                         |
| duration_ms    | int           | Execution time                                          |
| tokens_used    | object        | {input_tokens, output_tokens, total_cost_usd}           |
| cost_usd       | float         | DEFAULT 0.0                                             |
| retry_count    | int           | DEFAULT 0                                               |
| parent_task_id | string        | For subtask hierarchies                                 |

#### Table: `company`

| Field        | Type   | Notes                                            |
|--------------|--------|--------------------------------------------------|
| id           | string | PRIMARY KEY                                      |
| name         | string | ASSERT len > 0                                   |
| domain       | string | Primary domain (techcorp.com)                    |
| industry     | string | SaaS, FinTech, etc.                              |
| revenue      | float  | Annual revenue USD                               |
| employees    | int    |                                                  |
| tech_stack   | array  | Detected technologies                            |
| lead_score   | float  | DEFAULT 0.0 — auto-incremented by activity events |
| tags         | array  | DEFAULT []                                       |
| source       | string | scraper, manual, api, etc.                       |

#### Table: `deal`

| Field       | Type             | Notes                                                     |
|-------------|------------------|-----------------------------------------------------------|
| stage       | string           | IN ['lead','contacted','qualified','proposal','negotiation','won','lost'] |
| value       | float            | Deal value USD                                            |
| probability | float            | Win probability 0-100                                     |
| expected_revenue | float       | value * probability                                       |

### Graph Edges Reference

| Edge Table   | In (source)     | Out (target)     | Extra Fields                        |
|-------------|-----------------|------------------|-------------------------------------|
| coordinates  | agent           | agent            | relationship_type, last_sync        |
| assigned_to  | agent           | agent_task       | —                                   |
| remembers    | agent           | agent_memory     | recall_count, last_recalled         |
| has_contact  | company         | contact          | primary_contact: bool               |
| has_deal     | contact         | deal             | role (decision_maker, influencer)   |
| has_activity | deal            | activity         | —                                   |

### Built-in Functions and Events

**Custom Functions:**
- `token_cost($model, $input_tokens, $output_tokens)` — returns USD cost for haiku/sonnet/opus
- `agent_summary($agent_id, $days)` — returns {total_tasks, completed_tasks, failed_tasks, total_cost}

**Auto-Triggers:**
- `on agent_task UPDATE` — logs status transitions to activity stream
- `on agent UPDATE/CREATE` — keeps `updated_at` in sync
- `on activity CREATE` — auto-increments `company.lead_score` by 5 (capped at 100)

---

## SurrealQL Query Cookbook (20+ Copy-Paste Queries)

Connect first: `surreal sql --conn ws://localhost:8000 --user root --pass $PASSWORD --ns superstack --db agents`

### 1. Create an Agent

```sql
CREATE agent SET
  id = 'agent:researcher-001',
  name = 'Research Agent Alpha',
  role = 'researcher',
  status = 'active',
  model = 'sonnet',
  capabilities = ['web_search', 'database_access', 'email'],
  config = { temperature: 0.7, max_tokens: 4096 };
```

### 2. Assign a Task to an Agent

```sql
LET $task = CREATE agent_task SET
  agent_id = agent:researcher-001,
  task_type = 'research',
  description = 'Find all FinTech companies with > 50 employees in Germany',
  input = { query: 'fintech germany', min_employees: 50 },
  status = 'pending';

RELATE agent:researcher-001 -> assigned_to -> $task.id;
```

### 3. Store Agent Memory with Vector Embedding

```sql
-- embedding is a 1536-dim float array from OpenAI text-embedding-3-small
CREATE agent_memory SET
  agent_id = agent:researcher-001,
  content = 'TechCorp GmbH uses Salesforce and has a budget cycle in Q4',
  summary = 'TechCorp: Salesforce user, Q4 budget',
  vector_embedding = [0.023, -0.147, 0.891, /* ... 1536 values total */],
  memory_type = 'long_term',
  importance_score = 0.85,
  tags = ['company:TechCorp', 'pattern:q4_budget', 'tool:salesforce'];
```

### 4. Semantic Search Agent Memories (Vector Similarity)

```sql
-- Find top 5 memories semantically similar to query embedding
SELECT id, content, summary, importance_score,
  vector::similarity::cosine(vector_embedding, $query_vector) AS score
FROM agent_memory
WHERE agent_id = agent:researcher-001
ORDER BY score DESC
LIMIT 5;
```

### 5. Graph: Find All Agents Coordinating with Agent X

```sql
-- Direct peers
SELECT ->coordinates->agent.* AS peers
FROM agent:researcher-001;

-- Two hops: agents that coordinate with peers of agent X
SELECT ->coordinates->agent->coordinates->agent.* AS second_degree
FROM agent:researcher-001;
```

### 6. Multi-Hop: Agent's Full Context (Memory + Tasks + Messages)

```sql
SELECT
  name, role, status,
  (SELECT content, summary, importance_score
   FROM ->remembers->agent_memory
   ORDER BY importance_score DESC LIMIT 10) AS top_memories,
  (SELECT task_type, status, duration_ms, cost_usd
   FROM <-assigned_to<-agent_task
   WHERE status IN ['running', 'pending']
   LIMIT 5) AS active_tasks,
  (SELECT message_type, content, created_at
   FROM <-from_agent<-agent_message
   ORDER BY created_at DESC LIMIT 20) AS recent_messages
FROM agent:researcher-001;
```

### 7. Create Company with Contact Graph

```sql
LET $company = CREATE company SET
  id = 'company:techcorp-001',
  name = 'TechCorp GmbH',
  domain = 'techcorp.de',
  industry = 'SaaS',
  employees = 120,
  tech_stack = ['Salesforce', 'Slack', 'AWS'],
  lead_score = 0.0;

LET $contact = CREATE contact SET
  id = 'contact:mueller-001',
  company_id = $company.id,
  first_name = 'Hans',
  last_name = 'Mueller',
  email = 'h.mueller@techcorp.de',
  role = 'CTO',
  decision_maker = true;

RELATE $company.id -> has_contact -> $contact.id SET primary_contact = true;
```

### 8. Full CRM Pipeline: Company -> Contacts -> Deals -> Activities

```sql
-- Get entire company graph in one query
SELECT
  name, industry, lead_score,
  ->has_contact->contact.* AS contacts,
  ->has_contact->contact->has_deal->deal.* AS deals,
  ->has_contact->contact->has_deal->deal->has_activity->activity.* AS activities
FROM company:techcorp-001;
```

### 9. Lead Scoring Query (Computed from Activities)

```sql
SELECT
  company.id, company.name,
  count(->has_contact->contact->has_deal->deal) AS deal_count,
  math::sum(->has_contact->contact->has_deal->deal.value) AS pipeline_value,
  count(->has_contact->contact->has_deal->deal->has_activity->activity) AS touchpoints,
  company.lead_score
FROM company
WHERE lead_score > 50
ORDER BY lead_score DESC
LIMIT 20;
```

### 10. LIVE SELECT for Real-Time Agent Status Changes

```typescript
// TypeScript — WebSocket subscription
const db = sdk.getDB().getNativeClient();
const queryUuid = await db.live("agent", (action, result) => {
  if (action === "UPDATE" && result.status === "error") {
    console.warn("Agent error:", result.id, result.health_status);
  }
});

// SurrealQL equivalent (run in streaming client)
// LIVE SELECT * FROM agent WHERE status = 'active';
```

### 11. Full-Text Search Across Company Names

```sql
-- Requires DEFINE ANALYZER on company table first
DEFINE ANALYZER company_analyzer TOKENIZERS class FILTERS lowercase, ascii;
DEFINE INDEX idx_company_name_search ON TABLE company
  FIELDS name SEARCH ANALYZER company_analyzer BM25;

-- Then search:
SELECT * FROM company
WHERE name @@ 'tech solutions'
ORDER BY search::score() DESC
LIMIT 10;
```

### 12. Aggregate: Deals by Stage with Total Value

```sql
SELECT
  stage,
  count() AS deal_count,
  math::sum(value) AS total_value,
  math::mean(probability) AS avg_probability,
  math::sum(expected_revenue) AS expected_revenue
FROM deal
GROUP BY stage
ORDER BY total_value DESC;
```

### 13. Agent Performance: Avg Task Duration and Success Rate

```sql
SELECT
  agent_id,
  count() AS total_tasks,
  count(status = 'completed') AS completed,
  count(status = 'failed') AS failed,
  math::round(count(status = 'completed') / count() * 100, 1) AS success_rate_pct,
  math::mean(duration_ms) AS avg_duration_ms,
  math::sum(cost_usd) AS total_cost_usd
FROM agent_task
WHERE created_at > time::now() - 7d
GROUP BY agent_id
ORDER BY total_tasks DESC;
```

### 14. Find Similar Companies by Vector Embedding

```sql
-- Requires companies to have vector_embedding field added
SELECT id, name, industry,
  vector::similarity::cosine(vector_embedding, $target_vector) AS similarity
FROM company
WHERE vector_embedding IS NOT NONE
  AND id != $target_company_id
ORDER BY similarity DESC
LIMIT 10;
```

### 15. Multi-Model Query: Vector + Graph + Filter Combined

```sql
-- Find agent memories relevant to a query that are about high-score leads
SELECT m.id, m.content, m.summary, m.importance_score,
  vector::similarity::cosine(m.vector_embedding, $query_vec) AS relevance
FROM agent_memory AS m
WHERE m.agent_id = agent:researcher-001
  AND m.memory_type IN ['long_term', 'semantic']
  AND m.importance_score > 0.6
  AND 'company:TechCorp' IN m.tags
ORDER BY relevance DESC
LIMIT 5;
```

### 16. Batch Insert Companies from Scraper

```sql
INSERT INTO company [
  { id: 'company:corp-001', name: 'AlphaFlow', domain: 'alphaflow.io', industry: 'FinTech', employees: 45 },
  { id: 'company:corp-002', name: 'ByteWave', domain: 'bytewave.de', industry: 'SaaS', employees: 200 },
  { id: 'company:corp-003', name: 'Codex Systems', domain: 'codexsys.com', industry: 'DevTools', employees: 30 }
] ON DUPLICATE KEY UPDATE
  employees = $input.employees,
  updated_at = time::now();
```

### 17. Update Deal Stage with Auto Activity Log

```sql
BEGIN TRANSACTION;

UPDATE deal:d-001 SET
  stage = 'proposal',
  probability = 60,
  expected_revenue = value * 0.60,
  updated_at = time::now();

CREATE activity SET
  deal_id = deal:d-001,
  agent_id = agent:researcher-001,
  type = 'note',
  subject = 'Stage advanced to proposal',
  content = 'Sent proposal document. Decision expected within 2 weeks.',
  status = 'completed';

RELATE deal:d-001 -> has_activity -> $last.id;

COMMIT TRANSACTION;
```

### 18. Delete Agent and Cascade Relationships

```sql
BEGIN TRANSACTION;
-- Remove graph edges first
DELETE coordinates WHERE in = agent:old-001 OR out = agent:old-001;
DELETE assigned_to WHERE in = agent:old-001;
DELETE remembers WHERE in = agent:old-001;
-- Remove data records
DELETE agent_memory WHERE agent_id = agent:old-001;
DELETE agent_task WHERE agent_id = agent:old-001;
DELETE agent_message WHERE from_agent = agent:old-001 OR to_agent = agent:old-001;
-- Remove agent itself
DELETE agent:old-001;
COMMIT TRANSACTION;
```

### 19. Export Agent Memories to JSON

```sql
SELECT
  id,
  content,
  summary,
  memory_type,
  importance_score,
  tags,
  created_at,
  accessed_at
FROM agent_memory
WHERE agent_id = agent:researcher-001
  AND importance_score > 0.5
ORDER BY importance_score DESC;
-- Client: JSON.stringify(result.data)
```

### 20. Cross-Namespace Query Pattern

```sql
-- Query agents database from another database context
USE NS superstack DB agents;
SELECT * FROM agent WHERE status = 'active';

-- Switch back to another database
USE NS superstack DB analytics;
-- run analytics queries here
```

---

## Dragonfly Cache Patterns

Dragonfly is fully Redis-compatible. All `ioredis` / `redis` clients work without modification.

### Pattern 1: Cache-Aside (Read-Through)

```typescript
import { createDragonflyCache } from "@superstack/sdk";

const cache = await createDragonflyCache({
  url: "localhost:6379",
  password: process.env.DRAGONFLY_PASSWORD,
});

async function getCompany(id: string) {
  const cacheKey = `company:${id}`;

  // 1. Check cache first
  const cached = await cache.get<Company>(cacheKey);
  if (cached) return cached;

  // 2. Cache miss — query SurrealDB
  const db = sdk.getDB();
  const company = await db.read<Company>(id);

  // 3. Populate cache with 1h TTL
  await cache.set(cacheKey, company, { ttl: 3600 });
  return company;
}
```

### Pattern 2: Write-Through (Dual Write)

```typescript
async function updateCompany(id: string, data: Partial<Company>) {
  const db = sdk.getDB();
  const cache = sdk.getCache();

  // Write to DB first (source of truth)
  const updated = await db.update<Company>(id, data);

  // Immediately update cache — prevents stale reads
  await cache.set(`company:${id}`, updated, { ttl: 3600 });

  return updated;
}
```

### Pattern 3: Agent Session State (TTL-Based)

```typescript
// Store agent working state — auto-expires if agent crashes
await cache.set(`agent:session:${agentId}`, {
  currentTask: taskId,
  startedAt: Date.now(),
  context: { companyId, dealId },
  stepProgress: 0,
}, { ttl: 300 }); // 5 min — heartbeat must renew

// Heartbeat renewal
setInterval(async () => {
  const session = await cache.get(`agent:session:${agentId}`);
  if (session) {
    await cache.set(`agent:session:${agentId}`, session, { ttl: 300 });
  }
}, 60_000);
```

### Pattern 4: Rate Limiting (Sliding Window)

```typescript
async function checkRateLimit(agentId: string, limit = 100, windowSec = 60): Promise<boolean> {
  const key = `ratelimit:${agentId}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const count = await cache.incr(key);

  if (count === 1) {
    await cache.expire(key, windowSec * 2); // double window for safety
  }

  return count <= limit;
}
```

### Pattern 5: Pub/Sub for Inter-Agent Events

```typescript
// Publisher (orchestrator agent)
await cache.publish("agents:events", {
  type: "task_available",
  taskId: "task:research-001",
  priority: "high",
  requiredCapabilities: ["web_search"],
});

// Subscriber (worker agent)
await cache.subscribe("agents:events", async (raw) => {
  const event = JSON.parse(raw);
  if (event.type === "task_available" && canHandle(event)) {
    await claimTask(event.taskId);
  }
});
```

---

## NATS Message Patterns

NATS JetStream provides at-least-once delivery with durable consumers. Subjects follow the hierarchy `namespace.entity.event`.

### Pattern 1: Request-Reply (Agent Asks Orchestrator)

```typescript
import { createNatsClient } from "@superstack/sdk";

const nats = await createNatsClient({ url: "nats://localhost:4222" });

// Requester (agent)
const response = await nats.request("orchestrator.tasks.next", {
  agentId: "agent:worker-001",
  capabilities: ["web_search", "email"],
}, 5000); // 5s timeout

console.log("Assigned task:", response);

// Responder (orchestrator) — uses native connection for core request handling
const nc = nats.getNativeConnection()!;
const sub = nc.subscribe("orchestrator.tasks.next");
for await (const msg of sub) {
  const payload = JSON.parse(new TextDecoder().decode(msg.data));
  const task = await assignNextTask(payload.agentId, payload.capabilities);
  msg.respond(new TextEncoder().encode(JSON.stringify(task)));
}
```

### Pattern 2: Pub/Sub (Broadcast Agent Events)

```typescript
// Create persistent stream first
await nats.createStream({
  name: "AGENT_EVENTS",
  subjects: ["agents.>"],          // wildcard: all agents.* subjects
  retention: "limits",
  maxAge: 86400,                   // keep 24h
});

// Publisher
await nats.publish("agents.researcher-001.status", {
  agentId: "agent:researcher-001",
  status: "active",
  timestamp: new Date().toISOString(),
});

// Subscriber (dashboard or monitoring agent)
await nats.subscribe("agents.>", async (msg) => {
  console.log(`Event on ${msg.subject}:`, msg.data);
});
```

### Pattern 3: Queue Groups (Load-Balanced Task Distribution)

```typescript
// Multiple worker agents subscribe to the same queue group
// NATS delivers each message to exactly ONE subscriber in the group
async function startWorker(workerId: string) {
  await nats.createStream({
    name: "TASKS",
    subjects: ["tasks.pending"],
    retention: "workqueue",        // message deleted after ack
  });

  await nats.subscribe("tasks.pending", async (msg) => {
    console.log(`[Worker ${workerId}] Claimed task:`, msg.data);
    await processTask(msg.data);
  }, {
    queue: "task-workers",         // queue group name — load-balanced
    deliverPolicy: "all",
    maxDeliver: 3,                 // retry up to 3 times on nack
  });
}

// Start 3 workers — tasks distributed evenly
await startWorker("w1");
await startWorker("w2");
await startWorker("w3");
```

### Pattern 4: JetStream Durable Consumer (Guaranteed Delivery)

```typescript
// Create stream
await nats.createStream({
  name: "OUTREACH",
  subjects: ["outreach.emails.>"],
  retention: "limits",
  maxAge: 7 * 86400,              // 7-day retention
});

// Create durable consumer — survives agent restarts
await nats.createConsumerGroup("OUTREACH", "email-sender", {
  deliverPolicy: "all",
  maxDeliver: 5,
});

// Worker picks up from where it left off after restart
await nats.subscribe("outreach.emails.send", async (msg) => {
  await sendEmail(msg.data);
  // msg is auto-acked on successful handler return
  // msg.nak() is called automatically on exception — triggers retry
}, {
  queue: "email-sender",          // matches durable consumer name
  maxDeliver: 5,
});
```

### Pattern 5: Key-Value Store (Distributed Config)

```typescript
// NATS KV is backed by JetStream — use native client
const nc = nats.getNativeConnection()!;
const js = nc.jetstream();
const kv = await js.views.kv("superstack-config");

// Write config
await kv.put("agents.max_concurrent_tasks", new TextEncoder().encode("10"));
await kv.put("models.default", new TextEncoder().encode("haiku"));

// Read config
const entry = await kv.get("agents.max_concurrent_tasks");
const value = new TextDecoder().decode(entry?.value);

// Watch for changes (real-time config updates)
const watcher = await kv.watch({ key: "agents.>" });
for await (const update of watcher) {
  console.log(`Config changed: ${update.key} = ${new TextDecoder().decode(update.value)}`);
}
```

### NATS Subject Naming Convention

```
agents.{agent_id}.{event}         — agent lifecycle events
  agents.researcher-001.started
  agents.researcher-001.error
  agents.researcher-001.heartbeat

tasks.{priority}.{type}           — task distribution
  tasks.high.research
  tasks.medium.outreach
  tasks.low.report

outreach.emails.{action}          — email pipeline
  outreach.emails.send
  outreach.emails.delivered
  outreach.emails.bounced

orchestrator.{entity}.{action}    — orchestrator control
  orchestrator.tasks.next
  orchestrator.agents.spawn
  orchestrator.agents.kill

metrics.{service}.{metric}        — telemetry forwarding
  metrics.agents.cost_usd
  metrics.db.query_time_ms
```

---

## Meilisearch Integration Patterns

### Pattern 1: Sync SurrealDB to Meilisearch on Change

```typescript
import { createMeilisearchClient } from "@superstack/sdk";

const meili = await createMeilisearchClient({
  url: "http://localhost:7700",
  masterKey: process.env.MEILI_MASTER_KEY!,
});

// Create index with field config
await meili.createIndex({
  name: "companies",
  primaryKey: "id",
  searchableAttributes: ["name", "domain", "industry", "notes"],
  filterableAttributes: ["industry", "lead_score", "tags", "employees"],
  sortableAttributes: ["lead_score", "revenue", "employees", "created_at"],
});

// Sync function — call after SurrealDB writes
async function syncCompanyToSearch(company: Company) {
  await meili.addDocuments("companies", [company]);
}

// Bulk sync (initial or rebuild)
async function fullSync() {
  const companies = await db.select<Company>("company");
  const chunks = chunkArray(companies, 1000);
  for (const chunk of chunks) {
    await meili.addDocuments("companies", chunk);
  }
}
```

### Pattern 2: Faceted Search for Companies

```typescript
// Search with facet distribution — returns counts per filter value
const results = await meili.searchWithFacets<Company>("companies", {
  query: "payment fintech",
  filters: { industry: "FinTech" },
  limit: 20,
  offset: 0,
  sort: "lead_score:desc",
  facets: ["industry", "tags"],
});

console.log(results.hits);          // matching companies
console.log(results.totalHits);     // total count
console.log(results.facets);        // { industry: { FinTech: 45, SaaS: 12 }, ... }
console.log(results.processingTimeMs); // typically < 5ms
```

### Pattern 3: Typo-Tolerant Agent Memory Search

```typescript
// Useful for finding memories even with fuzzy queries
async function searchAgentMemories(query: string, agentId?: string) {
  // Create index if needed
  await meili.createIndex({
    name: "agent_memories",
    primaryKey: "id",
    searchableAttributes: ["content", "summary", "tags"],
    filterableAttributes: ["agent_id", "memory_type", "importance_score"],
  });

  const filter = agentId ? { agent_id: agentId } : undefined;

  const results = await meili.search<AgentMemory>("agent_memories", {
    query,
    filters: filter,
    limit: 10,
  });

  return results.hits;
}

// "techcorp q4 budget" matches "TechCorp GmbH Q4 Budget Cycle"
const memories = await searchAgentMemories("techcorp q4 budget", "agent:researcher-001");
```

---

## Use Cases Matrix

Legend: DB = SurrealDB | Cache = Dragonfly | Queue = NATS | Search = Meilisearch | Monitor = SigNoz/Langfuse

### AI Agent Operations (1-20)

| # | Use Case | Services |
|---|----------|----------|
| 1 | Multi-agent orchestration — spawn, assign, coordinate agents | DB + Queue + Cache |
| 2 | Agent memory management — store/retrieve episodic & semantic memory | DB (vector) + Cache |
| 3 | Task queue distribution — balanced work across N workers | Queue (workqueue) |
| 4 | Agent-to-agent communication — direct + broadcast messaging | Queue + DB |
| 5 | Real-time agent status monitoring — LIVE SELECT + dashboard | DB (live) + Cache |
| 6 | Agent performance analytics — cost, duration, success rates | DB + Monitor |
| 7 | Cost tracking per agent — token usage, USD spend over time | DB + Monitor |
| 8 | Agent decision audit trail — full execution log with inputs/outputs | DB + Monitor |
| 9 | Agent skill/capability registry — typed agent profiles | DB |
| 10 | Autonomous error recovery — retry logic, fallback agents | Queue (nak/retry) + Cache |
| 11 | Agent team formation — dynamic group creation via graph | DB (graph) + Queue |
| 12 | Knowledge graph building — entities + relationships over time | DB (graph) |
| 13 | RAG pipeline — chunk, embed, store, retrieve relevant context | DB (vector) + Cache |
| 14 | Semantic memory retrieval — cosine similarity on embeddings | DB (MTREE index) |
| 15 | Agent state machine — persist state across restarts | Cache (TTL) + DB |
| 16 | Multi-model routing — route by task complexity to haiku/sonnet/opus | Cache + Queue |
| 17 | Agent sandboxing — namespace isolation per agent team | DB (namespaces) |
| 18 | Agent versioning — track prompt/config changes over time | DB |
| 19 | A/B testing agents — compare performance by variant | DB + Monitor |
| 20 | Agent capability marketplace — discover agents by skill | DB + Search |

### CRM & Sales (21-40)

| # | Use Case | Services |
|---|----------|----------|
| 21 | Contact + company graph — relationships, decision makers | DB (graph) |
| 22 | Lead scoring — auto-increment on activity events | DB (triggers) |
| 23 | Deal pipeline — stage tracking with probability-weighted revenue | DB |
| 24 | Automated outreach sequencing — multi-step email campaigns | Queue + DB |
| 25 | Email bounce / unsubscribe tracking — keep list clean | DB + Queue |
| 26 | CRM full-text search — find companies, contacts, deals | Search |
| 27 | Activity timeline per contact/deal | DB (graph) |
| 28 | Agent-automated follow-up scheduling | DB + Queue + Cache |
| 29 | Duplicate detection — fuzzy match on domain/name | Search + DB |
| 30 | ICP scoring — match company attributes against ideal profile | DB |
| 31 | Enrichment pipeline — scraper fills company fields | Queue + DB |
| 32 | Win/loss analysis — aggregate reasons by industry/size | DB |
| 33 | Sales forecasting — pipeline value by close probability | DB |
| 34 | Meeting scheduling — availability + auto-confirm | Queue + DB |
| 35 | Cold outreach personalization — agent reads memory before writing | DB (vector) |
| 36 | LinkedIn enrichment tracking — update contact profiles | DB + Queue |
| 37 | Segment companies by tag/industry/score | DB + Search |
| 38 | Competitor intelligence — track mentions across deals | DB + Search |
| 39 | Renewal prediction — activity pattern analysis | DB |
| 40 | Customer health score — weighted activity signals | DB + Cache |

### E-Commerce (41-55)

| # | Use Case | Services |
|---|----------|----------|
| 41 | Product catalog with instant search | Search + DB |
| 42 | Session cart with TTL expiry | Cache |
| 43 | Real-time inventory updates — LIVE SELECT on stock | DB (live) |
| 44 | Price engine — rule-based pricing with cache layer | DB + Cache |
| 45 | Recommendation engine — similar items via vector similarity | DB (vector) |
| 46 | Order pipeline — status state machine with events | DB + Queue |
| 47 | Flash sale coordination — atomic stock decrement | Cache (atomic INCR) |
| 48 | Review sentiment analysis — store embeddings per review | DB (vector) |
| 49 | Customer purchase graph — what bought together | DB (graph) |
| 50 | Abandoned cart recovery — TTL-triggered re-engagement | Cache + Queue |
| 51 | Dynamic faceted product filtering | Search |
| 52 | Personalized product feed — agent-scored per user | DB (vector) + Cache |
| 53 | Fraud detection — pattern matching on order graph | DB (graph) |
| 54 | Supplier order management — graph of vendors and SKUs | DB (graph) |
| 55 | Analytics: conversion funnel by channel | DB + Monitor |

### Data & Scraping (56-70)

| # | Use Case | Services |
|---|----------|----------|
| 56 | Distributed scraping — job queue with dedup | Queue + Cache + DB |
| 57 | URL deduplication — bloom filter in cache | Cache |
| 58 | Scrape result normalization — schema validation + insert | DB |
| 59 | Change detection — diff new vs. cached page hash | Cache + DB |
| 60 | Proxy rotation queue — NATS round-robin proxy pool | Queue |
| 61 | Rate limit tracking per domain | Cache (sliding window) |
| 62 | Data enrichment pipeline — chain multiple APIs | Queue (chained subjects) |
| 63 | ETL pipeline — transform + validate + load | Queue + DB |
| 64 | Webhook ingestion — receive + deduplicate + fan-out | Queue + Cache |
| 65 | Data versioning — store diffs per record update | DB |
| 66 | Export to S3 — batch results to SeaweedFS | DB + Storage (SeaweedFS) |
| 67 | Search index rebuild — full resync from DB | DB + Search |
| 68 | Data quality scoring — completeness + freshness | DB |
| 69 | Cross-source entity resolution — fuzzy match merge | Search + DB |
| 70 | Crawl frontier management — priority queue with TTL | Queue + Cache |

### DevOps & Platform (71-85)

| # | Use Case | Services |
|---|----------|----------|
| 71 | Distributed tracing — instrument all services with OTEL | Monitor (SigNoz) |
| 72 | LLM call tracing — latency, tokens, cost per prompt | Monitor (Langfuse) |
| 73 | Prompt version management — A/B test prompt variants | Monitor (Langfuse) |
| 74 | Uptime monitoring — HTTP checks with alerting | Monitor (Uptime Kuma) |
| 75 | Server resource monitoring — CPU/RAM/disk across hosts | Monitor (Beszel) |
| 76 | Auto-HTTPS routing — add subdomain per service in Caddyfile | Caddy |
| 77 | Zero-downtime deploys — health-check aware compose | Docker Compose |
| 78 | Workflow automation — scheduled scripts and flows | Windmill |
| 79 | Feature flags — KV store in NATS | Queue (KV) |
| 80 | Configuration hot-reload — watch NATS KV changes | Queue (KV watch) |
| 81 | Log aggregation — structured logs to SigNoz via OTLP | Monitor (SigNoz) |
| 82 | Alert routing — metrics threshold to NATS events | Monitor + Queue |
| 83 | Circuit breaker — track failure counts in cache | Cache |
| 84 | Service discovery — register services in SurrealDB | DB + Cache |
| 85 | Blue/green deploys — traffic routing via Caddy rewrites | Caddy |

### Business Intelligence (86-100)

| # | Use Case | Services |
|---|----------|----------|
| 86 | Real-time revenue dashboard — LIVE SELECT on deals | DB (live) + Cache |
| 87 | Agent cost report — daily USD spend by agent/model | DB + Monitor |
| 88 | Funnel analysis — stage conversion rates over time | DB |
| 89 | Cohort analysis — customers by acquisition month | DB |
| 90 | Web analytics — page views, sessions, conversions | Monitor (Umami) |
| 91 | Email campaign metrics — open/click rates via Listmonk | Monitor (Listmonk) |
| 92 | SLA tracking — task completion within deadline | DB + Monitor |
| 93 | Anomaly detection — flag unusual agent behavior | DB + Monitor |
| 94 | Predictive lead scoring — ML model outputs stored as scores | DB (vector) |
| 95 | Multi-tenant reporting — namespace isolation per client | DB (namespaces) |
| 96 | Executive KPI dashboard — pre-aggregated cache layer | Cache + DB |
| 97 | Time-series metrics — token usage, API calls per hour | DB + Monitor |
| 98 | Competitor benchmarking — track market signals in DB | DB + Search |
| 99 | Custom event tracking — instrument apps with Umami | Monitor (Umami) |
| 100 | Automated weekly digest — Windmill script + Listmonk send | Windmill + Email |

---

## Framework Extension Points

### How to Add a New Agent Type

**Step 1: Define the role in SurrealDB schema**

```sql
-- Add to init.surql or run manually
ALTER TABLE agent MODIFY FIELD role
  ASSERT $value IN ['researcher','scraper','outreach','analyst','orchestrator',
                    'supervisor','custom','your_new_role'];
```

**Step 2: Create TypeScript type**

```typescript
// src/types.ts — extend AgentRole enum
export enum AgentRole {
  // ... existing roles ...
  YOUR_NEW_ROLE = "your_new_role",
}
```

**Step 3: Register agent in SurrealDB on startup**

```typescript
const agent = await db.create("agent", {
  id: "agent:your-agent-001",
  name: "Your New Agent",
  role: "your_new_role",
  status: "idle",
  model: "sonnet",
  capabilities: ["capability_a", "capability_b"],
});
```

**Step 4: Create NATS subscription for agent tasks**

```typescript
await nats.createStream({
  name: "YOUR_AGENT_TASKS",
  subjects: ["tasks.your_new_role.>"],
  retention: "workqueue",
});

await nats.subscribe("tasks.your_new_role.process", async (msg) => {
  const task = msg.data;
  await processTask(task);
}, { queue: "your-agent-workers" });
```

**Step 5: Publish task completion and update status**

```typescript
await db.update("agent:your-agent-001", { status: "idle" });
await nats.publish("agents.your-agent-001.completed", {
  taskId: task.id, result, durationMs: elapsed, costUsd: cost
});
```

---

### How to Add a New Service to docker-compose.yml

```yaml
# In docker-compose.yml — add under services:

  your-service:
    image: your-image:version
    container_name: superstack-your-service
    restart: unless-stopped
    profiles: [your-profile]           # optional: gateway, search, monitoring, etc.
    environment:
      YOUR_ENV_VAR: ${YOUR_ENV_VAR:?YOUR_ENV_VAR required}
    ports:
      - "${YOUR_PORT:-XXXX}:XXXX"
    volumes:
      - your-service-data:/data
      - ./services/your-service/config.yml:/etc/your-service/config.yml:ro
    networks:
      - superstack
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:XXXX/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    labels:
      superstack.service: "your-service"
      superstack.profile: "your-profile"
      superstack.url: "http://localhost:XXXX"
      superstack.description: "Short description"
```

Then add the volume at the top:
```yaml
volumes:
  your-service-data:
```

And add the env vars to `env.example`:
```bash
YOUR_PORT=XXXX
YOUR_ENV_VAR=CHANGE_ME
```

---

### How to Add a New API Route via Caddy

**For production domain (`DOMAIN` set in .env):**

```caddyfile
# In services/caddy/Caddyfile

your-service.{$DOMAIN} {
    reverse_proxy your-service-container-name:INTERNAL_PORT
}
```

**For local dev (always available):**

```caddyfile
your-service.localhost {
    tls internal
    reverse_proxy your-service-container-name:INTERNAL_PORT
}
```

**Path-based routing (share a domain):**

```caddyfile
{$DOMAIN} {
    handle /your-path/* {
        uri strip_prefix /your-path
        reverse_proxy your-service-container-name:INTERNAL_PORT
    }
}
```

---

### How to Create a NATS Subject Hierarchy

Follow the convention: `{domain}.{entity}.{action}` — always lowercase, dots as separators.

```
# Pattern examples
agents.{agent_id}.{lifecycle_event}
  agents.researcher-001.started
  agents.researcher-001.heartbeat
  agents.researcher-001.error
  agents.researcher-001.shutdown

tasks.{priority}.{type}.{action}
  tasks.high.research.assigned
  tasks.high.research.completed
  tasks.high.research.failed

outreach.{channel}.{action}
  outreach.email.send
  outreach.email.delivered
  outreach.email.bounced
  outreach.email.replied

crm.{entity}.{action}
  crm.company.created
  crm.deal.stage_changed
  crm.contact.enriched

# Wildcard subscriptions
agents.>                   # all agent events (any depth)
tasks.high.*               # all high-priority task actions (one level)
outreach.email.*           # all email outreach actions
```

---

## Environment Variables Reference

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `SURREALDB_USER` | `root` | Yes | SurrealDB admin username |
| `SURREALDB_PASSWORD` | — | Yes | SurrealDB admin password (strong) |
| `SURREALDB_PORT` | `8000` | No | SurrealDB host port |
| `DRAGONFLY_PASSWORD` | — | Yes | Dragonfly auth password |
| `DRAGONFLY_PORT` | `6379` | No | Dragonfly host port |
| `DRAGONFLY_MAX_MEMORY` | `2gb` | No | Max cache memory |
| `NATS_CLIENT_PORT` | `4222` | No | NATS client port |
| `NATS_MONITOR_PORT` | `8222` | No | NATS monitoring HTTP port |
| `DOMAIN` | `localhost` | No | Domain for Caddy HTTPS |
| `ACME_EMAIL` | `admin@example.com` | No | Let's Encrypt email |
| `MEILI_MASTER_KEY` | — | Yes (search profile) | Meilisearch master API key (min 16 chars) |
| `MEILI_PORT` | `7700` | No | Meilisearch host port |
| `MEILI_ENV` | `production` | No | `production` or `development` |
| `MEILI_MAX_INDEXING_MEMORY` | `1Gb` | No | Max memory for indexing |
| `SIGNOZ_PORT` | `3301` | No | SigNoz UI port |
| `SIGNOZ_CLICKHOUSE_PASSWORD` | — | Yes (monitoring) | ClickHouse password for SigNoz |
| `OTEL_GRPC_PORT` | `4317` | No | OTLP gRPC receiver port |
| `OTEL_HTTP_PORT` | `4318` | No | OTLP HTTP receiver port |
| `LANGFUSE_PORT` | `3100` | No | Langfuse UI port |
| `LANGFUSE_DB_PASSWORD` | — | Yes (monitoring) | PostgreSQL password for Langfuse |
| `LANGFUSE_NEXTAUTH_SECRET` | — | Yes (monitoring) | NextAuth secret (32+ chars) |
| `LANGFUSE_SALT` | — | Yes (monitoring) | Langfuse salt (32+ chars) |
| `LANGFUSE_INIT_USER_EMAIL` | `admin@superstack.local` | No | Auto-created admin email |
| `LANGFUSE_INIT_USER_PASSWORD` | — | Yes (monitoring) | Auto-created admin password |
| `BESZEL_PORT` | `8090` | No | Beszel UI port |
| `UPTIME_KUMA_PORT` | `3200` | No | Uptime Kuma UI port |
| `WINDMILL_PORT` | `8100` | No | Windmill UI port |
| `WINDMILL_DB_PASSWORD` | — | Yes (workflows) | PostgreSQL password for Windmill |
| `WINDMILL_SECRET` | — | Yes (workflows) | Windmill encryption secret (32+ chars) |
| `LISTMONK_PORT` | `9000` | No | Listmonk UI port |
| `LISTMONK_DB_PASSWORD` | — | Yes (email) | PostgreSQL password for Listmonk |
| `LISTMONK_ADMIN_PASSWORD` | — | Yes (email) | Listmonk admin password |
| `SEAWEEDFS_MASTER_PORT` | `9333` | No | SeaweedFS master port |
| `SEAWEEDFS_VOLUME_PORT` | `8080` | No | SeaweedFS volume port |
| `SEAWEEDFS_S3_PORT` | `8333` | No | SeaweedFS S3 API port |
| `SEAWEEDFS_ACCESS_KEY` | — | Yes (storage) | S3 access key |
| `SEAWEEDFS_SECRET_KEY` | — | Yes (storage) | S3 secret key |
| `UMAMI_PORT` | `3500` | No | Umami analytics UI port |
| `UMAMI_DB_PASSWORD` | — | Yes (storage) | PostgreSQL password for Umami |
| `UMAMI_APP_SECRET` | — | Yes (storage) | Umami app secret (32+ chars) |

**SDK-specific env vars (not in docker-compose):**

| Variable | Default | Description |
|----------|---------|-------------|
| `SURREALDB_URL` | `ws://localhost:8000` | SurrealDB WebSocket URL for SDK |
| `SURREALDB_NAMESPACE` | — | SurrealDB namespace to use |
| `SURREALDB_DATABASE` | — | SurrealDB database to use |
| `DRAGONFLY_URL` | `localhost:6379` | Dragonfly connection URL for SDK |
| `DRAGONFLY_DB` | `0` | Dragonfly database index |
| `NATS_URL` | `nats://localhost:4222` | NATS connection URL for SDK |
| `NATS_USER` | — | NATS username (if auth enabled) |
| `NATS_PASSWORD` | — | NATS password (if auth enabled) |
| `MEILI_URL` | `http://localhost:7700` | Meilisearch HTTP URL for SDK |

**Generate secrets:**
```bash
openssl rand -base64 32    # for passwords, secrets, salts
openssl rand -hex 16       # for API keys
```

---

## Port Map (Conflict Reference)

| Port  | Service                   | Profile    | Protocol    |
|-------|---------------------------|------------|-------------|
| 80    | Caddy HTTP                | gateway    | HTTP        |
| 443   | Caddy HTTPS               | gateway    | HTTPS/HTTP3 |
| 3100  | Langfuse UI               | monitoring | HTTP        |
| 3200  | Uptime Kuma               | monitoring | HTTP        |
| 3301  | SigNoz UI                 | monitoring | HTTP        |
| 3500  | Umami Analytics           | storage    | HTTP        |
| 4222  | NATS client               | core       | NATS        |
| 4317  | OTLP gRPC                 | monitoring | gRPC        |
| 4318  | OTLP HTTP                 | monitoring | HTTP        |
| 6379  | Dragonfly (Redis)         | core       | Redis       |
| 7700  | Meilisearch               | search     | HTTP        |
| 8000  | SurrealDB                 | core       | WS/HTTP     |
| 8080  | SeaweedFS volume          | storage    | HTTP        |
| 8090  | Beszel                    | monitoring | HTTP        |
| 8100  | Windmill                  | workflows  | HTTP        |
| 8222  | NATS monitoring           | core       | HTTP        |
| 8333  | SeaweedFS S3 API          | storage    | HTTP (S3)   |
| 9000  | Listmonk                  | email      | HTTP        |
| 9333  | SeaweedFS master          | storage    | HTTP        |

**Avoid binding your own services to these ports.** Use 3000-3099, 8400-8499, 9100-9299 for custom services.

---

## Technology Versions

| Technology     | Version       | Docker Image                              | Released  | Notes |
|----------------|---------------|-------------------------------------------|-----------|-------|
| SurrealDB      | v2.3.3        | `surrealdb/surrealdb:v2.3.3`             | 2024      | RocksDB backend, vector indexes |
| Dragonfly      | v1.27.2       | `dragonflydb/dragonfly:v1.27.2`          | 2024      | 25x Redis throughput, same protocol |
| NATS           | 2.10          | `nats:2.10-alpine`                        | 2024      | JetStream enabled, 8MB max payload |
| Caddy          | 2.9           | `caddy:2.9-alpine`                        | 2024      | Auto-HTTPS, HTTP/3 |
| Meilisearch    | v1.12         | `getmeili/meilisearch:v1.12`             | 2024      | Typo tolerance, facets, semantic |
| SigNoz         | 0.54.0        | `signoz/frontend:0.54.0`                 | 2024      | Full OTel stack |
| ClickHouse     | 24.7          | `clickhouse/clickhouse-server:24.7-alpine`| 2024     | SigNoz backend |
| Langfuse       | 3             | `langfuse/langfuse:3`                    | 2024      | LLM observability |
| Beszel         | latest        | `henrygd/beszel:latest`                  | 2024      | Lightweight server monitor |
| Uptime Kuma    | 1             | `louislam/uptime-kuma:1`                 | 2024      | Status pages |
| Windmill       | latest        | `ghcr.io/windmill-labs/windmill:latest`  | 2024      | Scripts + flows + apps |
| Listmonk       | v4.1.0        | `listmonk/listmonk:v4.1.0`              | 2024      | Newsletter manager |
| SeaweedFS      | 3.77          | `chrislusf/seaweedfs:3.77`              | 2024      | S3-compatible object storage |
| Umami          | postgresql-latest | `ghcr.io/umami-software/umami:postgresql-latest` | 2024 | GA alternative |
| PostgreSQL     | 16            | `postgres:16-alpine`                     | 2023      | Used by Langfuse/Windmill/Listmonk/Umami |
| ZooKeeper      | 3.7.2         | `bitnami/zookeeper:3.7.2`               | 2024      | SigNoz ClickHouse coordination |

**SDK dependencies (package.json):**

| Package      | Version | Purpose |
|-------------|---------|---------|
| `surrealdb`  | ^1.0.0  | SurrealDB WebSocket client |
| `ioredis`    | ^5.3.2  | Redis/Dragonfly client with cluster support |
| `nats`       | ^2.17.0 | NATS + JetStream client |
| `meilisearch`| ^0.37.0 | Meilisearch HTTP client |
| `zod`        | ^3.22.4 | Schema validation for NATS messages |
| `typescript` | ^5.3.3  | TypeScript compiler |

---

## Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `SURREALDB_PASSWORD required` on startup | env var not set | `cp env.example .env` then fill secrets |
| SurrealDB `ws://` connection refused | Container not started | `./scripts/start.sh core` |
| Dragonfly `ECONNREFUSED` | Wrong password or port | Check `DRAGONFLY_PASSWORD` in `.env` |
| NATS `MaxPayload exceeded` | Message > 8MB | Split payload or use SeaweedFS for blobs |
| Meilisearch 403 Unauthorized | Wrong master key | Set `MEILI_MASTER_KEY` min 16 chars |
| Caddy HTTPS cert error locally | Self-signed cert rejected | Add `tls internal` and trust Caddy's local CA |
| SigNoz UI empty after start | ClickHouse still initializing | Wait 60-90s — SigNoz has long start_period |
| Vector search returns no results | Embedding dim mismatch | Ensure all vectors use same dimension as index |
| NATS message lost on worker crash | Not using JetStream | Use `createStream` + durable consumer |
| Cache hit rate low | TTL too short | Tune TTL to data staleness tolerance |

---

## File Structure Reference

```
superstack/
├── docker-compose.yml         # All 14+ services with profiles
├── env.example                # Copy to .env — all variables documented
├── AGENT.md                   # This file — AI agent context
├── README.md                  # Human-facing overview
├── SDK.md                     # SDK detailed documentation
├── CONFIG.md                  # Configuration reference
├── package.json               # SDK package (@superstack/sdk v1.0.0)
├── tsconfig.json              # TypeScript config
├── scripts/
│   ├── start.sh               # Profile-based start script
│   ├── stop.sh                # Stop all services
│   ├── status.sh              # Check running services
│   └── init-db.sh             # Initialize SurrealDB schema
├── services/
│   ├── caddy/Caddyfile        # Reverse proxy config (subdomain routing)
│   ├── nats/nats.conf         # NATS server config
│   ├── surrealdb/
│   │   ├── init.surql         # Schema: tables, indexes, events, functions
│   │   └── seed.surql         # Optional seed data
│   ├── signoz/                # SigNoz OTEL collector + ClickHouse config
│   ├── seaweedfs/s3.json      # SeaweedFS S3 credentials config
│   └── listmonk/config.toml   # Listmonk app config
├── src/                       # TypeScript SDK source
│   ├── index.ts               # Main exports + SuperStackSDK class
│   ├── types.ts               # All TypeScript types and enums
│   ├── db/surreal.ts          # SurrealDBClient class
│   ├── cache/dragonfly.ts     # DragonflyCache class
│   ├── queue/nats.ts          # NatsClient class
│   └── search/meili.ts        # MeilisearchClient class
├── examples/
│   ├── agent-example.ts       # Full multi-agent task system example
│   └── basic-usage.ts         # SDK connection and CRUD example
└── docs/                      # Additional documentation
```
