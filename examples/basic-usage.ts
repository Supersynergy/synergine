/**
 * Basic usage example of the SuperStack SDK
 * Shows initialization, CRUD operations, caching, and messaging
 */

import {
  createSuperStackSDK,
  Company,
  CompanyStatus,
  Contact,
  Deal,
} from "@superstack/sdk";

async function main() {
  // Initialize the SDK
  const sdk = await createSuperStackSDK({
    autoConnect: true,
  });

  console.log("SuperStack SDK initialized successfully");

  try {
    // ============================================================
    // DATABASE OPERATIONS
    // ============================================================
    const db = sdk.getDB();

    // Create a company
    console.log("\n--- Creating a company ---");
    const company = await db.create<Company>("companies", {
      name: "TechCorp Inc",
      status: CompanyStatus.PROSPECT,
      website: "https://techcorp.example.com",
      email: "info@techcorp.example.com",
      industry: "Software Development",
      size: "50-100",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created company:", company);

    // Read the company
    console.log("\n--- Reading the company ---");
    const fetched = await db.read<Company>(company.id);
    console.log("Fetched company:", fetched);

    // Update the company
    console.log("\n--- Updating the company ---");
    const updated = await db.update<Company>(company.id, {
      status: CompanyStatus.ACTIVE,
    });
    console.log("Updated company:", updated);

    // Create related contacts
    console.log("\n--- Creating contacts ---");
    const contact1 = await db.create<Contact>("contacts", {
      companyId: company.id,
      firstName: "John",
      lastName: "Doe",
      email: "john@techcorp.example.com",
      title: "CEO",
      department: "Management",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const contact2 = await db.create<Contact>("contacts", {
      companyId: company.id,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@techcorp.example.com",
      title: "CTO",
      department: "Engineering",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Created contacts:", contact1, contact2);

    // Query contacts
    console.log("\n--- Querying contacts ---");
    const contacts = await db.select<Contact>(
      "contacts",
      `companyId = '${company.id}'`
    );
    console.log(`Found ${contacts.length} contacts for the company`);

    // Count records
    console.log("\n--- Counting records ---");
    const companyCount = await db.count("companies");
    const contactCount = await db.count("contacts");
    console.log(`Total companies: ${companyCount}, Total contacts: ${contactCount}`);

    // ============================================================
    // CACHE OPERATIONS
    // ============================================================
    const cache = sdk.getCache();

    console.log("\n--- Cache operations ---");

    // Cache company data
    await cache.set(`company:${company.id}`, company, { ttl: 3600 });
    console.log("Cached company");

    // Retrieve from cache
    const cachedCompany = await cache.get<Company>(`company:${company.id}`);
    console.log("Retrieved from cache:", cachedCompany?.name);

    // Check TTL
    const ttl = await cache.ttl(`company:${company.id}`);
    console.log(`Cache TTL: ${ttl} seconds`);

    // ============================================================
    // MESSAGING OPERATIONS
    // ============================================================
    const queue = sdk.getQueue();

    console.log("\n--- Setting up messaging ---");

    // Create a stream
    await queue.createStream({
      name: "company_events",
      subjects: ["company.created", "company.updated", "company.deleted"],
    });
    console.log("Created NATS stream");

    // Subscribe to company creation events
    await queue.subscribe("company.created", async (message) => {
      console.log("Received company.created event:", message.data);
    });

    // Publish an event
    const eventSeq = await queue.publish("company.created", {
      companyId: company.id,
      name: company.name,
      timestamp: new Date(),
    });
    console.log(`Published event with sequence: ${eventSeq}`);

    // ============================================================
    // SEARCH OPERATIONS
    // ============================================================
    const search = sdk.getSearch();

    console.log("\n--- Setting up search ---");

    // Create search index
    await search.createIndex({
      name: "companies_search",
      primaryKey: "id",
      searchableAttributes: ["name", "industry", "website"],
      filterableAttributes: ["status", "size", "industry"],
      sortableAttributes: ["createdAt", "name"],
    });
    console.log("Created search index");

    // Add documents to search
    await search.addDocuments("companies_search", [
      {
        id: company.id,
        name: company.name,
        industry: company.industry || "Unknown",
        website: company.website || "",
        status: company.status,
        size: company.size || "",
      },
    ]);
    console.log("Added company to search index");

    // Search
    const searchResults = await search.search("companies_search", {
      query: "TechCorp",
      limit: 10,
    });
    console.log(`Search found ${searchResults.hits.length} results`);

    // ============================================================
    // HEALTH CHECKS
    // ============================================================
    console.log("\n--- Health checks ---");

    const status = await sdk.getStatus();
    console.log("Service status:");
    status.forEach((s) => {
      console.log(`  ${s.service}: ${s.connected ? "Connected" : "Disconnected"}`);
    });

    const health = await sdk.healthCheck();
    console.log("\nHealth check results:");
    Object.entries(health).forEach(([service, ok]) => {
      console.log(`  ${service}: ${ok ? "Healthy" : "Unhealthy"}`);
    });

    // ============================================================
    // CLEANUP
    // ============================================================
    console.log("\n--- Cleaning up ---");

    // Delete the company (cascade deletes contacts)
    await db.delete(company.id);
    console.log("Deleted company");

    // Delete contacts
    await db.delete(contact1.id);
    await db.delete(contact2.id);
    console.log("Deleted contacts");

    // Clear cache
    await cache.del(`company:${company.id}`);
    console.log("Cleared cache");

    console.log("\n✓ All operations completed successfully");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    // Close all connections
    await sdk.close();
    console.log("SDK connections closed");
  }
}

// Run the example
main().catch(console.error);
