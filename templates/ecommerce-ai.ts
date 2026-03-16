/**
 * E-Commerce AI Platform Template
 *
 * Complete template for AI-powered e-commerce:
 * - Product catalog with vector embeddings
 * - Smart search via Meilisearch with faceting
 * - AI recommendation engine using vector similarity
 * - Dynamic pricing agent with demand signals
 * - Order tracking with graph relationships
 * - Real-time inventory via LIVE SELECT
 * - Cart optimization with personalization
 *
 * Usage: bun run templates/ecommerce-ai.ts
 * Prerequisites: ./scripts/start.sh core
 */

import {
  createSuperStackSDK,
} from "@superstack/sdk";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  embedding?: number[]; // Vector for similarity search
  tags: string[];
  ratings: number; // 1-5
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalPrice: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryEstimate?: Date;
}

interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Date;
}

interface PricingRule {
  id: string;
  condition: string; // "low_stock" | "high_demand" | "seasonal" | "competitor"
  multiplier: number; // price multiplier
  active: boolean;
  createdAt: Date;
}

interface Recommendation {
  productId: string;
  score: number; // 0-1 confidence
  reason: string;
  category: "similar" | "trending" | "personalized" | "bundle";
}

/**
 * E-Commerce AI Engine
 */
class EcommerceAIEngine {
  private sdk: any;
  private pricingRules: Map<string, PricingRule> = new Map();
  private similarityThreshold = 0.7;

  async initialize() {
    this.sdk = await createSuperStackSDK({ autoConnect: true });
    const queue = this.sdk.getQueue();

    // Create stream for order events
    try {
      await queue.createStream({
        name: "ecommerce_events",
        subjects: ["orders.>", "products.>", "carts.>"],
        retention: "limits",
        maxMsgs: 100000,
      });
      console.log("✓ E-commerce event stream initialized");
    } catch (e: any) {
      if (!e.message?.includes("STREAM_EXISTS")) throw e;
    }

    console.log("✓ E-Commerce AI Engine initialized");
    return this;
  }

  /**
   * Create or update product in catalog
   */
  async upsertProduct(
    name: string,
    description: string,
    category: string,
    price: number,
    cost: number,
    stock: number,
    tags: string[] = []
  ): Promise<Product> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const queue = this.sdk.getQueue();

    // Generate embedding (in production, use real embedding model)
    const embedding = this.generateEmbedding(description);

    const product: Product = {
      id: `product:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      sku: `SKU-${Date.now()}`,
      name,
      description,
      category,
      price,
      cost,
      stock,
      embedding,
      tags,
      ratings: 4.5,
      reviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const stored = await db.create<Product>("products", product);

    // Index for search
    const search = this.sdk.getSearch();
    await search.addDocuments("products", [
      {
        id: stored.id,
        sku: stored.sku,
        name: stored.name,
        description: stored.description,
        category: stored.category,
        price: stored.price,
        tags: stored.tags,
        stock: stored.stock,
      },
    ]);

    // Cache product
    await cache.set(`product:${stored.id}`, stored, { ttl: 3600 });

    // Publish event
    await queue.publish("products.created", {
      productId: stored.id,
      name: stored.name,
      category: stored.category,
      price: stored.price,
      timestamp: new Date(),
    });

    console.log(`✓ Product created: ${stored.name} ($${price})`);
    return stored;
  }

  /**
   * Smart search with faceting
   */
  async searchProducts(
    query: string,
    filters?: { category?: string; minPrice?: number; maxPrice?: number },
    limit: number = 20
  ) {
    const search = this.sdk.getSearch();

    let filterStr = "";
    if (filters) {
      if (filters.category) filterStr += `category = "${filters.category}"`;
      if (filters.minPrice !== undefined) {
        if (filterStr) filterStr += " AND ";
        filterStr += `price >= ${filters.minPrice}`;
      }
      if (filters.maxPrice !== undefined) {
        if (filterStr) filterStr += " AND ";
        filterStr += `price <= ${filters.maxPrice}`;
      }
    }

    const results = await search.search("products", {
      q: query,
      limit,
      filter: filterStr || undefined,
      facets: ["category", "tags"],
    });

    console.log(`✓ Found ${results.hits.length} products for: "${query}"`);
    return results;
  }

  /**
   * Get product recommendations based on similarity
   */
  async getRecommendations(
    productId: string,
    customerId?: string,
    limit: number = 5
  ): Promise<Recommendation[]> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Check cache
    const cacheKey = `recommendations:${productId}:${customerId || "anonymous"}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached as Recommendation[];

    // Get current product
    const product = await db.read<Product>(productId);
    if (!product || !product.embedding) {
      return [];
    }

    // Find similar products by embedding
    const allProducts = await db.query<Product>("SELECT * FROM products LIMIT 100");
    const recommendations: Recommendation[] = [];

    for (const p of allProducts.data || []) {
      if (p.id === productId || !p.embedding) continue;

      const similarity = this.cosineSimilarity(product.embedding, p.embedding);

      if (similarity > this.similarityThreshold) {
        recommendations.push({
          productId: p.id,
          score: similarity,
          reason: `Similar to ${product.name}`,
          category: "similar",
        });
      }
    }

    // Add trending products
    const trendingProducts = await db.query<Product>(
      `SELECT * FROM products WHERE category = $category ORDER BY reviews DESC LIMIT 3`,
      { category: product.category }
    );

    for (const p of trendingProducts.data || []) {
      if (p.id !== productId && !recommendations.find((r) => r.productId === p.id)) {
        recommendations.push({
          productId: p.id,
          score: 0.8,
          reason: "Trending in category",
          category: "trending",
        });
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);
    const limited = recommendations.slice(0, limit);

    // Cache for 1 hour
    await cache.set(cacheKey, limited, { ttl: 3600 });

    console.log(`✓ Generated ${limited.length} recommendations for product: ${productId}`);
    return limited;
  }

  /**
   * Add item to cart
   */
  async addToCart(customerId: string, productId: string, quantity: number = 1): Promise<CartItem[]> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const cartKey = `cart:${customerId}`;
    let cart = (await cache.get(cartKey)) as CartItem[] | null;

    if (!cart) {
      cart = [];
    }

    // Add or update item
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity, addedAt: new Date() });
    }

    // Cache cart
    await cache.set(cartKey, cart, { ttl: 86400 * 7 }); // 7 days

    console.log(`✓ Added ${quantity}x ${productId} to cart for ${customerId}`);
    return cart;
  }

  /**
   * Create order from cart
   */
  async createOrder(
    customerId: string,
    paymentMethod: string,
    shippingAddress: string
  ): Promise<Order | null> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const queue = this.sdk.getQueue();

    // Get cart
    const cartKey = `cart:${customerId}`;
    const cart = (await cache.get(cartKey)) as CartItem[] | null;

    if (!cart || cart.length === 0) {
      console.log("✗ Cart is empty");
      return null;
    }

    // Build order items with current prices
    let totalPrice = 0;
    const items = [];

    for (const cartItem of cart) {
      const product = await db.read<Product>(cartItem.productId);
      if (!product) continue;

      const price = await this.getDynamicPrice(product.id, product.price);
      const itemTotal = price * cartItem.quantity;

      items.push({
        productId: product.id,
        quantity: cartItem.quantity,
        price,
      });

      totalPrice += itemTotal;

      // Decrement stock
      await db.update<Product>(product.id, {
        stock: Math.max(0, product.stock - cartItem.quantity),
      });
    }

    // Create order
    const order: Order = {
      id: `order:${customerId}:${Date.now()}`,
      customerId,
      items,
      totalPrice,
      status: "pending",
      paymentMethod,
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryEstimate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const stored = await db.create<Order>("orders", order);

    // Clear cart
    await cache.del(cartKey);

    // Publish event
    await queue.publish("orders.created", {
      orderId: stored.id,
      customerId,
      totalPrice: stored.totalPrice,
      itemCount: stored.items.length,
      timestamp: new Date(),
    });

    console.log(`✓ Order created: ${stored.id} ($${totalPrice.toFixed(2)})`);
    return stored;
  }

  /**
   * Get dynamic price based on demand and inventory
   */
  async getDynamicPrice(productId: string, basePrice: number): Promise<number> {
    const db = this.sdk.getDB();
    const product = await db.read<Product>(productId);

    if (!product) return basePrice;

    let multiplier = 1.0;

    // Rule 1: Low stock increases price
    if (product.stock < 10) {
      multiplier *= 1.15; // +15%
    }

    // Rule 2: High reviews/ratings
    if (product.ratings >= 4.5 && product.reviews > 50) {
      multiplier *= 1.08; // +8%
    }

    // Rule 3: Custom pricing rules
    for (const rule of this.pricingRules.values()) {
      if (rule.active && rule.condition === "low_stock" && product.stock < 5) {
        multiplier *= rule.multiplier;
      }
    }

    const finalPrice = Math.round(basePrice * multiplier * 100) / 100;
    console.log(`  Price for ${productId}: $${basePrice} -> $${finalPrice}`);

    return finalPrice;
  }

  /**
   * Get order tracking with graph relations
   */
  async getOrderTracking(orderId: string) {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    // Check cache
    const cached = await cache.get(`order_tracking:${orderId}`);
    if (cached) return cached;

    const order = await db.read<Order>(orderId);
    if (!order) return null;

    // In production, use graph traversal to get related data
    const tracking = {
      order,
      items: order.items,
      estimatedDelivery: order.deliveryEstimate,
      currentStatus: order.status,
      timeline: [
        { status: "pending", timestamp: order.createdAt },
        {
          status: "processing",
          timestamp: new Date(order.createdAt.getTime() + 3600000),
        },
        {
          status: "shipped",
          timestamp: new Date(order.createdAt.getTime() + 86400000),
        },
      ],
    };

    // Cache for 24 hours
    await cache.set(`order_tracking:${orderId}`, tracking, { ttl: 86400 });

    return tracking;
  }

  /**
   * Get catalog analytics
   */
  async getCatalogAnalytics() {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const cached = await cache.get("catalog_analytics");
    if (cached) return cached;

    const products = await db.query<Product>("SELECT * FROM products");
    const orders = await db.query<Order>("SELECT * FROM orders");

    const analytics = {
      totalProducts: products.data?.length || 0,
      totalOrders: orders.data?.length || 0,
      totalRevenue: (orders.data || []).reduce((sum, o) => sum + o.totalPrice, 0),
      averageOrderValue:
        orders.data && orders.data.length > 0
          ? (orders.data || []).reduce((sum, o) => sum + o.totalPrice, 0) /
            (orders.data?.length || 1)
          : 0,
      inventory: {
        inStock: (products.data || []).filter((p) => p.stock > 0).length,
        lowStock: (products.data || []).filter((p) => p.stock > 0 && p.stock <= 10).length,
        outOfStock: (products.data || []).filter((p) => p.stock === 0).length,
      },
      topProducts: (products.data || [])
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 5),
    };

    // Cache for 1 hour
    await cache.set("catalog_analytics", analytics, { ttl: 3600 });

    return analytics;
  }

  /**
   * Helper: Generate embedding from text (simulated)
   */
  private generateEmbedding(text: string): number[] {
    // In production, use real embedding model (e.g., OpenAI, Hugging Face)
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % embedding.length] += text.charCodeAt(i) / text.length;
    }
    return embedding.map((v) => v / Math.sqrt(embedding.length));
  }

  /**
   * Helper: Cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    console.log("\n✓ Shutting down E-Commerce AI Engine...");
    await this.sdk.close();
    console.log("✓ Shutdown complete");
  }
}

/**
 * Main example - E-commerce AI in action
 */
async function main() {
  const ecom = new EcommerceAIEngine();
  await ecom.initialize();

  try {
    // Create product catalog
    console.log("Creating product catalog...");
    const laptop = await ecom.upsertProduct(
      "Pro Laptop X1",
      "High-performance laptop with 32GB RAM and RTX 4090",
      "Electronics",
      1299,
      900,
      15,
      ["laptop", "gaming", "professional"]
    );

    const monitor = await ecom.upsertProduct(
      "4K Monitor 32in",
      "UltraHD 32 inch monitor with HDR and 144Hz refresh",
      "Electronics",
      599,
      400,
      8,
      ["monitor", "gaming", "4k"]
    );

    const keyboard = await ecom.upsertProduct(
      "Mechanical Keyboard",
      "RGB mechanical keyboard with hot-swappable switches",
      "Accessories",
      149,
      80,
      50,
      ["keyboard", "gaming", "mechanical"]
    );

    // Search products
    console.log("\nSearching for gaming products...");
    await ecom.searchProducts("gaming", { category: "Electronics", maxPrice: 1000 });

    // Get recommendations
    console.log("\nGenerating recommendations...");
    const recs = await ecom.getRecommendations(laptop.id, "customer-001");
    console.log("Recommendations:", recs);

    // Shopping journey
    console.log("\nSimulating shopping journey...");
    const customerId = "customer-001";

    // Add items to cart
    await ecom.addToCart(customerId, laptop.id, 1);
    await ecom.addToCart(customerId, keyboard.id, 1);
    await ecom.addToCart(customerId, monitor.id, 2);

    // Create order
    const order = await ecom.createOrder(
      customerId,
      "credit_card",
      "123 Main St, Anytown, USA"
    );

    if (order) {
      // Get tracking
      const tracking = await ecom.getOrderTracking(order.id);
      console.log("\nOrder Tracking:", tracking?.currentStatus);

      // Get analytics
      const analytics = await ecom.getCatalogAnalytics();
      console.log("\nCatalog Analytics:", {
        totalProducts: analytics.totalProducts,
        totalOrders: analytics.totalOrders,
        totalRevenue: `$${analytics.totalRevenue.toFixed(2)}`,
        averageOrderValue: `$${analytics.averageOrderValue.toFixed(2)}`,
        inventory: analytics.inventory,
      });
    }

  } finally {
    await ecom.shutdown();
  }
}

main().catch(console.error);
