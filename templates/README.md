# SuperStack Templates

Production-ready template implementations for common SuperStack use cases. Each template is self-contained, well-documented, and immediately runnable.

## Prerequisites

All templates require the SuperStack core services to be running:

```bash
./scripts/start.sh core
```

This starts:
- SurrealDB (ws://localhost:8000)
- Dragonfly Cache (localhost:6379)
- NATS (nats://localhost:4222)
- Meilisearch (http://localhost:7700)

## Running Templates

Each template can be run individually:

```bash
bun run templates/ai-agent-saas.ts
bun run templates/crm-pipeline.ts
bun run templates/scraper-engine.ts
bun run templates/ecommerce-ai.ts
bun run templates/monitoring-dashboard.ts
bun run templates/knowledge-graph.ts
```

## Template Overview

### 1. AI Agent SaaS (`ai-agent-saas.ts`)

Complete platform for managing distributed AI agents with cost tracking and memory systems.

**Features:**
- Multi-tenant agent registration and lifecycle management
- Task queue with NATS JetStream for distributed processing
- Vector-based agent memory with semantic search
- Real-time status updates via LIVE SELECT
- Per-call cost tracking and usage analytics
- Agent memory storage with topic-based retrieval

**Key Classes:**
- `AgentSaaSManager` - Central agent management and orchestration

**Example Flow:**
```typescript
const manager = new AgentSaaSManager();
await manager.initialize();

// Register agent
const agent = await manager.registerAgent(
  "tenant-001",
  "DataAnalyzer",
  AgentRole.ANALYZER,
  ["data_analysis", "reporting"]
);

// Store memory
await manager.storeMemory(
  agent.id,
  "customer_insights",
  "North American market shows 23% growth"
);

// Create and track task
const task = await manager.createTask(agent.id, "Analyze Monthly Data", "...");

// Track costs
await manager.logApiCall(
  agent.id,
  task.id,
  "gpt-4",
  2500, // input tokens
  1200, // output tokens
  true  // success
);

// Get analytics
const analytics = await manager.getAgentAnalytics(agent.id);
```

**Use Cases:**
- Multi-agent orchestration platforms
- AI-powered SaaS applications
- Agent cost attribution and billing
- Memory-augmented AI systems

---

### 2. CRM Pipeline (`crm-pipeline.ts`)

Sales pipeline and lead management system with scoring and analytics.

**Features:**
- Company import from CSV/API sources
- Contact enrichment and relationship tracking
- Deal stage management with activity logging
- Lead scoring with computed fields
- Pipeline analytics and forecasting
- Activity timeline and audit trails

**Key Classes:**
- `CRMPipelineManager` - Complete CRM operations

**Example Flow:**
```typescript
const crm = new CRMPipelineManager();
await crm.initialize();

// Import companies
const companies = await crm.importCompanies([
  {
    name: "TechCorp Inc",
    industry: "Technology",
    website: "techcorp.com",
    size: "201-500",
    revenue: 50000000,
  },
]);

// Enrich contacts
await crm.enrichContact(
  companies[0].id,
  "John",
  "Smith",
  "john@techcorp.com"
);

// Create deal
const deal = await crm.createDeal(
  companies[0].id,
  "Enterprise License",
  150000
);

// Move through pipeline
await crm.moveDealToStage(deal.id, DealStatus.QUALIFIED);

// Log activities
await crm.logActivity(deal.id, "deal", ActivityType.CALL, {
  title: "Discovery call",
  description: "Discussed requirements",
});

// Calculate lead score
const score = await crm.calculateLeadScore(companies[0].id);

// Get pipeline metrics
const metrics = await crm.getPipelineMetrics();
```

**Use Cases:**
- B2B sales pipeline management
- Lead scoring and qualification
- Deal pipeline forecasting
- Activity tracking and reporting

---

### 3. Scraper Engine (`scraper-engine.ts`)

Distributed web scraping pipeline with deduplication and rate limiting.

**Features:**
- URL queue management via NATS JetStream
- Scrape results stored with deduplication
- Full-text indexing via Meilisearch
- Rate limiting with sliding window algorithm
- Concurrent worker pattern for horizontal scaling
- Error handling, retry logic, and status tracking

**Key Classes:**
- `ScraperEngine` - Distributed scraper coordination

**Example Flow:**
```typescript
const scraper = new ScraperEngine();
await scraper.initialize();

// Set rate limits
scraper.setRateLimit("github.com", {
  requestsPerSecond: 2,
  burstSize: 5,
});

// Start workers
await scraper.startWorkers(3);

// Enqueue URLs
const task = await scraper.enqueueUrl("https://example.com/page1", 100);

// Search scraped content
const results = await scraper.searchPages("query");

// Get statistics
const stats = await scraper.getStats();
```

**Worker Pattern:**
- Automatically retries failed requests with exponential backoff
- Deduplicates content using content hashing
- Respects domain-specific rate limits
- Publishes completion/failure events

**Use Cases:**
- Web scraping at scale
- Content collection and indexing
- SEO monitoring and competitor analysis
- Data extraction pipelines

---

### 4. E-Commerce AI (`ecommerce-ai.ts`)

AI-powered e-commerce platform with recommendations and dynamic pricing.

**Features:**
- Product catalog with vector embeddings
- Smart search via Meilisearch with faceting
- AI recommendation engine using vector similarity
- Dynamic pricing agent with demand signals
- Order tracking with graph relationships
- Real-time inventory via LIVE SELECT
- Cart optimization with personalization

**Key Classes:**
- `EcommerceAIEngine` - E-commerce AI operations

**Example Flow:**
```typescript
const ecom = new EcommerceAIEngine();
await ecom.initialize();

// Create products
const laptop = await ecom.upsertProduct(
  "Pro Laptop X1",
  "High-performance laptop...",
  "Electronics",
  1299,
  900,
  15,
  ["laptop", "gaming"]
);

// Search with facets
const results = await ecom.searchProducts("gaming", {
  category: "Electronics",
  maxPrice: 1000,
});

// Get recommendations
const recs = await ecom.getRecommendations(laptop.id, "customer-001", 5);

// Shopping journey
await ecom.addToCart(customerId, product.id, 1);
const order = await ecom.createOrder(
  customerId,
  "credit_card",
  "123 Main St"
);

// Dynamic pricing
const price = await ecom.getDynamicPrice(productId, basePrice);

// Track order
const tracking = await ecom.getOrderTracking(order.id);
```

**Pricing Logic:**
- Low stock increases price (+15%)
- High ratings with reviews increases price (+8%)
- Custom pricing rules via multipliers

**Use Cases:**
- AI-powered e-commerce platforms
- Product recommendation engines
- Dynamic pricing systems
- Personalized shopping experiences

---

### 5. Monitoring Dashboard (`monitoring-dashboard.ts`)

Real-time agent monitoring, metrics aggregation, and alerting.

**Features:**
- Aggregate agent metrics from tasks and logs
- Token usage and cost calculation
- Agent health checks via NATS request-reply
- Cache hot metrics in Dragonfly for fast access
- WebSocket real-time update streams
- Performance alerting and SLA tracking
- Historical metrics and trend analysis

**Key Classes:**
- `MonitoringDashboard` - Monitoring and analytics

**Example Flow:**
```typescript
const dashboard = new MonitoringDashboard();
await dashboard.initialize();

// Start health checks
await dashboard.startHealthChecks();

// Get dashboard data
const data = await dashboard.getDashboardData();
console.log(data.system.systemHealth);

// Get agent metrics
const metrics = await dashboard.getAgentMetrics(agentId);

// Get trends
const trends = await dashboard.getMetricsTrend(24); // 24 hours

// Get alerts
const alerts = await dashboard.getAlertHistory(50);

// Resolve alert
await dashboard.resolveAlert(alertId);
```

**Metrics Tracked:**
- Task success/failure rates
- Average response times
- Token usage and costs
- Agent health status
- System resource utilization
- Alert history and patterns

**Use Cases:**
- Agent performance monitoring
- Cost tracking and optimization
- System health dashboards
- SLA monitoring and reporting

---

### 6. Knowledge Graph + RAG (`knowledge-graph.ts`)

Knowledge graph construction with semantic search and RAG pipeline.

**Features:**
- Entity extraction and knowledge graph construction
- Relationship mapping with graph traversal
- Vector embeddings for semantic search
- Multi-hop graph traversal for context retrieval
- Hybrid retrieval combining vector + graph + keyword search
- RAG (Retrieval-Augmented Generation) pipeline
- Knowledge base indexing and graph analytics

**Key Classes:**
- `KnowledgeGraphEngine` - Knowledge graph operations

**Example Flow:**
```typescript
const kg = new KnowledgeGraphEngine();
await kg.initialize();

// Index knowledge source
const source = await kg.indexKnowledgeSource(
  "AI and ML Trends 2024",
  "Long text content...",
  "article"
);

// Perform hybrid search
const result = await kg.hybridSearch("machine learning AI", 10, 2);
console.log(result.context.directMatches);
console.log(result.context.graphContext);

// Get similar entities
const similar = await kg.findSimilarEntities(entityId, 5);

// Get graph stats
const stats = await kg.getGraphStats();
```

**Search Combines:**
1. **Vector Search** - Semantic similarity in embedding space
2. **Keyword Search** - Direct text matching in content
3. **Entity Search** - Query entity extraction and matching
4. **Graph Traversal** - Related entities up to N hops away

**Use Cases:**
- Semantic search systems
- RAG (Retrieval-Augmented Generation) pipelines
- Knowledge bases and documentation systems
- Intelligent search and discovery platforms

---

## Common Patterns

### Connection Management

All templates use the SDK's unified initialization:

```typescript
const sdk = await createSuperStackSDK({ autoConnect: true });
const db = sdk.getDB();
const cache = sdk.getCache();
const queue = sdk.getQueue();
const search = sdk.getSearch();
```

### Caching Pattern

Hot data cached in Dragonfly before querying database:

```typescript
// Try cache first
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Query database
const data = await db.query(...);

// Store in cache
await cache.set(cacheKey, data, { ttl: 3600 }); // 1 hour
```

### Event Publishing

All mutations publish events to NATS for real-time updates:

```typescript
await queue.publish("event.type", {
  resourceId: id,
  timestamp: new Date(),
  data: { ... },
});
```

### Error Handling

Templates include retry logic with exponential backoff:

```typescript
try {
  return await operation();
} catch (error) {
  if (retries < maxRetries) {
    await sleep(Math.pow(2, retries) * 1000);
    return retryOperation(retries + 1);
  }
  throw error;
}
```

## Performance Tuning

### Database

- Use indexed queries for frequently accessed fields
- Leverage LIVE SELECT for real-time updates
- Batch operations when possible

### Cache

- Cache hot data with appropriate TTLs
- Use cache invalidation on updates
- Monitor cache hit rates

### Search

- Index documents immediately after creation
- Use faceted search for filtering
- Implement pagination for large result sets

### Queue

- Use JetStream for durability
- Implement durable consumers for reliable processing
- Handle backpressure with worker pools

## Monitoring and Debugging

### Enable Debug Logging

```typescript
const sdk = await createSuperStackSDK({
  autoConnect: true,
  logLevel: "debug",
});
```

### Check Service Health

```typescript
const status = await sdk.getStatus();
const health = await sdk.healthCheck();
```

### Query Performance

Monitor slow queries in SurrealDB:

```bash
curl http://localhost:8000/health
```

## Production Deployment

### Environment Variables

Set these for production deployments:

```bash
SURREALDB_URL=wss://db.example.com
SURREALDB_USER=production_user
SURREALDB_PASSWORD=strong_password

DRAGONFLY_URL=cache.example.com:6379
DRAGONFLY_PASSWORD=cache_password

NATS_URL=nats://queue.example.com:4222
MEILI_URL=https://search.example.com
MEILI_MASTER_KEY=search_key
```

### Scaling Considerations

1. **Horizontal Scaling**: Run multiple worker instances for scraper/queue processing
2. **Database**: Use SurrealDB's replication for high availability
3. **Cache**: Use Dragonfly cluster mode for distributed caching
4. **Search**: Deploy Meilisearch in cluster mode

### Backup and Recovery

```bash
# Export SurrealDB
surreal export --conn ws://localhost:8000 --auth root:root backup.sql

# Restore
surreal import --conn ws://localhost:8000 --auth root:root backup.sql
```

## Contributing

To extend templates:

1. Follow existing naming conventions (camelCase for methods, PascalCase for classes)
2. Add JSDoc comments for all public methods
3. Include error handling and logging
4. Cache frequently accessed data
5. Publish relevant events to NATS

## License

All templates are part of SuperStack and follow the same license.
