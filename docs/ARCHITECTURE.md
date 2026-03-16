# SuperStack Architecture

**Comprehensive Design & Implementation Guide**

This document describes the complete architecture of SuperStack, including service interactions, data flows, agent lifecycle, messaging patterns, and optimization strategies.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Service Architecture](#service-architecture)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Agent Lifecycle](#agent-lifecycle)
6. [Message Patterns](#message-patterns)
7. [Caching Strategy](#caching-strategy)
8. [Search Indexing](#search-indexing)
9. [Monitoring Pipeline](#monitoring-pipeline)
10. [Performance Optimization](#performance-optimization)

---

## System Overview

SuperStack is a **composable infrastructure platform** designed for building distributed, AI-powered systems. It provides a unified abstraction layer over specialized services, each optimized for specific workloads.

### Design Principles

1. **Separation of Concerns**: Each service owns a specific responsibility
2. **Loose Coupling**: Services communicate through standardized protocols
3. **Horizontal Scalability**: All services can scale independently
4. **Observability First**: All operations are traced and metered
5. **Developer Experience**: Single SDK abstracts all complexity
6. **Open Standards**: Uses CQRS, event sourcing, and messaging patterns

### Architectural Layers

```
┌─────────────────────────────────────────┐
│  APPLICATION LAYER                      │  Your AI agents, APIs, workflows
├─────────────────────────────────────────┤
│  SDK LAYER (@superstack/sdk)            │  Unified TypeScript client
├─────────────────────────────────────────┤
│  GATEWAY LAYER (Caddy)                  │  Routing, TLS, rate limiting
├─────────────────────────────────────────┤
│  SERVICE LAYER                          │  Core services + add-ons
│  ├─ Persistence: SurrealDB              │  Graph DB with relationships
│  ├─ Cache: Dragonfly                    │  In-memory, Redis-compatible
│  ├─ Messaging: NATS                     │  Streaming, task distribution
│  ├─ Search: Meilisearch                 │  Full-text search
│  ├─ Workflows: Windmill                 │  Automation engine
│  ├─ Monitoring: SigNoz                  │  Traces & metrics
│  └─ More: Uptime Kuma, Beszel, etc.     │  Specialized tools
├─────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                   │  Docker, volumes, networking
└─────────────────────────────────────────┘
```

---

## Core Architecture

### Service Topology

```
                  ┌────────────────┐
                  │   CADDY GW     │
                  │  (:80, :443)   │
                  └────────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────────┐   ┌──────────────┐  ┌──────────────┐
   │ SurrealDB   │   │  Dragonfly   │  │    NATS      │
   │ :8000       │   │  :6379       │  │ :4222/:8222  │
   └─────────────┘   └──────────────┘  └──────────────┘
        │                  │                  │
        ├──────────────────┼──────────────────┤
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────────┐   ┌──────────────┐  ┌──────────────┐
   │  Meilisearch│   │   Windmill   │  │   SigNoz     │
   │  :7700      │   │   :8100      │  │  :3301       │
   └─────────────┘   └──────────────┘  └──────────────┘
```

### Communication Patterns

**Synchronous** (Request-Response):
- Application → SurrealDB (data fetch/update)
- Application → Dragonfly (cache hit/miss)
- Application → Meilisearch (search query)

**Asynchronous** (Event-Driven):
- Publisher → NATS (event published)
- NATS → Subscribers (multi-subscriber delivery)
- NATS JetStream (persistent message replay)

**Hybrid** (Request-Reply):
- Agent publishes task → NATS
- Processor subscribes & processes
- Processor publishes result → NATS
- Agent waits for reply (with timeout)

---

## Service Architecture

### 1. SurrealDB (Data Persistence)

**Role**: Graph database with record relationships, multi-tenant support, and real-time queries.

**Schema Design**:
```surql
-- Tables with field definitions
DEFINE TABLE companies SCHEMALESS;
DEFINE TABLE deals SCHEMALESS;
DEFINE TABLE contacts SCHEMALESS;
DEFINE TABLE activities SCHEMALESS;

-- Relationships
DEFINE FIELD company ON deals TYPE RECORD(companies);
DEFINE FIELD contact ON deals TYPE RECORD(contacts);
DEFINE FIELD created_by ON deals TYPE RECORD(contacts);

-- Indexes for performance
DEFINE INDEX idx_company_name ON companies COLUMNS name UNIQUE;
DEFINE INDEX idx_deal_status ON deals COLUMNS status;
DEFINE INDEX idx_contact_email ON contacts COLUMNS email UNIQUE;

-- Full-text search indexes
DEFINE INDEX ft_companies ON companies COLUMNS name, description SEARCH ANALYZER LIKE;
DEFINE INDEX ft_activities ON activities COLUMNS description SEARCH ANALYZER LIKE;

-- Computed fields
DEFINE FIELD total_value ON deals VALUE {
  RETURN (SELECT math::sum(value) FROM deals WHERE company = this.company).sum
};
```

**Query Patterns**:

```typescript
// Simple CRUD
const company = await db.select("companies:acme-corp");
const deal = await db.create("deals", { title: "New Deal" });
await db.update("companies:acme-corp", { updated_at: time::now() });
await db.delete("deals:deal-123");

// Relations with fetch
const deals = await db.query(`
  SELECT *, company.*, created_by.name FROM deals
  WHERE company.id = 'companies:acme-corp'
  ORDER BY created_at DESC
`);

// Graph traversal
const relatedContacts = await db.query(`
  SELECT <-created_by<-activities<-contact FROM companies:acme-corp
`);

// Aggregations
const stats = await db.query(`
  SELECT
    status,
    COUNT(*) as count,
    math::mean(value) as avg_value
  FROM deals
  GROUP BY status
`);

// Transactions
await db.transaction(async (tx) => {
  const deal = await tx.create("deals", { title: "Deal" });
  await tx.update("companies:acme-corp", { last_deal_id: deal.id });
});
```

**Performance Considerations**:
- Use indexes for frequently queried fields
- Avoid N+1 queries (use SELECT with related records)
- Batch operations where possible
- Monitor query execution time via SigNoz traces

### 2. Dragonfly (Caching)

**Role**: High-speed in-memory cache for reducing database load and improving response times.

**Cache Patterns**:

```typescript
// Cache-Aside Pattern (most common)
async function getCompany(id: string) {
  const cached = await cache.get(`company:${id}`);
  if (cached) return cached;

  const company = await db.select(`companies:${id}`);
  await cache.set(`company:${id}`, company, 3600); // 1 hour TTL
  return company;
}

// Write-Through Pattern (for important data)
async function updateCompany(id: string, data: any) {
  const updated = await db.update(`companies:${id}`, data);
  await cache.set(`company:${id}`, updated, 3600);
  return updated;
}

// Cache Invalidation Pattern
async function invalidateCompany(id: string) {
  await cache.del(`company:${id}`);
  // Also invalidate related caches
  await cache.del(`company:${id}:deals`);
  await cache.del(`company:${id}:contacts`);
}

// Batch Operations
async function cacheMultiple(ids: string[]) {
  const keys = ids.map(id => `company:${id}`);
  const cached = await cache.mget(...keys);
  const missing = ids.filter((id, i) => !cached[i]);

  if (missing.length === 0) return cached;

  const data = await db.select(...missing);
  for (const item of data) {
    await cache.set(`company:${item.id}`, item, 3600);
  }
  return data;
}
```

**Data Structures**:
```typescript
// Strings
await cache.set("api_key:user123", "secret_key", 86400);

// Hashes
await cache.hset("company:acme", { name: "Acme", revenue: 1000000 });
const name = await cache.hget("company:acme", "name");

// Lists
await cache.lpush("email_queue", { to: "user@example.com" });
const job = await cache.rpop("email_queue");

// Sets
await cache.sadd("admin_users", "user1", "user2", "user3");
const isAdmin = await cache.sismember("admin_users", "user1");

// Sorted Sets
await cache.zadd("leaderboard", { score: 100, member: "player1" });
const topPlayers = await cache.zrange("leaderboard", 0, 9, { withScores: true });
```

**Eviction & Cleanup**:
```typescript
// Automatic TTL-based cleanup
cache.set(key, value, ttl_seconds);

// Manual cleanup on batch operations
async function cleanupOldSessions() {
  const sessions = await cache.keys("session:*");
  for (const session of sessions) {
    const ttl = await cache.ttl(session);
    if (ttl === -1) { // No TTL set
      await cache.expire(session, 3600); // Set 1-hour expiry
    }
  }
}
```

### 3. NATS (Messaging & Streaming)

**Role**: Distributed messaging, task distribution, event sourcing, and request-reply patterns.

**JetStream Configuration**:
```yaml
jetstream:
  max_memory_store: 512M    # In-memory messages
  max_file_store: 2G        # Disk-persisted messages
  store_dir: /data/jetstream
```

**Subject Hierarchy**:
```
company.>                    # Company events
  company.created
  company.updated
  company.deleted

deal.>                       # Deal events
  deal.created
  deal.updated.status
  deal.closed

contact.>                    # Contact events
  contact.created
  contact.updated
  contact.deleted

task.>                       # Task distribution
  task.enqueue
  task.started
  task.completed
  task.failed

ai.>                         # AI agents
  ai.analyze_sentiment
  ai.generate_summary
  ai.predict_churn
  ai.extract_entities
```

**Message Patterns**:

```typescript
// Pub-Sub Pattern (fire-and-forget)
await nats.publish("company.created", {
  id: "companies:acme",
  name: "Acme Corp",
  created_at: new Date().toISOString()
});

// Request-Reply Pattern (sync-like)
const reply = await nats.request("ai.analyze_sentiment",
  { text: "Great product!" },
  5000 // 5 second timeout
);

// Queue Subscribers (load balancing)
const sub = nats.subscribe("task.enqueue", {
  queue: "processors"  // All subscribers share work
}, (msg) => {
  console.log("Processing task:", msg.data);
});

// Durable Subscribers (replay on reconnect)
const sub = nats.subscribe("company.created", {
  durable: "analytics"  // Remembers last delivered message
}, (msg) => {
  console.log("Indexing company:", msg.data);
  msg.ack(); // Manual acknowledgment
});

// Consumer Groups with pull-based consumption
const consumer = nats.jetstream().consumers.get("companies", "indexer");
const messages = await consumer.nextMsg();
```

**Event Sourcing Example**:

```typescript
// Store all state changes as events
async function createCompany(data: any) {
  const id = generateId();

  // Publish immutable event
  await nats.publish("company.created", {
    event_id: generateId(),
    aggregate_id: id,
    event_type: "CompanyCreated",
    timestamp: new Date().toISOString(),
    data: { name: data.name, industry: data.industry }
  });

  // Rebuild current state from events
  const events = await nats.jetstream()
    .consumers.get("companies")
    .fetch({ batch: 1000 });

  const state = rebuildState(events);
  return state[id];
}

// Event handler for side effects
nats.subscribe("company.created", async (msg) => {
  const event = msg.data;

  // Create cache entry
  await cache.set(`company:${event.aggregate_id}`, event.data);

  // Index in search
  await search.index("companies").addDocuments([event.data]);

  // Publish metrics
  await nats.publish("analytics.company_created", event);
});
```

---

## Data Flow Patterns

### Write Flow: Creating a Deal

```
┌─────────────┐
│ Application │  1. POST /api/deals { title, company_id, value }
└──────┬──────┘
       │
       ▼
┌───────────────────┐
│ Caddy Gateway     │  2. Route to application backend
└──────┬────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Application Handler                     │  3. Validate input
│ (TypeScript/Node.js)                    │
└──────┬────────────────────────────────┬─┘
       │                                │
       ▼                                ▼
   SurrealDB                         NATS
   4a. Create deal record            4b. Publish event
   CREATE deals SET                  deal.created {
    title,                            id,
    company,                          company_id,
    value,                            title,
    created_at                        created_at
   RETURN id                         }
       │                                │
       ├────────────────────┬───────────┤
       │                    │           │
       ▼                    ▼           ▼
   Return ID          Dragonfly      Event Processors
   5a. Response       5b. Cache      5c. Index, Notify,
       to client       deal info       Analyze

   200 OK {
    id: "deals:abc123",
    title: "...",
    status: "created"
   }
```

### Read Flow: Getting Company with Cache

```
┌──────────┐
│ Client   │  1. GET /api/companies/acme
└────┬─────┘
     │
     ▼
┌──────────────────────┐
│ Cache Lookup         │  2. Check Dragonfly
│ Dragonfly.get(key)   │
└────┬─────────────────┘
     │
     ├─ HIT (cached)        └─ MISS (not cached)
     │                           │
     ▼                           ▼
┌──────────┐              ┌──────────────────┐
│ Return   │              │ DB Query         │
│ Cached   │              │ SurrealDB.select │
│ Data     │              └────┬─────────────┘
└──────────┘                   │
                               ▼
                          ┌──────────────────┐
                          │ Cache Write      │
                          │ Dragonfly.set    │
                          │ (TTL: 3600s)     │
                          └────┬─────────────┘
                               │
                               ▼
                          ┌──────────────────┐
                          │ Return Data      │
                          │ to Client        │
                          └──────────────────┘
```

### Async Flow: Task Processing via NATS

```
┌──────────────┐
│ Application  │  1. Enqueue task
│              │
│ nats.publish │
│ ("task.work")│
└────┬─────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ NATS                                │  2. Persist to JetStream
│ - Persist to disk                   │     & deliver to subscribers
│ - ACK to publisher                  │
└────┬────────────────────────────────┘
     │
     ├──────────────────┬──────────────────┐
     │                  │                  │
     ▼                  ▼                  ▼
  Worker 1           Worker 2           Worker 3
  3. Subscribe        3. Subscribe        3. Subscribe
  (queue="workers")   (queue="workers")   (queue="workers")
     │                  │                  │
     ├─ One receives work (load-balanced)
     │
     ▼
┌─────────────────────┐
│ Process Task        │  4. Execute
│ - Query DB          │
│ - Run logic         │
│ - Store result      │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Publish Result      │  5. Emit completion
│ nats.publish        │
│ ("task.completed")  │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│ Application Listens │  6. Handle completion
│ nats.subscribe      │
│ ("task.completed")  │
└─────────────────────┘
```

---

## Agent Lifecycle

Agents are autonomous processes that consume tasks from NATS and interact with the platform.

### Agent Architecture

```
┌──────────────────────────────────┐
│       AGENT CONTAINER            │
├──────────────────────────────────┤
│  Agent Class                     │
│  ├─ Task Queue Subscriber        │  Subscribe to work
│  ├─ DB Client                    │  Persist state
│  ├─ Cache Client                 │  Optimize queries
│  ├─ Search Client                │  Index results
│  ├─ NATS Publisher               │  Emit events
│  └─ Monitoring Client            │  Send traces
├──────────────────────────────────┤
│  Task Processor                  │
│  ├─ Parse task                   │
│  ├─ Load context from DB/cache   │
│  ├─ Execute work                 │
│  ├─ Handle errors                │
│  └─ Ack/Nack messages            │
├──────────────────────────────────┤
│  Memory Manager                  │
│  ├─ Store short-term memory      │  Cache/Redis
│  ├─ Store long-term memory       │  Database
│  ├─ Retrieve context             │  Fast lookup
│  └─ Cleanup old data             │
└──────────────────────────────────┘
```

### Agent Lifecycle States

```
┌──────────┐
│  CREATED │  Agent instance initialized
└────┬─────┘
     │ connect()
     ▼
┌──────────────┐
│ CONNECTED    │  Connected to all services
└────┬─────────┘
     │ subscribe(task_topic)
     ▼
┌──────────────┐
│ WAITING      │  Idle, waiting for tasks
└────┬─────────┘
     │ task received
     ▼
┌──────────────┐
│ PROCESSING   │  Actively processing task
│              │  ├─ Load context
│              │  ├─ Execute
│              │  └─ Store result
└────┬─────────┘
     │ task complete / error
     ▼
┌──────────────┐
│ ACKNOWLEDGED │  Message ack'd to NATS
└────┬─────────┘
     │ Ready for next task
     ▼
┌──────────────┐
│ WAITING      │  (back to waiting)
└──────────────┘
```

### Agent Implementation Example

```typescript
import { Agent } from "@superstack/agent";
import { SurrealDB, Dragonfly, NATS } from "@superstack/sdk";

class SalesAgent extends Agent {
  private db: SurrealDB;
  private cache: Dragonfly;
  private nats: NATS;

  constructor() {
    super();
    this.db = new SurrealDB(process.env.DB_URL);
    this.cache = new Dragonfly({ host: "dragonfly", port: 6379 });
    this.nats = new NATS({ servers: ["nats://nats:4222"] });
  }

  async initialize() {
    // Connect to all services
    await this.db.connect();
    await this.cache.connect();
    await this.nats.connect();

    // Subscribe to tasks
    await this.subscribe("sales.analyze_deal", this.handleAnalyzeDeal.bind(this));
    await this.subscribe("sales.predict_churn", this.handlePredictChurn.bind(this));

    console.log("Sales agent initialized and listening");
  }

  async handleAnalyzeDeal(task: any) {
    const { deal_id } = task;

    try {
      // Log task start
      this.emit("task_started", { task_id: task.id, deal_id });

      // Load deal from cache or DB
      const deal = await this.getWithCache(`deal:${deal_id}`, () =>
        this.db.select(`deals:${deal_id}`)
      );

      // Load related company
      const company = await this.db.select(deal.company);

      // Analyze using AI/ML
      const analysis = await this.analyzeWithAI(deal, company);

      // Store result
      await this.db.update(`deals:${deal_id}`, {
        analysis_result: analysis,
        analyzed_at: new Date().toISOString()
      });

      // Invalidate cache
      await this.cache.del(`deal:${deal_id}`);

      // Emit completion
      this.emit("deal_analyzed", { deal_id, analysis });

      // Ack the task
      this.ack(task);
    } catch (error) {
      // Log error to monitoring
      this.error("Deal analysis failed", error, { deal_id });

      // Nack to retry
      this.nack(task);
    }
  }

  private async getWithCache(key: string, loader: () => Promise<any>) {
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const data = await loader();
    await this.cache.set(key, data, 3600);
    return data;
  }

  private async analyzeWithAI(deal: any, company: any) {
    // Your AI/ML logic here
    return {
      deal_complexity: "high",
      revenue_impact: 150000,
      decision_probability: 0.78,
      confidence: 0.92
    };
  }
}

// Run agent
const agent = new SalesAgent();
await agent.initialize();
```

---

## Message Patterns

### 1. Pub-Sub (Fan-out)

**Use Case**: Broadcasting events to multiple listeners

```
Publisher → NATS → Worker 1
                 → Worker 2
                 → Worker 3
                 → Analytics
                 → Search Indexer
```

```typescript
// Publisher
await nats.publish("company.created", {
  id: company.id,
  name: company.name,
  created_at: new Date()
});

// Multiple independent subscribers
nats.subscribe("company.created", (msg) => {
  console.log("Notifying users...");
  sendNotification(msg.data);
});

nats.subscribe("company.created", (msg) => {
  console.log("Indexing company...");
  indexSearchEngine(msg.data);
});

nats.subscribe("company.created", (msg) => {
  console.log("Recording analytics...");
  recordMetric("company_created");
});
```

### 2. Request-Reply (RPC)

**Use Case**: Synchronous-style queries with guaranteed reply

```
Client → NATS → (temp reply subject)
Server ← NATS ← response
```

```typescript
// Server setup
nats.subscribe("ai.sentiment_analysis", async (msg) => {
  const { text } = msg.data;
  const sentiment = await analyzeSentiment(text);
  msg.respond({ sentiment, confidence: 0.95 });
});

// Client request
const reply = await nats.request("ai.sentiment_analysis",
  { text: "Great product!" },
  5000 // timeout
);
console.log(reply.data); // { sentiment: "positive", confidence: 0.95 }
```

### 3. Work Queue (Competing Consumers)

**Use Case**: Distribute work across multiple workers

```
Task → NATS → [Worker 1] (gets 1)
           → [Worker 2] (gets 1)
           → [Worker 3] (gets 1)
```

```typescript
// All workers subscribe with same queue
nats.subscribe("batch.process", {
  queue: "batch_processors"
}, async (msg) => {
  const batch = msg.data;
  await processBatch(batch);
  msg.ack();
});

// Messages automatically distributed (load balanced)
for (let i = 0; i < 100; i++) {
  await nats.publish("batch.process", { batch_number: i, items: [...] });
}
```

### 4. Event Sourcing (State Audit Trail)

**Use Case**: Maintain complete history of state changes

```
Event 1: CompanyCreated → Persist
Event 2: NameChanged → Persist
Event 3: StatusUpdated → Persist

Current State = Replay all events
```

```typescript
// Record event immutably
async function updateCompanyStatus(id: string, newStatus: string) {
  const event = {
    event_id: generateId(),
    aggregate_id: id,
    event_type: "StatusChanged",
    timestamp: new Date(),
    old_status: currentStatus,
    new_status: newStatus
  };

  // Persist to JetStream (immutable log)
  await nats.jetstream().publish(`events.company.status_changed`, event);

  // Publish for real-time subscribers
  await nats.publish("company.status_changed", event);
}

// Replay events to rebuild state
async function getCompanyState(id: string) {
  const events = await nats.jetstream()
    .consumers.get("company_events")
    .fetch({ filter: `events.company.*` });

  let state = { id, created_at: null, status: null };

  for (const msg of events) {
    const event = msg.data;
    if (event.aggregate_id === id) {
      applyEvent(state, event);
    }
  }

  return state;
}
```

### 5. Choreography (Distributed Workflow)

**Use Case**: Complex multi-step processes with error handling

```
1. PublishCompany → company.created
2. Listener subscribes, IndexesSearch → search.company_indexed
3. Another listener subscribes, NotifiesUsers → user.notified
4. Another listener subscribes, RecordsMetrics → metric.recorded
```

```typescript
// Step 1: Create company
async function createCompany(data: any) {
  const company = await db.create("companies", data);
  await nats.publish("company.created", company);
  return company;
}

// Step 2: Index search (reacts to company.created)
nats.subscribe("company.created", async (msg) => {
  const company = msg.data;
  await search.index("companies").addDocuments([company]);
  await nats.publish("company.indexed", { company_id: company.id });
});

// Step 3: Notify users (reacts to company.indexed)
nats.subscribe("company.indexed", async (msg) => {
  const users = await db.select("contacts WHERE can_notify = true");
  for (const user of users) {
    await sendNotification(user.email, `New company: ${msg.data.company_id}`);
  }
  await nats.publish("users.notified", msg.data);
});

// Step 4: Record metrics (independent, doesn't block anything)
nats.subscribe("company.created", async (msg) => {
  await recordMetric("company.created_total", 1);
});
```

---

## Caching Strategy

### Cache Taxonomy

```
┌─────────────────────────────────────────────────┐
│           CACHING HIERARCHY                    │
├─────────────────────────────────────────────────┤
│ L1: HTTP Cache (Browser)      TTL: hours        │
│ L2: API Layer (Dragonfly)     TTL: minutes      │
│ L3: Query Cache (SurrealDB)   TTL: seconds      │
│ L4: Memory Cache (App)        TTL: requests     │
└─────────────────────────────────────────────────┘
```

### Cache Patterns

**1. Cache-Aside (Lazy Loading)**

```typescript
async function getCompany(id: string) {
  // Check cache first
  const cached = await cache.get(`company:${id}`);
  if (cached) return cached;

  // Cache miss - load from DB
  const company = await db.select(`companies:${id}`);

  // Store for future requests
  await cache.set(`company:${id}`, company, 3600);

  return company;
}
```

**2. Write-Through (Synchronous)**

```typescript
async function updateCompany(id: string, data: any) {
  // Update DB first
  const updated = await db.update(`companies:${id}`, data);

  // Update cache immediately
  await cache.set(`company:${id}`, updated, 3600);

  // Guaranteed consistency
  return updated;
}
```

**3. Write-Behind (Asynchronous)**

```typescript
async function updateCompanyAsync(id: string, data: any) {
  // Update cache immediately
  await cache.set(`company:${id}`, data, 3600);

  // Queue DB update for later
  await nats.publish("company.update_queue", {
    id,
    data,
    timestamp: Date.now()
  });

  // Return immediately to client
  return data;
}

// Batch processor (runs periodically)
nats.subscribe("company.update_queue", {
  queue: "db_writers",
  durable: "company_persistence"
}, async (msg) => {
  const { id, data } = msg.data;

  // Batch updates
  await db.update(`companies:${id}`, data);

  // Ack to prevent reprocessing
  msg.ack();
});
```

**4. Refresh-Ahead**

```typescript
async function getWithRefresh(key: string, loader: () => Promise<any>, ttl: number) {
  const cached = await cache.get(key);

  // Check TTL
  const ttlRemaining = await cache.ttl(key);

  // Refresh if TTL below threshold (e.g., 20% remaining)
  if (cached && ttlRemaining > ttl * 0.2) {
    return cached; // Still valid
  }

  // Refresh in background
  const fresh = await loader();
  await cache.set(key, fresh, ttl);

  return cached || fresh;
}
```

### Invalidation Strategies

**1. TTL-Based (Passive)**

```typescript
// Automatic expiry
await cache.set("key", value, 3600); // Expires in 1 hour
```

**2. Event-Based (Active)**

```typescript
// Listen to DB updates
nats.subscribe("company.updated", async (msg) => {
  const { id } = msg.data;

  // Invalidate related caches
  await cache.del(`company:${id}`);
  await cache.del(`company:${id}:deals`);
  await cache.del(`company:${id}:contacts`);
});
```

**3. Versioning**

```typescript
// Include version in key
async function get(id: string, version: string) {
  const key = `company:${id}:v${version}`;
  return cache.get(key);
}

// Update creates new version
async function update(id: string, data: any) {
  const newVersion = Date.now();
  const updated = await db.update(`companies:${id}`, data);
  await cache.set(`company:${id}:v${newVersion}`, updated, 3600);
  return updated;
}
```

### Cache Warming

```typescript
// Load critical data on startup
async function warmCache() {
  const companies = await db.select("SELECT * FROM companies LIMIT 100");

  for (const company of companies) {
    await cache.set(`company:${company.id}`, company, 86400);
  }

  console.log(`Warmed ${companies.length} company records`);
}

// On application startup
await warmCache();
```

---

## Search Indexing

### Indexing Architecture

```
Data Change Events → NATS
                     ↓
                 Event Handler
                     ↓
              Update Database
                     ↓
              Emit Index Event
                     ↓
              Search Indexer
                     ↓
                 Meilisearch
                     ↓
              Ready for Search
```

### Indexing Patterns

**1. Real-Time Indexing**

```typescript
// Listen to create/update events
nats.subscribe("company.created", async (msg) => {
  const company = msg.data;

  await search.index("companies").addDocuments([{
    id: company.id,
    name: company.name,
    industry: company.industry,
    description: company.description,
    founded_year: company.founded_year,
    // Denormalize for search
    employee_count: company.employee_count
  }]);
});

nats.subscribe("company.updated", async (msg) => {
  const { id, changes } = msg.data;

  // Partial update
  await search.index("companies").updateDocuments([{
    id,
    ...changes
  }]);
});

nats.subscribe("company.deleted", async (msg) => {
  const { id } = msg.data;

  await search.index("companies").deleteDocuments([id]);
});
```

**2. Batch Indexing**

```typescript
// Full reindex (monthly)
async function reindexAllCompanies() {
  const companies = await db.select("SELECT * FROM companies");

  // Transform for search
  const docs = companies.map(c => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    revenue: c.revenue,
    // Aggregate related data
    deal_count: c.deals.length,
    recent_activity: getRecentActivity(c)
  }));

  // Delete old index
  await search.index("companies").delete();

  // Create fresh index
  await search.index("companies").addDocuments(docs);
}
```

**3. Filtered Search**

```typescript
// Configure filterable attributes
await search.index("companies").updateFilterableAttributes([
  "industry",
  "founded_year",
  "employee_count",
  "revenue_range"
]);

// Search with filters
const results = await search.index("companies").search("technology", {
  filter: [
    ["industry = 'Technology'"],
    ["founded_year > 2015"],
    ["employee_count >= 100"]
  ]
});
```

**4. Faceted Search**

```typescript
// Configure facets
await search.index("companies").updateFacetedSearch(["industry", "size"]);

// Search with aggregation
const results = await search.index("companies").search("enterprise", {
  facets: ["industry", "size"]
});

// Results include facet counts
console.log(results.facet_distribution);
// {
//   industry: { Technology: 45, Finance: 23, ... },
//   size: { small: 10, medium: 35, large: 23 }
// }
```

---

## Monitoring Pipeline

### Observability Stack

```
┌──────────────────────────────────────────┐
│        APPLICATION LAYER                 │
│  (Emit traces, metrics, logs)            │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
     Traces    Metrics      Logs
        │          │          │
        └──────────┼──────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  OTEL COLLECTOR      │  Export protocol
        │  (gRPC, HTTP)        │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    SigNoz                Metrics DB
    (Traces)             (Prometheus)
        │
        ▼
    Grafana (Visualization)
```

### Instrumentation Example

```typescript
import { trace, metrics } from "@opentelemetry/api";

const tracer = trace.getTracer("sales-agent");
const meter = metrics.getMeter("sales-agent");

// Counter
const dealCreatedCounter = meter.createCounter("deals.created");

// Histogram
const processingTime = meter.createHistogram("task.processing_ms");

// Track operation
async function processTask(task: any) {
  const span = tracer.startSpan("process_task", {
    attributes: {
      "task.id": task.id,
      "task.type": task.type
    }
  });

  const startTime = Date.now();

  try {
    const result = await doWork(task);

    span.setStatus({ code: SpanStatusCode.OK });
    dealCreatedCounter.add(1);

    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    processingTime.record(duration);
    span.end();
  }
}
```

### Key Metrics to Monitor

```
Performance:
├─ Query latency (SurrealDB)
├─ Cache hit rate
├─ Message publish latency
├─ Search query time
└─ Task processing time

Throughput:
├─ Requests/second
├─ Messages/second
├─ Tasks/second
└─ Documents indexed/second

Health:
├─ Service availability
├─ Error rate
├─ JetStream queue depth
├─ Cache memory usage
└─ Database connections

Business:
├─ Deals created
├─ Contacts processed
├─ AI analysis success rate
└─ Average deal value
```

### Alerting Rules

```yaml
# SigNoz alert rules

- name: HighErrorRate
  condition: error_rate > 0.05  # >5%
  duration: 5m
  action: notify_slack

- name: HighLatency
  condition: p99_latency > 1000  # >1 second
  duration: 5m
  action: page_on_call

- name: CacheMiss
  condition: cache_hit_rate < 0.6  # <60%
  duration: 10m
  action: investigate

- name: QueueBackup
  condition: jetstream_pending > 10000
  duration: 2m
  action: page_on_call
```

---

## Performance Optimization

### Database Optimization

**1. Index Strategy**

```surql
-- Create indexes for frequently queried fields
DEFINE INDEX idx_deal_status ON deals COLUMNS status;
DEFINE INDEX idx_company_name ON companies COLUMNS name UNIQUE;
DEFINE INDEX idx_activity_date ON activities COLUMNS created_at DESC;

-- Composite indexes for common queries
DEFINE INDEX idx_deal_company_status ON deals COLUMNS company, status;

-- Full-text search indexes
DEFINE INDEX ft_companies ON companies COLUMNS name, description SEARCH ANALYZER LIKE;
```

**2. Query Optimization**

```typescript
// SLOW: N+1 queries
const deals = await db.select("SELECT * FROM deals");
for (const deal of deals) {
  const company = await db.select(deal.company); // N queries!
}

// FAST: Eager loading
const deals = await db.query(`
  SELECT *, company.* FROM deals
  WHERE created_at > time::now() - 30d
  ORDER BY value DESC
  LIMIT 100
`);

// FAST: Aggregation in query
const stats = await db.query(`
  SELECT
    company,
    COUNT(*) as deal_count,
    math::mean(value) as avg_value,
    math::sum(value) as total_value
  FROM deals
  WHERE status != 'closed'
  GROUP BY company
`);
```

### Cache Optimization

**1. Strategic Cache Placement**

```typescript
// Cache frequently accessed, slowly changing data
await cache.set(`company:${id}`, company, 86400); // 24h

// Don't cache fast-changing data
// (real-time inventory, active sessions, etc)

// Cache computed values
await cache.set(`company:${id}:total_deals`, 42, 3600);
```

**2. Cache Warming**

```typescript
// Preload on startup
async function startup() {
  const topCompanies = await db.select(
    "SELECT * FROM companies ORDER BY deal_count DESC LIMIT 100"
  );

  for (const company of topCompanies) {
    await cache.set(`company:${company.id}`, company, 86400);
  }
}
```

### NATS Optimization

**1. Message Batching**

```typescript
// SLOW: Publish individually
for (const event of events) {
  await nats.publish("events.batch", event);
}

// FAST: Batch publish
const batch = events.slice(0, 100);
await nats.publish("events.batch", JSON.stringify(batch));

// Subscriber unpacks
nats.subscribe("events.batch", (msg) => {
  const events = JSON.parse(msg.data);
  processEvents(events);
});
```

**2. Consumer Group Tuning**

```typescript
// Balance throughput vs latency
nats.subscribe("tasks.work", {
  queue: "processors",
  durable: "processor_group",
  // Batch settings
  batch: 100,           // Process 100 messages at once
  flow_control: {
    idle_heartbeat: "5s"  // Send heartbeat every 5s
  }
}, processor);
```

### Search Optimization

**1. Denormalization**

```typescript
// Store denormalized data in search index
const doc = {
  id: deal.id,
  title: deal.title,
  // Denormalize company info
  company_name: deal.company.name,
  company_industry: deal.company.industry,
  // Denormalize contact info
  contact_name: deal.primary_contact.name,
  contact_email: deal.primary_contact.email,
  // Precomputed values
  days_in_pipeline: getDaysInPipeline(deal),
  probability_score: calculateProbability(deal)
};
```

**2. Index Tuning**

```typescript
// Configure for performance
await search.index("companies").updateSettings({
  searchableAttributes: ["name", "industry", "description"],
  filterableAttributes: ["industry", "founded_year"],
  sortableAttributes: ["revenue", "founded_year"],
  // Pagination limits
  pagination: {
    maxTotalHits: 10000,
    defaultLimit: 20
  }
});
```

### Application-Level Optimization

**1. Connection Pooling**

```typescript
// Reuse connections
const db = new SurrealDB({ url, pool: { min: 5, max: 20 } });
const cache = new Dragonfly({ host, port, maxclients: 30 });
```

**2. Lazy Loading**

```typescript
// Don't load related data unless needed
const deal = await db.select(`deals:${id}`);

// Lazy load on demand
Object.defineProperty(deal, 'company', {
  get: async () => db.select(deal.company_id)
});
```

---

## Conclusion

SuperStack provides a cohesive, well-integrated platform for building complex AI systems. By understanding these architectural patterns and optimization strategies, you can build scalable, observable, maintainable applications.

For more information:
- See README.md for quick start
- Check config/ directory for service configurations
- Review scripts/ for deployment helpers
- Examine services/ for service-specific docs
