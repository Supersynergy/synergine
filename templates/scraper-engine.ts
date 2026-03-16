/**
 * Web Scraper Engine Template
 *
 * Complete template for building a distributed scraping pipeline:
 * - URL queue management via NATS JetStream
 * - Scrape results stored with deduplication
 * - Full-text indexing via Meilisearch
 * - Rate limiting with sliding window algorithm
 * - Concurrent worker pattern for horizontal scaling
 * - Error handling, retry logic, and status tracking
 *
 * Usage: bun run templates/scraper-engine.ts
 * Prerequisites: ./scripts/start.sh core
 */

import {
  createSuperStackSDK,
  TaskStatus,
} from "@superstack/sdk";

interface ScrapedPage {
  id: string;
  url: string;
  title?: string;
  content: string;
  contentHash: string; // For deduplication
  metadata?: Record<string, unknown>;
  statusCode: number;
  headers?: Record<string, string>;
  scrapedAt: Date;
  source: string;
}

interface ScraperTask {
  id: string;
  url: string;
  priority: number;
  retries: number;
  maxRetries: number;
  status: TaskStatus;
  error?: string;
  result?: ScrapedPage;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
  domain?: string;
}

/**
 * Distributed Web Scraper Engine
 */
class ScraperEngine {
  private sdk: any;
  private workers = 0;
  private maxWorkers = 4;
  private rateLimits: Map<string, RateLimitConfig> = new Map();
  private requestTimestamps: Map<string, number[]> = new Map();

  async initialize() {
    this.sdk = await createSuperStackSDK({ autoConnect: true });
    const queue = this.sdk.getQueue();

    // Create JetStream stream for URL queue
    try {
      await queue.createStream({
        name: "scraper_queue",
        subjects: ["scrape.>"],
        retention: "limits",
        maxMsgs: 1000000,
      });
      console.log("✓ Scraper queue initialized");
    } catch (e: any) {
      if (!e.message?.includes("STREAM_EXISTS")) throw e;
    }

    // Create durable consumer for workers
    try {
      await queue.createConsumer("scraper_queue", {
        name: "scraper_workers",
        filterSubject: "scrape.pending",
        deliveryPolicy: "all",
        ackPolicy: "explicit",
      });
    } catch (e: any) {
      if (!e.message?.includes("CONSUMER_EXISTS")) throw e;
    }

    // Set default rate limits
    this.setRateLimit("default", { requestsPerSecond: 5, burstSize: 10 });

    console.log("✓ Scraper Engine initialized");
    return this;
  }

  /**
   * Enqueue URL for scraping
   */
  async enqueueUrl(
    url: string,
    priority: number = 50,
    metadata?: Record<string, unknown>
  ): Promise<ScraperTask> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const task: ScraperTask = {
      id: `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      url,
      priority,
      retries: 0,
      maxRetries: 3,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
    };

    // Store in database
    await db.create("scraper_tasks", task);

    // Publish to queue with priority
    await queue.publish(`scrape.pending`, {
      ...task,
      metadata,
      enqueueTime: new Date(),
    });

    console.log(`✓ Enqueued: ${url}`);
    return task;
  }

  /**
   * Process scrape task with rate limiting
   */
  async processScrapeTask(task: ScraperTask): Promise<ScrapedPage | null> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const queue = this.sdk.getQueue();

    try {
      // Apply rate limiting
      const domain = new URL(task.url).hostname || "default";
      await this.checkRateLimit(domain);

      // Update task status
      await db.update(task.id, {
        status: TaskStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      // Check cache for deduplication
      const contentHash = await this.getContentHash(task.url);
      const cached = await cache.get(`page_hash:${contentHash}`);

      if (cached) {
        console.log(`✓ Cache hit: ${task.url}`);
        return cached as ScrapedPage;
      }

      // Simulate scraping (in production, use real HTTP client)
      const page = await this.scrapeUrl(task.url);

      // Deduplicate
      const pageHash = this.computeHash(page.content);
      const existingPage = await cache.get(`page_hash:${pageHash}`);

      if (existingPage) {
        console.log(`⊘ Duplicate detected: ${task.url}`);
        await db.update(task.id, {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          result: existingPage,
        });
        return existingPage as ScrapedPage;
      }

      // Store in database
      const stored = await db.create<ScrapedPage>("scraped_pages", {
        ...page,
        contentHash: pageHash,
      });

      // Cache for deduplication (30 days)
      await cache.set(`page_hash:${pageHash}`, stored, { ttl: 2592000 });

      // Index in Meilisearch for full-text search
      const search = this.sdk.getSearch();
      await search.addDocuments("pages", [
        {
          id: stored.id,
          url: stored.url,
          title: stored.title,
          content: stored.content.substring(0, 1000), // First 1000 chars
          scrapedAt: stored.scrapedAt,
        },
      ]);

      // Update task
      await db.update(task.id, {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        result: stored,
      });

      // Publish completion event
      await queue.publish("scrape.completed", {
        taskId: task.id,
        url: task.url,
        pageId: stored.id,
        timestamp: new Date(),
      });

      console.log(`✓ Scraped: ${task.url} (${stored.content.length} bytes)`);
      return stored;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Scrape failed: ${task.url} - ${errorMessage}`);

      // Retry logic
      if (task.retries < task.maxRetries) {
        task.retries++;
        await db.update(task.id, {
          retries: task.retries,
          status: TaskStatus.PENDING,
        });

        // Re-enqueue with exponential backoff
        const delay = Math.pow(2, task.retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processScrapeTask(task);
      } else {
        // Max retries exceeded
        await db.update(task.id, {
          status: TaskStatus.FAILED,
          error: errorMessage,
          completedAt: new Date(),
        });

        // Publish failure event
        const queue = this.sdk.getQueue();
        await queue.publish("scrape.failed", {
          taskId: task.id,
          url: task.url,
          error: errorMessage,
          timestamp: new Date(),
        });

        return null;
      }
    }
  }

  /**
   * Start worker pool for distributed scraping
   */
  async startWorkers(count: number = this.maxWorkers) {
    const queue = this.sdk.getQueue();

    for (let i = 0; i < count; i++) {
      this.workers++;
      const workerId = i + 1;

      // Subscribe to pending tasks
      queue.subscribe("scrape.pending", async (message) => {
        const task = message.data as ScraperTask;
        console.log(`[Worker ${workerId}] Processing: ${task.url}`);

        try {
          await this.processScrapeTask(task);
          // Message automatically acknowledged on success
        } catch (error) {
          console.error(`[Worker ${workerId}] Error:`, error);
        }
      });
    }

    console.log(`✓ Started ${count} scraper workers`);
  }

  /**
   * Search scraped content
   */
  async searchPages(query: string, limit: number = 20) {
    const search = this.sdk.getSearch();

    const results = await search.search("pages", {
      q: query,
      limit,
      attributesToHighlight: ["title", "content"],
    });

    console.log(`✓ Found ${results.hits.length} results for: "${query}"`);
    return results;
  }

  /**
   * Get scraper statistics
   */
  async getStats() {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Try cache
    const cached = await cache.get("scraper_stats");
    if (cached) return cached;

    const tasks = await db.query<ScraperTask>("SELECT * FROM scraper_tasks");
    const pages = await db.query<ScrapedPage>("SELECT * FROM scraped_pages");

    const stats = {
      totalTasks: tasks.data?.length || 0,
      completedTasks: (tasks.data || []).filter((t) => t.status === TaskStatus.COMPLETED).length,
      failedTasks: (tasks.data || []).filter((t) => t.status === TaskStatus.FAILED).length,
      pendingTasks: (tasks.data || []).filter((t) => t.status === TaskStatus.PENDING).length,
      totalPages: pages.data?.length || 0,
      totalContent: (pages.data || []).reduce((sum, p) => sum + p.content.length, 0),
      averagePageSize:
        pages.data && pages.data.length > 0
          ? (pages.data || []).reduce((sum, p) => sum + p.content.length, 0) /
            (pages.data?.length || 1)
          : 0,
      activeWorkers: this.workers,
    };

    // Cache for 5 minutes
    await cache.set("scraper_stats", stats, { ttl: 300 });

    return stats;
  }

  /**
   * Set rate limit for domain
   */
  setRateLimit(domain: string, config: RateLimitConfig) {
    this.rateLimits.set(domain, config);
    console.log(`✓ Rate limit set: ${domain} - ${config.requestsPerSecond} req/s`);
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  private async checkRateLimit(domain: string): Promise<void> {
    const config = this.rateLimits.get(domain) || this.rateLimits.get("default")!;
    const now = Date.now();
    const window = 1000; // 1 second window

    // Get timestamps for this domain
    let timestamps = this.requestTimestamps.get(domain) || [];

    // Remove timestamps older than window
    timestamps = timestamps.filter((t) => now - t < window);

    // Check if we can make another request
    if (timestamps.length >= config.requestsPerSecond) {
      const oldestTimestamp = timestamps[0];
      const waitTime = window - (now - oldestTimestamp) + 100;
      console.log(`⊗ Rate limited: ${domain}. Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Add current timestamp
    timestamps.push(now);
    this.requestTimestamps.set(domain, timestamps);
  }

  /**
   * Simulate URL scraping (replace with real HTTP client)
   */
  private async scrapeUrl(url: string): Promise<ScrapedPage> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));

    const content = `Sample content from ${url}. This would contain the actual HTML/text.`;

    return {
      id: `page:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      url,
      title: `Page from ${new URL(url).hostname}`,
      content,
      contentHash: this.computeHash(content),
      statusCode: 200,
      scrapedAt: new Date(),
      source: "web-scraper",
    };
  }

  /**
   * Compute content hash for deduplication
   */
  private computeHash(content: string): string {
    // Simple hash function - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get content hash from URL
   */
  private async getContentHash(url: string): Promise<string> {
    return this.computeHash(url);
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    console.log("\n✓ Shutting down Scraper Engine...");
    await this.sdk.close();
    console.log("✓ Shutdown complete");
  }
}

/**
 * Main example - Web scraper in action
 */
async function main() {
  const scraper = new ScraperEngine();
  await scraper.initialize();

  try {
    // Set rate limits for different domains
    scraper.setRateLimit("github.com", { requestsPerSecond: 2, burstSize: 5 });
    scraper.setRateLimit("example.com", { requestsPerSecond: 10, burstSize: 20 });

    // Start worker pool
    await scraper.startWorkers(3);

    // Enqueue URLs
    const urls = [
      "https://github.com/explore",
      "https://example.com/page1",
      "https://example.com/page2",
      "https://github.com/trending",
      "https://example.com/page3",
      "https://github.com/awesome",
    ];

    console.log("\nEnqueuing URLs...");
    const tasks = [];
    for (let i = 0; i < urls.length; i++) {
      tasks.push(await scraper.enqueueUrl(urls[i], 100 - i * 10));
    }

    // Let scraper process for a while
    console.log("\n✓ Scraper processing...");
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Get statistics
    const stats = await scraper.getStats();
    console.log("\nScraper Statistics:", stats);

    // Search for content
    console.log("\nSearching for content...");
    const searchResults = await scraper.searchPages("github");

  } finally {
    await scraper.shutdown();
  }
}

main().catch(console.error);
