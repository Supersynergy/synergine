# SuperStack Visualization & Dashboard Stack

> Complete guide to real-time dashboards, analytics, and visual tooling for the SuperStack framework.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser / Next.js 15                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Tremor Cards │  │ React Flow   │  │ Sigma.js Network Graph   │  │
│  │ (KPI / bars) │  │ (topology)   │  │ (10K nodes, WebGL)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ uPlot        │  │ Perspective  │  │ Cube.js Playground       │  │
│  │ (100K pts)   │  │ (1M row WASM)│  │ (semantic analytics)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ WebSocket + HTTP
┌────────────────────────────▼────────────────────────────────────────┐
│                    RealtimePipeline (Node.js)                        │
│                                                                     │
│  SurrealDB LIVE SELECT  ──►  Event Aggregator  ──►  Dedup Cache     │
│  NATS JetStream         ──►  (fan-out)         ──►  WS Clients      │
│  Dragonfly pub/sub      ──►                                         │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
    │SurrealDB│          │  NATS   │          │Dragonfly│
    │  :8000  │          │  :4222  │          │  :6379  │
    └─────────┘          └─────────┘          └─────────┘
```

**Data flows:**
1. SurrealDB emits row-level changes via `LIVE SELECT` WebSocket streams
2. NATS carries agent-emitted events (task started, metric pushed, etc.)
3. Dragonfly channels carry high-frequency metric ticks (sub-second)
4. `RealtimePipeline` deduplicates, aggregates, and fans out to browser clients
5. `DashboardManager` holds a Zustand-style in-memory state consumed by React hooks
6. Cube.js provides a semantic layer for historical analytics queries

---

## Available Widgets

### 1. AgentStatusWidget

**Library:** `@tremor/react` cards + badges
**Data source:** `LIVE SELECT id, name, role, status, model, health_status FROM agent`
**Features:**
- Color-coded status badges (active = green, error = red, idle = gray)
- KPI metrics: task count, avg response time, error rate
- Optional sparkline of recent activity

```typescript
import { createWidget } from "@superstack/sdk/dashboard/widgets";

const statusWidget = createWidget({
  id: "my-agent-status",
  type: "agent-status",
  title: "All Agents",
  displayFields: ["name", "status", "model", "avg_response_time_ms"],
  showSparkline: true,
});
```

---

### 2. MetricsChart

**Library:** `uplot` — 100,000 data points at 60 fps in < 40KB
**Data source:** NATS subjects `agent.metrics.*`
**Features:**
- Sub-millisecond rendering via canvas (not SVG)
- Cursor sync across multiple charts via `syncKey`
- Multiple series with custom colors and dash patterns
- Zoom, pan, and selection built-in

```typescript
const chart = createWidget({
  id: "throughput",
  type: "metrics-chart",
  title: "Task Throughput",
  series: [
    { label: "completed/s", stroke: "#22c55e" },
    { label: "failed/s",    stroke: "#ef4444", dash: [4, 4] },
  ],
  yAxisLabel: "tasks/s",
  height: 300,
  syncKey: "timeline",
});
```

---

### 3. AgentFlowDiagram

**Library:** `@xyflow/react` (React Flow v12)
**Data source:** `LIVE SELECT in, out, relationship_type FROM coordinates`
**Features:**
- Live node/edge updates as agents connect and disconnect
- Auto-layout via dagre or ELK (install separately)
- Custom node types for agents, tasks, gateways
- Animated edges for active message passing
- Minimap, fit-to-view, zoom controls

```typescript
const flow = createWidget({
  id: "topology",
  type: "agent-flow",
  title: "Live Agent Topology",
  layoutAlgorithm: "dagre",
  animateActiveEdges: true,
  minimap: true,
});
```

**Custom node component example:**
```tsx
import { Handle, Position } from "@xyflow/react";

function AgentNode({ data }: { data: { label: string; status: string } }) {
  return (
    <div className={`agent-node agent-node--${data.status}`}>
      <Handle type="target" position={Position.Top} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

---

### 4. GraphVisualization

**Library:** `@sigma/core` (Sigma.js v3) + `graphology`
**Data source:** Multi-hop SurrealQL graph query
**Features:**
- WebGL rendering supports 10,000+ nodes at interactive frame rates
- Force-directed layout (ForceAtlas2 via graphology-layout-forceatlas2)
- Color nodes by field (e.g., `role`, `industry`)
- Size nodes by numeric field (e.g., `lead_score`, `avg_response_time_ms`)
- Click to inspect, hover for tooltips

```typescript
const graph = createWidget({
  id: "knowledge-graph",
  type: "graph-viz",
  title: "Agent-Company Knowledge Graph",
  colorByField: "role",
  sizeByField: "lead_score",
  gravity: 0.1,
});
```

**SurrealQL query for graph data:**
```sql
SELECT
  id, name, role, lead_score,
  ->coordinates->agent.{ id, name } AS peers,
  ->has_contact->contact->has_deal->deal.{ id, value, stage } AS deals
FROM agent
FETCH peers, deals;
```

---

### 5. PivotTable

**Library:** `@finos/perspective` + `@finos/perspective-viewer`
**Data source:** Cube.js semantic layer queries
**Features:**
- WASM-accelerated pivot over 1,000,000+ rows
- Multiple view types: datagrid, bar chart, heatmap, treemap
- Drag-and-drop pivot configuration in the browser
- Export to CSV / Arrow IPC
- Filtering, sorting, aggregation all client-side after initial load

```typescript
const pivot = createWidget({
  id: "task-analytics",
  type: "pivot-table",
  title: "Task Cost Breakdown",
  view: "datagrid",
  pivotConfig: {
    rowPivots: ["AgentTask.agentId"],
    columnPivots: ["AgentTask.taskType"],
    aggregates: {
      "AgentTask.totalCostUsd": "sum",
      "AgentTask.avgDurationMs": "avg",
    },
    sort: [["AgentTask.totalCostUsd", "desc"]],
  },
  theme: "material-dark",
});
```

---

### 6. CostTracker

**Library:** `@tremor/react` (bar chart) + `uplot` (cumulative line)
**Data source:** `LIVE SELECT agent_id, model, sum(cost_usd) FROM agent_task GROUP BY agent_id, model`
**Features:**
- Real-time token spend by agent, model, or task type
- Daily / monthly budget tracking with threshold alerts
- Cumulative cost curve rendered via uPlot
- Top-N cost contributors in a Tremor bar chart

```typescript
const costs = createWidget({
  id: "costs",
  type: "cost-tracker",
  title: "LLM Cost Tracker",
  budget: { daily: 10, monthly: 200, alertThresholdPct: 80 },
  groupBy: "model",
  showCumulativeCurve: true,
  topN: 10,
});
```

---

## How to Customize Dashboards

### 1. Compose a dashboard layout

```typescript
import { DashboardManager, createDashboardManager } from "@superstack/sdk/dashboard";
import { createWidget, AnyWidgetConfig } from "@superstack/sdk/dashboard/widgets";

const widgets: AnyWidgetConfig[] = [
  createWidget({ id: "status", type: "agent-status", title: "Agents" }),
  createWidget({ id: "costs",  type: "cost-tracker", title: "Costs", groupBy: "model" }),
  createWidget({ id: "flow",   type: "agent-flow",   title: "Topology" }),
];

const manager = await createDashboardManager();

// React: pass manager.getStore() to useSyncExternalStore
```

### 2. Add a custom widget type

1. Add a new entry to the `AnyWidgetConfig` union in `src/dashboard/widgets.ts`
2. Implement the widget as a React component consuming `manager.getStore()`
3. Register the new data source in `RealtimePipeline` if needed
4. Export from `src/dashboard/index.ts`

### 3. Override default data sources

```typescript
createWidget({
  id: "custom-metrics",
  type: "metrics-chart",
  title: "Custom Metric",
  dataSource: {
    type: "nats-subject",
    query: "myapp.metrics.latency",
    maxPoints: 50_000,
  },
  series: [{ label: "p99 latency ms", stroke: "#f59e0b" }],
  yAxisLabel: "ms",
  height: 200,
});
```

---

## Performance Characteristics

| Widget           | Library         | Max Data         | Render Engine | Notes                          |
|-----------------|-----------------|-----------------|---------------|--------------------------------|
| MetricsChart    | uPlot 1.6       | 100,000 pts/series | Canvas 2D  | ~40KB, sub-ms render           |
| GraphVisualization | Sigma.js 3   | 10,000 nodes     | WebGL        | ForceAtlas2 layout             |
| PivotTable      | Perspective 3.0 | 1,000,000 rows   | WASM + Arrow | Arrow IPC binary transport     |
| AgentFlowDiagram | React Flow 12  | ~500 nodes       | SVG/HTML     | Optimized with virtualization  |
| AgentStatusWidget | Tremor 3.18   | ~200 agents      | React DOM    | Lightweight card grid          |
| CostTracker     | Tremor + uPlot  | 50,000 pts       | Mixed        | Canvas for chart, DOM for bars |

---

## Integration with Cube.js

Cube.js provides a semantic layer that abstracts raw SurrealDB queries into business metrics. The `pivot-table` widget consumes Cube.js queries by default.

**Setup:**
```bash
npm install @cubejs-client/core @cubejs-client/react
```

**Cube schema for agent tasks (`schema/AgentTask.js`):**
```javascript
cube("AgentTask", {
  sql: `SELECT * FROM agent_task`,
  measures: {
    totalCount: { type: "count" },
    totalCostUsd: { sql: "cost_usd", type: "sum", format: "currency" },
    avgDurationMs: { sql: "duration_ms", type: "avg" },
  },
  dimensions: {
    agentId:  { sql: "agent_id",  type: "string" },
    taskType: { sql: "task_type", type: "string" },
    status:   { sql: "status",    type: "string" },
    createdAt: { sql: "created_at", type: "time" },
  },
});
```

**Querying from TypeScript:**
```typescript
import CubejsClient from "@cubejs-client/core";

const cubejs = new CubejsClient({ token: "...", options: { apiUrl: "http://localhost:4000/cubejs-api/v1" } });
const result = await cubejs.load({
  measures: ["AgentTask.totalCostUsd"],
  dimensions: ["AgentTask.agentId"],
  timeDimensions: [{ dimension: "AgentTask.createdAt", granularity: "day", dateRange: "last 7 days" }],
});
```

---

## React Flow Agent Topology Patterns

### Pattern 1: Flat peer mesh (all agents connected)
Useful for showing total coordination surface area. Use `layoutAlgorithm: "dagre"` with rankdir `LR`.

### Pattern 2: Hierarchical orchestrator tree
One orchestrator node at the top, worker agents below. Set `rankdir: "TB"` and filter edges to `relationship_type = 'orchestrates'`.

### Pattern 3: Pipeline / workflow DAG
Agents as processing stages connected in sequence. Use ELK layout with `elk.algorithm: "layered"`. Edges carry `task_type` labels.

### Pattern 4: Dynamic cluster view
Group agents by `role` into cluster nodes. Use React Flow sub-flows for each cluster. Edges between clusters represent inter-role communication.

**Live edge animation on NATS message:**
```typescript
pipeline.on("event", (event) => {
  if (event.source === "nats" && event.subject.startsWith("agent.message.")) {
    const { from_agent, to_agent } = event.payload as { from_agent: string; to_agent: string };
    // Temporarily animate edge from_agent -> to_agent
    setEdges((edges) =>
      edges.map((e) =>
        e.source === from_agent && e.target === to_agent
          ? { ...e, animated: true }
          : e
      )
    );
    // Reset after 2s
    setTimeout(() => setEdges((edges) => edges.map((e) => ({ ...e, animated: false }))), 2000);
  }
});
```

---

## Visualization Library Comparison

| Library              | Package                    | Size     | Render  | Best For                    | Max Scale       |
|---------------------|---------------------------|----------|---------|----------------------------|-----------------|
| Tremor              | `@tremor/react`            | ~120KB   | React   | KPI cards, bar/line charts | ~200 data points|
| uPlot               | `uplot`                    | ~40KB    | Canvas  | Dense time-series          | 100K points     |
| React Flow          | `@xyflow/react`            | ~200KB   | SVG/DOM | Workflow diagrams, DAGs    | ~500 nodes      |
| Sigma.js            | `@sigma/core`              | ~180KB   | WebGL   | Network graphs             | 10K nodes       |
| Perspective         | `@finos/perspective`       | ~8MB WASM| WASM    | Analytics pivot tables     | 1M+ rows        |
| D3                  | `d3`                       | ~250KB   | SVG     | Custom charts, geo, maps   | Unlimited       |
| Cube.js             | `@cubejs-client/core`      | ~90KB    | N/A     | Semantic analytics layer   | Server-side     |

---

## Adding Custom Widgets

### Step 1 — Define the config type

```typescript
// src/dashboard/widgets.ts
export interface HeatmapWidgetConfig extends BaseWidget {
  type: "heatmap";
  xField: string;
  yField: string;
  valueField: string;
  colorScale: [string, string]; // low, high
}
```

### Step 2 — Create the React component

```tsx
// src/dashboard/components/HeatmapWidget.tsx
import { useSyncExternalStore } from "react";
import type { DashboardManager } from "../index.js";
import type { HeatmapWidgetConfig } from "../widgets.js";

export function HeatmapWidget({
  config,
  manager,
}: {
  config: HeatmapWidgetConfig;
  manager: DashboardManager;
}) {
  const metrics = useSyncExternalStore(
    manager.getStore().subscribe,
    () => manager.getStore().getState().metrics
  );
  // Render with D3 or uPlot ...
}
```

### Step 3 — Register data source in RealtimePipeline

```typescript
// In your pipeline config, add the NATS subject or SurrealQL query
const pipeline = await createRealtimePipeline({
  natsSubjects: ["agent.>", "task.>", "metric.>", "heatmap.>"],
});
```

### Step 4 — Export from index

```typescript
// src/dashboard/index.ts
export { HeatmapWidget } from "./components/HeatmapWidget.js";
```
