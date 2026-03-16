/**
 * Agent system example using SuperStack SDK
 * Demonstrates building a task-processing agent with database, cache, and messaging
 */

import {
  createSuperStackSDK,
  Agent,
  AgentStatus,
  AgentRole,
  AgentTask,
  TaskStatus,
  TaskPriority,
  NatsMessage,
} from "@superstack/sdk";

class TaskProcessingAgent {
  private sdk: any;
  private agentId: string;
  private agentName: string;

  constructor(agentName: string) {
    this.agentName = agentName;
    this.agentId = `agent:${agentName}:${Date.now()}`;
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    this.sdk = await createSuperStackSDK({
      autoConnect: true,
    });

    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Create agent record
    const agent = await db.create<Agent>("agents", {
      id: this.agentId,
      name: this.agentName,
      status: AgentStatus.ACTIVE,
      role: AgentRole.EXECUTOR,
      capabilities: ["task_processing", "data_analysis", "reporting"],
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Cache agent info
    await cache.set(`agent:${this.agentId}`, agent, { ttl: 3600 });

    console.log(`Agent ${this.agentName} initialized with ID: ${this.agentId}`);
    return this;
  }

  /**
   * Start listening for tasks
   */
  async startTaskListener() {
    const queue = this.sdk.getQueue();

    // Create task stream
    await queue.createStream({
      name: "agent_tasks",
      subjects: ["tasks.assigned", "tasks.cancel"],
    });

    // Subscribe to assigned tasks
    await queue.subscribe("tasks.assigned", async (message) => {
      const task = message.data as any;
      console.log(`\n[${this.agentName}] Received task: ${task.id}`);

      try {
        await this.processTask(task);
      } catch (error) {
        console.error(`[${this.agentName}] Error processing task:`, error);
        await this.reportTaskError(task.id, error);
      }
    });

    console.log(`[${this.agentName}] Listening for tasks...`);
  }

  /**
   * Process a task
   */
  private async processTask(taskData: any) {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const queue = this.sdk.getQueue();

    const taskId = taskData.id;
    const startTime = Date.now();

    // Update task status to in_progress
    const task = await db.update<AgentTask>(taskId, {
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    // Cache task state
    await cache.set(`task:${taskId}:state`, { status: "processing", progress: 0 }, { ttl: 300 });

    console.log(`[${this.agentName}] Processing task: ${task.title}`);

    // Simulate task processing
    const stepCount = 5;
    for (let step = 1; step <= stepCount; step++) {
      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update progress
      const progress = (step / stepCount) * 100;
      await cache.set(
        `task:${taskId}:progress`,
        { progress, step },
        { ttl: 300 }
      );

      // Publish progress event
      await queue.publish("tasks.progress", {
        taskId,
        agentId: this.agentId,
        progress,
        step,
      });

      console.log(`[${this.agentName}] Task ${taskId} progress: ${progress.toFixed(0)}%`);
    }

    // Complete task
    const result = {
      status: "success",
      summary: `Processed ${taskData.description || "unknown task"}`,
      itemsProcessed: 150,
      duration: Date.now() - startTime,
    };

    const completedTask = await db.update<AgentTask>(taskId, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result,
    });

    // Cache completion
    await cache.set(`task:${taskId}:result`, result, { ttl: 86400 });

    // Publish completion event
    await queue.publish("tasks.completed", {
      taskId,
      agentId: this.agentId,
      result,
    });

    console.log(`[${this.agentName}] Task ${taskId} completed successfully`);
  }

  /**
   * Report task error
   */
  private async reportTaskError(taskId: string, error: any) {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update task status
    await db.update<AgentTask>(taskId, {
      status: TaskStatus.FAILED,
      error: errorMessage,
    });

    // Publish error event
    await queue.publish("tasks.failed", {
      taskId,
      agentId: this.agentId,
      error: errorMessage,
    });
  }

  /**
   * Create a task for this agent
   */
  async createTask(title: string, description: string, priority: TaskPriority = TaskPriority.MEDIUM) {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const task = await db.create<AgentTask>("agent_tasks", {
      agentId: this.agentId,
      status: TaskStatus.PENDING,
      priority,
      title,
      description,
      assignedAt: new Date(),
    });

    // Publish task assigned event
    await queue.publish("tasks.assigned", {
      id: task.id,
      agentId: this.agentId,
      title,
      description,
      priority,
    });

    return task;
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string) {
    const cache = this.sdk.getCache();
    const db = this.sdk.getDB();

    // Try cache first
    const cached = await cache.get(`task:${taskId}:state`);
    if (cached) {
      return cached;
    }

    // Fall back to database
    const task = await db.read<AgentTask>(taskId);
    return task;
  }

  /**
   * Update agent status
   */
  async updateStatus(status: AgentStatus) {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const agent = await db.update<Agent>(this.agentId, {
      status,
      lastSeen: new Date(),
    });

    await cache.set(`agent:${this.agentId}`, agent, { ttl: 3600 });
  }

  /**
   * Shutdown the agent
   */
  async shutdown() {
    await this.updateStatus(AgentStatus.OFFLINE);
    await this.sdk.close();
    console.log(`[${this.agentName}] Agent shutdown complete`);
  }
}

/**
 * Main example - create and run agents
 */
async function main() {
  // Create two agents
  const agent1 = await new TaskProcessingAgent("DataProcessor").initialize();
  const agent2 = await new TaskProcessingAgent("ReportGenerator").initialize();

  try {
    // Start task listeners
    await agent1.startTaskListener();
    await agent2.startTaskListener();

    // Create some tasks
    await agent1.createTask(
      "Process Dataset A",
      "Process and validate 1000 records from dataset A",
      TaskPriority.HIGH
    );

    await agent2.createTask(
      "Generate Monthly Report",
      "Create summary report for current month",
      TaskPriority.MEDIUM
    );

    // Let agents process for a while
    console.log("\nAgents are processing tasks...");
    await new Promise((resolve) => setTimeout(resolve, 15000));
  } finally {
    // Shutdown agents
    await agent1.shutdown();
    await agent2.shutdown();
  }
}

// Run example
main().catch(console.error);
