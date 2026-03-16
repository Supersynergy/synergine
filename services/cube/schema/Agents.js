/**
 * Agents — Cube.js Schema for Agent Analytics
 *
 * Provides metrics and dimensions for monitoring agent performance,
 * activity patterns, and operational health across the stack.
 */

cube(`Agents`, {
  sql: `SELECT * FROM agent`,

  measures: {
    count: {
      type: `count`,
      title: `Total Agents`,
      description: `Total number of agents in the system`
    },

    activeCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'active'` }],
      title: `Active Agents`,
      description: `Number of agents currently active`
    },

    inactiveCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'inactive'` }],
      title: `Inactive Agents`,
      description: `Number of agents currently inactive`
    },

    avgActivityScore: {
      type: `avg`,
      sql: `${CUBE}.activity_score`,
      title: `Average Activity Score`,
      description: `Mean activity score across all agents`
    },

    maxActivityScore: {
      type: `max`,
      sql: `${CUBE}.activity_score`,
      title: `Peak Activity Score`,
      description: `Highest activity score recorded`
    },

    minActivityScore: {
      type: `min`,
      sql: `${CUBE}.activity_score`,
      title: `Minimum Activity Score`,
      description: `Lowest activity score recorded`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      title: `Agent ID`,
      description: `Unique identifier for the agent`
    },

    name: {
      sql: `name`,
      type: `string`,
      title: `Agent Name`,
      description: `Human-readable name of the agent`
    },

    role: {
      sql: `role`,
      type: `string`,
      title: `Agent Role`,
      description: `Role/specialization of the agent (e.g., researcher, coder, reviewer)`
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Status`,
      description: `Current operational status (active, inactive, paused, error)`
    },

    model: {
      sql: `model`,
      type: `string`,
      title: `Model`,
      description: `LLM model used by the agent (e.g., claude-opus, claude-sonnet)`
    },

    tier: {
      sql: `tier`,
      type: `string`,
      title: `Tier`,
      description: `Agent tier/level (e.g., premium, standard, lite)`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created Date`,
      description: `Timestamp when agent was created`
    },

    updatedAt: {
      sql: `updated_at`,
      type: `time`,
      title: `Updated Date`,
      description: `Timestamp of last agent update`
    },

    lastActiveAt: {
      sql: `last_active_at`,
      type: `time`,
      title: `Last Active`,
      description: `Timestamp of last agent activity`
    },
  },

  preAggregations: {
    agentsByStatus: {
      measures: [Agents.count],
      dimensions: [Agents.status],
      granularity: `day`
    },

    agentsByRole: {
      measures: [Agents.count, Agents.activeCount],
      dimensions: [Agents.role],
      granularity: `day`
    }
  }
});
