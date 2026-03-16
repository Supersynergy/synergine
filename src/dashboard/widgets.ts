/**
 * SuperStack Dashboard Widget Definitions
 *
 * Type-safe configuration for every visualization widget.
 * Each widget declares its data source, rendering library, and options.
 *
 * Libraries used:
 *  - Tremor      (@tremor/react)           — cards, KPI, bar charts
 *  - uPlot       (uplot)                  — high-performance time-series
 *  - React Flow  (@xyflow/react)           — node-graph topology
 *  - Sigma.js    (@sigma/core)            — force-directed network graphs
 *  - Perspective (@finos/perspective)     — WASM pivot tables / analytics
 *  - Cube.js     (@cubejs-client/core)    — semantic-layer analytics queries
 *  - D3          (d3)                     — custom SVG / transitions
 */

// ---------------------------------------------------------------------------
// Shared base
// ---------------------------------------------------------------------------

export type DataSourceType =
  | "surrealdb-live"   // LIVE SELECT subscription
  | "nats-subject"     // NATS subject subscription
  | "dragonfly-key"    // Dragonfly GET / HGETALL
  | "cubejs-query"     // Cube.js semantic layer
  | "static";          // Hard-coded / demo data

export interface DataSource {
  type: DataSourceType;
  /** SurrealQL query, NATS subject, Redis key, or Cube.js query object */
  query: string | Record<string, unknown>;
  /** Polling interval in ms (only for dragonfly-key and static) */
  pollIntervalMs?: number;
  /** Max data points to retain in memory */
  maxPoints?: number;
}

export interface BaseWidget {
  id: string;
  title: string;
  description?: string;
  dataSource: DataSource;
  refreshIntervalMs?: number;
  /** CSS grid area span, e.g. "span 2" */
  gridSpan?: string;
}

// ---------------------------------------------------------------------------
// 1. AgentStatusWidget — Tremor Cards
// ---------------------------------------------------------------------------

export type AgentStatusVariant = "success" | "warning" | "error" | "neutral";

export interface AgentStatusWidgetConfig extends BaseWidget {
  type: "agent-status";
  /** Fields from the agent record to display as KPI */
  displayFields: Array<keyof {
    name: string;
    role: string;
    status: string;
    model: string;
    error_count: number;
    avg_response_time_ms: number;
    total_tasks: number;
  }>;
  /** Map agent status values to Tremor color variants */
  statusColorMap: Record<string, AgentStatusVariant>;
  /** Show sparkline of recent activity */
  showSparkline: boolean;
}

export const defaultAgentStatusWidget: AgentStatusWidgetConfig = {
  id: "widget-agent-status",
  title: "Agent Status",
  description: "Live health overview of all registered agents",
  type: "agent-status",
  dataSource: {
    type: "surrealdb-live",
    query: "LIVE SELECT id, name, role, status, model, health_status FROM agent",
  },
  displayFields: ["name", "role", "status", "model"],
  statusColorMap: {
    active: "success",
    idle: "neutral",
    error: "error",
    disabled: "warning",
  },
  showSparkline: true,
  gridSpan: "span 2",
};

// ---------------------------------------------------------------------------
// 2. MetricsChart — uPlot (100K data points at 60 fps)
// ---------------------------------------------------------------------------

export interface UPlotSeriesConfig {
  label: string;
  stroke: string;
  fill?: string;
  width?: number;
  dash?: number[];
}

export interface MetricsChartConfig extends BaseWidget {
  type: "metrics-chart";
  /** uPlot series definitions (one per NATS subject / metric key) */
  series: UPlotSeriesConfig[];
  /** Y-axis label */
  yAxisLabel: string;
  /** X-axis time format (uPlot fmtDate string) */
  timeFormat?: string;
  /** Plot height in pixels */
  height: number;
  /** Enable cursor sync across multiple charts */
  syncKey?: string;
}

export const defaultMetricsChart: MetricsChartConfig = {
  id: "widget-metrics-chart",
  title: "Agent Task Throughput",
  description: "Tasks completed / failed per second (uPlot, 100K points)",
  type: "metrics-chart",
  dataSource: {
    type: "nats-subject",
    query: "agent.metrics.throughput",
    maxPoints: 100_000,
  },
  series: [
    { label: "completed/s", stroke: "#22c55e", width: 1.5 },
    { label: "failed/s",    stroke: "#ef4444", width: 1.5, dash: [4, 4] },
  ],
  yAxisLabel: "tasks/s",
  height: 240,
  syncKey: "main-timeline",
};

// ---------------------------------------------------------------------------
// 3. AgentFlowDiagram — React Flow / Xyflow
// ---------------------------------------------------------------------------

export type FlowNodeType = "agentNode" | "taskNode" | "gatewayNode" | "ioNode";

export interface FlowNodeStyle {
  background: string;
  border: string;
  color: string;
  borderRadius: number;
  padding: string;
}

export interface AgentFlowDiagramConfig extends BaseWidget {
  type: "agent-flow";
  /** Node type → style map */
  nodeStyles: Record<FlowNodeType, FlowNodeStyle>;
  /** Auto-layout algorithm: dagre | elk | manual */
  layoutAlgorithm: "dagre" | "elk" | "manual";
  /** Show minimap */
  minimap: boolean;
  /** Show controls (zoom, fit) */
  controls: boolean;
  /** Animate edges when agents are actively passing messages */
  animateActiveEdges: boolean;
}

export const defaultAgentFlowDiagram: AgentFlowDiagramConfig = {
  id: "widget-agent-flow",
  title: "Agent Topology",
  description: "Live coordination graph rendered with React Flow",
  type: "agent-flow",
  dataSource: {
    type: "surrealdb-live",
    query: "LIVE SELECT in, out, relationship_type FROM coordinates",
  },
  nodeStyles: {
    agentNode:   { background: "#1e293b", border: "1px solid #334155", color: "#f8fafc", borderRadius: 8, padding: "8px 12px" },
    taskNode:    { background: "#0f172a", border: "1px solid #6366f1", color: "#e0e7ff", borderRadius: 4, padding: "6px 10px" },
    gatewayNode: { background: "#1e1b4b", border: "1px solid #818cf8", color: "#c7d2fe", borderRadius: 20, padding: "4px 8px" },
    ioNode:      { background: "#052e16", border: "1px solid #16a34a", color: "#dcfce7", borderRadius: 4, padding: "6px 10px" },
  },
  layoutAlgorithm: "dagre",
  minimap: true,
  controls: true,
  animateActiveEdges: true,
};

// ---------------------------------------------------------------------------
// 4. GraphVisualization — Sigma.js (10K nodes)
// ---------------------------------------------------------------------------

export interface SigmaRenderSettings {
  nodeProgramClasses?: Record<string, string>;
  edgeProgramClasses?: Record<string, string>;
  labelRenderedSizeThreshold: number;
  defaultNodeColor: string;
  defaultEdgeColor: string;
  labelFont: string;
}

export interface GraphVisualizationConfig extends BaseWidget {
  type: "graph-viz";
  /** Force-layout gravity (0–1) */
  gravity: number;
  /** Edge weight attribute name */
  edgeWeightField?: string;
  /** Color nodes by this field */
  colorByField: string;
  /** Node size based on this numeric field */
  sizeByField?: string;
  sigmaSettings: SigmaRenderSettings;
}

export const defaultGraphVisualization: GraphVisualizationConfig = {
  id: "widget-graph-viz",
  title: "Knowledge Graph",
  description: "Multi-hop agent-company-deal network (Sigma.js, 10K nodes)",
  type: "graph-viz",
  dataSource: {
    type: "surrealdb-live",
    query: "SELECT id, name, ->coordinates->agent AS peers FROM agent FETCH peers",
  },
  gravity: 0.1,
  colorByField: "role",
  sizeByField: "health_status.avg_response_time_ms",
  sigmaSettings: {
    labelRenderedSizeThreshold: 8,
    defaultNodeColor: "#6366f1",
    defaultEdgeColor: "#475569",
    labelFont: "Inter, sans-serif",
  },
};

// ---------------------------------------------------------------------------
// 5. PivotTable — FINOS Perspective (1M rows WASM)
// ---------------------------------------------------------------------------

export type PerspectiveAggregateOp =
  | "sum" | "avg" | "count" | "min" | "max" | "median" | "distinct count";

export interface PerspectivePivotConfig {
  rowPivots: string[];
  columnPivots: string[];
  aggregates: Record<string, PerspectiveAggregateOp>;
  filters?: Array<[string, string, unknown]>;
  sort?: Array<[string, "asc" | "desc"]>;
}

export interface PivotTableConfig extends BaseWidget {
  type: "pivot-table";
  /** Perspective view type */
  view: "datagrid" | "d3_y_bar" | "d3_x_bar" | "d3_heatmap" | "d3_treemap";
  pivotConfig: PerspectivePivotConfig;
  /** Theme: "material" | "material-dark" | "monokai" */
  theme: string;
}

export const defaultPivotTable: PivotTableConfig = {
  id: "widget-pivot-table",
  title: "Task Analytics Pivot",
  description: "WASM-accelerated pivot over agent_task records (1M row capacity)",
  type: "pivot-table",
  dataSource: {
    type: "cubejs-query",
    query: {
      measures: ["AgentTask.totalCount", "AgentTask.totalCostUsd", "AgentTask.avgDurationMs"],
      dimensions: ["AgentTask.agentId", "AgentTask.taskType", "AgentTask.status"],
      timeDimensions: [{ dimension: "AgentTask.createdAt", granularity: "day" }],
    },
  },
  view: "datagrid",
  pivotConfig: {
    rowPivots: ["AgentTask.agentId"],
    columnPivots: ["AgentTask.taskType"],
    aggregates: {
      "AgentTask.totalCostUsd": "sum",
      "AgentTask.avgDurationMs": "avg",
      "AgentTask.totalCount": "count",
    },
    sort: [["AgentTask.totalCostUsd", "desc"]],
  },
  theme: "material-dark",
};

// ---------------------------------------------------------------------------
// 6. CostTracker — Tremor + uPlot
// ---------------------------------------------------------------------------

export interface CostBudget {
  daily: number;
  monthly: number;
  alertThresholdPct: number;
}

export interface CostTrackerConfig extends BaseWidget {
  type: "cost-tracker";
  budget: CostBudget;
  currency: string;
  /** Break down cost by this dimension */
  groupBy: "agent" | "model" | "task_type";
  /** Show cumulative spend curve (uPlot) */
  showCumulativeCurve: boolean;
  /** Tremor bar chart for top-N cost agents */
  topN: number;
}

export const defaultCostTracker: CostTrackerConfig = {
  id: "widget-cost-tracker",
  title: "LLM Cost Tracker",
  description: "Real-time token spend with budget alerts (Tremor + uPlot)",
  type: "cost-tracker",
  dataSource: {
    type: "surrealdb-live",
    query:
      "LIVE SELECT agent_id, model, sum(cost_usd) AS total_cost FROM agent_task GROUP BY agent_id, model",
  },
  budget: {
    daily: 10.0,
    monthly: 200.0,
    alertThresholdPct: 80,
  },
  currency: "USD",
  groupBy: "model",
  showCumulativeCurve: true,
  topN: 10,
};

// ---------------------------------------------------------------------------
// Widget registry
// ---------------------------------------------------------------------------

export type AnyWidgetConfig =
  | AgentStatusWidgetConfig
  | MetricsChartConfig
  | AgentFlowDiagramConfig
  | GraphVisualizationConfig
  | PivotTableConfig
  | CostTrackerConfig;

export const WIDGET_DEFAULTS: Record<AnyWidgetConfig["type"], AnyWidgetConfig> = {
  "agent-status":  defaultAgentStatusWidget,
  "metrics-chart": defaultMetricsChart,
  "agent-flow":    defaultAgentFlowDiagram,
  "graph-viz":     defaultGraphVisualization,
  "pivot-table":   defaultPivotTable,
  "cost-tracker":  defaultCostTracker,
};

export function createWidget<T extends AnyWidgetConfig>(
  overrides: Partial<T> & { type: T["type"]; id: string }
): T {
  const defaults = WIDGET_DEFAULTS[overrides.type] as T;
  return { ...defaults, ...overrides } as T;
}
