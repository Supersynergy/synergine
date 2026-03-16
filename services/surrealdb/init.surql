-- ===================================================================
-- SurrealDB 3.0 Schema for SuperStack AI Company Framework
-- ===================================================================
-- Multi-tenant AI agent coordination system with CRM integration
-- Supports agent orchestration, memory management, task tracking,
-- and integrated company/contact/deal management
-- ===================================================================

-- ===================================================================
-- NAMESPACE & DATABASE DEFINITION
-- ===================================================================

-- Define the superstack namespace for logical isolation
DEFINE NS superstack COMMENT "SuperStack AI company framework namespace";

-- Use the superstack namespace
USE NS superstack;

-- Define agents database for agent-specific data
DEFINE DB agents COMMENT "Agent orchestration and memory database";

-- Use agents database
USE DB agents;

-- ===================================================================
-- AGENT CORE TABLES
-- ===================================================================

-- Agents table: Represents AI agents in the system
DEFINE TABLE agent SCHEMAFULL COMMENT "AI agents (researcher, scraper, analyst, etc.)" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD name TYPE string ASSERT string::len($value) > 0;
  DEFINE FIELD role TYPE string ASSERT $value IN ['researcher', 'scraper', 'outreach', 'analyst', 'orchestrator', 'supervisor', 'custom'];
  DEFINE FIELD status TYPE string ASSERT $value IN ['active', 'idle', 'error', 'disabled'] DEFAULT 'idle';
  DEFINE FIELD model TYPE string ASSERT $value IN ['haiku', 'sonnet', 'opus', 'gemma', 'kimi', 'custom'] DEFAULT 'haiku';
  DEFINE FIELD config TYPE object COMMENT "Agent-specific configuration (temperature, max_tokens, etc.)";
  DEFINE FIELD capabilities TYPE array DEFAULT [] COMMENT "List of capabilities: ['web_search', 'email', 'code_execution', 'database_access']";
  DEFINE FIELD health_status TYPE object COMMENT "Current health: {last_heartbeat, error_count, avg_response_time_ms}";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD updated_at TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_agent_status ON status;
  DEFINE INDEX idx_agent_role ON role;
};

-- Agent memory table: Long-term and episodic memory for agents
DEFINE TABLE agent_memory SCHEMAFULL COMMENT "Agent memory storage with vector embeddings for semantic search" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD agent_id TYPE record<agent> ASSERT $value != NONE;
  DEFINE FIELD content TYPE string ASSERT string::len($value) > 0 COMMENT "Raw memory content (facts, learnings, patterns)";
  DEFINE FIELD summary TYPE string COMMENT "Summarized version of memory for quick retrieval";
  DEFINE FIELD vector_embedding TYPE array<float> COMMENT "Vector embedding for semantic search (1536-dim for OpenAI)";
  DEFINE FIELD memory_type TYPE string ASSERT $value IN ['short_term', 'long_term', 'episodic', 'semantic', 'procedural'] DEFAULT 'short_term';
  DEFINE FIELD importance_score TYPE float DEFAULT 0.5 COMMENT "0.0-1.0: relevance/importance for retrieval";
  DEFINE FIELD tags TYPE array DEFAULT [] COMMENT "Labels: ['company:TechCorp', 'deal:DEAL123', 'pattern:cold_outreach']";
  DEFINE FIELD metadata TYPE object COMMENT "Optional: {source, context, conversation_id}";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD accessed_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD expires_at TYPE datetime COMMENT "Optional: TTL for auto-cleanup of stale memories";
  DEFINE INDEX idx_agent_memory_agent_id ON agent_id;
  DEFINE INDEX idx_agent_memory_type ON memory_type;
  DEFINE INDEX idx_agent_memory_tags ON tags;
  DEFINE INDEX idx_agent_memory_importance ON importance_score;
  -- Vector index for semantic search (requires SurrealDB vector support)
  DEFINE INDEX idx_agent_memory_vector ON vector_embedding MTREE COMMENT "MTREE vector index with cosine distance";
};

-- Agent task table: Track agent work and execution logs
DEFINE TABLE agent_task SCHEMAFULL COMMENT "Agent task execution logs with performance metrics" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD agent_id TYPE record<agent> ASSERT $value != NONE;
  DEFINE FIELD task_type TYPE string ASSERT string::len($value) > 0 COMMENT "Type: research, email, scrape, analyze, etc.";
  DEFINE FIELD description TYPE string;
  DEFINE FIELD input TYPE object COMMENT "Task input parameters";
  DEFINE FIELD output TYPE object COMMENT "Task results/response";
  DEFINE FIELD status TYPE string ASSERT $value IN ['pending', 'running', 'completed', 'failed', 'cancelled'] DEFAULT 'pending';
  DEFINE FIELD error_message TYPE string COMMENT "Error details if status is failed";
  DEFINE FIELD started_at TYPE datetime;
  DEFINE FIELD completed_at TYPE datetime;
  DEFINE FIELD duration_ms TYPE int COMMENT "Execution time in milliseconds";
  DEFINE FIELD tokens_used TYPE object COMMENT "{input_tokens, output_tokens, total_cost_usd}";
  DEFINE FIELD cost_usd TYPE float DEFAULT 0.0;
  DEFINE FIELD retry_count TYPE int DEFAULT 0;
  DEFINE FIELD parent_task_id TYPE string COMMENT "Reference to parent task if this is a subtask";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_agent_task_agent_id ON agent_id;
  DEFINE INDEX idx_agent_task_status ON status;
  DEFINE INDEX idx_agent_task_type ON task_type;
  DEFINE INDEX idx_agent_task_completed ON completed_at;
};

-- Agent message table: Inter-agent communication and logs
DEFINE TABLE agent_message SCHEMAFULL COMMENT "Messages between agents for coordination and data exchange" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD from_agent TYPE record<agent> ASSERT $value != NONE;
  DEFINE FIELD to_agent TYPE record<agent>;
  DEFINE FIELD channel TYPE string DEFAULT 'direct' COMMENT "direct, broadcast, queue";
  DEFINE FIELD message_type TYPE string COMMENT "request, response, event, broadcast";
  DEFINE FIELD content TYPE object COMMENT "Message payload";
  DEFINE FIELD priority TYPE int DEFAULT 0 COMMENT "0=normal, 1=high, -1=low";
  DEFINE FIELD status TYPE string DEFAULT 'sent' COMMENT "sent, received, processed, failed";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD processed_at TYPE datetime;
  DEFINE INDEX idx_agent_message_from ON from_agent;
  DEFINE INDEX idx_agent_message_to ON to_agent;
  DEFINE INDEX idx_agent_message_status ON status;
};

-- ===================================================================
-- CRM TABLES (from OpenClaw schema)
-- ===================================================================

-- Companies table: Prospect and client companies
DEFINE TABLE company SCHEMAFULL COMMENT "Companies in the CRM system" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD name TYPE string ASSERT string::len($value) > 0;
  DEFINE FIELD domain TYPE string COMMENT "Primary domain (e.g., techcorp.com)";
  DEFINE FIELD industry TYPE string COMMENT "Industry classification (SaaS, FinTech, etc.)";
  DEFINE FIELD revenue TYPE float COMMENT "Annual revenue in USD";
  DEFINE FIELD employees TYPE int COMMENT "Number of employees";
  DEFINE FIELD tech_stack TYPE array COMMENT "Detected technologies: ['Salesforce', 'Slack', 'AWS']";
  DEFINE FIELD website TYPE string;
  DEFINE FIELD phone TYPE string;
  DEFINE FIELD location TYPE string COMMENT "HQ location";
  DEFINE FIELD tags TYPE array DEFAULT [] COMMENT "Labels for segmentation";
  DEFINE FIELD source TYPE string COMMENT "How we found them (scraper, manual, api, etc.)";
  DEFINE FIELD lead_score TYPE float DEFAULT 0.0 COMMENT "0-100 qualification score";
  DEFINE FIELD notes TYPE string;
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD updated_at TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_company_domain ON domain;
  DEFINE INDEX idx_company_industry ON industry;
  DEFINE INDEX idx_company_lead_score ON lead_score;
  DEFINE INDEX idx_company_tags ON tags;
};

-- Contacts table: People at companies
DEFINE TABLE contact SCHEMAFULL COMMENT "Contacts (people) at companies" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD company_id TYPE record<company> ASSERT $value != NONE;
  DEFINE FIELD first_name TYPE string ASSERT string::len($value) > 0;
  DEFINE FIELD last_name TYPE string ASSERT string::len($value) > 0;
  DEFINE FIELD email TYPE string COMMENT "Primary email address";
  DEFINE FIELD phone TYPE string;
  DEFINE FIELD role TYPE string COMMENT "Job title/role";
  DEFINE FIELD department TYPE string COMMENT "Engineering, Sales, etc.";
  DEFINE FIELD linkedin_url TYPE string;
  DEFINE FIELD decision_maker TYPE bool DEFAULT false COMMENT "Is decision maker/budget holder";
  DEFINE FIELD tags TYPE array DEFAULT [];
  DEFINE FIELD notes TYPE string;
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD updated_at TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_contact_company_id ON company_id;
  DEFINE INDEX idx_contact_email ON email;
  DEFINE INDEX idx_contact_decision_maker ON decision_maker;
};

-- Deals table: Sales pipeline
DEFINE TABLE deal SCHEMAFULL COMMENT "Sales opportunities and deals" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD company_id TYPE record<company> ASSERT $value != NONE;
  DEFINE FIELD contact_id TYPE record<contact>;
  DEFINE FIELD title TYPE string ASSERT string::len($value) > 0;
  DEFINE FIELD description TYPE string;
  DEFINE FIELD value TYPE float COMMENT "Deal value in USD";
  DEFINE FIELD stage TYPE string ASSERT $value IN ['lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] DEFAULT 'lead';
  DEFINE FIELD probability TYPE float DEFAULT 0.0 COMMENT "Win probability 0-100%";
  DEFINE FIELD expected_revenue TYPE float COMMENT "value * probability";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD updated_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD closed_at TYPE datetime;
  DEFINE FIELD closing_reason TYPE string COMMENT "If lost: why; if won: customer satisfaction";
  DEFINE INDEX idx_deal_company_id ON company_id;
  DEFINE INDEX idx_deal_contact_id ON contact_id;
  DEFINE INDEX idx_deal_stage ON stage;
  DEFINE INDEX idx_deal_closed_at ON closed_at;
};

-- Activities table: Interactions and communications
DEFINE TABLE activity SCHEMAFULL COMMENT "Interactions: emails, calls, meetings, notes" {
  DEFINE FIELD id TYPE string PRIMARY KEY;
  DEFINE FIELD deal_id TYPE record<deal>;
  DEFINE FIELD contact_id TYPE record<contact>;
  DEFINE FIELD company_id TYPE record<company>;
  DEFINE FIELD agent_id TYPE record<agent> COMMENT "Which agent performed/logged this activity";
  DEFINE FIELD type TYPE string ASSERT $value IN ['email', 'call', 'meeting', 'note', 'task', 'message'] DEFAULT 'note';
  DEFINE FIELD subject TYPE string;
  DEFINE FIELD content TYPE string COMMENT "Email body, call notes, meeting summary";
  DEFINE FIELD direction TYPE string COMMENT "inbound, outbound";
  DEFINE FIELD status TYPE string DEFAULT 'completed' COMMENT "completed, scheduled, failed";
  DEFINE FIELD outcome TYPE string COMMENT "Positive, negative, neutral";
  DEFINE FIELD scheduled_for TYPE datetime COMMENT "For future tasks/calls";
  DEFINE FIELD metadata TYPE object COMMENT "Email headers, call duration, meeting link, etc.";
  DEFINE FIELD created_at TYPE datetime DEFAULT time::now();
  DEFINE FIELD updated_at TYPE datetime DEFAULT time::now();
  DEFINE INDEX idx_activity_deal_id ON deal_id;
  DEFINE INDEX idx_activity_contact_id ON contact_id;
  DEFINE INDEX idx_activity_agent_id ON agent_id;
  DEFINE INDEX idx_activity_type ON type;
};

-- ===================================================================
-- RELATIONSHIP DEFINITIONS (Graph Edges)
-- ===================================================================

-- Agent coordination edges
DEFINE TABLE coordinates SCHEMAFULL COMMENT "Edge: Agent coordinates with another agent" {
  DEFINE FIELD in TYPE record<agent>;
  DEFINE FIELD out TYPE record<agent>;
  DEFINE FIELD relationship_type TYPE string DEFAULT 'peer' COMMENT "peer, supervisor, subordinate";
  DEFINE FIELD last_sync TYPE datetime;
};

-- Agent task assignments
DEFINE TABLE assigned_to SCHEMAFULL COMMENT "Edge: Agent is assigned to task" {
  DEFINE FIELD in TYPE record<agent>;
  DEFINE FIELD out TYPE record<agent_task>;
};

-- Agent memory edges
DEFINE TABLE remembers SCHEMAFULL COMMENT "Edge: Agent stores/recalls memory" {
  DEFINE FIELD in TYPE record<agent>;
  DEFINE FIELD out TYPE record<agent_memory>;
  DEFINE FIELD recall_count TYPE int DEFAULT 0;
  DEFINE FIELD last_recalled TYPE datetime;
};

-- Company-Contact relationship
DEFINE TABLE has_contact SCHEMAFULL COMMENT "Edge: Company has contact" {
  DEFINE FIELD in TYPE record<company>;
  DEFINE FIELD out TYPE record<contact>;
  DEFINE FIELD primary_contact TYPE bool DEFAULT false;
};

-- Contact-Deal relationship
DEFINE TABLE has_deal SCHEMAFULL COMMENT "Edge: Contact is involved in deal" {
  DEFINE FIELD in TYPE record<contact>;
  DEFINE FIELD out TYPE record<deal>;
  DEFINE FIELD role TYPE string COMMENT "decision_maker, influencer, user, etc.";
};

-- Deal-Activity relationship
DEFINE TABLE has_activity SCHEMAFULL COMMENT "Edge: Deal has activity" {
  DEFINE FIELD in TYPE record<deal>;
  DEFINE FIELD out TYPE record<activity>;
};

-- ===================================================================
-- AUTHENTICATION & ACCESS CONTROL
-- ===================================================================

-- Define JWT token access for API
DEFINE ACCESS agent_token ON DB TYPE JWT
  ALGORITHM HS512
  KEY "your-secret-key-replace-in-production"
  ISSUER "SuperStack"
  COMMENT "JWT-based access for agent API calls";

-- Define admin user (use environment variables in production)
DEFINE USER admin ON DB PASSWORD "admin123" ROLES owner
  COMMENT "Admin user - change password in production";

-- ===================================================================
-- EVENTS & TRIGGERS
-- ===================================================================

-- Event: Log agent task status changes to activity
DEFINE EVENT on agent_task WHEN $event = "UPDATE"
  THEN {
    LET $task = $after;
    LET $agent = (SELECT * FROM agent WHERE id = $task.agent_id);

    -- Create activity log when task status changes
    IF $before.status != $after.status THEN
      CREATE activity SET
        agent_id = $task.agent_id,
        type = 'task',
        subject = "Task status changed: " + $before.status + " -> " + $after.status,
        content = "Task: " + $task.description + " | Status: " + $after.status,
        status = $after.status,
        created_at = time::now();
    END;
  }
  COMMENT "Auto-log task status transitions to activity stream";

-- Event: Update agent updated_at timestamp on any change
DEFINE EVENT on agent WHEN $event = "UPDATE" OR $event = "CREATE"
  THEN {
    UPDATE agent SET updated_at = time::now() WHERE id = $after.id;
  }
  COMMENT "Keep agent.updated_at in sync with changes";

-- Event: Update company lead_score when activity happens
DEFINE EVENT on activity WHEN $event = "CREATE"
  THEN {
    IF $after.company_id != NONE THEN
      UPDATE company
      SET lead_score = math::min(lead_score + 5, 100)
      WHERE id = $after.company_id;
    END;
  }
  COMMENT "Increase lead score with each activity interaction";

-- ===================================================================
-- HELPER FUNCTIONS
-- ===================================================================

-- Function: Calculate token cost based on model and token count
DEFINE FUNCTION token_cost($model: string, $input_tokens: int, $output_tokens: int) {
  RETURN MATCH $model {
    'haiku' => ($input_tokens * 0.00000080 + $output_tokens * 0.00000400),
    'sonnet' => ($input_tokens * 0.00000300 + $output_tokens * 0.00001500),
    'opus' => ($input_tokens * 0.00001500 + $output_tokens * 0.00007500),
    _ => 0.0
  };
};

-- Function: Get agent activity summary for a date range
DEFINE FUNCTION agent_summary($agent_id: record, $days: int) {
  LET $start = time::now() - 86400 * $days;
  RETURN {
    total_tasks: (SELECT count() FROM agent_task
                   WHERE agent_id = $agent_id AND created_at > $start)[0].count,
    completed_tasks: (SELECT count() FROM agent_task
                      WHERE agent_id = $agent_id AND status = 'completed' AND created_at > $start)[0].count,
    failed_tasks: (SELECT count() FROM agent_task
                   WHERE agent_id = $agent_id AND status = 'failed' AND created_at > $start)[0].count,
    total_cost: (SELECT math::sum(cost_usd) FROM agent_task
                 WHERE agent_id = $agent_id AND created_at > $start)[0],
  };
};

-- ===================================================================
-- INITIAL PERMISSIONS & SETTINGS
-- ===================================================================

-- Allow public read on specific tables (adjust as needed)
DEFINE TABLE company PERMISSIONS
  FOR select WHERE true,
  FOR create WHERE $auth != NONE,
  FOR update WHERE $auth.role = 'admin' OR $auth.role = 'user',
  FOR delete WHERE $auth.role = 'admin';

DEFINE TABLE agent PERMISSIONS
  FOR select WHERE true,
  FOR create WHERE $auth.role = 'admin',
  FOR update WHERE $auth.role = 'admin',
  FOR delete WHERE $auth.role = 'admin';

DEFINE TABLE agent_task PERMISSIONS
  FOR select WHERE $auth != NONE,
  FOR create WHERE $auth != NONE,
  FOR update WHERE $auth.agent_id = $value.agent_id OR $auth.role = 'admin',
  FOR delete WHERE $auth.role = 'admin';

-- ===================================================================
-- END OF SCHEMA
-- ===================================================================
-- Schema created for SuperStack AI Company Framework
-- Total tables: 12 (4 agent + 4 CRM + 4 relationships)
-- Total indexes: 30+
-- Total events: 3
-- Total functions: 2
-- ===================================================================
