/**
 * SurrealDB client wrapper with type-safe operations
 * Handles connection, queries, CRUD operations, and auto-reconnect logic
 */

import { Surreal } from "surrealdb";
import {
  SurrealDBConfig,
  SuperStackError,
  ConnectionError,
  ValidationError,
  NotFoundError,
  TimeoutError,
  QueryResult,
  LifecycleHooks,
} from "../types.js";

interface ReconnectOptions {
  maxRetries: number;
  retryDelayMs: number;
}

export class SurrealDBClient {
  private client: Surreal | null = null;
  private config: Required<SurrealDBConfig>;
  private connected = false;
  private hooks: LifecycleHooks = {};
  private reconnectOptions: ReconnectOptions;
  private retryCount = 0;

  constructor(
    config: SurrealDBConfig,
    hooks?: LifecycleHooks,
    reconnectOptions?: Partial<ReconnectOptions>
  ) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 5,
    };
    this.hooks = hooks || {};
    this.reconnectOptions = {
      maxRetries: reconnectOptions?.maxRetries ?? 5,
      retryDelayMs: reconnectOptions?.retryDelayMs ?? 1000,
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.url) {
      throw new ValidationError("SurrealDB URL is required", {
        field: "url",
      });
    }
    if (!this.config.user) {
      throw new ValidationError("SurrealDB user is required", {
        field: "user",
      });
    }
    if (!this.config.password) {
      throw new ValidationError("SurrealDB password is required", {
        field: "password",
      });
    }
  }

  /**
   * Connect to SurrealDB with auto-reconnect logic
   */
  async connect(): Promise<void> {
    try {
      this.client = new Surreal();

      await this.client.connect(this.config.url, {
        auth: {
          username: this.config.user,
          password: this.config.password,
        },
      });

      if (this.config.namespace) {
        await this.client.use({
          namespace: this.config.namespace,
          database: this.config.database || "default",
        });
      } else if (this.config.database) {
        await this.client.use({ database: this.config.database });
      }

      this.connected = true;
      this.retryCount = 0;

      if (this.hooks.onConnect) {
        await this.hooks.onConnect();
      }
    } catch (error) {
      this.connected = false;
      const connectionError = this.handleError(
        error,
        "Failed to connect to SurrealDB"
      );

      if (this.retryCount < this.reconnectOptions.maxRetries) {
        this.retryCount++;
        if (this.hooks.onRetry) {
          await this.hooks.onRetry(this.retryCount, connectionError);
        }
        await this.delay(
          this.reconnectOptions.retryDelayMs * this.retryCount
        );
        return this.connect();
      }

      throw connectionError;
    }
  }

  /**
   * Disconnect from SurrealDB
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.connected) {
        await this.client.close();
        this.connected = false;

        if (this.hooks.onDisconnect) {
          await this.hooks.onDisconnect();
        }
      }
    } catch (error) {
      throw this.handleError(error, "Failed to disconnect from SurrealDB");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.client !== null;
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
   * Execute a raw SurrealQL query with generics support
   */
  async query<T = unknown>(
    sql: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult<T>> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const result = await Promise.race([
        this.client.query<T[]>(sql, params),
        this.createTimeout(this.config.timeout),
      ]);

      return {
        data: result || [],
        count: (result || []).length,
        status: "ok",
      };
    } catch (error) {
      return {
        data: [],
        count: 0,
        status: "error",
        error: String(error),
      };
    }
  }

  /**
   * Create a new record
   */
  async create<T extends { id?: string }>(
    table: string,
    data: Partial<T>
  ): Promise<T & { id: string }> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const record = await Promise.race([
        this.client.create<T>(table, data),
        this.createTimeout(this.config.timeout),
      ]);

      if (!record || !record.id) {
        throw new Error("Failed to create record: no ID returned");
      }

      return record as T & { id: string };
    } catch (error) {
      throw this.handleError(error, `Failed to create record in ${table}`);
    }
  }

  /**
   * Read a record by ID
   */
  async read<T>(id: string): Promise<T> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const record = await Promise.race([
        this.client.select<T>(id),
        this.createTimeout(this.config.timeout),
      ]);

      if (!record) {
        throw new NotFoundError(`Record not found: ${id}`, { id });
      }

      return record as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw this.handleError(error, `Failed to read record: ${id}`);
    }
  }

  /**
   * Update a record
   */
  async update<T extends { id: string }>(
    id: string,
    data: Partial<T>
  ): Promise<T> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const record = await Promise.race([
        this.client.update<T>(id, data),
        this.createTimeout(this.config.timeout),
      ]);

      if (!record) {
        throw new NotFoundError(`Record not found for update: ${id}`, { id });
      }

      return record as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw this.handleError(error, `Failed to update record: ${id}`);
    }
  }

  /**
   * Merge-update a record (shallow merge)
   */
  async merge<T extends { id: string }>(
    id: string,
    data: Partial<T>
  ): Promise<T> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const record = await Promise.race([
        this.client.merge<T>(id, data),
        this.createTimeout(this.config.timeout),
      ]);

      if (!record) {
        throw new NotFoundError(`Record not found for merge: ${id}`, { id });
      }

      return record as T;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw this.handleError(error, `Failed to merge record: ${id}`);
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      await Promise.race([
        this.client.delete(id),
        this.createTimeout(this.config.timeout),
      ]);

      return true;
    } catch (error) {
      throw this.handleError(error, `Failed to delete record: ${id}`);
    }
  }

  /**
   * Select multiple records with WHERE clause
   */
  async select<T>(table: string, where?: string): Promise<T[]> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      let sql = `SELECT * FROM ${table}`;
      if (where) {
        sql += ` WHERE ${where}`;
      }

      const records = await Promise.race([
        this.client.query<T[]>(sql),
        this.createTimeout(this.config.timeout),
      ]);

      return records || [];
    } catch (error) {
      throw this.handleError(error, `Failed to select from ${table}`);
    }
  }

  /**
   * Insert a new record (alias for create)
   */
  async insert<T extends { id?: string }>(
    table: string,
    data: Partial<T>
  ): Promise<T & { id: string }> {
    return this.create(table, data);
  }

  /**
   * Count records in a table
   */
  async count(table: string, where?: string): Promise<number> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      let sql = `SELECT COUNT() as count FROM ${table}`;
      if (where) {
        sql += ` WHERE ${where}`;
      }

      const result = await Promise.race([
        this.client.query<Array<{ count: number }>>(sql),
        this.createTimeout(this.config.timeout),
      ]);

      return result?.[0]?.count || 0;
    } catch (error) {
      throw this.handleError(error, `Failed to count records in ${table}`);
    }
  }

  /**
   * Batch create records
   */
  async createBatch<T extends { id?: string }>(
    table: string,
    records: Partial<T>[]
  ): Promise<Array<T & { id: string }>> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Client not initialized");
      }

      const results: Array<T & { id: string }> = [];
      for (const record of records) {
        const created = await this.create(table, record);
        results.push(created);
      }

      return results;
    } catch (error) {
      throw this.handleError(error, `Failed to batch create in ${table}`);
    }
  }

  /**
   * Transaction support
   */
  async transaction<T>(
    callback: (client: Surreal) => Promise<T>
  ): Promise<T> {
    await this.ensureConnected();

    if (!this.client) {
      throw new Error("Client not initialized");
    }

    try {
      await this.client.query("BEGIN TRANSACTION");
      const result = await callback(this.client);
      await this.client.query("COMMIT TRANSACTION");
      return result;
    } catch (error) {
      try {
        await this.client.query("CANCEL TRANSACTION");
      } catch {
        // Ignore rollback errors
      }
      throw this.handleError(error, "Transaction failed");
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, context: string): SuperStackError {
    let message = context;
    let code = "DB_ERROR";
    let statusCode = 500;

    if (error instanceof Error) {
      message = `${context}: ${error.message}`;

      if (error.message.includes("timeout")) {
        code = "TIMEOUT";
        statusCode = 408;
        return new TimeoutError(message, { originalError: error.message });
      }

      if (error.message.includes("not found")) {
        code = "NOT_FOUND";
        statusCode = 404;
        return new NotFoundError(message, { originalError: error.message });
      }

      if (error.message.includes("validation")) {
        code = "VALIDATION_ERROR";
        statusCode = 400;
        return new ValidationError(message, { originalError: error.message });
      }

      if (
        error.message.includes("connection") ||
        error.message.includes("connected")
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

  /**
   * Helper for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get native Surreal client for advanced operations
   */
  getNativeClient(): Surreal | null {
    return this.client;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query("SELECT 1");
      return result.status === "ok";
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create and connect SurrealDB client
 */
export async function createSurrealDBClient(
  config: SurrealDBConfig,
  hooks?: LifecycleHooks
): Promise<SurrealDBClient> {
  const client = new SurrealDBClient(config, hooks);
  await client.connect();
  return client;
}
