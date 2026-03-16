/**
 * SuperStack SDK - Main entry point
 * Exports all clients and types for unified SDK usage
 */

// Client exports
export { SurrealDBClient, createSurrealDBClient } from "./db/surreal.js";
export { DragonflyCache, createDragonflyCache } from "./cache/dragonfly.js";
export { NatsClient, createNatsClient } from "./queue/nats.js";
export { MeilisearchClient, createMeilisearchClient } from "./search/meili.js";

// Convenience aliases (match README examples)
export { SurrealDBClient as SurrealDB } from "./db/surreal.js";
export { DragonflyCache as Dragonfly } from "./cache/dragonfly.js";
export { NatsClient as NATS } from "./queue/nats.js";
export { MeilisearchClient as Meilisearch } from "./search/meili.js";

// Type exports
export type {
  // Enums
  AgentStatus,
  AgentRole,
  TaskStatus,
  TaskPriority,
  CompanyStatus,
  DealStatus,
  ActivityType,
  // Core types
  Agent,
  AgentMemory,
  AgentTask,
  AgentMessage,
  Company,
  Contact,
  Deal,
  Activity,
  // Query types
  QueryResult,
  PaginationOptions,
  PaginatedResult,
  SearchOptions,
  SearchResult,
  // Message types
  NatsMessage,
  NatsPublishOptions,
  // Cache types
  CacheOptions,
  CacheStats,
  // Configuration types
  SurrealDBConfig,
  DragonflyCacheConfig,
  NatsConfig,
  MeilisearchConfig,
  SuperStackSDKOptions,
  // Connection types
  ConnectionStatus,
  // Batch types
  BatchOperation,
  BatchResult,
  // Hook types
  LifecycleHooks,
} from "./types.js";

export {
  // Error exports
  SuperStackError,
  ConnectionError,
  ValidationError,
  NotFoundError,
  TimeoutError,
} from "./types.js";

// SDK class for unified client management
import {
  SurrealDBConfig,
  DragonflyCacheConfig,
  NatsConfig,
  MeilisearchConfig,
  SuperStackSDKOptions,
  ConnectionStatus,
  LifecycleHooks,
  SuperStackError,
} from "./types.js";
import { SurrealDBClient, createSurrealDBClient } from "./db/surreal.js";
import { DragonflyCache, createDragonflyCache } from "./cache/dragonfly.js";
import { NatsClient, createNatsClient } from "./queue/nats.js";
import { MeilisearchClient, createMeilisearchClient } from "./search/meili.js";

/**
 * Unified SuperStack SDK client
 * Manages connections to all services and provides a single interface
 */
export class SuperStackSDK {
  private db: SurrealDBClient | null = null;
  private cache: DragonflyCache | null = null;
  private queue: NatsClient | null = null;
  private search: MeilisearchClient | null = null;
  private options: SuperStackSDKOptions;
  private hooks: LifecycleHooks;

  constructor(options: SuperStackSDKOptions = {}) {
    this.options = options;
    this.hooks = {};
  }

  /**
   * Initialize all connections
   */
  async initialize(): Promise<void> {
    try {
      const config = this.buildConfig();

      if (config.db) {
        this.db = await createSurrealDBClient(config.db, this.hooks);
      }

      if (config.cache) {
        this.cache = await createDragonflyCache(config.cache, this.hooks);
      }

      if (config.queue) {
        this.queue = await createNatsClient(config.queue, this.hooks);
      }

      if (config.search) {
        this.search = await createMeilisearchClient(config.search, this.hooks);
      }
    } catch (error) {
      throw new SuperStackError(
        `Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`,
        "INIT_ERROR",
        500
      );
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.disconnect();
      }
      if (this.cache) {
        await this.cache.disconnect();
      }
      if (this.queue) {
        await this.queue.disconnect();
      }
      if (this.search) {
        await this.search.disconnect();
      }
    } catch (error) {
      throw new SuperStackError(
        `Failed to close SDK: ${error instanceof Error ? error.message : String(error)}`,
        "CLOSE_ERROR",
        500
      );
    }
  }

  /**
   * Get database client
   */
  getDB(): SurrealDBClient {
    if (!this.db) {
      throw new SuperStackError(
        "Database client not initialized",
        "NOT_INITIALIZED",
        500
      );
    }
    return this.db;
  }

  /**
   * Get cache client
   */
  getCache(): DragonflyCache {
    if (!this.cache) {
      throw new SuperStackError(
        "Cache client not initialized",
        "NOT_INITIALIZED",
        500
      );
    }
    return this.cache;
  }

  /**
   * Get queue client
   */
  getQueue(): NatsClient {
    if (!this.queue) {
      throw new SuperStackError(
        "Queue client not initialized",
        "NOT_INITIALIZED",
        500
      );
    }
    return this.queue;
  }

  /**
   * Get search client
   */
  getSearch(): MeilisearchClient {
    if (!this.search) {
      throw new SuperStackError(
        "Search client not initialized",
        "NOT_INITIALIZED",
        500
      );
    }
    return this.search;
  }

  /**
   * Check connection status for all services
   */
  async getStatus(): Promise<ConnectionStatus[]> {
    const statuses: ConnectionStatus[] = [];

    if (this.db) {
      statuses.push({
        service: "SurrealDB",
        connected: this.db.isConnected(),
        lastCheck: new Date(),
      });
    }

    if (this.cache) {
      statuses.push({
        service: "Dragonfly",
        connected: this.cache.isConnected(),
        lastCheck: new Date(),
      });
    }

    if (this.queue) {
      statuses.push({
        service: "NATS",
        connected: this.queue.isConnected(),
        lastCheck: new Date(),
      });
    }

    if (this.search) {
      statuses.push({
        service: "Meilisearch",
        connected: this.search.isConnected(),
        lastCheck: new Date(),
      });
    }

    return statuses;
  }

  /**
   * Perform health checks on all services
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    if (this.db) {
      results.database = await this.db.healthCheck();
    }

    if (this.cache) {
      results.cache = await this.cache.healthCheck();
    }

    if (this.queue) {
      results.queue = await this.queue.healthCheck();
    }

    if (this.search) {
      results.search = await this.search.healthCheck();
    }

    return results;
  }

  /**
   * Build configuration from environment variables and options
   */
  private buildConfig() {
    return {
      db: this.options.surreal || this.getDBConfigFromEnv(),
      cache: this.options.cache || this.getCacheConfigFromEnv(),
      queue: this.options.nats || this.getQueueConfigFromEnv(),
      search: this.options.meili || this.getSearchConfigFromEnv(),
    };
  }

  /**
   * Get DB config from environment
   */
  private getDBConfigFromEnv(): SurrealDBConfig {
    return {
      url: process.env.SURREALDB_URL || "ws://localhost:8000",
      user: process.env.SURREALDB_USER || "root",
      password: process.env.SURREALDB_PASSWORD || "root",
      database: process.env.SURREALDB_DATABASE,
      namespace: process.env.SURREALDB_NAMESPACE,
    };
  }

  /**
   * Get cache config from environment
   */
  private getCacheConfigFromEnv(): DragonflyCacheConfig {
    return {
      url: process.env.DRAGONFLY_URL || "localhost:6379",
      password: process.env.DRAGONFLY_PASSWORD,
      db: process.env.DRAGONFLY_DB ? parseInt(process.env.DRAGONFLY_DB) : 0,
    };
  }

  /**
   * Get queue config from environment
   */
  private getQueueConfigFromEnv(): NatsConfig {
    return {
      url: process.env.NATS_URL || "nats://localhost:4222",
      user: process.env.NATS_USER,
      password: process.env.NATS_PASSWORD,
    };
  }

  /**
   * Get search config from environment
   */
  private getSearchConfigFromEnv(): MeilisearchConfig {
    return {
      url: process.env.MEILI_URL || "http://localhost:7700",
      masterKey: process.env.MEILI_MASTER_KEY || "masterKey",
    };
  }
}

/**
 * Factory function to create SDK with environment configuration
 */
export async function createSuperStackSDK(
  options?: SuperStackSDKOptions
): Promise<SuperStackSDK> {
  const sdk = new SuperStackSDK(options);
  if (options?.autoConnect !== false) {
    await sdk.initialize();
  }
  return sdk;
}
