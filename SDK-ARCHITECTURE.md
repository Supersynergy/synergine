# SuperStack SDK Architecture

## Overview

The SuperStack SDK is a production-ready TypeScript client library providing unified access to all SuperStack infrastructure services. It's designed for type safety, reliability, and ease of use.

## Core Architecture

```
┌────────────────────────────────────────────┐
│          SuperStackSDK (Main)              │
│    Unified SDK Manager & Factory           │
└───────┬────────┬────────┬──────────────────┘
        │        │        │
        ▼        ▼        ▼
┌─────────────────────────────────────────────┐
│  Client Implementations                     │
│  ┌──────────────────────────────────────┐  │
│  │ SurrealDBClient (DB)                 │  │
│  │ - CRUD operations                    │  │
│  │ - Transactions                       │  │
│  │ - Raw queries                        │  │
│  │ - Batch operations                   │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ DragonflyCache (Cache)               │  │
│  │ - Get/Set/Delete                     │  │
│  │ - Pub/Sub                            │  │
│  │ - TTL management                     │  │
│  │ - Atomic operations                  │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ NatsClient (Queue)                   │  │
│  │ - Pub/Sub messaging                  │  │
│  │ - Request-reply                      │  │
│  │ - JetStream support                  │  │
│  │ - Consumer groups                    │  │
│  │ - Validated messaging                │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ MeilisearchClient (Search)           │  │
│  │ - Indexing                           │  │
│  │ - Searching                          │  │
│  │ - Filtering & facets                 │  │
│  │ - Sorting                            │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. SurrealDBClient (`src/db/surreal.ts`)

**Purpose**: Type-safe database operations with automatic reconnection

**Key Features**:
- Connection pooling with auto-reconnect
- CRUD operations (create, read, update, merge, delete)
- Query execution with parameter binding
- Transaction support with rollback
- Batch operations
- Health checks
- Timeout handling

**Design Patterns**:
```typescript
// Type-safe generics
const company = await db.create<Company>("companies", data);
const updated = await db.update<Company>(id, patch);

// Transactional safety
await db.transaction(async (client) => {
  // All operations atomic or rolled back
});
```

**Reliability**:
- Automatic reconnection with exponential backoff
- Lifecycle hooks (onConnect, onDisconnect, onError, onRetry)
- Timeout management
- Comprehensive error handling

### 2. DragonflyCache (`src/cache/dragonfly.ts`)

**Purpose**: High-performance caching with Redis compatibility

**Key Features**:
- Get/Set/Delete with TTL
- Publish/Subscribe
- Atomic increment operations
- Pattern-based key deletion
- Connection pooling
- Pub/Sub subscription management

**Design Patterns**:
```typescript
// Set with options
await cache.set("key", value, { ttl: 3600, nx: true });

// Pub/Sub
await cache.subscribe("channel", (msg) => handler(msg));
await cache.publish("channel", message);

// Pattern operations
await cache.clearPattern("user:*");
```

**Features**:
- Automatic JSON serialization/deserialization
- TTL tracking and expiration
- Thread-safe pub/sub implementation
- Statistics tracking (hits/misses/size)

### 3. NatsClient (`src/queue/nats.ts`)

**Purpose**: Distributed messaging with JetStream reliability

**Key Features**:
- Pub/Sub messaging
- Request-reply pattern
- JetStream stream creation
- Consumer group management
- Message validation with Zod
- Durable subscribers
- Acknowledgment handling

**Design Patterns**:
```typescript
// Pub/Sub
await queue.publish("subject", data);
await queue.subscribe("subject", handler);

// Request-reply
const response = await queue.request("subject", data, timeout);

// JetStream with validation
await queue.publishValidated("subject", data, zodSchema);
await queue.subscribeValidated("subject", handler, zodSchema);
```

**Reliability**:
- Automatic message acknowledgment
- Redelivery with max_deliver limits
- Stream persistence
- Consumer state durability
- Error handling with backoff

### 4. MeilisearchClient (`src/search/meili.ts`)

**Purpose**: Full-text search with advanced filtering

**Key Features**:
- Index creation and management
- Document CRUD operations
- Full-text search with query parsing
- Filtering and faceted search
- Sorting by multiple fields
- Batch operations

**Design Patterns**:
```typescript
// Create searchable index
await search.createIndex({
  name: "companies",
  searchableAttributes: ["name", "industry"],
  filterableAttributes: ["status"],
});

// Search with filters
const results = await search.search("companies", {
  query: "tech",
  filters: { status: "active" },
  sort: "revenue:desc",
});

// Faceted search
const facets = await search.searchWithFacets("companies", {
  query: "tech",
  facets: ["industry", "country"],
});
```

### 5. SuperStackSDK (`src/index.ts`)

**Purpose**: Unified SDK manager coordinating all services

**Key Features**:
- Single entry point for all services
- Environment variable configuration
- Lifecycle management
- Status and health checks
- Factory function for easy setup

**Design Patterns**:
```typescript
// Factory function
const sdk = await createSuperStackSDK({
  surreal: { /* config */ },
  cache: { /* config */ },
  nats: { /* config */ },
  meili: { /* config */ },
  autoConnect: true,
});

// Get individual clients
const db = sdk.getDB();
const cache = sdk.getCache();
const queue = sdk.getQueue();
const search = sdk.getSearch();

// Status checks
const status = await sdk.getStatus();
const health = await sdk.healthCheck();

// Cleanup
await sdk.close();
```

## Type System

### Type Hierarchy

```
SuperStackError (base)
├── ConnectionError
├── ValidationError
├── NotFoundError
└── TimeoutError

Domain Models:
├── Agent + AgentTask + AgentMessage + AgentMemory
├── Company + Contact + Deal + Activity
└── Enums: Status, Role, Priority, Type, etc.
```

### Key Types

**src/types.ts** (300+ lines):
- Enums for all domain states (AgentStatus, TaskStatus, DealStatus, etc.)
- Interface definitions for all domain models
- Query result types (QueryResult, PaginatedResult, SearchResult)
- Configuration types (SurrealDBConfig, DragonflyCacheConfig, NatsConfig, MeilisearchConfig)
- Error types (SuperStackError and variants)
- Hook and lifecycle types

## Connection Management

### Auto-Reconnection Flow

```
Initial Connection Attempt
    ↓
    ├─ Success → Set connected = true
    │
    └─ Failure → Check retry count
        ├─ Under max retries → Exponential backoff + Retry
        │   └─ (delay = initialDelay * multiplier^attempt)
        │
        └─ Max retries exceeded → Throw ConnectionError
```

### Lifecycle Hooks

```typescript
interface LifecycleHooks {
  onConnect?: () => Promise<void>;
  onDisconnect?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onRetry?: (attempt: number, error: Error) => Promise<void>;
}
```

## Error Handling Strategy

### Error Classification

1. **ConnectionError (503)** - Service unavailable
   - Auto-reconnect triggered
   - Operations fail fast after max retries

2. **TimeoutError (408)** - Operation exceeded timeout
   - Configurable timeout per operation
   - Logged but not retried automatically

3. **ValidationError (400)** - Invalid input data
   - Schema validation failures
   - Type mismatches

4. **NotFoundError (404)** - Resource doesn't exist
   - Read/update of non-existent records
   - Specific handling required

### Error Context

Each error includes:
- Message: Human-readable description
- Code: Machine-readable error code
- StatusCode: HTTP-style status code
- Context: Additional debug information

```typescript
try {
  await db.read("table:id");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`Not found: ${error.context?.id}`);
    console.log(`HTTP Status: ${error.statusCode}`);
  }
}
```

## Configuration

### Environment-Based

Priority order:
1. Programmatic config passed to SDK
2. Environment variables
3. Hardcoded defaults

```bash
SURREALDB_URL=ws://localhost:8000
SURREALDB_USER=root
SURREALDB_PASSWORD=root
DRAGONFLY_URL=localhost:6379
NATS_URL=nats://localhost:4222
MEILI_URL=http://localhost:7700
```

### Programmatic Configuration

```typescript
const sdk = new SuperStackSDK({
  surreal: {
    url: "ws://localhost:8000",
    user: "root",
    password: "root",
    database: "superstack",
    timeout: 30000,
    maxRetries: 5,
  },
  cache: {
    url: "localhost:6379",
    password: "secret",
    timeout: 5000,
  },
  nats: {
    url: "nats://localhost:4222",
    timeout: 10000,
  },
  meili: {
    url: "http://localhost:7700",
    masterKey: "masterKey",
  },
  autoConnect: true,
});
```

## Performance Characteristics

### Caching Strategy

```
Request for data
    ↓
┌─ Check cache (O(1))
├─ Hit → Return cached (fast path)
└─ Miss → Query database
    ├─ Get result (O(n) or indexed)
    ├─ Cache with TTL
    └─ Return
```

### Batch Operations

```typescript
// Efficient for bulk operations
const results = await db.createBatch("table", [
  { /* 100 records */ }
]);
// Better than individual creates in a loop
```

### Connection Pooling

```
Multiple Concurrent Operations
    ↓
Shared Connection Pool
    ├─ Max connections configurable
    ├─ Reused across requests
    └─ Automatic cleanup
```

## Testing & Utilities

### Logger (`src/utils/logger.ts`)

```typescript
import { getLogger, createScopedLogger } from "@superstack/sdk/utils/logger";

const logger = getLogger("debug");
const scoped = createScopedLogger("MyModule");

scoped.info("Message", { context: "data" });
```

### Retry Utility (`src/utils/retry.ts`)

```typescript
import { retryWithBackoff } from "@superstack/sdk/utils/retry";

const result = await retryWithBackoff(
  () => riskyOperation(),
  {
    maxAttempts: 5,
    initialDelayMs: 100,
    backoffMultiplier: 2,
  }
);
```

## Design Decisions

### 1. Unified SDK vs Individual Clients
- **Decision**: Provide both
- **Rationale**: SDK for convenience, individual clients for modularity

### 2. Type Generics for Domain Models
- **Decision**: Use generics throughout
- **Rationale**: Full type safety without runtime overhead

### 3. Auto-Reconnection Strategy
- **Decision**: Exponential backoff with max retries
- **Rationale**: Balance reliability with resource usage

### 4. Error Types Hierarchy
- **Decision**: Extend SuperStackError
- **Rationale**: Catchable as specific types or base SuperStackError

### 5. Pub/Sub Pattern for Cache
- **Decision**: Redis-compatible pub/sub
- **Rationale**: Familiar API for developers

### 6. JetStream for Messaging
- **Decision**: Full JetStream support
- **Rationale**: Persistent, reliable message delivery

## Scaling Considerations

### Horizontal Scaling

**Consumer Groups** (NATS):
```typescript
await queue.subscribe("tasks", handler, {
  queue: "workers", // Share queue across instances
  deliverPolicy: "new",
});
```

**Database Sharding**:
```typescript
const shard = hash(tenantId) % SHARD_COUNT;
const db = dbClients[shard];
```

**Cache Warming**:
```typescript
// Pre-load frequently accessed data on startup
for (const item of items) {
  await cache.set(`key:${item.id}`, item, { ttl: 86400 });
}
```

## Security Considerations

### Credential Management
- No credentials in code
- Environment variables required
- Config objects for programmatic setup

### Data Validation
- Zod schema support for messaging
- Type validation at compile-time
- Input sanitization

### Connection Security
- WebSocket (wss://) support for SurrealDB
- TLS support for all services
- Authentication tokens/credentials

## File Structure

```
superstack/
├── src/
│   ├── db/
│   │   └── surreal.ts          (500+ lines)
│   ├── cache/
│   │   └── dragonfly.ts        (480+ lines)
│   ├── queue/
│   │   └── nats.ts             (550+ lines)
│   ├── search/
│   │   └── meili.ts            (520+ lines)
│   ├── utils/
│   │   ├── logger.ts           (150+ lines)
│   │   └── retry.ts            (50+ lines)
│   ├── types.ts                (300+ lines)
│   └── index.ts                (300+ lines)
├── examples/
│   ├── basic-usage.ts
│   └── agent-example.ts
├── package.json
├── tsconfig.json
└── SDK.md
```

## Total Lines of Code

- **Core Implementation**: 3,000+ lines
- **Type Definitions**: 300+ lines
- **Utilities**: 200+ lines
- **Examples**: 400+ lines
- **Documentation**: 2,000+ lines

**Total**: 5,900+ lines of production-ready code

## Next Steps

1. **Build the SDK**: `npm install && npm run build`
2. **Run Examples**: See `examples/` directory
3. **Integration**: Use in your applications via `npm install @superstack/sdk`
4. **Monitoring**: Use with SigNoz or other monitoring tools
5. **Scaling**: Deploy with container orchestration

## References

- **Package Manifest**: `package.json`
- **TypeScript Config**: `tsconfig.json`
- **SDK Documentation**: `SDK.md`
- **Usage Examples**: `examples/`
- **Type Definitions**: `src/types.ts`
