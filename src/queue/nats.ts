/**
 * NATS client with JetStream support
 * Provides reliable message queuing with consumer groups and type-safe schemas
 */

import {
  connect,
  Connection,
  JetStreamClient,
  JetStreamManager,
  NatsError,
  StringCodec,
  JSONCodec,
} from "nats";
import { z } from "zod";
import {
  NatsConfig,
  SuperStackError,
  ConnectionError,
  TimeoutError,
  NatsMessage,
  NatsPublishOptions,
  LifecycleHooks,
} from "../types.js";

interface JetStreamStreamConfig {
  name: string;
  subjects: string[];
  retention?: "limits" | "interest" | "workqueue";
  maxAge?: number;
}

type MessageHandler<T> = (message: NatsMessage<T>) => Promise<void>;
type ErrorHandler = (error: Error) => Promise<void>;

export class NatsClient {
  private connection: Connection | null = null;
  private jetstream: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;
  private config: Required<NatsConfig>;
  private hooks: LifecycleHooks = {};
  private connected = false;
  private subscriptions = new Map<
    string,
    {
      handler: MessageHandler<unknown>;
      consumerName?: string;
    }
  >();
  private stringCodec = StringCodec();
  private jsonCodec = JSONCodec();

  constructor(config: NatsConfig, hooks?: LifecycleHooks) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 10000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
    };
    this.hooks = hooks || {};
  }

  /**
   * Connect to NATS server
   */
  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: this.config.url,
        user: this.config.user,
        pass: this.config.password,
        timeout: this.config.timeout,
        maxReconnectAttempts: this.config.maxReconnectAttempts,
      });

      this.jetstream = this.connection.jetstream();
      this.jsm = await this.jetstream.jetstreamManager();

      this.connected = true;

      if (this.hooks.onConnect) {
        await this.hooks.onConnect();
      }
    } catch (error) {
      this.connected = false;
      throw this.handleError(error, "Failed to connect to NATS");
    }
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        // Unsubscribe from all subscriptions
        for (const { consumerName } of this.subscriptions.values()) {
          if (consumerName) {
            try {
              await this.jsm?.consumers.delete(consumerName, consumerName);
            } catch {
              // Ignore cleanup errors
            }
          }
        }

        await this.connection.close();
        this.connection = null;
        this.jetstream = null;
        this.jsm = null;
        this.connected = false;

        if (this.hooks.onDisconnect) {
          await this.hooks.onDisconnect();
        }
      }
    } catch (error) {
      throw this.handleError(error, "Failed to disconnect from NATS");
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.connected &&
      this.connection !== null &&
      this.jetstream !== null &&
      this.jsm !== null
    );
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
   * Create or get a stream
   */
  async createStream(config: JetStreamStreamConfig): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.jsm) {
        throw new Error("JetStream manager not initialized");
      }

      try {
        await this.jsm.streams.info(config.name);
      } catch {
        // Stream doesn't exist, create it
        await this.jsm.streams.add({
          name: config.name,
          subjects: config.subjects,
          retention: config.retention || "limits",
          max_age: config.maxAge ? config.maxAge * 1_000_000 : undefined,
        });
      }
    } catch (error) {
      throw this.handleError(error, `Failed to create stream: ${config.name}`);
    }
  }

  /**
   * Publish a message to a subject
   */
  async publish<T>(
    subject: string,
    data: T,
    options?: NatsPublishOptions
  ): Promise<string> {
    await this.ensureConnected();

    try {
      if (!this.jetstream) {
        throw new Error("JetStream not initialized");
      }

      const payload = this.encodeData(data);
      const publishAckFuture = await this.jetstream.publish(subject, payload, {
        timeout: options?.timeout || this.config.timeout,
      });

      const ack = await publishAckFuture;

      return ack.seq.toString();
    } catch (error) {
      throw this.handleError(error, `Failed to publish to ${subject}`);
    }
  }

  /**
   * Subscribe to a subject with optional queue group
   */
  async subscribe<T = unknown>(
    subject: string,
    handler: MessageHandler<T>,
    options?: {
      queue?: string;
      deliverPolicy?: "all" | "new" | "last";
      maxDeliver?: number;
      errorHandler?: ErrorHandler;
    }
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.jetstream) {
        throw new Error("JetStream not initialized");
      }

      const consumerConfig = {
        durable_name: options?.queue || `consumer-${Date.now()}`,
        deliver_policy: this.mapDeliverPolicy(options?.deliverPolicy),
        max_deliver: options?.maxDeliver || 10,
        ack_policy: "explicit" as const,
      };

      const subscription = await this.jetstream.subscribe(subject, {
        config: consumerConfig,
      });

      this.subscriptions.set(subject, {
        handler: handler as MessageHandler<unknown>,
        consumerName: consumerConfig.durable_name,
      });

      // Handle messages
      (async () => {
        for await (const msg of subscription) {
          try {
            const data = this.decodeData<T>(msg.data);
            const natsMessage: NatsMessage<T> = {
              id: msg.info().replySubject || `msg-${Date.now()}`,
              subject,
              data,
              timestamp: new Date(),
            };

            await handler(natsMessage);
            msg.ack();
          } catch (error) {
            msg.nak();
            if (options?.errorHandler) {
              await options.errorHandler(
                error instanceof Error ? error : new Error(String(error))
              );
            }
          }
        }
      })().catch((error) => {
        if (options?.errorHandler) {
          options.errorHandler(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
    } catch (error) {
      throw this.handleError(error, `Failed to subscribe to ${subject}`);
    }
  }

  /**
   * Request-reply pattern
   */
  async request<T, R = unknown>(
    subject: string,
    data: T,
    timeoutMs: number = this.config.timeout
  ): Promise<R> {
    await this.ensureConnected();

    try {
      if (!this.jetstream) {
        throw new Error("JetStream not initialized");
      }

      const payload = this.encodeData(data);

      const msg = await Promise.race([
        this.connection!.request(subject, payload, {
          timeout: timeoutMs,
        }),
        this.createTimeout<R>(timeoutMs),
      ]);

      return this.decodeData<R>(msg.data);
    } catch (error) {
      throw this.handleError(error, `Request to ${subject} failed`);
    }
  }

  /**
   * Reply to a message
   */
  async reply<T>(replySubject: string, data: T): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.connection) {
        throw new Error("Connection not initialized");
      }

      const payload = this.encodeData(data);
      this.connection.publish(replySubject, payload);
    } catch (error) {
      throw this.handleError(error, `Failed to reply to ${replySubject}`);
    }
  }

  /**
   * Create a consumer group with durable consumer
   */
  async createConsumerGroup(
    streamName: string,
    groupName: string,
    options?: {
      subjects?: string[];
      deliverPolicy?: "all" | "new" | "last";
      maxDeliver?: number;
    }
  ): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.jsm) {
        throw new Error("JetStream manager not initialized");
      }

      const consumerConfig = {
        durable_name: groupName,
        deliver_policy: this.mapDeliverPolicy(options?.deliverPolicy),
        max_deliver: options?.maxDeliver || 10,
        ack_policy: "explicit" as const,
        filter_subject: options?.subjects ? options.subjects[0] : undefined,
      };

      await this.jsm.consumers.add(streamName, consumerConfig);
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to create consumer group: ${groupName}`
      );
    }
  }

  /**
   * Publish with validation schema
   */
  async publishValidated<T>(
    subject: string,
    data: T,
    schema: z.ZodSchema,
    options?: NatsPublishOptions
  ): Promise<string> {
    try {
      const validated = schema.parse(data);
      return this.publish(subject, validated, options);
    } catch (error) {
      throw this.handleError(error, `Validation failed for ${subject}`);
    }
  }

  /**
   * Subscribe with validation schema
   */
  async subscribeValidated<T>(
    subject: string,
    handler: MessageHandler<T>,
    schema: z.ZodSchema,
    options?: {
      queue?: string;
      deliverPolicy?: "all" | "new" | "last";
      maxDeliver?: number;
      errorHandler?: ErrorHandler;
    }
  ): Promise<void> {
    const validatingHandler: MessageHandler<T> = async (message) => {
      try {
        const validated = schema.parse(message.data);
        await handler({
          ...message,
          data: validated,
        });
      } catch (error) {
        if (options?.errorHandler) {
          await options.errorHandler(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    };

    await this.subscribe(subject, validatingHandler, options);
  }

  /**
   * Unsubscribe from a subject
   */
  async unsubscribe(subject: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subject);
      if (subscription?.consumerName && this.jsm) {
        await this.jsm.consumers.delete(subscription.consumerName, subscription.consumerName);
      }
      this.subscriptions.delete(subject);
    } catch (error) {
      throw this.handleError(error, `Failed to unsubscribe from ${subject}`);
    }
  }

  /**
   * Get stream info
   */
  async getStreamInfo(streamName: string) {
    await this.ensureConnected();

    try {
      if (!this.jsm) {
        throw new Error("JetStream manager not initialized");
      }

      return await this.jsm.streams.info(streamName);
    } catch (error) {
      throw this.handleError(error, `Failed to get stream info: ${streamName}`);
    }
  }

  /**
   * Purge all messages in a stream
   */
  async purgeStream(streamName: string): Promise<void> {
    await this.ensureConnected();

    try {
      if (!this.jsm) {
        throw new Error("JetStream manager not initialized");
      }

      await this.jsm.streams.purge(streamName);
    } catch (error) {
      throw this.handleError(error, `Failed to purge stream: ${streamName}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connection) {
        return false;
      }

      return !this.connection.isClosed();
    } catch {
      return false;
    }
  }

  /**
   * Get native NATS connection
   */
  getNativeConnection(): Connection | null {
    return this.connection;
  }

  /**
   * Get native JetStream client
   */
  getNativeJetStream(): JetStreamClient | null {
    return this.jetstream;
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, context: string): SuperStackError {
    let message = context;
    let code = "NATS_ERROR";
    let statusCode = 500;

    if (error instanceof NatsError) {
      message = `${context}: ${error.message}`;

      if (error.code === "TIMEOUT" || error.message.includes("timeout")) {
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
    } else if (error instanceof Error) {
      message = `${context}: ${error.message}`;
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
   * Encode data to bytes
   */
  private encodeData(data: unknown): Uint8Array {
    if (typeof data === "string") {
      return this.stringCodec.encode(data);
    }
    if (data instanceof Uint8Array) {
      return data;
    }
    return this.jsonCodec.encode(data);
  }

  /**
   * Decode data from bytes
   */
  private decodeData<T>(data: Uint8Array): T {
    try {
      return this.jsonCodec.decode(data) as T;
    } catch {
      return this.stringCodec.decode(data) as T;
    }
  }

  /**
   * Map deliver policy
   */
  private mapDeliverPolicy(
    policy?: "all" | "new" | "last"
  ): "all" | "new" | "last" {
    switch (policy) {
      case "all":
        return "all";
      case "new":
        return "new";
      case "last":
        return "last";
      default:
        return "new";
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
 * Factory function to create and connect NATS client
 */
export async function createNatsClient(
  config: NatsConfig,
  hooks?: LifecycleHooks
): Promise<NatsClient> {
  const client = new NatsClient(config, hooks);
  await client.connect();
  return client;
}
