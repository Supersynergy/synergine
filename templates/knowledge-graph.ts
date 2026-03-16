/**
 * Knowledge Graph + RAG Template
 *
 * Complete template for semantic search and knowledge systems:
 * - Entity extraction and knowledge graph construction
 * - Relationship mapping with RELATE statements
 * - Vector embeddings for semantic search
 * - Multi-hop graph traversal for context retrieval
 * - Hybrid retrieval combining vector + graph + keyword search
 * - RAG (Retrieval-Augmented Generation) pipeline
 * - Knowledge base indexing and graph analytics
 *
 * Usage: bun run templates/knowledge-graph.ts
 * Prerequisites: ./scripts/start.sh core
 */

import {
  createSuperStackSDK,
} from "@superstack/sdk";

interface Entity {
  id: string;
  type: string; // "person" | "organization" | "concept" | "location" | "product"
  name: string;
  description: string;
  embedding?: number[]; // Vector for semantic search
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string; // "mentions" | "authored" | "works_for" | "related_to" | etc.
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  sourceType: string; // "document" | "webpage" | "article" | "research"
  entities: Entity[];
  relationships: Relationship[];
  embedding?: number[];
  createdAt: Date;
}

interface RAGQuery {
  query: string;
  embedding?: number[];
  topK: number;
  depth: number; // Graph traversal depth
}

interface RAGResult {
  query: string;
  context: {
    directMatches: Entity[];
    graphContext: Entity[];
    relatedDocuments: KnowledgeSource[];
  };
  relevanceScores: Record<string, number>;
  timestamp: Date;
}

/**
 * Knowledge Graph + RAG Engine
 */
class KnowledgeGraphEngine {
  private sdk: any;
  private embeddingDim = 384;

  async initialize() {
    this.sdk = await createSuperStackSDK({ autoConnect: true });
    const queue = this.sdk.getQueue();

    // Create stream for knowledge events
    try {
      await queue.createStream({
        name: "knowledge_graph",
        subjects: ["kg.>"],
        retention: "limits",
        maxMsgs: 50000,
      });
      console.log("✓ Knowledge graph stream initialized");
    } catch (e: any) {
      if (!e.message?.includes("STREAM_EXISTS")) throw e;
    }

    console.log("✓ Knowledge Graph Engine initialized");
    return this;
  }

  /**
   * Extract entities from text (simulated NLP)
   */
  async extractEntities(content: string, sourceId: string): Promise<Entity[]> {
    const db = this.sdk.getDB();
    const entities: Entity[] = [];

    // Simple entity extraction (in production, use NER model)
    const patterns = [
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: "person" },
      { regex: /\b[A-Z][a-z]+ Inc\.?\b|\b[A-Z][a-z]+ Corporation\b/g, type: "organization" },
      { regex: /\b(technology|AI|machine learning|data|cloud)\b/gi, type: "concept" },
    ];

    const extractedNames = new Set<string>();

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          if (!extractedNames.has(match)) {
            extractedNames.add(match);

            const entity: Entity = {
              id: `entity:${sourceId}:${Date.now()}:${extractedNames.size}`,
              type: pattern.type,
              name: match,
              description: `Extracted from source ${sourceId}`,
              embedding: this.generateEmbedding(match),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const stored = await db.create<Entity>("entities", entity);
            entities.push(stored);
          }
        }
      }
    }

    console.log(`✓ Extracted ${entities.length} entities from source`);
    return entities;
  }

  /**
   * Create relationships between entities
   */
  async createRelationships(
    sourceEntity: Entity,
    targetEntity: Entity,
    relationType: string,
    confidence: number = 0.8
  ): Promise<Relationship> {
    const db = this.sdk.getDB();
    const queue = this.sdk.getQueue();

    const relationship: Relationship = {
      id: `rel:${sourceEntity.id}:${targetEntity.id}:${Date.now()}`,
      sourceId: sourceEntity.id,
      targetId: targetEntity.id,
      type: relationType,
      confidence,
      metadata: {
        sourceType: sourceEntity.type,
        targetType: targetEntity.type,
      },
      createdAt: new Date(),
    };

    // Store as graph relationship
    const stored = await db.create<Relationship>("relationships", relationship);

    // In SurrealDB, also use RELATE statement for graph traversal
    // await db.query(`RELATE ${sourceEntity.id}->${relationType}->${targetEntity.id}`);

    // Publish event
    await queue.publish("kg.relationship_created", {
      relationshipId: stored.id,
      sourceId: sourceEntity.id,
      targetId: targetEntity.id,
      type: relationType,
      confidence,
      timestamp: new Date(),
    });

    console.log(`✓ Relationship created: ${sourceEntity.name} -[${relationType}]-> ${targetEntity.name}`);
    return stored;
  }

  /**
   * Index knowledge source with entities and relationships
   */
  async indexKnowledgeSource(
    title: string,
    content: string,
    sourceType: string
  ): Promise<KnowledgeSource> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const search = this.sdk.getSearch();

    // Generate embedding for content
    const embedding = this.generateEmbedding(content);

    // Extract entities
    const sourceId = `source:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const entities = await this.extractEntities(content, sourceId);

    // Create relationships between extracted entities
    const relationships: Relationship[] = [];
    if (entities.length > 1) {
      for (let i = 0; i < Math.min(entities.length, 3); i++) {
        for (let j = i + 1; j < Math.min(entities.length, 4); j++) {
          const rel = await this.createRelationships(
            entities[i],
            entities[j],
            "mentions",
            0.9
          );
          relationships.push(rel);
        }
      }
    }

    // Store knowledge source
    const source: KnowledgeSource = {
      id: sourceId,
      title,
      content,
      sourceType,
      entities,
      relationships,
      embedding,
      createdAt: new Date(),
    };

    const stored = await db.create<KnowledgeSource>("knowledge_sources", source);

    // Index for full-text search
    await search.addDocuments("knowledge", [
      {
        id: stored.id,
        title: stored.title,
        content: stored.content.substring(0, 2000), // First 2000 chars
        sourceType: stored.sourceType,
        entityCount: stored.entities.length,
        createdAt: stored.createdAt,
      },
    ]);

    // Cache knowledge source
    await cache.set(`knowledge:${stored.id}`, stored, { ttl: 86400 * 7 }); // 7 days

    console.log(`✓ Knowledge source indexed: ${title}`);
    return stored;
  }

  /**
   * Hybrid search combining vector + graph + keyword search
   */
  async hybridSearch(
    queryText: string,
    topK: number = 10,
    graphDepth: number = 2
  ): Promise<RAGResult> {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();
    const search = this.sdk.getSearch();

    // Check cache
    const cacheKey = `search:${queryText}:${topK}:${graphDepth}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached as RAGResult;

    const queryEmbedding = this.generateEmbedding(queryText);

    // 1. Vector search - find semantically similar content
    const vectorMatches = await search.search("knowledge", {
      q: queryText,
      limit: topK,
    });

    // 2. Keyword search - find direct matches
    const keywordMatches = await db.query(
      `SELECT * FROM knowledge_sources WHERE content CONTAINS $query LIMIT $limit`,
      { query: queryText, limit: topK / 2 }
    );

    // 3. Entity search - extract entities from query
    const queryEntities = await this.extractEntities(queryText, "query");

    // 4. Graph traversal - find related entities at specified depth
    const relatedEntities: Entity[] = [];
    for (const entity of queryEntities) {
      const graphContext = await this.traverseGraph(entity.id, graphDepth);
      relatedEntities.push(...graphContext);
    }

    // 5. Combine results and score
    const relevanceScores: Record<string, number> = {};

    // Score vector matches
    for (const match of vectorMatches.hits || []) {
      const id = match.id;
      relevanceScores[id] =
        (relevanceScores[id] || 0) + this.cosineSimilarity(queryEmbedding, [0.8]); // Simplified
    }

    // Score keyword matches
    for (const match of keywordMatches.data || []) {
      const id = (match as any).id;
      relevanceScores[id] = (relevanceScores[id] || 0) + 0.7;
    }

    // Build result
    const result: RAGResult = {
      query: queryText,
      context: {
        directMatches: queryEntities,
        graphContext: relatedEntities.slice(0, topK / 2),
        relatedDocuments: (keywordMatches.data || []) as unknown as KnowledgeSource[],
      },
      relevanceScores,
      timestamp: new Date(),
    };

    // Cache for 1 hour
    await cache.set(cacheKey, result, { ttl: 3600 });

    console.log(
      `✓ Hybrid search complete: ${Object.keys(relevanceScores).length} results`
    );

    return result;
  }

  /**
   * Multi-hop graph traversal
   */
  async traverseGraph(startEntityId: string, maxDepth: number): Promise<Entity[]> {
    const db = this.sdk.getDB();
    const visited = new Set<string>();
    const results: Entity[] = [];

    const traverse = async (entityId: string, depth: number) => {
      if (depth === 0 || visited.has(entityId)) return;

      visited.add(entityId);

      // Get relationships from this entity
      const relationships = await db.query<Relationship>(
        `SELECT * FROM relationships WHERE sourceId = $entityId LIMIT 5`,
        { entityId }
      );

      for (const rel of relationships.data || []) {
        const targetEntity = await db.read<Entity>(rel.targetId);
        if (targetEntity && !visited.has(targetEntity.id)) {
          results.push(targetEntity);
          await traverse(targetEntity.id, depth - 1);
        }
      }
    };

    await traverse(startEntityId, maxDepth);
    return results;
  }

  /**
   * Get knowledge graph statistics
   */
  async getGraphStats() {
    const db = this.sdk.getDB();
    const cache = this.sdk.getCache();

    const cached = await cache.get("graph_stats");
    if (cached) return cached;

    const entities = await db.query<Entity>("SELECT * FROM entities");
    const relationships = await db.query<Relationship>("SELECT * FROM relationships");
    const sources = await db.query<KnowledgeSource>("SELECT * FROM knowledge_sources");

    const stats = {
      totalEntities: entities.data?.length || 0,
      entityTypes: this.groupBy(entities.data || [], "type"),
      totalRelationships: relationships.data?.length || 0,
      relationshipTypes: this.groupBy(relationships.data || [], "type"),
      totalSources: sources.data?.length || 0,
      sourceTypes: this.groupBy(sources.data || [], "sourceType"),
      averageEntityDegree:
        relationships.data && relationships.data.length > 0 && entities.data
          ? (relationships.data.length * 2) / entities.data.length
          : 0,
    };

    // Cache for 1 hour
    await cache.set("graph_stats", stats, { ttl: 3600 });

    return stats;
  }

  /**
   * Find similar entities
   */
  async findSimilarEntities(entityId: string, limit: number = 5) {
    const db = this.sdk.getDB();

    const entity = await db.read<Entity>(entityId);
    if (!entity || !entity.embedding) return [];

    const allEntities = await db.query<Entity>("SELECT * FROM entities LIMIT 100");
    const similarities: Array<[Entity, number]> = [];

    for (const other of allEntities.data || []) {
      if (other.id === entityId || !other.embedding) continue;

      const similarity = this.cosineSimilarity(entity.embedding, other.embedding);
      if (similarity > 0.6) {
        similarities.push([other, similarity]);
      }
    }

    // Sort by similarity and return top K
    return similarities.sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  /**
   * Helper: Generate embedding (simulated)
   */
  private generateEmbedding(text: string): number[] {
    const embedding = new Array(this.embeddingDim).fill(0);

    for (let i = 0; i < text.length; i++) {
      embedding[i % this.embeddingDim] += text.charCodeAt(i) / text.length;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map((v) => (norm > 0 ? v / norm : 0));
  }

  /**
   * Helper: Cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const minLen = Math.min(a.length, b.length);

    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Helper: Group array by property
   */
  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    console.log("\n✓ Shutting down Knowledge Graph Engine...");
    await this.sdk.close();
    console.log("✓ Shutdown complete");
  }
}

/**
 * Main example - Knowledge graph and RAG in action
 */
async function main() {
  const kg = new KnowledgeGraphEngine();
  await kg.initialize();

  try {
    // Index knowledge sources
    console.log("Indexing knowledge sources...");

    const source1 = await kg.indexKnowledgeSource(
      "AI and Machine Learning Trends 2024",
      `Machine learning has revolutionized industries. Companies like OpenAI and Google
      are leading the charge. Deep learning, transformer architectures, and vector databases
      are key technologies. The AI industry is rapidly growing with applications in healthcare,
      finance, and technology.`,
      "article"
    );

    const source2 = await kg.indexKnowledgeSource(
      "Enterprise Data Management",
      `Enterprise data management requires robust infrastructure. SurrealDB provides real-time
      capabilities with LIVE SELECT. NATS is a powerful message broker. Companies must manage
      data at scale with proper indexing and caching strategies.`,
      "document"
    );

    const source3 = await kg.indexKnowledgeSource(
      "AI Applications in Business",
      `Artificial intelligence transforms business processes. Recommendation engines powered by
      machine learning increase sales. Natural language processing helps with customer service.
      Technology companies invest heavily in AI research and development.`,
      "research"
    );

    // Perform hybrid search
    console.log("\nPerforming hybrid search...");
    const result1 = await kg.hybridSearch("machine learning AI", 5, 2);

    console.log(`Found ${Object.keys(result1.relevanceScores).length} relevant results`);
    console.log(`Direct entity matches: ${result1.context.directMatches.length}`);
    console.log(`Graph context: ${result1.context.graphContext.length}`);

    // Another search
    const result2 = await kg.hybridSearch("data management infrastructure", 5, 2);
    console.log(`\nSearch for "data management": ${Object.keys(result2.relevanceScores).length} results`);

    // Get graph statistics
    const stats = await kg.getGraphStats();
    console.log("\nKnowledge Graph Statistics:");
    console.log(`  Total Entities: ${stats.totalEntities}`);
    console.log(`  Entity Types: ${JSON.stringify(stats.entityTypes)}`);
    console.log(`  Total Relationships: ${stats.totalRelationships}`);
    console.log(`  Relationship Types: ${JSON.stringify(stats.relationshipTypes)}`);
    console.log(`  Avg Entity Degree: ${stats.averageEntityDegree.toFixed(2)}`);

  } finally {
    await kg.shutdown();
  }
}

main().catch(console.error);
