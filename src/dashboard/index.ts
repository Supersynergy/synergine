/**
 * SuperStack Dashboard Manager
 *
 * Aggregates real-time data from SurrealDB LIVE SELECT, NATS agent events,
 * and Dragonfly cached metrics into a unified Zustand-compatible state.
 * Provides typed hooks for React components.
 */

import type { Agent, AgentTask, AgentMessage } from "../types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "error" | "disabled";
  model: string;
  health_status: {
    last_heartbeat: string;
    error_count: number;
    avg_response_time_ms: number;
  };
  updated_at: string;
}

export interface MetricPoint {
  timestamp: number; // Unix epoch ms
  value: number;
  label: string;
}

export interface MetricSeries {
  name: string;
  unit: string;
  points: MetricPoint[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "agent" | "task" | "company" | "deal";
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; status?: string; model?: string };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface DashboardState {
  agents: AgentState[];
  metrics: Record<string, MetricSeries>;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
  lastUpdated: number;
  connectionStatus: "connected" | "connecting" | "disconnected";
}

export interface DashboardManagerConfig {
  surrealdbUrl?: string;
  surrealdbUser?: string;
  surrealdbPassword?: string;
  surrealdbNamespace?: string;
  surrealdbDatabase?: string;
  natsUrl?: string;
  dragonflyUrl?: string;
  dragonflyPassword?: string;
}

// ---------------------------------------------------------------------------
// State store (Zustand-compatible plain object with subscribers)
// ---------------------------------------------------------------------------

type Subscriber = (state: DashboardState) => void;

function createStore(initial: DashboardState) {
  let state = { ...initial };
  const subscribers = new Set<Subscriber>();

  return {
    getState: () => state,
    setState: (patch: Partial<DashboardState>) => {
      state = { ...state, ...patch, lastUpdated: Date.now() };
      subscribers.forEach((fn) => fn(state));
    },
    subscribe: (fn: Subscriber) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

// ---------------------------------------------------------------------------
// DashboardManager
// ---------------------------------------------------------------------------

export class DashboardManager {
  private config: Required<DashboardManagerConfig>;
  private store: ReturnType<typeof createStore>;
  private liveQueryId: string | null = null;
  private natsSubscription: unknown = null;
  private dragonflyPollInterval: ReturnType<typeof setInterval> | null = null;
  private db: unknown = null;
  private nats: unknown = null;
  private dragonfly: unknown = null;

  constructor(config: DashboardManagerConfig = {}) {
    this.config = {
      surrealdbUrl: config.surrealdbUrl ?? process.env.SURREALDB_URL ?? "ws://localhost:8000",
      surrealdbUser: config.surrealdbUser ?? process.env.SURREALDB_USER ?? "root",
      surrealdbPassword: config.surrealdbPassword ?? process.env.SURREALDB_PASSWORD ?? "",
      surrealdbNamespace: config.surrealdbNamespace ?? process.env.SURREALDB_NAMESPACE ?? "superstack",
      surrealdbDatabase: config.surrealdbDatabase ?? process.env.SURREALDB_DATABASE ?? "agents",
      natsUrl: config.natsUrl ?? process.env.NATS_URL ?? "nats://localhost:4222",
      dragonflyUrl: config.dragonflyUrl ?? process.env.DRAGONFLY_URL ?? "localhost:6379",
      dragonflyPassword: config.dragonflyPassword ?? process.env.DRAGONFLY_PASSWORD ?? "",
    };

    this.store = createStore({
      agents: [],
      metrics: {},
      graphNodes: [],
      graphEdges: [],
      flowNodes: [],
      flowEdges: [],
      lastUpdated: 0,
      connectionStatus: "disconnected",
    });
  }

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------

  async connect(): Promise<void> {
    this.store.setState({ connectionStatus: "connecting" });
    await Promise.all([
      this.connectSurrealDB(),
      this.connectNATS(),
      this.connectDragonfly(),
    ]);
    this.store.setState({ connectionStatus: "connected" });
  }

  async disconnect(): Promise<void> {
    if (this.liveQueryId && this.db) {
      const db = this.db as { kill: (id: string) => Promise<void>; close: () => Promise<void> };
      await db.kill(this.liveQueryId).catch(() => {});
      await db.close().catch(() => {});
    }
    if (this.natsSubscription) {
      const sub = this.natsSubscription as { unsubscribe: () => void };
      sub.unsubscribe();
    }
    if (this.nats) {
      const nc = this.nats as { close: () => Promise<void> };
      await nc.close().catch(() => {});
    }
    if (this.dragonflyPollInterval) {
      clearInterval(this.dragonflyPollInterval);
    }
    if (this.dragonfly) {
      const redis = this.dragonfly as { quit: () => Promise<void> };
      await redis.quit().catch(() => {});
    }
    this.store.setState({ connectionStatus: "disconnected" });
  }

  // -------------------------------------------------------------------------
  // SurrealDB LIVE SELECT
  // -------------------------------------------------------------------------

  private async connectSurrealDB(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues when running without the full stack
      const { Surreal } = await import("surrealdb");
      const db = new Surreal();
      await db.connect(this.config.surrealdbUrl);
      await db.signin({ username: this.config.surrealdbUser, password: this.config.surrealdbPassword });
      await db.use({ namespace: this.config.surrealdbNamespace, database: this.config.surrealdbDatabase });
      this.db = db;

      // Seed initial agent list
      const agents = await db.select<AgentState>("agent");
      this.store.setState({ agents: agents ?? [] });
      this.syncFlowFromAgents(agents ?? []);

      // Subscribe to live updates
      this.liveQueryId = await db.live("agent", (action: string, result: AgentState) => {
        this.handleAgentLiveEvent(action, result);
      });
    } catch (err) {
      console.warn("[DashboardManager] SurrealDB connection failed:", err);
    }
  }

  private handleAgentLiveEvent(action: string, result: AgentState): void {
    const current = this.store.getState().agents;
    if (action === "CREATE") {
      this.store.setState({ agents: [...current, result] });
    } else if (action === "UPDATE") {
      this.store.setState({ agents: current.map((a) => (a.id === result.id ? result : a)) });
    } else if (action === "DELETE") {
      this.store.setState({ agents: current.filter((a) => a.id !== (result as { id: string }).id) });
    }
    this.syncFlowFromAgents(this.store.getState().agents);
  }

  // -------------------------------------------------------------------------
  // NATS event listener
  // -------------------------------------------------------------------------

  private async connectNATS(): Promise<void> {
    try {
      const { connect, StringCodec } = await import("nats");
      const nc = await connect({ servers: this.config.natsUrl });
      this.nats = nc;
      const sc = StringCodec();

      // Subscribe to all agent events
      const sub = nc.subscribe("agent.>");
      this.natsSubscription = sub;

      (async () => {
        for await (const msg of sub) {
          try {
            const payload = JSON.parse(sc.decode(msg.data)) as {
              event: string;
              agent_id: string;
              metric?: string;
              value?: number;
              timestamp?: number;
            };
            this.handleNatsEvent(msg.subject, payload);
          } catch {
            // Ignore malformed messages
          }
        }
      })().catch(() => {});
    } catch (err) {
      console.warn("[DashboardManager] NATS connection failed:", err);
    }
  }

  private handleNatsEvent(subject: string, payload: Record<string, unknown>): void {
    // agent.metrics.* — ingest time-series data points
    if (subject.startsWith("agent.metrics.")) {
      const seriesName = subject.replace("agent.metrics.", "");
      const current = this.store.getState().metrics;
      const series = current[seriesName] ?? { name: seriesName, unit: "", points: [] };
      const newPoint: MetricPoint = {
        timestamp: (payload.timestamp as number) ?? Date.now(),
        value: (payload.value as number) ?? 0,
        label: (payload.agent_id as string) ?? seriesName,
      };
      // Keep last 1000 points per series
      const points = [...series.points.slice(-999), newPoint];
      this.store.setState({ metrics: { ...current, [seriesName]: { ...series, points } } });
    }
  }

  // -------------------------------------------------------------------------
  // Dragonfly cached metrics poller
  // -------------------------------------------------------------------------

  private async connectDragonfly(): Promise<void> {
    try {
      const { default: Redis } = await import("ioredis");
      const [host, portStr] = this.config.dragonflyUrl.split(":");
      const redis = new Redis({
        host: host ?? "localhost",
        port: portStr ? parseInt(portStr, 10) : 6379,
        password: this.config.dragonflyPassword || undefined,
        lazyConnect: true,
      });
      await redis.connect();
      this.dragonfly = redis;

      // Poll cached metric keys every 5 seconds
      this.dragonflyPollInterval = setInterval(async () => {
        try {
          await this.pollDragonflyMetrics(redis);
        } catch {
          // Silently ignore transient errors
        }
      }, 5000);

      // Initial poll
      await this.pollDragonflyMetrics(redis);
    } catch (err) {
      console.warn("[DashboardManager] Dragonfly connection failed:", err);
    }
  }

  private async pollDragonflyMetrics(redis: { keys: (p: string) => Promise<string[]>; get: (k: string) => Promise<string | null> }): Promise<void> {
    const keys = await redis.keys("dashboard:metric:*");
    if (keys.length === 0) return;
    const current = this.store.getState().metrics;
    const updates: Record<string, MetricSeries> = { ...current };
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as MetricSeries;
        updates[data.name] = data;
      } catch {
        // Skip malformed cache entries
      }
    }
    this.store.setState({ metrics: updates });
  }

  // -------------------------------------------------------------------------
  // React Flow topology sync
  // -------------------------------------------------------------------------

  private syncFlowFromAgents(agents: AgentState[]): void {
    const cols = 3;
    const flowNodes: FlowNode[] = agents.map((agent, idx) => ({
      id: agent.id,
      type: "agentNode",
      position: { x: (idx % cols) * 220, y: Math.floor(idx / cols) * 120 },
      data: { label: agent.name, status: agent.status, model: agent.model },
    }));
    this.store.setState({ flowNodes });
  }

  // -------------------------------------------------------------------------
  // Public API — Zustand-style hooks (use with React useSyncExternalStore)
  // -------------------------------------------------------------------------

  getStore() {
    return this.store;
  }

  useAgents(): AgentState[] {
    return this.store.getState().agents;
  }

  useMetrics(): Record<string, MetricSeries> {
    return this.store.getState().metrics;
  }

  useGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const state = this.store.getState();
    return { nodes: state.graphNodes, edges: state.graphEdges };
  }

  useFlows(): { nodes: FlowNode[]; edges: FlowEdge[] } {
    const state = this.store.getState();
    return { nodes: state.flowNodes, edges: state.flowEdges };
  }

  getConnectionStatus(): DashboardState["connectionStatus"] {
    return this.store.getState().connectionStatus;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createDashboardManager(
  config?: DashboardManagerConfig
): Promise<DashboardManager> {
  const manager = new DashboardManager(config);
  await manager.connect();
  return manager;
}

export type { Agent, AgentTask, AgentMessage };
