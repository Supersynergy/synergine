# SurrealDB Schema: SuperStack AI Company Framework

Comprehensive SurrealDB 3.0 schema for AI agent coordination with integrated CRM capabilities.

**Location:** `/Users/master/superstack/services/surrealdb/`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Tables](#core-tables)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Authentication](#authentication)
7. [Functions](#functions)
8. [Events & Triggers](#events--triggers)
9. [Initialization](#initialization)
10. [Query Examples](#query-examples)
11. [Performance Considerations](#performance-considerations)

---

## Overview

### Purpose

The SuperStack schema manages:
- **AI Agent Orchestration** — Multiple agents with different roles, models, and capabilities
- **Agent Memory** — Long-term learning, episodic memories, semantic search via vector embeddings
- **Task Execution** — Track agent work, performance, costs, errors
- **Inter-agent Communication** — Messages, coordination, event broadcasting
- **CRM Integration** — Companies, contacts, deals, activities (from OpenClaw pattern)
- **Relationship Graph** — Connections between agents, with companies, through deals

### Key Features

✅ **Multi-agent Coordination** — Agents coordinate via edges and messages
✅ **Vector Semantic Search** — Find memories by semantic similarity
✅ **Financial Tracking** — Token usage, cost attribution per task
✅ **Activity Timeline** — Complete audit trail of interactions
✅ **Flexible Config** — Agent-specific settings, extensible metadata
✅ **Event-driven** — Automatic logging and score updates
✅ **Permission System** — Role-based access control (admin/user)

### Namespace Structure

```
superstack (NAMESPACE)
└── agents (DATABASE)
    ├── Tables (12 core)
    ├── Relationships (4 edge tables)
    ├── Functions (2 utility)
    └── Events (3 triggers)
```

---

## Architecture

### Data Model Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT CORE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│ agent → (many) agent_task → agent_memory                   │
│         ↓                                                    │
│      agent_message ←→ agent (peer coordination)            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    CRM DATA LAYER                           │
├─────────────────────────────────────────────────────────────┤
│ company ─(has_contact)→ contact                            │
│         ├─(has_deal)→ deal ─(has_activity)→ activity      │
│         └─(has_activity)→ activity ←─ agent (logs)        │
└─────────────────────────────────────────────────────────────┘
```

### Relationship Types

| Relationship | From | To | Purpose |
|---|---|---|---|
| **coordinates** | agent | agent | Peer or supervisor coordination |
| **assigned_to** | agent | agent_task | Task ownership |
| **remembers** | agent | agent_memory | Memory storage & retrieval |
| **has_contact** | company | contact | Organizational structure |
| **has_deal** | contact | deal | Deal involvement |
| **has_activity** | deal | activity | Interaction timeline |

---

## Core Tables

### AGENT CORE LAYER

#### 1. `agent`

Represents an AI agent in the system with role, model, and configuration.

```sql
DEFINE TABLE agent SCHEMAFULL {
  id: string (PRIMARY KEY)
  name: string                          -- Display name
  role: string                          -- researcher|scraper|outreach|analyst|orchestrator
  status: string                        -- active|idle|error|disabled
  model: string                         -- haiku|sonnet|opus|gemma|kimi|custom
  config: object                        -- {temperature, max_tokens, timeout_ms, ...}
  capabilities: array<string>           -- ['web_search', 'email', 'code_execution']
  health_status: object                 -- {last_heartbeat, error_count, avg_response_time_ms}
  created_at: datetime                  -- Immutable creation time
  updated_at: datetime                  -- Modified timestamp
}
```

**Indexes:** `idx_agent_status`, `idx_agent_role`

**Example:**
```sql
CREATE agent:researcher SET
  name = 'Research Bot',
  role = 'researcher',
  model = 'sonnet',
  status = 'active',
  capabilities = ['web_search', 'data_analysis'],
  config = { temperature: 0.5, max_tokens: 2048 };
```

---

#### 2. `agent_memory`

Stores agent learning, memories, and vector embeddings for semantic search.

```sql
DEFINE TABLE agent_memory SCHEMAFULL {
  id: string (PRIMARY KEY)
  agent_id: record<agent>               -- Agent who owns this memory (required)
  content: string                       -- Raw memory text (required)
  summary: string                       -- Short version for quick retrieval
  vector_embedding: array<float>        -- 1536-dim OpenAI embeddings for semantic search
  memory_type: string                   -- short_term|long_term|episodic|semantic|procedural
  importance_score: float               -- 0.0-1.0 relevance rating
  tags: array<string>                   -- Labels: ['company:TechCorp', 'pattern:cold_outreach']
  metadata: object                      -- {source, context, conversation_id}
  created_at: datetime
  accessed_at: datetime                 -- Last retrieval time
  expires_at: datetime (optional)       -- TTL for auto-cleanup
}
```

**Indexes:** `idx_agent_memory_agent_id`, `idx_agent_memory_type`, `idx_agent_memory_tags`, `idx_agent_memory_importance`, `idx_agent_memory_vector` (MTREE)

**Key Notes:**
- **Vector Search:** MTREE index with cosine distance for semantic matching
- **Tags:** Hierarchical labels using `type:value` pattern for filtering
- **TTL:** Optional `expires_at` for automatic cleanup of old memories

**Example:**
```sql
CREATE agent_memory SET
  agent_id = agent:researcher,
  content = 'TechCorp shows strong enterprise signals...',
  vector_embedding = [0.1, 0.2, 0.15, ...],  -- 1536 floats
  memory_type = 'long_term',
  importance_score = 0.95,
  tags = ['company:techcorp', 'pattern:enterprise-buyer'],
  metadata = { source: 'web_research', confidence: 0.92 };

-- Semantic search example:
SELECT * FROM agent_memory
WHERE agent_id = agent:researcher
AND vector_embedding <~> [0.1, 0.2, ...] BY 5;  -- Top 5 closest
```

---

#### 3. `agent_task`

Execution log for agent tasks with performance metrics and cost tracking.

```sql
DEFINE TABLE agent_task SCHEMAFULL {
  id: string (PRIMARY KEY)
  agent_id: record<agent>               -- Agent executing this task
  task_type: string                     -- research|email|scrape|analyze|etc
  description: string
  input: object                         -- Task parameters
  output: object                        -- Task results
  status: string                        -- pending|running|completed|failed|cancelled
  error_message: string                 -- Details if failed
  started_at: datetime
  completed_at: datetime
  duration_ms: int                      -- Execution time
  tokens_used: object                   -- {input_tokens, output_tokens, total_cost_usd}
  cost_usd: float                       -- Calculated from token usage
  retry_count: int                      -- Number of retries
  parent_task_id: string (optional)     -- For subtask hierarchy
  created_at: datetime
}
```

**Indexes:** `idx_agent_task_agent_id`, `idx_agent_task_status`, `idx_agent_task_type`, `idx_agent_task_completed`

**Example:**
```sql
CREATE agent_task:research_1 SET
  agent_id = agent:researcher,
  task_type = 'company_research',
  status = 'completed',
  input = { company_name: 'TechCorp', domain: 'techcorp.io' },
  output = { fit_score: 0.92, contacts_found: 2 },
  duration_ms = 45000,
  tokens_used = { input_tokens: 500, output_tokens: 1200 },
  cost_usd = 0.0051;

-- Query agent performance:
SELECT
  agent_id,
  COUNT() as total_tasks,
  COUNT(WHERE status = 'completed') as successful,
  AVG(duration_ms) as avg_duration_ms,
  SUM(cost_usd) as total_cost
FROM agent_task
WHERE created_at > time::now() - 86400 * 7
GROUP BY agent_id;
```

---

#### 4. `agent_message`

Inter-agent communication and coordination logs.

```sql
DEFINE TABLE agent_message SCHEMAFULL {
  id: string (PRIMARY KEY)
  from_agent: record<agent>             -- Sender (required)
  to_agent: record<agent> (optional)    -- Recipient (broadcast if null)
  channel: string                       -- direct|broadcast|queue
  message_type: string                  -- request|response|event|broadcast
  content: object                       -- Message payload
  priority: int                         -- 0=normal, 1=high, -1=low
  status: string                        -- sent|received|processed|failed
  created_at: datetime
  processed_at: datetime (optional)
}
```

**Indexes:** `idx_agent_message_from`, `idx_agent_message_to`, `idx_agent_message_status`

**Example:**
```sql
-- Orchestrator broadcasts task to all agents
CREATE agent_message SET
  from_agent = agent:orchestrator,
  to_agent = NONE,  -- Broadcast
  channel = 'broadcast',
  message_type = 'event',
  priority = 1,
  content = {
    event: 'new_company_discovered',
    company_id: 'company:techcorp',
    fit_score: 0.92
  };
```

---

### CRM LAYER

#### 5. `company`

Prospect and client companies in the sales pipeline.

```sql
DEFINE TABLE company SCHEMAFULL {
  id: string (PRIMARY KEY)
  name: string                          -- Company name (required)
  domain: string                        -- Primary domain
  industry: string                      -- SaaS|FinTech|Agency|etc
  revenue: float                        -- Annual revenue in USD
  employees: int                        -- Employee count
  tech_stack: array<string>             -- ['Salesforce', 'Slack', 'AWS']
  website: string
  phone: string
  location: string                      -- HQ location
  tags: array<string>                   -- Segmentation labels
  source: string                        -- How discovered
  lead_score: float                     -- 0-100 qualification score
  notes: string
  created_at: datetime
  updated_at: datetime
}
```

**Indexes:** `idx_company_domain`, `idx_company_industry`, `idx_company_lead_score`, `idx_company_tags`

---

#### 6. `contact`

People at companies with contact info and decision-making status.

```sql
DEFINE TABLE contact SCHEMAFULL {
  id: string (PRIMARY KEY)
  company_id: record<company>           -- Parent company (required)
  first_name: string
  last_name: string
  email: string                         -- Primary email
  phone: string
  role: string                          -- Job title
  department: string                    -- Engineering|Sales|etc
  linkedin_url: string
  decision_maker: bool                  -- Budget holder?
  tags: array<string>
  notes: string
  created_at: datetime
  updated_at: datetime
}
```

**Indexes:** `idx_contact_company_id`, `idx_contact_email`, `idx_contact_decision_maker`

---

#### 7. `deal`

Sales opportunities in the pipeline.

```sql
DEFINE TABLE deal SCHEMAFULL {
  id: string (PRIMARY KEY)
  company_id: record<company>           -- Company (required)
  contact_id: record<contact> (optional)-- Primary contact
  title: string                         -- Deal name (required)
  description: string
  value: float                          -- USD amount
  stage: string                         -- lead|contacted|qualified|proposal|negotiation|won|lost
  probability: float                    -- Win % (0-100)
  expected_revenue: float               -- value * probability
  created_at: datetime
  updated_at: datetime
  closed_at: datetime (optional)
  closing_reason: string                -- Why won/lost
}
```

**Indexes:** `idx_deal_company_id`, `idx_deal_contact_id`, `idx_deal_stage`, `idx_deal_closed_at`

---

#### 8. `activity`

Interactions: emails, calls, meetings, notes.

```sql
DEFINE TABLE activity SCHEMAFULL {
  id: string (PRIMARY KEY)
  deal_id: record<deal> (optional)
  contact_id: record<contact> (optional)
  company_id: record<company> (optional)
  agent_id: record<agent> (optional)    -- Which agent performed
  type: string                          -- email|call|meeting|note|task|message
  subject: string
  content: string                       -- Email body|call notes|meeting summary
  direction: string                     -- inbound|outbound
  status: string                        -- completed|scheduled|failed
  outcome: string                       -- positive|negative|neutral
  scheduled_for: datetime (optional)
  metadata: object                      -- Email headers|call duration|meeting link
  created_at: datetime
  updated_at: datetime
}
```

**Indexes:** `idx_activity_deal_id`, `idx_activity_contact_id`, `idx_activity_agent_id`, `idx_activity_type`

---

## Relationships

### Edge Tables (Graph Relationships)

#### `coordinates` — Agent to Agent

```sql
DEFINE TABLE coordinates SCHEMAFULL {
  in: record<agent>
  out: record<agent>
  relationship_type: string             -- peer|supervisor|subordinate
  last_sync: datetime
}

-- Example: Create supervisor relationship
CREATE coordinates SET
  in = agent:orchestrator,
  out = agent:researcher,
  relationship_type = 'supervisor',
  last_sync = time::now();

-- Query: Who does orchestrator supervise?
SELECT -> out FROM coordinates WHERE in = agent:orchestrator;
```

#### `assigned_to` — Agent to Task

```sql
DEFINE TABLE assigned_to SCHEMAFULL {
  in: record<agent>
  out: record<agent_task>
}

-- Query: Find all tasks for an agent
SELECT -> out FROM assigned_to WHERE in = agent:researcher;
```

#### `remembers` — Agent to Memory

```sql
DEFINE TABLE remembers SCHEMAFULL {
  in: record<agent>
  out: record<agent_memory>
  recall_count: int                     -- How many times recalled
  last_recalled: datetime
}

-- Query: Get agent's memories with recall stats
SELECT
  agent_id,
  count() as memory_count,
  sum(recall_count) as total_recalls
FROM remembers
WHERE in = agent:researcher
GROUP BY agent_id;
```

#### `has_contact` — Company to Contact

```sql
DEFINE TABLE has_contact SCHEMAFULL {
  in: record<company>
  out: record<contact>
  primary_contact: bool
}

-- Query: Find primary contact for a company
SELECT -> out FROM has_contact
WHERE in = company:techcorp AND primary_contact = true;
```

#### `has_deal` — Contact to Deal

```sql
DEFINE TABLE has_deal SCHEMAFULL {
  in: record<contact>
  out: record<deal>
  role: string                          -- decision_maker|influencer|user
}

-- Query: Find deals involving a contact
SELECT -> out FROM has_deal WHERE in = contact:techcorp_cto;
```

#### `has_activity` — Deal to Activity

```sql
DEFINE TABLE has_activity SCHEMAFULL {
  in: record<deal>
  out: record<activity>
}

-- Query: Get timeline of all activities for a deal
SELECT -> out FROM has_activity WHERE in = deal:techcorp_main ORDER BY created_at DESC;
```

---

## Indexes

### Complete Index List

| Table | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| **agent** | idx_agent_status | status | Filter by active/idle/error |
| | idx_agent_role | role | Filter by agent type |
| **agent_memory** | idx_agent_memory_agent_id | agent_id | Find memories by owner |
| | idx_agent_memory_type | memory_type | Filter by memory type |
| | idx_agent_memory_tags | tags | Filter by tags |
| | idx_agent_memory_importance | importance_score | Sort by relevance |
| | idx_agent_memory_vector | vector_embedding | **MTREE** semantic search |
| **agent_task** | idx_agent_task_agent_id | agent_id | Find tasks by agent |
| | idx_agent_task_status | status | Filter by status |
| | idx_agent_task_type | task_type | Filter by type |
| | idx_agent_task_completed | completed_at | Sort by completion |
| **company** | idx_company_domain | domain | Lookup by domain |
| | idx_company_industry | industry | Filter by industry |
| | idx_company_lead_score | lead_score | Sort by fit |
| | idx_company_tags | tags | Filter by tags |
| **contact** | idx_contact_company_id | company_id | Find contacts by company |
| | idx_contact_email | email | Lookup by email |
| | idx_contact_decision_maker | decision_maker | Find decision makers |
| **deal** | idx_deal_company_id | company_id | Find deals by company |
| | idx_deal_contact_id | contact_id | Find deals by contact |
| | idx_deal_stage | stage | Filter by pipeline stage |
| | idx_deal_closed_at | closed_at | Find recently closed |
| **activity** | idx_activity_deal_id | deal_id | Find activities by deal |
| | idx_activity_contact_id | contact_id | Find activities by contact |
| | idx_activity_agent_id | agent_id | Audit agent actions |
| | idx_activity_type | type | Filter by type |

**Total:** 30+ indexes for optimal query performance

---

## Authentication

### JWT Access

```sql
DEFINE ACCESS agent_token ON DB TYPE JWT
  ALGORITHM HS512
  KEY "your-secret-key-replace-in-production"
  ISSUER "SuperStack";
```

### User Management

```sql
-- Create admin user
DEFINE USER admin ON DB PASSWORD "admin123" ROLES owner;

-- Create read-only user
DEFINE USER analyst ON DB PASSWORD "password123" ROLES viewer;

-- Create agent API user
DEFINE USER api_agent ON DB PASSWORD "token123" ROLES api;
```

### Permissions

```sql
-- Admin can do everything
DEFINE TABLE agent PERMISSIONS
  FOR select WHERE true,
  FOR create WHERE $auth.role = 'admin',
  FOR update WHERE $auth.role = 'admin',
  FOR delete WHERE $auth.role = 'admin';

-- Users can create/update their own tasks
DEFINE TABLE agent_task PERMISSIONS
  FOR select WHERE $auth != NONE,
  FOR create WHERE $auth != NONE,
  FOR update WHERE $auth.agent_id = $value.agent_id OR $auth.role = 'admin',
  FOR delete WHERE $auth.role = 'admin';
```

---

## Functions

### 1. `token_cost($model, $input_tokens, $output_tokens)`

Calculate cost based on model and token count.

```sql
DEFINE FUNCTION token_cost($model: string, $input_tokens: int, $output_tokens: int) {
  RETURN MATCH $model {
    'haiku' => ($input_tokens * 0.00000080 + $output_tokens * 0.00000400),
    'sonnet' => ($input_tokens * 0.00000300 + $output_tokens * 0.00001500),
    'opus' => ($input_tokens * 0.00001500 + $output_tokens * 0.00007500),
    _ => 0.0
  };
};

-- Usage:
SELECT token_cost('sonnet', 500, 1200) as cost;  -- Returns 0.0021
```

### 2. `agent_summary($agent_id, $days)`

Get agent activity summary for a date range.

```sql
DEFINE FUNCTION agent_summary($agent_id: record, $days: int) {
  RETURN {
    total_tasks: (SELECT count() FROM agent_task WHERE ...)[0].count,
    completed_tasks: (SELECT count() FROM agent_task WHERE status = 'completed' ...)[0].count,
    failed_tasks: (SELECT count() FROM agent_task WHERE status = 'failed' ...)[0].count,
    total_cost: (SELECT math::sum(cost_usd) FROM agent_task WHERE ...)[0],
  };
};

-- Usage:
SELECT agent_summary(agent:researcher, 7) as weekly_summary;
```

---

## Events & Triggers

### Event 1: Agent Task Status Logging

**Trigger:** When agent task status changes
**Action:** Create activity record

```sql
DEFINE EVENT on agent_task WHEN $event = "UPDATE"
  THEN {
    IF $before.status != $after.status THEN
      CREATE activity SET
        agent_id = $after.agent_id,
        type = 'task',
        subject = "Task status: " + $before.status + " -> " + $after.status,
        status = $after.status;
    END;
  };
```

### Event 2: Agent Timestamp Maintenance

**Trigger:** When agent is created or updated
**Action:** Keep `updated_at` current

```sql
DEFINE EVENT on agent WHEN $event = "UPDATE" OR $event = "CREATE"
  THEN {
    UPDATE agent SET updated_at = time::now() WHERE id = $after.id;
  };
```

### Event 3: Lead Score Updates

**Trigger:** When activity created
**Action:** Boost company lead score

```sql
DEFINE EVENT on activity WHEN $event = "CREATE"
  THEN {
    IF $after.company_id != NONE THEN
      UPDATE company
      SET lead_score = math::min(lead_score + 5, 100)
      WHERE id = $after.company_id;
    END;
  };
```

---

## Initialization

### Quick Start

```bash
# Basic initialization
./scripts/init-db.sh

# With seed data
./scripts/init-db.sh --seed

# Custom connection
./scripts/init-db.sh --url http://localhost:8000 --user admin --pass secret --seed
```

### Manual Initialization

```bash
# Using surreal CLI
surreal import -e http://localhost:8000 \
  --user admin \
  --pass admin123 \
  services/surrealdb/init.surql

# Then seed
surreal import -e http://localhost:8000 \
  --user admin \
  --pass admin123 \
  services/surrealdb/seed.surql
```

### Using Docker Compose

```yaml
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
      - ./services/surrealdb:/db

  init-db:
    image: surrealdb/surrealdb:latest
    depends_on:
      - surrealdb
    entrypoint: |
      bash -c "
        sleep 3 && \
        surreal import -e http://surrealdb:8000 \
          --user admin --pass admin123 \
          /db/init.surql && \
        surreal import -e http://surrealdb:8000 \
          --user admin --pass admin123 \
          /db/seed.surql
      "
    volumes:
      - ./services/surrealdb:/db
```

---

## Query Examples

### Agent Queries

```sql
-- Find all active researchers
SELECT * FROM agent WHERE role = 'researcher' AND status = 'active';

-- Get agent performance (last 7 days)
SELECT
  id, name, role,
  (SELECT count() FROM agent_task WHERE agent_id = agent.id AND created_at > time::now() - 86400 * 7) as tasks_7d,
  (SELECT count() FROM agent_task WHERE agent_id = agent.id AND status = 'completed' AND created_at > time::now() - 86400 * 7) as completed_7d,
  (SELECT sum(cost_usd) FROM agent_task WHERE agent_id = agent.id AND created_at > time::now() - 86400 * 7) as cost_7d
FROM agent
WHERE status = 'active';

-- Find memory by semantic similarity
SELECT * FROM agent_memory
WHERE agent_id = agent:researcher
AND vector_embedding <~> [0.1, 0.2, 0.15, ...] BY 5
ORDER BY importance_score DESC;
```

### CRM Queries

```sql
-- Find high-value leads
SELECT
  id, name, lead_score, revenue, employees,
  (SELECT count() FROM has_contact WHERE in = company.id) as contacts_count,
  (SELECT count() FROM deal WHERE company_id = company.id) as deals_count
FROM company
WHERE lead_score >= 70
ORDER BY lead_score DESC;

-- Deal pipeline by stage
SELECT
  stage,
  count() as deal_count,
  math::sum(value) as total_value,
  math::sum(value * probability / 100) as expected_revenue,
  math::avg(probability) as avg_probability
FROM deal
GROUP BY stage;

-- Activity timeline for a deal
SELECT
  type, subject, status, outcome, created_at,
  agent_id, contact_id
FROM activity
WHERE deal_id = deal:techcorp_main
ORDER BY created_at DESC;
```

### Coordination Queries

```sql
-- Get agent hierarchy
SELECT
  id, name, role,
  (SELECT <- in FROM coordinates WHERE out = agent.id AND relationship_type = 'supervisor')[0] as supervisor,
  (SELECT -> out FROM coordinates WHERE in = agent.id AND relationship_type = 'supervisor') as subordinates
FROM agent;

-- Find all memories of an agent with recall stats
SELECT
  memory.*,
  (SELECT recall_count FROM remembers WHERE in = agent.id AND out = memory.id)[0] as recall_count,
  (SELECT last_recalled FROM remembers WHERE in = agent.id AND out = memory.id)[0] as last_recalled
FROM agent:researcher
  LET memory = (SELECT -> out FROM remembers WHERE in = agent.id);
```

---

## Performance Considerations

### Index Strategy

1. **Primary Lookup:** Domain, email, ID-based lookups use B-tree indexes
2. **Filtering:** Status, stage, type filters use composite indexes
3. **Sorting:** Timestamps (created_at, closed_at) indexed for pagination
4. **Vector Search:** MTREE index optimized for semantic similarity

### Optimization Tips

1. **Always filter by agent_id first** — Most queries should start with agent context
2. **Use pagination** — Especially for large task/memory queries
3. **Vector batch queries** — Group semantic searches to reduce API calls
4. **Denormalization:** Store lead_score, expected_revenue to avoid recalculation
5. **Archive old data:** Periodically move old agent_task records to archive table

### Query Planning

```sql
-- Check query plan
EXPLAIN SELECT * FROM agent_memory WHERE agent_id = ? AND importance_score > 0.8;

-- Analyze index usage
INFO FOR TABLE agent_memory;

-- Monitor slow queries (if enabled)
ADMIN SLOW QUERIES;
```

---

## Schema Statistics

| Component | Count | Notes |
|-----------|-------|-------|
| **Tables** | 12 | 4 agent + 4 CRM + 4 relationships |
| **Indexes** | 30+ | B-tree + MTREE vector |
| **Events** | 3 | Triggers for logging & scoring |
| **Functions** | 2 | Utility functions |
| **Permissions** | Multiple | Role-based access control |
| **Relations** | 6 | Agent/company/deal graph |

---

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `init.surql` | 363 | Complete schema definition |
| `seed.surql` | 634 | Sample data (5 agents, 3 companies, etc.) |
| `SCHEMA.md` | This file | Documentation |
| `scripts/init-db.sh` | 362 | Initialization script |

---

## Next Steps

1. **Start SurrealDB:** `docker run -p 8000:8000 surrealdb/surrealdb start`
2. **Initialize schema:** `./scripts/init-db.sh --seed`
3. **Connect UI:** Visit http://localhost:8000/studio
4. **Run test queries:** Use examples above
5. **Monitor performance:** Track index usage and slow queries

---

**Last Updated:** March 16, 2026
**Schema Version:** 1.0
**SurrealDB Version:** 3.0+
