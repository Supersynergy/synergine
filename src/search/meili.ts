/**
 * Meilisearch client wrapper with type-safe operations
 * Provides full-text search with filters, sorting, and advanced search capabilities
 */

import { MeiliSearch, SearchParams } from "meilisearch";
import {
  MeilisearchConfig,
  SuperStackError,
  ConnectionError,
  TimeoutError,
  SearchOptions,
  SearchResult,
  LifecycleHooks,
} from "../types.js";

interface IndexConfig {
  name: string;
  primaryKey?: string;
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
}

interface FacetDistribution {
  [key: string]: Record<string, number>;
}

export class MeilisearchClient {
  private client: MeiliSearch | null = null;
  private config: Required<MeilisearchConfig>;
  private hooks: LifecycleHooks = {};
  private connected = false;
  private indexes = new Map<string, string>();

  constructor(config: MeilisearchConfig, hooks?: LifecycleHooks) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
    };
    this.hooks = hooks || {};
  }

  /**
   * Connect to Meilisearch
   */
  async connect(): Promise<void> {
    try {
      this.client = new MeiliSearch({
        host: this.config.url,
        apiKey: this.config.masterKey,
        requestConfig: {
          timeout: this.config.timeout,
        },
      });

      // Verify connection
      await Promise.race([
        this.client.health(),
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
        "Failed to connect to Meilisearch"
      );
      throw connectionError;
    }
  }

  /**
   * Disconnect from Meilisearch
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.connected) {
        this.client = null;
        this.connected = false;

        if (this.hooks.onDisconnect) {
          await this.hooks.onDisconnect();
        }
      }
    } catch (error) {
      throw this.handleError(error, "Failed to disconnect from Meilisearch");
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
   * Create or get an index
   */
  async createIndex(config: IndexConfig): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      try {
        const index = this.client.index(config.name);
        await Promise.race([
          index.getRawInfo(),
          this.createTimeout(this.config.timeout),
        ]);
      } catch {
        // Index doesn't exist, create it
        await Promise.race([
          this.client.createIndex(config.name, {
            primaryKey: config.primaryKey || "id",
          }),
          this.createTimeout(this.config.timeout),
        ]);
      }

      // Configure index settings
      const index = this.client.index(config.name);

      if (config.searchableAttributes) {
        await Promise.race([
          index.updateSearchableAttributes(config.searchableAttributes),
          this.createTimeout(this.config.timeout),
        ]);
      }

      if (config.filterableAttributes) {
        await Promise.race([
          index.updateFilterableAttributes(config.filterableAttributes),
          this.createTimeout(this.config.timeout),
        ]);
      }

      if (config.sortableAttributes) {
        await Promise.race([
          index.updateSortableAttributes(config.sortableAttributes),
          this.createTimeout(this.config.timeout),
        ]);
      }

      this.indexes.set(config.name, config.name);
    } catch (error) {
      throw this.handleError(error, `Failed to create index: ${config.name}`);
    }
  }

  /**
   * Add documents to an index
   */
  async addDocuments<T extends { id: string | number }>(
    indexName: string,
    documents: T[],
    options?: { primaryKey?: string }
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      await Promise.race([
        index.addDocuments(documents as Record<string, unknown>[], {
          primaryKey: options?.primaryKey,
        }),
        this.createTimeout(this.config.timeout),
      ]);
    } catch (error) {
      throw this.handleError(error, `Failed to add documents to ${indexName}`);
    }
  }

  /**
   * Update documents in an index
   */
  async updateDocuments<T extends { id: string | number }>(
    indexName: string,
    documents: Partial<T>[]
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      await Promise.race([
        index.updateDocuments(documents as Record<string, unknown>[]),
        this.createTimeout(this.config.timeout),
      ]);
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to update documents in ${indexName}`
      );
    }
  }

  /**
   * Delete documents from an index
   */
  async deleteDocuments(
    indexName: string,
    documentIds: (string | number)[]
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      await Promise.race([
        index.deleteDocuments(documentIds as (string | number)[]),
        this.createTimeout(this.config.timeout),
      ]);
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to delete documents from ${indexName}`
      );
    }
  }

  /**
   * Search an index
   */
  async search<T = unknown>(
    indexName: string,
    options: SearchOptions
  ): Promise<SearchResult<T>> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      const searchParams: SearchParams = {
        q: options.query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        sort: options.sort ? [options.sort] : undefined,
      };

      if (options.filters) {
        const filterArray = Object.entries(options.filters).map(
          ([key, value]) => `${key} = "${value}"`
        );
        searchParams.filter = filterArray;
      }

      const response = await Promise.race([
        index.search<T>(options.query, searchParams),
        this.createTimeout(this.config.timeout),
      ]);

      return {
        hits: response.hits || [],
        totalHits: response.estimatedTotalHits || 0,
        query: options.query,
        processingTimeMs: response.processingTimeMs || 0,
      };
    } catch (error) {
      throw this.handleError(error, `Search in ${indexName} failed`);
    }
  }

  /**
   * Advanced search with facets
   */
  async searchWithFacets<T = unknown>(
    indexName: string,
    options: SearchOptions & { facets?: string[] }
  ): Promise<SearchResult<T> & { facets: FacetDistribution }> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      const searchParams: SearchParams = {
        q: options.query,
        limit: options.limit || 20,
        offset: options.offset || 0,
        sort: options.sort ? [options.sort] : undefined,
        facets: options.facets,
      };

      if (options.filters) {
        const filterArray = Object.entries(options.filters).map(
          ([key, value]) => `${key} = "${value}"`
        );
        searchParams.filter = filterArray;
      }

      const response = await Promise.race([
        index.search<T>(options.query, searchParams),
        this.createTimeout(this.config.timeout),
      ]);

      return {
        hits: response.hits || [],
        totalHits: response.estimatedTotalHits || 0,
        query: options.query,
        processingTimeMs: response.processingTimeMs || 0,
        facets: (response.facetDistribution || {}) as FacetDistribution,
      };
    } catch (error) {
      throw this.handleError(error, `Search with facets in ${indexName} failed`);
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument<T>(indexName: string, documentId: string | number): Promise<T> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      const document = await Promise.race([
        index.getDocument<T>(String(documentId)),
        this.createTimeout(this.config.timeout),
      ]);

      return document as T;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to get document ${documentId} from ${indexName}`
      );
    }
  }

  /**
   * Get all documents from an index
   */
  async getAllDocuments<T>(
    indexName: string,
    options?: { limit?: number; offset?: number }
  ): Promise<T[]> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      const response = await Promise.race([
        index.getDocuments<T>({
          limit: options?.limit,
          offset: options?.offset,
        }),
        this.createTimeout(this.config.timeout),
      ]);

      return response.results || [];
    } catch (error) {
      throw this.handleError(error, `Failed to get documents from ${indexName}`);
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      await Promise.race([
        this.client.deleteIndex(indexName),
        this.createTimeout(this.config.timeout),
      ]);

      this.indexes.delete(indexName);
    } catch (error) {
      throw this.handleError(error, `Failed to delete index: ${indexName}`);
    }
  }

  /**
   * Clear all documents in an index
   */
  async clearIndex(indexName: string): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      await Promise.race([
        index.deleteAllDocuments(),
        this.createTimeout(this.config.timeout),
      ]);
    } catch (error) {
      throw this.handleError(error, `Failed to clear index: ${indexName}`);
    }
  }

  /**
   * Get index info
   */
  async getIndexInfo(indexName: string) {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const index = this.client.index(indexName);

      return await Promise.race([
        index.getRawInfo(),
        this.createTimeout(this.config.timeout),
      ]);
    } catch (error) {
      throw this.handleError(error, `Failed to get index info: ${indexName}`);
    }
  }

  /**
   * List all indexes
   */
  async listIndexes() {
    await this.ensureConnected();

    try {
      if (!this.client) {
        throw new Error("Meilisearch client not initialized");
      }

      const response = await Promise.race([
        this.client.getIndexes(),
        this.createTimeout(this.config.timeout),
      ]);

      return response.results || [];
    } catch (error) {
      throw this.handleError(error, "Failed to list indexes");
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await Promise.race([
        this.client.health(),
        this.createTimeout(this.config.timeout),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get native Meilisearch client
   */
  getNativeClient(): MeiliSearch | null {
    return this.client;
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, context: string): SuperStackError {
    let message = context;
    let code = "SEARCH_ERROR";
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
 * Factory function to create and connect Meilisearch client
 */
export async function createMeilisearchClient(
  config: MeilisearchConfig,
  hooks?: LifecycleHooks
): Promise<MeilisearchClient> {
  const client = new MeilisearchClient(config, hooks);
  await client.connect();
  return client;
}
