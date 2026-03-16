/**
 * Core TypeScript types for SuperStack framework
 * Matches SurrealDB schema and service models
 */

// Enums for status, roles, and states
export enum AgentStatus {
  IDLE = "idle",
  ACTIVE = "active",
  BUSY = "busy",
  PAUSED = "paused",
  ERROR = "error",
  OFFLINE = "offline",
}

export enum AgentRole {
  COORDINATOR = "coordinator",
  EXECUTOR = "executor",
  OBSERVER = "observer",
  ANALYZER = "analyzer",
  STRATEGIST = "strategist",
}

export enum TaskStatus {
  PENDING = "pending",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum CompanyStatus {
  PROSPECT = "prospect",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum DealStatus {
  LEAD = "lead",
  QUALIFIED = "qualified",
  PROPOSED = "proposed",
  NEGOTIATING = "negotiating",
  WON = "won",
  LOST = "lost",
}

export enum ActivityType {
  CALL = "call",
  EMAIL = "email",
  MEETING = "meeting",
  NOTE = "note",
  TASK = "task",
  MESSAGE = "message",
}

// Core Agent Types
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  role: AgentRole;
  description?: string;
  capabilities?: string[];
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  topic: string;
  content: Record<string, unknown>;
  context?: Record<string, unknown>;
  timestamp: Date;
  expiresAt?: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  description?: string;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  result?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  senderId: string;
  recipientId?: string;
  type: "broadcast" | "direct" | "reply";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
}

// CRM Types
export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  size?: string;
  revenue?: number;
  customFields?: Record<string, unknown>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  linkedIn?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  companyId: string;
  title: string;
  status: DealStatus;
  value?: number;
  currency?: string;
  owner?: string;
  expectedClosureDate?: Date;
  description?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface Activity {
  id: string;
  relatedToId: string; // Can reference Company, Contact, or Deal
  relatedToType: "company" | "contact" | "deal";
  type: ActivityType;
  title: string;
  description?: string;
  dueDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Database Query Result Types
export interface QueryResult<T> {
  data: T[];
  count: number;
  status: "ok" | "error";
  error?: string;
}

// Pagination Types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Search Types
export interface SearchOptions {
  query: string;
  filters?: Record<string, unknown>;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  hits: T[];
  totalHits: number;
  query: string;
  processingTimeMs: number;
}

// NATS Message Types
export interface NatsMessage<T = unknown> {
  id: string;
  subject: string;
  data: T;
  timestamp: Date;
  replyTo?: string;
}

export interface NatsPublishOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

// Cache Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if not exists
  xx?: boolean; // Only set if exists
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memory: number;
}

// Connection Configuration
export interface SurrealDBConfig {
  url: string;
  user: string;
  password: string;
  database?: string;
  namespace?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface DragonflyCacheConfig {
  url: string;
  password?: string;
  db?: number;
  timeout?: number;
  maxConnections?: number;
}

export interface NatsConfig {
  url: string;
  user?: string;
  password?: string;
  timeout?: number;
  maxReconnectAttempts?: number;
}

export interface MeilisearchConfig {
  url: string;
  masterKey: string;
  timeout?: number;
}

// SDK Options
export interface SuperStackSDKOptions {
  surreal?: Partial<SurrealDBConfig>;
  cache?: Partial<DragonflyCacheConfig>;
  nats?: Partial<NatsConfig>;
  meili?: Partial<MeilisearchConfig>;
  autoConnect?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

// Connection Status
export interface ConnectionStatus {
  service: string;
  connected: boolean;
  error?: string;
  latency?: number;
  lastCheck: Date;
}

// Batch Operation Types
export interface BatchOperation<T> {
  action: "create" | "update" | "delete";
  data: T;
}

export interface BatchResult<T> {
  successful: (T & { id: string })[];
  failed: Array<{
    data: T;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

// Hook Types for Lifecycle Events
export interface LifecycleHooks {
  onConnect?: () => Promise<void>;
  onDisconnect?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onRetry?: (attempt: number, error: Error) => Promise<void>;
}

// Error Types
export class SuperStackError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SuperStackError";
  }
}

export class ConnectionError extends SuperStackError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONNECTION_ERROR", 503, context);
    this.name = "ConnectionError";
  }
}

export class ValidationError extends SuperStackError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, context);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends SuperStackError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NOT_FOUND", 404, context);
    this.name = "NotFoundError";
  }
}

export class TimeoutError extends SuperStackError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "TIMEOUT", 408, context);
    this.name = "TimeoutError";
  }
}
