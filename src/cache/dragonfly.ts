/**
 * Dragonfly cache client using ioredis
 * Provides high-performance caching with connection pooling and pub/sub
 */

import Redis, { Cluster, Redis as RedisClient } from "ioredis";
import {
  DragonflyCacheConfig,
  SuperStackError,
  ConnectionError,
  TimeoutError,
  CacheOptions,
  CacheStats,
  LifecycleHooks,
} from "../types.js";

export interface DragonflyConnectionPool {
  client: RedisClient | Cluster;
  pubsub: RedisClient | Cluster;
  isCluster: boolean;
}

export class DragonflyCache {
  private pool: DragonflyConnectionPool | null = null;
  private config: Required<DragonflyCacheConfig>;
  private hooks: LifecycleHooks = {};
  private connected = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    memory: 0,
  };
  private subscriptions = new Map<string, Set<(message: string) => void>>();

  constructor(config: DragonflyCacheConfig, hooks?: LifecycleHooks) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 5000,
      maxConnections: config.maxConnections ?? 10,
      db: config.db ?? 0,
    };
    this.hooks = hooks || {};
  }

  /**
   * Connect to Dragonfly
   */
  async connect(): Promise<void> {
    try {
      const redisConfig: Redis.RedisOptions = {
        host: this.parseHost(this.config.url),
        port: this.parsePort(this.config.url),
        password: this.config.password,
        db: this.config.db,
        connectTimeout: this.config.timeout,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
      };

      // Create main client
      const client = new Redis(redisConfig);

      // Create separate pubsub client
      const pubsub = new Redis(redisConfig);

      this.pool = {
        client,
        pubsub,
        isCluster: false,
      };

      // Wait for connection
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          client.on("ready", () => resolve());
          client.on("error", reject);
        }),
        this.createTimeout(this.config.timeout),
      ]);

      this.connected = true;

      if (this.hooks.onConnect) {
        await this.hooks.onConnect();
      }
    } catch (error) {
      this.connected = false;
      const connectionError = this.handleError(
        error,
        "Failed to connect to Dragonfly"
      );
      throw connectionError;
    }
  }

  /**
   * Disconnect from Dragonfly
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.client.quit();
        await this.pool.pubsub.quit();
        this.pool = null;
        this.connected = false;

        if (this.hooks.onDisconnect) {
          await this.hooks.onDisconnect();
        }
      }
    } catch (error) {
      throw this.handleError(error, "Failed to disconnect from Dragonfly");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Ensure client is connected
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = string>(key: string): Promise<T | null> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const value = await Promise.race([
        this.pool.client.get(key),
        this.createTimeout(this.config.timeout),
      ]);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      throw this.handleError(error, `Failed to get key: ${key}`);
    }
  }

  /**
   * Set a value in cache
   */
  async set<T = unknown>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      const args: (string | number)[] = [key, serialized];

      if (options?.ttl) {
        args.push("EX");
        args.push(options.ttl);
      }

      if (options?.nx) {
        args.push("NX");
      }

      if (options?.xx) {
        args.push("XX");
      }

      const result = await Promise.race([
        this.pool.client.set(...args),
        this.createTimeout(this.config.timeout),
      ]);

      return result !== null;
    } catch (error) {
      throw this.handleError(error, `Failed to set key: ${key}`);
    }
  }

  /**
   * Delete a key from cache
   */
  async del(...keys: string[]): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const count = await Promise.race([
        this.pool.client.del(...keys),
        this.createTimeout(this.config.timeout),
      ]);

      return count || 0;
    } catch (error) {
      throw this.handleError(error, `Failed to delete keys: ${keys.join(",")}`);
    }
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const count = await Promise.race([
        this.pool.client.exists(...keys),
        this.createTimeout(this.config.timeout),
      ]);

      return count || 0;
    } catch (error) {
      throw this.handleError(error, `Failed to check existence: ${keys.join(",")}`);
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const result = await Promise.race([
        this.pool.client.expire(key, seconds),
        this.createTimeout(this.config.timeout),
      ]);

      return result === 1;
    } catch (error) {
      throw this.handleError(error, `Failed to set expiration: ${key}`);
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const result = await Promise.race([
        this.pool.client.ttl(key),
        this.createTimeout(this.config.timeout),
      ]);

      return result || -1;
    } catch (error) {
      throw this.handleError(error, `Failed to get TTL: ${key}`);
    }
  }

  /**
   * Increment a value
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const result = await Promise.race([
        this.pool.client.incrby(key, increment),
        this.createTimeout(this.config.timeout),
      ]);

      return result || 0;
    } catch (error) {
      throw this.handleError(error, `Failed to increment: ${key}`);
    }
  }

  /**
   * Publish a message
   */
  async publish(channel: string, message: string | object): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const serialized =
        typeof message === "string" ? message : JSON.stringify(message);

      const subscribers = await Promise.race([
        this.pool.client.publish(channel, serialized),
        this.createTimeout(this.config.timeout),
      ]);

      return subscribers || 0;
    } catch (error) {
      throw this.handleError(error, `Failed to publish: ${channel}`);
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());

        this.pool.pubsub.on("message", (ch, message) => {
          if (ch === channel) {
            const callbacks = this.subscriptions.get(channel);
            if (callbacks) {
              callbacks.forEach((cb) => cb(message));
            }
          }
        });

        await this.pool.pubsub.subscribe(channel);
      }

      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.add(callback);
      }
    } catch (error) {
      throw this.handleError(error, `Failed to subscribe: ${channel}`);
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(
    channel: string,
    callback?: (message: string) => void
  ): Promise<void> {
    try {
      const callbacks = this.subscriptions.get(channel);

      if (callbacks && callback) {
        callbacks.delete(callback);
      }

      if (!callbacks || callbacks.size === 0) {
        await this.pool?.pubsub.unsubscribe(channel);
        this.subscriptions.delete(channel);
      }
    } catch (error) {
      throw this.handleError(error, `Failed to unsubscribe: ${channel}`);
    }
  }

  /**
   * Clear all keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      const keys = await Promise.race([
        this.pool.client.keys(pattern),
        this.createTimeout(this.config.timeout),
      ]);

      if (!keys || keys.length === 0) {
        return 0;
      }

      return this.del(...keys);
    } catch (error) {
      throw this.handleError(error, `Failed to clear pattern: ${pattern}`);
    }
  }

  /**
   * Clear all keys
   */
  async clear(): Promise<boolean> {
    await this.ensureConnected();

    try {
      if (!this.pool) {
        throw new Error("Cache not initialized");
      }

      await Promise.race([
        this.pool.client.flushdb(),
        this.createTimeout(this.config.timeout),
      ]);

      return true;
    } catch (error) {
      throw this.handleError(error, "Failed to clear cache");
    }
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      memory: 0,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      await Promise.race([
        this.pool.client.ping(),
        this.createTimeout(this.config.timeout),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get native Redis client for advanced operations
   */
  getNativeClient(): RedisClient | Cluster | null {
    return this.pool?.client || null;
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, context: string): SuperStackError {
    let message = context;
    let code = "CACHE_ERROR";
    let statusCode = 500;

    if (error instanceof Error) {
      message = `${context}: ${error.message}`;

      if (error.message.includes("timeout")) {
        code = "TIMEOUT";
        statusCode = 408;
        return new TimeoutError(message, { originalError: error.message });
      }

      if (
        error.message.includes("connection") ||
        error.message.includes("ECONNREFUSED")
      ) {
        code = "CONNECTION_ERROR";
        statusCode = 503;
        return new ConnectionError(message, { originalError: error.message });
      }
    }

    if (this.hooks.onError) {
      this.hooks.onError(new Error(message)).catch(() => {
        // Ignore hook errors
      });
    }

    return new SuperStackError(message, code, statusCode, {
      originalError: String(error),
    });
  }

  /**
   * Helper to parse host from URL
   */
  private parseHost(url: string): string {
    try {
      const parsed = new URL(url.startsWith("redis://") ? url : `redis://${url}`);
      return parsed.hostname || "localhost";
    } catch {
      return url.split(":")[0] || "localhost";
    }
  }

  /**
   * Helper to parse port from URL
   */
  private parsePort(url: string): number {
    try {
      const parsed = new URL(url.startsWith("redis://") ? url : `redis://${url}`);
      return parseInt(parsed.port || "6379", 10);
    } catch {
      const parts = url.split(":");
      return parts.length > 1 ? parseInt(parts[1], 10) : 6379;
    }
  }

  /**
   * Helper to create timeout promise
   */
  private createTimeout<T>(ms: number): Promise<T> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(`Operation timed out after ${ms}ms`)),
        ms
      )
    );
  }
}

/**
 * Factory function to create and connect Dragonfly cache
 */
export async function createDragonflyCache(
  config: DragonflyCacheConfig,
  hooks?: LifecycleHooks
): Promise<DragonflyCache> {
  const cache = new DragonflyCache(config, hooks);
  await cache.connect();
  return cache;
}
