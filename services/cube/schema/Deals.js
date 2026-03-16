/**
 * Deals — Cube.js Schema for Sales Deal Analytics
 *
 * Provides metrics and dimensions for tracking sales pipeline,
 * deal stages, conversion rates, and revenue forecasting.
 */

cube(`Deals`, {
  sql: `SELECT * FROM deal`,

  measures: {
    count: {
      type: `count`,
      title: `Total Deals`,
      description: `Total number of deals in the pipeline`
    },

    wonCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'won'` }],
      title: `Deals Won`,
      description: `Number of deals successfully closed/won`
    },

    lostCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'lost'` }],
      title: `Deals Lost`,
      description: `Number of deals lost or disqualified`
    },

    activeCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status NOT IN ('won', 'lost')` }],
      title: `Active Deals`,
      description: `Number of deals in active pipeline stages`
    },

    totalValue: {
      type: `sum`,
      sql: `${CUBE}.amount`,
      title: `Total Deal Value`,
      description: `Sum of all deal amounts`
    },

    avgDealSize: {
      type: `avg`,
      sql: `${CUBE}.amount`,
      title: `Average Deal Size`,
      description: `Mean deal amount value`
    },

    maxDealSize: {
      type: `max`,
      sql: `${CUBE}.amount`,
      title: `Largest Deal`,
      description: `Highest individual deal amount`
    },

    minDealSize: {
      type: `min`,
      sql: `${CUBE}.amount`,
      title: `Smallest Deal`,
      description: `Lowest individual deal amount`
    },

    winRate: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'won'` }],
      title: `Win Count`,
      description: `Count of won deals (for rate calculation)`
    },

    avgSalesCycle: {
      type: `avg`,
      sql: `EXTRACT(EPOCH FROM (${CUBE}.closed_at - ${CUBE}.created_at)) / 86400`,
      title: `Avg Sales Cycle (days)`,
      description: `Mean number of days from deal creation to close`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      title: `Deal ID`,
      description: `Unique identifier for the deal`
    },

    title: {
      sql: `title`,
      type: `string`,
      title: `Deal Title`,
      description: `Name or description of the deal`
    },

    companyId: {
      sql: `company_id`,
      type: `string`,
      title: `Company ID`,
      description: `ID of the company associated with the deal`
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Status`,
      description: `Deal stage/status (negotiation, proposal, decision, won, lost)`
    },

    stage: {
      sql: `stage`,
      type: `string`,
      title: `Pipeline Stage`,
      description: `Position in sales pipeline (prospecting, qualification, proposal, etc.)`
    },

    amount: {
      sql: `amount`,
      type: `number`,
      title: `Deal Amount`,
      description: `Monetary value of the deal`
    },

    currency: {
      sql: `currency`,
      type: `string`,
      title: `Currency`,
      description: `Currency code (USD, EUR, GBP, etc.)`
    },

    probability: {
      sql: `probability`,
      type: `number`,
      title: `Win Probability`,
      description: `Estimated probability of deal closure (0-100%)`
    },

    ownerId: {
      sql: `owner_id`,
      type: `string`,
      title: `Deal Owner`,
      description: `User/Agent ID responsible for the deal`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created Date`,
      description: `Timestamp when deal was created`
    },

    closedAt: {
      sql: `closed_at`,
      type: `time`,
      title: `Closed Date`,
      description: `Timestamp when deal was closed (won/lost)`
    },

    expectedCloseAt: {
      sql: `expected_close_at`,
      type: `time`,
      title: `Expected Close Date`,
      description: `Forecasted deal closure date`
    },

    notes: {
      sql: `notes`,
      type: `string`,
      title: `Notes`,
      description: `Additional deal notes and comments`
    },
  },

  preAggregations: {
    dealsByStatus: {
      measures: [Deals.count, Deals.totalValue, Deals.avgDealSize],
      dimensions: [Deals.status],
      granularity: `day`
    },

    dealsByStage: {
      measures: [Deals.count, Deals.totalValue, Deals.avgDealSize, Deals.avgSalesCycle],
      dimensions: [Deals.stage],
      granularity: `day`
    },

    dealsByOwner: {
      measures: [Deals.count, Deals.totalValue, Deals.wonCount, Deals.lostCount],
      dimensions: [Deals.ownerId],
      granularity: `day`
    },

    dealForecast: {
      measures: [Deals.totalValue],
      dimensions: [Deals.stage, Deals.expectedCloseAt],
      granularity: `day`
    }
  }
});
