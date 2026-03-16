/**
 * Tasks — Cube.js Schema for Task Analytics
 *
 * Provides metrics and dimensions for tracking task execution,
 * performance, outcomes, and operational efficiency.
 */

cube(`Tasks`, {
  sql: `SELECT * FROM task`,

  measures: {
    count: {
      type: `count`,
      title: `Total Tasks`,
      description: `Total number of tasks in the system`
    },

    completedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'completed'` }],
      title: `Completed Tasks`,
      description: `Number of tasks that completed successfully`
    },

    failedCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'failed'` }],
      title: `Failed Tasks`,
      description: `Number of tasks that failed`
    },

    runningCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'running'` }],
      title: `Running Tasks`,
      description: `Number of tasks currently running`
    },

    avgDuration: {
      type: `avg`,
      sql: `EXTRACT(EPOCH FROM (${CUBE}.completed_at - ${CUBE}.started_at))`,
      title: `Average Duration (seconds)`,
      description: `Mean task execution time in seconds`
    },

    totalDuration: {
      type: `sum`,
      sql: `EXTRACT(EPOCH FROM (${CUBE}.completed_at - ${CUBE}.started_at))`,
      title: `Total Duration (seconds)`,
      description: `Sum of all task execution times`
    },

    successRate: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'completed'` }],
      title: `Success Count`,
      description: `Number of successfully completed tasks`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      title: `Task ID`,
      description: `Unique identifier for the task`
    },

    name: {
      sql: `name`,
      type: `string`,
      title: `Task Name`,
      description: `Name or title of the task`
    },

    type: {
      sql: `type`,
      type: `string`,
      title: `Task Type`,
      description: `Type of task (e.g., analysis, automation, verification)`
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Status`,
      description: `Current status (pending, running, completed, failed, cancelled)`
    },

    priority: {
      sql: `priority`,
      type: `string`,
      title: `Priority`,
      description: `Task priority level (low, medium, high, critical)`
    },

    agentId: {
      sql: `agent_id`,
      type: `string`,
      title: `Assigned Agent`,
      description: `ID of the agent executing the task`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created Date`,
      description: `Timestamp when task was created`
    },

    startedAt: {
      sql: `started_at`,
      type: `time`,
      title: `Started Date`,
      description: `Timestamp when task execution began`
    },

    completedAt: {
      sql: `completed_at`,
      type: `time`,
      title: `Completed Date`,
      description: `Timestamp when task execution completed`
    },

    result: {
      sql: `result`,
      type: `string`,
      title: `Result Summary`,
      description: `Summary or status of task result`
    },
  },

  preAggregations: {
    tasksByStatus: {
      measures: [Tasks.count],
      dimensions: [Tasks.status],
      granularity: `day`
    },

    tasksByType: {
      measures: [Tasks.count, Tasks.completedCount, Tasks.failedCount],
      dimensions: [Tasks.type],
      granularity: `day`
    },

    tasksByAgent: {
      measures: [Tasks.count, Tasks.completedCount, Tasks.avgDuration],
      dimensions: [Tasks.agentId],
      granularity: `day`
    }
  }
});
