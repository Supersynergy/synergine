/**
 * SuperStack Real-Time Data Pipeline
 *
 * Manages three live data sources and fans out to WebSocket clients:
 *  1. SurrealDB LIVE SELECT — schema-level change notifications
 *  2. NATS JetStream         — agent events with subject filtering
 *  3. Dragonfly pub/sub      — high-frequency metric streams
 *
 * A built-in deduplication layer prevents duplicate events from
 * flooding frontend clients during reconnection storms.
 */

import { EventEmitter } from "events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventSource = "surrealdb" | "nats" | "dragonfly";

export interface PipelineEvent {
  id: string;           // sha1-like dedup key
  source: EventSource;
  subject: string;      // SurrealQL table | NATS subject | Redis channel
  action: "CREATE" | "UPDATE" | "DELETE" | "METRIC" | "CUSTOM";
  payload: unknown;
  timestamp: number;    // Unix epoch ms
}

export interface WebSocketClient {
  id: string;
  send: (data: string) => void;
  /** Optional subject filter — if set, only matching events are forwarded */
  subjectFilter?: string | RegExp;
}

export interface RealtimePipelineConfig {
  surrealdbUrl?: string;
  surrealdbUser?: string;
  surrealdbPassword?: string;
  surrealdbNamespace?: string;
  surrealdbDatabase?: string;
  natsUrl?: string;
  /** NATS subject patterns to subscribe to (wildcards supported) */
  natsSubjects?: string[];
  dragonflyUrl?: string;
  dragonflyPassword?: string;
  /** Redis pub/sub channels to subscribe to */
  dragonflyChannels?: string[];
  /** Dedup window in ms — events with same id within window are dropped */
  dedupWindowMs?: number;
  /** Max WebSocket clients before rejecting new connections */
  maxClients?: number;
}

// ---------------------------------------------------------------------------
// RealtimePipeline
// ---------------------------------------------------------------------------

export class RealtimePipeline extends EventEmitter {
  private config: Required<RealtimePipelineConfig>;
  private clients = new Map<string, WebSocketClient>();
  private dedupCache = new Map<string, number>(); // id → timestamp
  private dedupCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private liveQueryIds: string[] = [];
  private natsSubscriptions: unknown[] = [];
  private db: unknown = null;
  private nats: unknown = null;
  private dragonfly: unknown = null;
  private dragonflySubscriber: unknown = null;

  constructor(config: RealtimePipelineConfig = {}) {
    super();
    this.config = {
      surrealdbUrl: config.surrealdbUrl ?? process.env.SURREALDB_URL ?? "ws://localhost:8000",
      surrealdbUser: config.surrealdbUser ?? process.env.SURREALDB_USER ?? "root",
      surrealdbPassword: config.surrealdbPassword ?? process.env.SURREALDB_PASSWORD ?? "",
      surrealdbNamespace: config.surrealdbNamespace ?? process.env.SURREALDB_NAMESPACE ?? "superstack",
      surrealdbDatabase: config.surrealdbDatabase ?? process.env.SURREALDB_DATABASE ?? "agents",
      natsUrl: config.natsUrl ?? process.env.NATS_URL ?? "nats://localhost:4222",
      natsSubjects: config.natsSubjects ?? ["agent.>", "task.>", "metric.>"],
      dragonflyUrl: config.dragonflyUrl ?? process.env.DRAGONFLY_URL ?? "localhost:6379",
      dragonflyPassword: config.dragonflyPassword ?? process.env.DRAGONFLY_PASSWORD ?? "",
      dragonflyChannels: config.dragonflyChannels ?? ["dashboard:events"],
      dedupWindowMs: config.dedupWindowMs ?? 2_000,
      maxClients: config.maxClients ?? 100,
    };
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    this.startDedupCleanup();
    await Promise.all([
      this.startSurrealDBListeners(),
      this.startNATSListeners(),
      this.startDragonflyConsumer(),
    ]);
    this.emit("started");
  }

  async stop(): Promise<void> {
    if (this.dedupCleanupInterval) clearInterval(this.dedupCleanupInterval);

    // Kill SurrealDB live queries
    if (this.db) {
      const db = this.db as { kill: (id: string) => Promise<void>; close: () => Promise<void> };
      for (const id of this.liveQueryIds) {
        await db.kill(id).catch(() => {});
      }
      await db.close().catch(() => {});
    }

    // Drain NATS subscriptions
    for (const sub of this.natsSubscriptions) {
      (sub as { unsubscribe: () => void }).unsubscribe();
    }
    if (this.nats) {
      await (this.nats as { drain: () => Promise<void> }).drain().catch(() => {});
    }

    // Disconnect Dragonfly
    if (this.dragonflySubscriber) {
      await (this.dragonflySubscriber as { quit: () => Promise<void> }).quit().catch(() => {});
    }
    if (this.dragonfly) {
      await (this.dragonfly as { quit: () => Promise<void> }).quit().catch(() => {});
    }

    this.clients.clear();
    this.emit("stopped");
  }

  // -------------------------------------------------------------------------
  // SurrealDB LIVE SELECT subscription manager
  // -------------------------------------------------------------------------

  private async startSurrealDBListeners(): Promise<void> {
    try {
      const { Surreal } = await import("surrealdb");
      const db = new Surreal();
      await db.connect(this.config.surrealdbUrl);
      await db.signin({ username: this.config.surrealdbUser, password: this.config.surrealdbPassword });
      await db.use({ namespace: this.config.surrealdbNamespace, database: this.config.surrealdbDatabase });
      this.db = db;

      const tables = ["agent", "agent_task", "agent_message", "company", "deal", "activity"];
      for (const table of tables) {
        const queryId = await db.live(table, (action: string, result: unknown) => {
          const event = this.buildEvent("surrealdb", table, action as PipelineEvent["action"], result);
          this.dispatchEvent(event);
        });
        this.liveQueryIds.push(queryId as string);
      }
    } catch (err) {
      console.warn("[RealtimePipeline] SurrealDB listener failed:", err);
    }
  }

  // -------------------------------------------------------------------------
  // NATS event listener with subject filtering
  // -------------------------------------------------------------------------

  private async startNATSListeners(): Promise<void> {
    try {
      const { connect, StringCodec } = await import("nats");
      const nc = await connect({ servers: this.config.natsUrl });
      this.nats = nc;
      const sc = StringCodec();

      for (const subject of this.config.natsSubjects) {
        const sub = nc.subscribe(subject);
        this.natsSubscriptions.push(sub);

        (async () => {
          for await (const msg of sub) {
            try {
              const payload = JSON.parse(sc.decode(msg.data)) as unknown;
              const event = this.buildEvent("nats", msg.subject, "CUSTOM", payload);
              this.dispatchEvent(event);
            } catch {
              // Ignore non-JSON messages
            }
          }
        })().catch(() => {});
      }
    } catch (err) {
      console.warn("[RealtimePipeline] NATS listener failed:", err);
    }
  }

  // -------------------------------------------------------------------------
  // Dragonfly pub/sub consumer
  // -------------------------------------------------------------------------

  private async startDragonflyConsumer(): Promise<void> {
    try {
      const { default: Redis } = await import("ioredis");
      const [host, portStr] = this.config.dragonflyUrl.split(":");
      const opts = {
        host: host ?? "localhost",
        port: portStr ? parseInt(portStr, 10) : 6379,
        password: this.config.dragonflyPassword || undefined,
        lazyConnect: true,
      };

      // Separate client for subscribe (ioredis requirement)
      const subscriber = new Redis(opts);
      await subscriber.connect();
      this.dragonflySubscriber = subscriber;

      await subscriber.subscribe(...this.config.dragonflyChannels);

      subscriber.on("message", (channel: string, message: string) => {
        try {
          const payload = JSON.parse(message) as unknown;
          const event = this.buildEvent("dragonfly", channel, "METRIC", payload);
          this.dispatchEvent(event);
        } catch {
          // Ignore non-JSON messages
        }
      });
    } catch (err) {
      console.warn("[RealtimePipeline] Dragonfly consumer failed:", err);
    }
  }

  // -------------------------------------------------------------------------
  // WebSocket client management
  // -------------------------------------------------------------------------

  registerClient(client: WebSocketClient): void {
    if (this.clients.size >= this.config.maxClients) {
      throw new Error(`Max WebSocket clients (${this.config.maxClients}) reached`);
    }
    this.clients.set(client.id, client);
  }

  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  // -------------------------------------------------------------------------
  // Event deduplication and dispatch
  // -------------------------------------------------------------------------

  private buildEvent(
    source: EventSource,
    subject: string,
    action: PipelineEvent["action"],
    payload: unknown
  ): PipelineEvent {
    const timestamp = Date.now();
    // Dedup key: source + subject + action + payload fingerprint (first 64 chars)
    const payloadStr = JSON.stringify(payload)?.slice(0, 64) ?? "";
    const id = `${source}:${subject}:${action}:${payloadStr}:${Math.floor(timestamp / this.config.dedupWindowMs)}`;
    return { id, source, subject, action, payload, timestamp };
  }

  private dispatchEvent(event: PipelineEvent): void {
    // Deduplication check
    if (this.dedupCache.has(event.id)) return;
    this.dedupCache.set(event.id, event.timestamp);

    // Emit internally for DashboardManager
    this.emit("event", event);

    // Fan out to WebSocket clients
    const serialized = JSON.stringify(event);
    for (const client of this.clients.values()) {
      if (this.clientMatchesFilter(client, event)) {
        try {
          client.send(serialized);
        } catch {
          // Remove dead clients
          this.clients.delete(client.id);
        }
      }
    }
  }

  private clientMatchesFilter(client: WebSocketClient, event: PipelineEvent): boolean {
    if (!client.subjectFilter) return true;
    if (typeof client.subjectFilter === "string") {
      return event.subject.startsWith(client.subjectFilter);
    }
    return client.subjectFilter.test(event.subject);
  }

  // -------------------------------------------------------------------------
  // Dedup cache cleanup
  // -------------------------------------------------------------------------

  private startDedupCleanup(): void {
    this.dedupCleanupInterval = setInterval(() => {
      const cutoff = Date.now() - this.config.dedupWindowMs * 2;
      for (const [id, ts] of this.dedupCache.entries()) {
        if (ts < cutoff) this.dedupCache.delete(id);
      }
    }, this.config.dedupWindowMs);
  }

  // -------------------------------------------------------------------------
  // Diagnostics
  // -------------------------------------------------------------------------

  getStats(): {
    clients: number;
    dedupCacheSize: number;
    liveQueries: number;
    natsSubscriptions: number;
  } {
    return {
      clients: this.clients.size,
      dedupCacheSize: this.dedupCache.size,
      liveQueries: this.liveQueryIds.length,
      natsSubscriptions: this.natsSubscriptions.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createRealtimePipeline(
  config?: RealtimePipelineConfig
): Promise<RealtimePipeline> {
  const pipeline = new RealtimePipeline(config);
  await pipeline.start();
  return pipeline;
}
