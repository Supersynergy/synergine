/**
 * AI Agent SaaS Platform Template
 *
 * Complete template for building an AI Agent SaaS with:
 * - Multi-tenant agent registration and lifecycle management
 * - Task queue with NATS JetStream for distributed processing
 * - Vector-based agent memory with semantic search via SurrealDB
 * - Real-time status updates via LIVE SELECT
 * - Per-call cost tracking and usage analytics
 * - Production patterns and error handling
 *
 * Usage: bun run templates/ai-agent-saas.ts
 * Prerequisites: ./scripts/start.sh core
 */

import {
  createSuperStackSDK,
  Agent,
  AgentStatus,
  AgentRole,
  AgentTask,
  TaskStatus,
  TaskPriority,
} from "@superstack/sdk";

interface AgentCallLog {
  id: string;
  agentId: string;
  taskId: string;
  tokensUsed: number;
  cost: number;
  model: string;
  startTime: Date;
  endTime?: Date;
  success: boolean;
  error?: string;
}

interface AgentMemoryEntry {
  id: string;
  agentId: string;
  topic: string;
  content: string;
  embedding?: number[]; // Vector embedding for semantic search
  confidence: number;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
}

/**
 * Agent SaaS Manager - handles registration, lifecycle, cost tracking
 */
class AgentSaaSManager {
  private sdk: any;
  private agentRegistry: Map<string, Agent> = new Map();
  private costTracker: Map<string, number> = new Map();
  private models: Record<string, { inputCost: number; outputCost: number }> = {
    "gpt-4": { inputCost: 0.03, outputCost: 0.06 },
    "gpt-3.5": { inputCost: 0.0005, outputCost: 0.0015 },
    "claude-3": { inputCost: 0.01, outputCost: 0.03 },
  };

  async initialize() {
    this.sdk = await createSuperStackSDK({ autoConnect: true });
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    // Create JetStream streams for distributed task processing
    try {
      await queue.createStream({
        name: "agent_tasks",
        subjects: ["tasks.>"],
        retention: "limits",
        maxMsgs: 100000,
      });
      console.log("✓ Task queue initialized");
    } catch (e: any) {
      if (!e.message?.includes("STREAM_EXISTS")) throw e;
    }

    // Create durable consumer for task processing
    try {
      await queue.createConsumer("agent_tasks", {
        name: "task_processor",
        filterSubject: "tasks.assigned",
        deliveryPolicy: "all",
      });
    } catch (e: any) {
      if (!e.message?.includes("CONSUMER_EXISTS")) throw e;
    }

    console.log("✓ Agent SaaS Manager initialized");
    return this;
  }

  /**
   * Register a new AI agent
   */
  async registerAgent(
    tenantId: string,
    name: string,
    role: AgentRole = AgentRole.EXECUTOR,
    capabilities: string[] = []
  ): Promise<Agent> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const agentId = `agent:${tenantId}:${name}:${Date.now()}`;
    const agent = await db.create<Agent>("agents", {
      id: agentId,
      name,
      status: AgentStatus.IDLE,
      role,
      capabilities,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Cache agent metadata
    await cache.set(`agent:${agentId}`, agent, { ttl: 3600 });
    this.agentRegistry.set(agentId, agent);
    this.costTracker.set(agentId, 0);

    console.log(`✓ Agent registered: ${agentId} (${role})`);
    return agent;
  }

  /**
   * Store agent memory with semantic context
   */
  async storeMemory(
    agentId: string,
    topic: string,
    content: string,
    embedding?: number[]
  ): Promise<AgentMemoryEntry> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const memory = await db.create<AgentMemoryEntry>("agent_memory", {
      id: `memory:${agentId}:${topic}:${Date.now()}`,
      agentId,
      topic,
      content,
      embedding,
      confidence: 0.95,
      accessCount: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
    });

    // Index for semantic search - store topic embeddings in cache
    const memoryKey = `memory:${agentId}:${topic}`;
    await cache.set(memoryKey, { content, embedding, createdAt: new Date() }, {
      ttl: 86400 * 30, // 30 days
    });

    return memory;
  }

  /**
   * Retrieve memory by topic (semantic search ready)
   */
  async getMemory(agentId: string, topic: string): Promise<AgentMemoryEntry | null> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Try cache first
    const cached = await cache.get(`memory:${agentId}:${topic}`);
    if (cached) {
      return cached as AgentMemoryEntry;
    }

    // Query database - in production, use vector similarity search
    const result = await db.query<AgentMemoryEntry>(
      `SELECT * FROM agent_memory WHERE agentId = $agentId AND topic = $topic LIMIT 1`,
      { agentId, topic }
    );

    return result.data?.[0] || null;
  }

  /**
   * Create task and assign to agent
   */
  async createTask(
    agentId: string,
    title: string,
    description: string,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): Promise<AgentTask> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const task = await db.create<AgentTask>("agent_tasks", {
      id: `task:${agentId}:${Date.now()}`,
      agentId,
      status: TaskStatus.PENDING,
      priority,
      title,
      description,
      assignedAt: new Date(),
    });

    // Publish task to queue for distributed processing
    await queue.publish("tasks.assigned", {
      id: task.id,
      agentId,
      title,
      description,
      priority,
      timestamp: new Date(),
    });

    console.log(`✓ Task created: ${task.id}`);
    return task;
  }

  /**
   * Log API call for cost tracking
   */
  async logApiCall(
    agentId: string,
    taskId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    success: boolean,
    error?: string
  ): Promise<AgentCallLog> {
    const db = this.sdk.getDB();
    const modelPricing = this.models[model] || this.models["gpt-3.5"];

    const cost =
      inputTokens * (modelPricing.inputCost / 1000) +
      outputTokens * (modelPricing.outputCost / 1000);

    const callLog = await db.create<AgentCallLog>("agent_call_logs", {
      id: `call:${agentId}:${Date.now()}`,
      agentId,
      taskId,
      tokensUsed: inputTokens + outputTokens,
      cost,
      model,
      startTime: new Date(),
      success,
      error,
    });

    // Update agent cost tracking
    const currentCost = this.costTracker.get(agentId) || 0;
    this.costTracker.set(agentId, currentCost + cost);

    return callLog;
  }

  /**
   * Get agent usage analytics
   */
  async getAgentAnalytics(agentId: string) {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Try cache first
    const cached = await cache.get(`analytics:${agentId}`);
    if (cached) return cached;

    // Query aggregated metrics
    const callLogs = await db.query<AgentCallLog>(
      `SELECT * FROM agent_call_logs WHERE agentId = $agentId`,
      { agentId }
    );

    const tasks = await db.query<AgentTask>(
      `SELECT * FROM agent_tasks WHERE agentId = $agentId`,
      { agentId }
    );

    const analytics = {
      totalCalls: callLogs.data?.length || 0,
      totalCost: this.costTracker.get(agentId) || 0,
      totalTokens: (callLogs.data || []).reduce((sum, log) => sum + log.tokensUsed, 0),
      successRate: callLogs.data
        ? (callLogs.data.filter((l) => l.success).length / callLogs.data.length) * 100
        : 0,
      taskStats: {
        total: tasks.data?.length || 0,
        completed: (tasks.data || []).filter((t) => t.status === TaskStatus.COMPLETED).length,
        failed: (tasks.data || []).filter((t) => t.status === TaskStatus.FAILED).length,
      },
    };

    // Cache for 1 hour
    await cache.set(`analytics:${agentId}`, analytics, { ttl: 3600 });

    return analytics;
  }

  /**
   * Subscribe to real-time agent status changes via LIVE SELECT
   */
  async watchAgentStatus(agentId: string, callback: (agent: Agent) => void) {
    const db = this.sdk.getDB();

    // In production SurrealDB, use LIVE SELECT for real-time updates
    const watchId = await db.query(
      `LIVE SELECT * FROM agents WHERE id = $agentId`,
      { agentId }
    );

    console.log(`✓ Watching agent status: ${agentId} (live query: ${watchId})`);
    return watchId;
  }

  /**
   * Update agent status and broadcast
   */
  async updateAgentStatus(agentId: string, status: AgentStatus) {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();
    const cache = this.sdk.getCache();

    const agent = await db.update<Agent>(agentId, {
      status,
      lastSeen: new Date(),
      updatedAt: new Date(),
    });

    // Broadcast status change
    await queue.publish("agents.status_changed", {
      agentId,
      status,
      timestamp: new Date(),
    });

    // Update cache
    await cache.set(`agent:${agentId}`, agent, { ttl: 3600 });

    return agent;
  }

  /**
   * Get agent by ID with cache fallback
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    const cache = this.sdk.getCache();
    const db = this.sdk.getDB();

    // Try cache
    const cached = await cache.get(`agent:${agentId}`);
    if (cached) return cached as Agent;

    // Query database
    const agent = await db.read<Agent>(agentId);
    if (agent) {
      await cache.set(`agent:${agentId}`, agent, { ttl: 3600 });
    }

    return agent || null;
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    console.log("\n✓ Shutting down Agent SaaS Manager...");
    for (const [agentId, agent] of this.agentRegistry.entries()) {
      await this.updateAgentStatus(agentId, AgentStatus.OFFLINE);
    }
    await this.sdk.close();
    console.log("✓ Shutdown complete");
  }
}

/**
 * Main example - AI Agent SaaS in action
 */
async function main() {
  const manager = new AgentSaaSManager();
  await manager.initialize();

  try {
    // Register tenant agents
    const analyzerAgent = await manager.registerAgent(
      "tenant-001",
      "DataAnalyzer",
      AgentRole.ANALYZER,
      ["data_analysis", "reporting", "forecasting"]
    );

    const coordinatorAgent = await manager.registerAgent(
      "tenant-001",
      "Coordinator",
      AgentRole.COORDINATOR,
      ["task_distribution", "monitoring"]
    );

    // Store agent memory
    await manager.storeMemory(
      analyzerAgent.id,
      "customer_insights",
      "North American market shows 23% growth in Q1 2024"
    );

    await manager.storeMemory(
      analyzerAgent.id,
      "processing_rules",
      "All reports require validation before submission"
    );

    // Create and track tasks
    const task1 = await manager.createTask(
      analyzerAgent.id,
      "Analyze Monthly Data",
      "Process and analyze March 2024 sales data"
    );

    // Simulate API call and cost tracking
    await manager.logApiCall(
      analyzerAgent.id,
      task1.id,
      "gpt-4",
      2500, // input tokens
      1200, // output tokens
      true
    );

    // Get analytics
    const analytics = await manager.getAgentAnalytics(analyzerAgent.id);
    console.log("\nAgent Analytics:", analytics);

    // Get memory
    const memory = await manager.getMemory(analyzerAgent.id, "customer_insights");
    console.log("\nRetrieved Memory:", memory?.content);

    // Update and broadcast status
    await manager.updateAgentStatus(analyzerAgent.id, AgentStatus.ACTIVE);
    await manager.updateAgentStatus(coordinatorAgent.id, AgentStatus.ACTIVE);

    // Simulate running for a bit
    console.log("\n✓ Agent SaaS platform running...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

  } finally {
    await manager.shutdown();
  }
}

main().catch(console.error);
