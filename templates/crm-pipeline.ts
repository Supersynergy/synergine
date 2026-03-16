/**
 * CRM Pipeline Template
 *
 * Complete template for building a sales pipeline with:
 * - Company import from CSV/API sources
 * - Contact enrichment and relationship tracking
 * - Deal stage management with activity logging
 * - Lead scoring with computed fields
 * - Pipeline analytics and forecasting
 * - Activity timeline and audit trails
 *
 * Usage: bun run templates/crm-pipeline.ts
 * Prerequisites: ./scripts/start.sh core
 */

import {
  createSuperStackSDK,
  Company,
  CompanyStatus,
  Contact,
  Deal,
  DealStatus,
  Activity,
  ActivityType,
} from "@superstack/sdk";

interface LeadScore {
  id: string;
  companyId: string;
  engagementScore: number; // 0-100
  conversionProbability: number; // 0-1
  recommendedAction: string;
  factors: Record<string, number>;
  calculatedAt: Date;
}

interface PipelineMetrics {
  totalLeads: number;
  activeDeals: number;
  pipelineValue: number;
  averageDealSize: number;
  winRate: number;
  forecastedRevenue: number;
  velocityByStage: Record<string, number>;
}

/**
 * CRM Pipeline Manager - handles companies, deals, activities, and analytics
 */
class CRMPipelineManager {
  private sdk: any;
  private leadScoringWeights = {
    companySize: 0.2,
    industryMatch: 0.15,
    activityFrequency: 0.25,
    dealValue: 0.2,
    contactEngagement: 0.15,
    responseTime: 0.05,
  };

  async initialize() {
    this.sdk = await createSuperStackSDK({ autoConnect: true });
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    // Create messaging stream for CRM events
    try {
      await queue.createStream({
        name: "crm_events",
        subjects: ["crm.>"],
        retention: "limits",
        maxMsgs: 50000,
      });
      console.log("✓ CRM event stream initialized");
    } catch (e: any) {
      if (!e.message?.includes("STREAM_EXISTS")) throw e;
    }

    console.log("✓ CRM Pipeline Manager initialized");
    return this;
  }

  /**
   * Import companies from external source
   */
  async importCompanies(companies: Partial<Company>[]): Promise<Company[]> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();
    const imported: Company[] = [];

    for (const companyData of companies) {
      try {
        const company = await db.create<Company>("companies", {
          id: `company:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
          name: companyData.name || "",
          status: companyData.status || CompanyStatus.PROSPECT,
          industry: companyData.industry,
          website: companyData.website,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          country: companyData.country,
          size: companyData.size,
          revenue: companyData.revenue,
          customFields: companyData.customFields,
          tags: companyData.tags || ["imported"],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        imported.push(company);

        // Publish import event
        await queue.publish("crm.company_imported", {
          companyId: company.id,
          name: company.name,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Failed to import company ${companyData.name}:`, error);
      }
    }

    console.log(`✓ Imported ${imported.length}/${companies.length} companies`);
    return imported;
  }

  /**
   * Enrich contact information
   */
  async enrichContact(
    companyId: string,
    firstName: string,
    lastName: string,
    email?: string
  ): Promise<Contact> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const contact = await db.create<Contact>("contacts", {
      id: `contact:${companyId}:${Date.now()}`,
      companyId,
      firstName,
      lastName,
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      title: "Employee", // Would be enriched from API in production
      department: "Sales",
      linkedIn: undefined,
      customFields: { enriched: true, enrichedAt: new Date() },
      tags: ["enriched"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Cache for quick access
    await cache.set(`contact:${contact.id}`, contact, { ttl: 86400 });

    console.log(
      `✓ Contact enriched: ${firstName} ${lastName} (${contact.email})`
    );
    return contact;
  }

  /**
   * Create deal and move through pipeline
   */
  async createDeal(
    companyId: string,
    title: string,
    value: number,
    currency: string = "USD"
  ): Promise<Deal> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const deal = await db.create<Deal>("deals", {
      id: `deal:${companyId}:${Date.now()}`,
      companyId,
      title,
      status: DealStatus.LEAD,
      value,
      currency,
      owner: "sales_team",
      expectedClosureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      description: `New deal for ${title}`,
      tags: ["new"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log creation activity
    await this.logActivity(deal.id, "deal", ActivityType.NOTE, {
      title: "Deal created",
      description: `${title} created with value ${currency} ${value}`,
    });

    // Publish deal event
    await queue.publish("crm.deal_created", {
      dealId: deal.id,
      companyId,
      title,
      value,
      status: DealStatus.LEAD,
      timestamp: new Date(),
    });

    console.log(`✓ Deal created: ${deal.id} (${title} - ${value})`);
    return deal;
  }

  /**
   * Move deal to next stage
   */
  async moveDealToStage(dealId: string, newStatus: DealStatus): Promise<Deal> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const deal = await db.update<Deal>(dealId, {
      status: newStatus,
      updatedAt: new Date(),
    });

    // Log stage change activity
    await this.logActivity(dealId, "deal", ActivityType.NOTE, {
      title: "Stage moved",
      description: `Deal moved to ${newStatus}`,
    });

    // Publish stage change
    await queue.publish("crm.deal_stage_changed", {
      dealId,
      previousStatus: deal.status,
      newStatus,
      timestamp: new Date(),
    });

    console.log(`✓ Deal ${dealId} moved to: ${newStatus}`);
    return deal;
  }

  /**
   * Log activity (call, email, meeting, note, task)
   */
  async logActivity(
    relatedToId: string,
    relatedToType: "company" | "contact" | "deal",
    type: ActivityType,
    details: { title: string; description?: string }
  ): Promise<Activity> {
    const db = this.sdk.getDB();

    const activity = await db.create<Activity>("activities", {
      id: `activity:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      relatedToId,
      relatedToType,
      type,
      title: details.title,
      description: details.description,
      completedDate: new Date(),
      assignedTo: "team",
      notes: `Logged via pipeline manager`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return activity;
  }

  /**
   * Calculate lead score based on multiple factors
   */
  async calculateLeadScore(companyId: string): Promise<LeadScore> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Get company data
    const company = await db.read<Company>(companyId);
    if (!company) throw new Error(`Company ${companyId} not found`);

    // Get related data
    const contacts = await db.query<Contact>(
      `SELECT * FROM contacts WHERE companyId = $companyId`,
      { companyId }
    );

    const deals = await db.query<Deal>(
      `SELECT * FROM deals WHERE companyId = $companyId`,
      { companyId }
    );

    const activities = await db.query<Activity>(
      `SELECT * FROM activities WHERE relatedToId = $companyId AND relatedToType = 'company'`,
      { companyId }
    );

    // Calculate individual scores
    const factors: Record<string, number> = {};

    // Company size factor (0-20)
    factors.companySize =
      (this.getCompanySizeScore(company.size) / 100) * 20 *
      this.leadScoringWeights.companySize;

    // Industry match (0-15)
    factors.industryMatch =
      (this.getIndustryMatchScore(company.industry) / 100) *
      15 *
      this.leadScoringWeights.industryMatch;

    // Activity frequency (0-25)
    const activityScore =
      Math.min((activities.data?.length || 0) / 10, 1) *
      100 *
      this.leadScoringWeights.activityFrequency;
    factors.activityFrequency = (activityScore / 100) * 25;

    // Deal value (0-20)
    const totalDealValue = (deals.data || []).reduce((sum, d) => sum + (d.value || 0), 0);
    factors.dealValue = Math.min(totalDealValue / 100000, 1) * 20 * this.leadScoringWeights.dealValue;

    // Contact engagement (0-15)
    factors.contactEngagement =
      (Math.min((contacts.data?.length || 0) / 5, 1) *
        100 *
        this.leadScoringWeights.contactEngagement) /
      100 *
      15;

    // Response time (0-5)
    factors.responseTime = 3 * this.leadScoringWeights.responseTime;

    const engagementScore = Math.min(
      100,
      Object.values(factors).reduce((a, b) => a + b, 0)
    );

    // Conversion probability based on engagement and deal presence
    const conversionProbability = Math.min(
      1,
      (engagementScore / 100) * (deals.data && deals.data.length > 0 ? 1.2 : 0.8)
    );

    const recommendedAction = this.getRecommendedAction(engagementScore, conversionProbability);

    const score: LeadScore = {
      id: `score:${companyId}:${Date.now()}`,
      companyId,
      engagementScore,
      conversionProbability,
      recommendedAction,
      factors,
      calculatedAt: new Date(),
    };

    // Cache score for 24 hours
    await cache.set(`lead_score:${companyId}`, score, { ttl: 86400 });

    return score;
  }

  /**
   * Get pipeline metrics and analytics
   */
  async getPipelineMetrics(): Promise<PipelineMetrics> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Try cache first
    const cached = await cache.get("pipeline_metrics");
    if (cached) return cached as PipelineMetrics;

    const companies = await db.query<Company>(`SELECT * FROM companies`);
    const deals = await db.query<Deal>(`SELECT * FROM deals`);

    const activeDealStats = (deals.data || []).filter(
      (d) => d.status !== DealStatus.WON && d.status !== DealStatus.LOST
    );

    const wonDeals = (deals.data || []).filter((d) => d.status === DealStatus.WON);
    const totalDeals = (deals.data || []).filter(
      (d) => d.status !== DealStatus.LEAD
    );

    const velocityByStage: Record<string, number> = {};
    for (const status of Object.values(DealStatus)) {
      velocityByStage[status] =
        (deals.data || []).filter((d) => d.status === status).length;
    }

    const metrics: PipelineMetrics = {
      totalLeads: (companies.data || []).length,
      activeDeals: activeDealStats.length,
      pipelineValue: activeDealStats.reduce((sum, d) => sum + (d.value || 0), 0),
      averageDealSize:
        activeDealStats.length > 0
          ? activeDealStats.reduce((sum, d) => sum + (d.value || 0), 0) /
            activeDealStats.length
          : 0,
      winRate: totalDeals.length > 0 ? (wonDeals.length / totalDeals.length) * 100 : 0,
      forecastedRevenue: activeDealStats.reduce((sum, d) => sum + (d.value || 0) * 0.6, 0),
      velocityByStage,
    };

    // Cache for 1 hour
    await cache.set("pipeline_metrics", metrics, { ttl: 3600 });

    return metrics;
  }

  /**
   * Helper: Get company size score
   */
  private getCompanySizeScore(size?: string): number {
    const sizeScores: Record<string, number> = {
      "1-10": 30,
      "11-50": 60,
      "51-200": 85,
      "201-500": 90,
      "501-1000": 95,
      "1000+": 100,
    };
    return sizeScores[size || "50-200"] || 60;
  }

  /**
   * Helper: Get industry match score
   */
  private getIndustryMatchScore(industry?: string): number {
    const targetIndustries = ["Technology", "Finance", "Healthcare", "Retail"];
    return targetIndustries.includes(industry || "") ? 90 : 50;
  }

  /**
   * Helper: Get recommended action based on score
   */
  private getRecommendedAction(
    engagementScore: number,
    conversionProbability: number
  ): string {
    if (engagementScore < 30) return "Initial outreach needed";
    if (engagementScore < 50) return "Schedule discovery call";
    if (engagementScore < 70) return "Prepare proposal";
    if (conversionProbability > 0.7) return "Move to closing";
    return "Nurture relationship";
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    console.log("\n✓ Shutting down CRM Pipeline Manager...");
    await this.sdk.close();
    console.log("✓ Shutdown complete");
  }
}

/**
 * Main example - CRM pipeline in action
 */
async function main() {
  const crm = new CRMPipelineManager();
  await crm.initialize();

  try {
    // Import companies
    const companies = await crm.importCompanies([
      {
        name: "TechCorp Inc",
        industry: "Technology",
        website: "techcorp.com",
        email: "sales@techcorp.com",
        phone: "+1-555-0100",
        size: "201-500",
        revenue: 50000000,
        tags: ["prospect", "tech"],
      },
      {
        name: "Finance Solutions Ltd",
        industry: "Finance",
        website: "financesol.com",
        email: "info@financesol.com",
        size: "51-200",
        revenue: 15000000,
        tags: ["prospect", "finance"],
      },
    ]);

    // Enrich contacts
    for (const company of companies) {
      await crm.enrichContact(company.id, "John", "Smith", "john.smith@techcorp.com");
      await crm.enrichContact(company.id, "Sarah", "Johnson", "sarah.johnson@techcorp.com");
    }

    // Create deals
    const deal1 = await crm.createDeal(companies[0].id, "Enterprise License", 150000);
    const deal2 = await crm.createDeal(companies[1].id, "Data Integration", 75000);

    // Move deals through pipeline
    await crm.moveDealToStage(deal1.id, DealStatus.QUALIFIED);
    await crm.moveDealToStage(deal2.id, DealStatus.PROPOSED);

    // Log activities
    await crm.logActivity(deal1.id, "deal", ActivityType.CALL, {
      title: "Discovery call",
      description: "Discussed requirements and timeline",
    });

    await crm.logActivity(companies[0].id, "company", ActivityType.EMAIL, {
      title: "Follow-up email",
      description: "Sent proposal documents",
    });

    // Calculate lead scores
    console.log("\nCalculating lead scores...");
    const score1 = await crm.calculateLeadScore(companies[0].id);
    const score2 = await crm.calculateLeadScore(companies[1].id);

    console.log(`\nLead Score - TechCorp: ${score1.engagementScore.toFixed(1)}/100`);
    console.log(`  Conversion Probability: ${(score1.conversionProbability * 100).toFixed(1)}%`);
    console.log(`  Recommended Action: ${score1.recommendedAction}`);

    console.log(`\nLead Score - Finance Solutions: ${score2.engagementScore.toFixed(1)}/100`);
    console.log(`  Conversion Probability: ${(score2.conversionProbability * 100).toFixed(1)}%`);
    console.log(`  Recommended Action: ${score2.recommendedAction}`);

    // Get pipeline metrics
    const metrics = await crm.getPipelineMetrics();
    console.log("\nPipeline Metrics:", {
      "Total Leads": metrics.totalLeads,
      "Active Deals": metrics.activeDeals,
      "Pipeline Value": `$${metrics.pipelineValue.toLocaleString()}`,
      "Average Deal Size": `$${metrics.averageDealSize.toLocaleString()}`,
      "Win Rate": `${metrics.winRate.toFixed(1)}%`,
      "Forecasted Revenue": `$${metrics.forecastedRevenue.toLocaleString()}`,
    });

  } finally {
    await crm.shutdown();
  }
}

main().catch(console.error);
