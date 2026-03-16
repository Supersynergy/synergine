/**
 * Companies — Cube.js Schema for Company/Business Analytics
 *
 * Provides metrics and dimensions for tracking company data,
 * engagement metrics, deal pipelines, and revenue opportunities.
 */

cube(`Companies`, {
  sql: `SELECT * FROM company`,

  measures: {
    count: {
      type: `count`,
      title: `Total Companies`,
      description: `Total number of companies in the database`
    },

    activeCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'active'` }],
      title: `Active Companies`,
      description: `Number of companies with active status`
    },

    leadCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'lead'` }],
      title: `Qualified Leads`,
      description: `Number of companies in lead status`
    },

    customerCount: {
      type: `count`,
      filters: [{ sql: `${CUBE}.status = 'customer'` }],
      title: `Customers`,
      description: `Number of companies that are customers`
    },

    avgEmployeeCount: {
      type: `avg`,
      sql: `${CUBE}.employee_count`,
      title: `Average Employee Count`,
      description: `Mean number of employees across companies`
    },

    totalRevenue: {
      type: `sum`,
      sql: `${CUBE}.annual_revenue`,
      title: `Total Annual Revenue`,
      description: `Sum of reported annual revenue`
    },

    avgRevenue: {
      type: `avg`,
      sql: `${CUBE}.annual_revenue`,
      title: `Average Annual Revenue`,
      description: `Mean annual revenue per company`
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      title: `Company ID`,
      description: `Unique identifier for the company`
    },

    name: {
      sql: `name`,
      type: `string`,
      title: `Company Name`,
      description: `Legal name of the company`
    },

    website: {
      sql: `website`,
      type: `string`,
      title: `Website`,
      description: `Company website URL`
    },

    status: {
      sql: `status`,
      type: `string`,
      title: `Status`,
      description: `Company status (prospect, lead, customer, churned, suspended)`
    },

    industry: {
      sql: `industry`,
      type: `string`,
      title: `Industry`,
      description: `Industry sector or vertical`
    },

    size: {
      sql: `size`,
      type: `string`,
      title: `Company Size`,
      description: `Company size category (startup, small, medium, enterprise)`
    },

    country: {
      sql: `country`,
      type: `string`,
      title: `Country`,
      description: `Country of operation (primary location)`
    },

    employeeCount: {
      sql: `employee_count`,
      type: `number`,
      title: `Employee Count`,
      description: `Number of employees`
    },

    annualRevenue: {
      sql: `annual_revenue`,
      type: `number`,
      title: `Annual Revenue`,
      description: `Annual revenue in company currency`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
      title: `Created Date`,
      description: `Timestamp when company record was created`
    },

    lastContactedAt: {
      sql: `last_contacted_at`,
      type: `time`,
      title: `Last Contacted`,
      description: `Timestamp of most recent contact`
    },

    nextFollowUpAt: {
      sql: `next_follow_up_at`,
      type: `time`,
      title: `Next Follow-up`,
      description: `Scheduled next contact timestamp`
    },
  },

  preAggregations: {
    companiesByStatus: {
      measures: [Companies.count],
      dimensions: [Companies.status],
      granularity: `day`
    },

    companiesByIndustry: {
      measures: [Companies.count, Companies.avgRevenue, Companies.totalRevenue],
      dimensions: [Companies.industry],
      granularity: `day`
    },

    companiesBySize: {
      measures: [Companies.count, Companies.customerCount],
      dimensions: [Companies.size],
      granularity: `day`
    }
  }
});
