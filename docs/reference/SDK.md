# SuperStack SDK Documentation

## Overview

The SuperStack SDK is a comprehensive TypeScript client library that provides unified access to all SuperStack services:

- **SurrealDB** - Graph database for data persistence
- **Dragonfly** - High-performance Redis-compatible cache
- **NATS** - Distributed messaging with JetStream
- **Meilisearch** - Full-text search engine

## Installation

```bash
npm install @superstack/sdk
```

## Quick Start

```typescript
import { createSuperStackSDK } from "@superstack/sdk";

const sdk = await createSuperStackSDK();

// Use individual clients
const db = sdk.getDB();
const cache = sdk.getCache();
const queue = sdk.getQueue();
const search = sdk.getSearch();

// Perform operations...

await sdk.close();
```

## Architecture

### Core Components

Each service has its own client class with specific functionality:

1. **SurrealDBClient** - Database operations (CRUD, transactions, queries)
2. **DragonflyCache** - Cache operations (get/set, pub/sub, expiration)
3. **NatsClient** - Messaging (pub/sub, request-reply, streams, JetStream)
4. **MeilisearchClient** - Search operations (indexing, searching, facets)

### SDK Architecture

```
┌─────────────────────────────────┐
│      SuperStackSDK              │
│  (Unified SDK Manager)          │
└────────┬────────────────────────┘
         │
    ┌────┼────┬─────────┬──────────┐
    │    │    │         │          │
    ▼    ▼    ▼         ▼          ▼
  SurrealDB  Cache    NATS     Meilisearch
  (Database)  (Redis)  (Queue)    (Search)
```

## Database Client

### SurrealDBClient

Provides type-safe database operations with automatic reconnection and transaction support.

#### Connection

```typescript
const db = sdk.getDB();

// Manual connection
await db.connect();

// Auto-reconnect is enabled by default
console.log(db.isConnected());
```

#### CRUD Operations

```typescript
// Create
const company = await db.create<Company>("companies", {
  name: "Acme Corp",
  status: "prospect",
});

// Read
const fetched = await db.read<Company>(company.id);

// Update
const updated = await db.update<Company>(company.id, {
  status: "active",
});

// Merge (shallow update)
const merged = await db.merge<Company>(company.id, {
  industry: "Technology",
});

// Delete
await db.delete(company.id);
```

#### Querying

```typescript
// Select with WHERE clause
const prospects = await db.select<Company>(
  "companies",
  "status = 'prospect'"
);

// Count records
const totalCompanies = await db.count("companies");
const activeCompanies = await db.count("companies", "status = 'active'");
```

#### Batch Operations

```typescript
const companies = await db.createBatch<Company>("companies", [
  { name: "Company A" },
  { name: "Company B" },
  { name: "Company C" },
]);
```

#### Transactions

```typescript
await db.transaction(async (client) => {
  // All operations are atomic
  const company = await db.create("companies", { name: "New Corp" });
  const contact = await db.create("contacts", {
    companyId: company.id,
    firstName: "John",
    lastName: "Doe",
  });
});
```

#### Raw Queries

```typescript
const result = await db.query<Company>(
  "SELECT * FROM companies WHERE status = $status",
  { status: "active" }
);
```

## Cache Client

### DragonflyCache

High-performance caching with pub/sub support.

#### Basic Operations

```typescript
const cache = sdk.getCache();

// Set value
await cache.set("user:123", { id: 123, name: "John" }, { ttl: 3600 });

// Get value
const user = await cache.get<{ id: number; name: string }>("user:123");

// Delete
await cache.del("user:123");

// Check existence
const exists = await cache.exists("user:123");
```

#### TTL Management

```typescript
// Set with TTL on creation
await cache.set("key", value, { ttl: 3600 });

// Check remaining TTL
const ttl = await cache.ttl("key");

// Set expiration on existing key
await cache.expire("key", 7200);
```

#### Set Operations

```typescript
// Only set if key doesn't exist
await cache.set("key", value, { nx: true });

// Only set if key exists
await cache.set("key", newValue, { xx: true });
```

#### Atomic Increment

```typescript
// Increment counter
const count = await cache.incr("request_count");
const count5 = await cache.incr("request_count", 5);
```

#### Pub/Sub

```typescript
// Subscribe to channel
await cache.subscribe("events", (message) => {
  console.log("Received:", message);
});

// Publish message
const subscribers = await cache.publish("events", {
  type: "user.created",
  id: 123,
});

// Unsubscribe
await cache.unsubscribe("events");
```

#### Pattern Operations

```typescript
// Clear all keys matching pattern
const deletedCount = await cache.clearPattern("user:*");

// Clear all keys
await cache.clear();
```

#### Statistics

```typescript
const stats = cache.getStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);

// Reset statistics
cache.resetStats();
```

## Queue Client

### NatsClient

Distributed messaging with JetStream for reliable delivery.

#### Pub/Sub

```typescript
const queue = sdk.getQueue();

// Publish message
const seq = await queue.publish("events.user.created", {
  userId: 123,
  email: "user@example.com",
});

// Subscribe to subject
await queue.subscribe("events.user.*", async (message) => {
  console.log(`Received on ${message.subject}:`, message.data);
});
```

#### Request-Reply

```typescript
// Send request and wait for reply
const response = await queue.request(
  "tasks.process",
  { taskId: "123" },
  5000 // timeout
);

// Reply to a request
await queue.reply(message.replyTo, { status: "processed" });
```

#### Streams and JetStream

```typescript
// Create a stream
await queue.createStream({
  name: "company_events",
  subjects: ["company.>"],
  retention: "limits", // "limits" | "interest" | "workqueue"
  maxAge: 2592000, // 30 days in seconds
});

// Create a consumer group
await queue.createConsumerGroup("company_events", "processors", {
  subjects: ["company.created"],
  deliverPolicy: "new", // "all" | "new" | "last"
});
```

#### Validated Messaging

```typescript
import { z } from "zod";

const userEventSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  timestamp: z.date(),
});

// Publish with validation
await queue.publishValidated(
  "events.user",
  { userId: "123", email: "user@example.com", timestamp: new Date() },
  userEventSchema
);

// Subscribe with validation
await queue.subscribeValidated(
  "events.user",
  async (message) => {
    // message.data is guaranteed to match schema
    console.log(message.data.email); // TypeScript knows this is valid
  },
  userEventSchema
);
```

#### Consumer Groups

```typescript
// Subscribe with queue group for load distribution
await queue.subscribe(
  "tasks.process",
  async (message) => {
    // Multiple subscribers share the queue
  },
  {
    queue: "workers",
    deliverPolicy: "new",
    maxDeliver: 5,
  }
);
```

#### Stream Management

```typescript
// Get stream info
const info = await queue.getStreamInfo("company_events");

// Purge all messages
await queue.purgeStream("company_events");
```

## Search Client

### MeilisearchClient

Full-text search with advanced filtering and sorting.

#### Index Management

```typescript
const search = sdk.getSearch();

// Create index
await search.createIndex({
  name: "companies",
  primaryKey: "id",
  searchableAttributes: ["name", "industry", "website"],
  filterableAttributes: ["status", "country"],
  sortableAttributes: ["revenue", "createdAt"],
});

// List indexes
const indexes = await search.listIndexes();

// Delete index
await search.deleteIndex("companies");
```

#### Document Operations

```typescript
// Add documents
await search.addDocuments("companies", [
  { id: 1, name: "Acme Corp", industry: "Tech" },
  { id: 2, name: "Beta Inc", industry: "Finance" },
]);

// Update documents
await search.updateDocuments("companies", [
  { id: 1, name: "Acme Corporation" },
]);

// Delete documents
await search.deleteDocuments("companies", [1, 2]);

// Get single document
const company = await search.getDocument<Company>("companies", "1");

// Get all documents
const allCompanies = await search.getAllDocuments<Company>("companies", {
  limit: 100,
  offset: 0,
});

// Clear all documents in index
await search.clearIndex("companies");
```

#### Search

```typescript
// Basic search
const results = await search.search("companies", {
  query: "technology",
  limit: 10,
});

// Search with filters
const filtered = await search.search("companies", {
  query: "tech",
  filters: { country: "US" },
});

// Search with sorting
const sorted = await search.search("companies", {
  query: "tech",
  sort: "revenue:desc",
});
```

#### Advanced Search with Facets

```typescript
const results = await search.searchWithFacets("companies", {
  query: "technology",
  facets: ["industry", "country"],
});

// results.facets contains distribution counts
// {
//   industry: { "Tech": 45, "Finance": 12 },
//   country: { "US": 40, "UK": 17 }
// }
```

## Type Safety

### Built-in Types

The SDK includes TypeScript interfaces for all domain models:

```typescript
import {
  Agent,
  AgentTask,
  Company,
  Contact,
  Deal,
  Activity,
  AgentStatus,
  TaskStatus,
  DealStatus,
  CompanyStatus,
} from "@superstack/sdk";

// Use types for type-safe operations
const task: AgentTask = {
  id: "task:1",
  agentId: "agent:1",
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.HIGH,
  title: "Process data",
  assignedAt: new Date(),
};
```

### Custom Types

Extend or create custom types:

```typescript
interface CustomCompany extends Company {
  customField: string;
}

const company = await db.create<CustomCompany>("companies", {
  name: "Acme",
  customField: "custom value",
});
```

## Error Handling

### Error Types

```typescript
import {
  SuperStackError,
  ConnectionError,
  ValidationError,
  NotFoundError,
  TimeoutError,
} from "@superstack/sdk";

try {
  await db.read("companies:nonexistent");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Record not found");
  } else if (error instanceof ConnectionError) {
    console.log("Connection failed - will auto-retry");
  } else if (error instanceof TimeoutError) {
    console.log("Operation timed out");
  } else if (error instanceof SuperStackError) {
    console.log(`Error ${error.code}: ${error.message}`);
  }
}
```

### Error Context

```typescript
try {
  // ...operation...
} catch (error) {
  if (error instanceof SuperStackError) {
    console.log(error.context); // Contains additional debug info
    console.log(error.statusCode); // HTTP-style status code
  }
}
```

## Lifecycle Management

### Connection Hooks

```typescript
const sdk = new SuperStackSDK({
  surreal: { /* config */ }
});

// Set up hooks before initialization
// These are called during client initialization

await sdk.initialize();

// Check connection status
const status = await sdk.getStatus();
status.forEach(s => {
  console.log(`${s.service}: ${s.connected ? "Connected" : "Disconnected"}`);
});

// Health checks
const health = await sdk.healthCheck();
// { database: true, cache: true, queue: true, search: true }

// Cleanup
await sdk.close();
```

## Configuration

### Environment Variables

```bash
# SurrealDB
SURREALDB_URL=ws://localhost:8000
SURREALDB_USER=root
SURREALDB_PASSWORD=root
SURREALDB_DATABASE=superstack
SURREALDB_NAMESPACE=superstack

# Dragonfly
DRAGONFLY_URL=localhost:6379
DRAGONFLY_PASSWORD=
DRAGONFLY_DB=0

# NATS
NATS_URL=nats://localhost:4222
NATS_USER=
NATS_PASSWORD=

# Meilisearch
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=masterKey
```

### Programmatic Configuration

```typescript
const sdk = new SuperStackSDK({
  surreal: {
    url: "ws://localhost:8000",
    user: "root",
    password: "root",
  },
  cache: {
    url: "localhost:6379",
  },
  nats: {
    url: "nats://localhost:4222",
  },
  meili: {
    url: "http://localhost:7700",
    masterKey: "masterKey",
  },
  autoConnect: true,
});

await sdk.initialize();
```

## Best Practices

### 1. Connection Management

```typescript
// Always close connections when done
const sdk = await createSuperStackSDK();
try {
  // Use SDK
} finally {
  await sdk.close();
}

// Or use with cleanup function
async function withSDK<T>(
  fn: (sdk: SuperStackSDK) => Promise<T>
): Promise<T> {
  const sdk = await createSuperStackSDK();
  try {
    return await fn(sdk);
  } finally {
    await sdk.close();
  }
}
```

### 2. Error Handling

```typescript
// Always handle errors gracefully
try {
  await db.create("table", data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof ConnectionError) {
    // Will auto-retry, but can also handle manually
  } else {
    // Handle other errors
  }
}
```

### 3. Type Safety

```typescript
// Always use TypeScript types
const company = await db.create<Company>("companies", {
  name: "Acme",
  status: CompanyStatus.ACTIVE, // Type-checked enum
});

// Avoid `any` types
const result = await db.query<MyType>("SELECT ...");
```

### 4. Performance

```typescript
// Use caching strategically
const cached = await cache.get<Company>(`company:${id}`);
if (cached) return cached;

const company = await db.read<Company>(id);
await cache.set(`company:${id}`, company, { ttl: 3600 });

// Use batch operations when possible
const companies = await db.createBatch("companies", data);
```

### 5. Resource Management

```typescript
// Set appropriate TTLs for cache
await cache.set("temporary", value, { ttl: 300 }); // 5 minutes

// Use consumer groups for distributed processing
await queue.subscribe("tasks", handler, {
  queue: "workers", // Distributes across workers
  deliverPolicy: "new",
});
```

## Examples

See the `examples/` directory for complete, runnable examples:

- `basic-usage.ts` - Complete usage walkthrough
- `agent-example.ts` - Multi-agent task processing system

## API Reference

See `README.md` for complete API reference with all methods and their signatures.
