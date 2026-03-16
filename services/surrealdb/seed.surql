-- ===================================================================
-- SurrealDB Seed Data for SuperStack AI Framework
-- ===================================================================
-- Sample agents, companies, deals, and memories for development/testing
-- ===================================================================

USE NS superstack;
USE DB agents;

-- ===================================================================
-- SAMPLE AGENTS
-- ===================================================================

-- Agent 1: Researcher - Finds and analyzes companies
CREATE agent:researcher SET
  id = 'agent:researcher',
  name = 'Research Bot',
  role = 'researcher',
  status = 'active',
  model = 'sonnet',
  config = {
    temperature: 0.5,
    max_tokens: 2048,
    timeout_ms: 30000,
    retry_policy: 'exponential'
  },
  capabilities = ['web_search', 'data_analysis', 'pattern_detection'],
  health_status = {
    last_heartbeat: time::now(),
    error_count: 0,
    avg_response_time_ms: 1500
  },
  created_at = time::now(),
  updated_at = time::now();

-- Agent 2: Scraper - Collects company data
CREATE agent:scraper SET
  id = 'agent:scraper',
  name = 'Web Scraper',
  role = 'scraper',
  status = 'active',
  model = 'haiku',
  config = {
    temperature: 0.2,
    max_tokens: 1024,
    timeout_ms: 60000,
    rate_limit: 10,
    rate_limit_window_ms: 60000
  },
  capabilities = ['web_scraping', 'html_parsing', 'data_extraction'],
  health_status = {
    last_heartbeat: time::now(),
    error_count: 0,
    avg_response_time_ms: 8000
  },
  created_at = time::now(),
  updated_at = time::now();

-- Agent 3: Outreach - Sends emails and manages communications
CREATE agent:outreach SET
  id = 'agent:outreach',
  name = 'Outreach Bot',
  role = 'outreach',
  status = 'active',
  model = 'sonnet',
  config = {
    temperature: 0.7,
    max_tokens: 512,
    timeout_ms: 10000,
    email_signature: 'SuperStack AI - Automating Success'
  },
  capabilities = ['email_sending', 'message_composition', 'scheduling'],
  health_status = {
    last_heartbeat: time::now(),
    error_count: 0,
    avg_response_time_ms: 800
  },
  created_at = time::now(),
  updated_at = time::now();

-- Agent 4: Analyst - Analyzes results and scoring
CREATE agent:analyst SET
  id = 'agent:analyst',
  name = 'Analytics Bot',
  role = 'analyst',
  status = 'active',
  model = 'sonnet',
  config = {
    temperature: 0.3,
    max_tokens: 2048,
    timeout_ms: 20000
  },
  capabilities = ['data_analysis', 'scoring', 'reporting', 'forecasting'],
  health_status = {
    last_heartbeat: time::now(),
    error_count: 0,
    avg_response_time_ms: 2200
  },
  created_at = time::now(),
  updated_at = time::now();

-- Agent 5: Orchestrator - Coordinates all agents
CREATE agent:orchestrator SET
  id = 'agent:orchestrator',
  name = 'Orchestration System',
  role = 'orchestrator',
  status = 'active',
  model = 'opus',
  config = {
    temperature: 0.4,
    max_tokens: 4096,
    timeout_ms: 120000,
    coordination_strategy: 'hierarchical'
  },
  capabilities = ['task_orchestration', 'agent_coordination', 'workflow_management', 'error_handling'],
  health_status = {
    last_heartbeat: time::now(),
    error_count: 0,
    avg_response_time_ms: 3000
  },
  created_at = time::now(),
  updated_at = time::now();

-- ===================================================================
-- AGENT COORDINATION (Graph edges)
-- ===================================================================

-- Orchestrator supervises all agents
CREATE coordinates SET
  in = 'agent:orchestrator',
  out = 'agent:researcher',
  relationship_type = 'supervisor',
  last_sync = time::now();

CREATE coordinates SET
  in = 'agent:orchestrator',
  out = 'agent:scraper',
  relationship_type = 'supervisor',
  last_sync = time::now();

CREATE coordinates SET
  in = 'agent:orchestrator',
  out = 'agent:outreach',
  relationship_type = 'supervisor',
  last_sync = time::now();

CREATE coordinates SET
  in = 'agent:orchestrator',
  out = 'agent:analyst',
  relationship_type = 'supervisor',
  last_sync = time::now();

-- Researcher and Scraper are peers
CREATE coordinates SET
  in = 'agent:researcher',
  out = 'agent:scraper',
  relationship_type = 'peer',
  last_sync = time::now();

-- ===================================================================
-- SAMPLE COMPANIES
-- ===================================================================

CREATE company:techcorp SET
  id = 'company:techcorp',
  name = 'TechCorp Solutions',
  domain = 'techcorp.io',
  industry = 'SaaS',
  revenue = 50000000.0,
  employees = 250,
  tech_stack = ['Salesforce', 'Slack', 'AWS', 'Kubernetes', 'PostgreSQL'],
  website = 'https://techcorp.io',
  phone = '+1-555-0101',
  location = 'San Francisco, CA',
  tags = ['enterprise', 'fast-growing', 'b2b', 'api-first'],
  source = 'scraper',
  lead_score = 85.0,
  notes = 'Strong engineering team, looking to expand integration partnerships',
  created_at = time::now(),
  updated_at = time::now();

CREATE company:innovate SET
  id = 'company:innovate',
  name = 'Innovate AI Labs',
  domain = 'innovateai.com',
  industry = 'AI/ML',
  revenue = 15000000.0,
  employees = 120,
  tech_stack = ['Python', 'PyTorch', 'Docker', 'GCP', 'Kubernetes'],
  website = 'https://innovateai.com',
  phone = '+1-555-0202',
  location = 'Boston, MA',
  tags = ['startup', 'ai-first', 'research-focused', 'b2b-and-b2c'],
  source = 'scraper',
  lead_score = 72.0,
  notes = 'Very technical team, emphasis on cutting-edge AI solutions',
  created_at = time::now() - 86400 * 15,
  updated_at = time::now() - 86400 * 2;

CREATE company:digital_agency SET
  id = 'company:digital_agency',
  name = 'Digital Dynamics Agency',
  domain = 'digitaldynamics.agency',
  industry = 'Marketing/Agency',
  revenue = 8000000.0,
  employees = 45,
  tech_stack = ['Zapier', 'HubSpot', 'Google Analytics', 'Shopify'],
  website = 'https://digitaldynamics.agency',
  phone = '+1-555-0303',
  location = 'New York, NY',
  tags = ['agency', 'service-provider', 'sme', 'ecommerce-focus'],
  source = 'manual',
  lead_score = 58.0,
  notes = 'Interested in automation tools for client delivery',
  created_at = time::now() - 86400 * 30,
  updated_at = time::now() - 86400 * 7;

-- ===================================================================
-- SAMPLE CONTACTS
-- ===================================================================

CREATE contact:techcorp_cto SET
  id = 'contact:techcorp_cto',
  company_id = 'company:techcorp',
  first_name = 'Sarah',
  last_name = 'Chen',
  email = 'sarah.chen@techcorp.io',
  phone = '+1-555-0101-1',
  role = 'CTO',
  department = 'Engineering',
  linkedin_url = 'https://linkedin.com/in/sarahchen',
  decision_maker = true,
  tags = ['budget-holder', 'technical-lead', 'open-to-innovation'],
  notes = 'Very responsive, interested in agent-based automation',
  created_at = time::now() - 86400 * 5,
  updated_at = time::now() - 86400 * 1;

CREATE contact:techcorp_vp SET
  id = 'contact:techcorp_vp',
  company_id = 'company:techcorp',
  first_name = 'Michael',
  last_name = 'Rodriguez',
  email = 'mrodriguez@techcorp.io',
  phone = '+1-555-0101-2',
  role = 'VP of Product',
  department = 'Product',
  linkedin_url = 'https://linkedin.com/in/mrodriguez',
  decision_maker = true,
  tags = ['strategic-thinker', 'partnership-focused'],
  notes = 'Typically a gatekeeper but warm introduction pending',
  created_at = time::now() - 86400 * 10,
  updated_at = time::now();

CREATE contact:innovate_founder SET
  id = 'contact:innovate_founder',
  company_id = 'company:innovate',
  first_name = 'David',
  last_name = 'Patel',
  email = 'david@innovateai.com',
  phone = '+1-555-0202-1',
  role = 'Founder & CEO',
  department = 'Executive',
  linkedin_url = 'https://linkedin.com/in/davidpatel',
  decision_maker = true,
  tags = ['founder', 'technical-founder', 'vision-setter'],
  notes = 'Visionary thinker, but very busy',
  created_at = time::now() - 86400 * 20,
  updated_at = time::now() - 86400 * 3;

-- ===================================================================
-- SAMPLE DEALS
-- ===================================================================

CREATE deal:techcorp_main SET
  id = 'deal:techcorp_main',
  company_id = 'company:techcorp',
  contact_id = 'contact:techcorp_cto',
  title = 'TechCorp - Enterprise Integration Package',
  description = 'Full integration of AI agents for customer support automation',
  value = 500000.0,
  stage = 'proposal',
  probability = 0.75,
  expected_revenue = 375000.0,
  created_at = time::now() - 86400 * 30,
  updated_at = time::now() - 86400 * 2,
  closing_reason = '';

CREATE deal:innovate_trial SET
  id = 'deal:innovate_trial',
  company_id = 'company:innovate',
  contact_id = 'contact:innovate_founder',
  title = 'Innovate AI - Research Collaboration',
  description = 'Joint research initiative for advanced AI agent systems',
  value = 150000.0,
  stage = 'qualified',
  probability = 0.50,
  expected_revenue = 75000.0,
  created_at = time::now() - 86400 * 45,
  updated_at = time::now() - 86400 * 5,
  closing_reason = '';

CREATE deal:digital_agency_implementation SET
  id = 'deal:digital_agency_implementation',
  company_id = 'company:digital_agency',
  contact_id = NONE,
  title = 'Digital Dynamics - Client Automation Tools',
  description = 'Provide AI agents as service to their clients',
  value = 75000.0,
  stage = 'contacted',
  probability = 0.30,
  expected_revenue = 22500.0,
  created_at = time::now() - 86400 * 60,
  updated_at = time::now() - 86400 * 10,
  closing_reason = '';

-- ===================================================================
-- SAMPLE ACTIVITIES
-- ===================================================================

CREATE activity:techcorp_email1 SET
  id = 'activity:techcorp_email1',
  deal_id = 'deal:techcorp_main',
  contact_id = 'contact:techcorp_cto',
  company_id = 'company:techcorp',
  agent_id = 'agent:outreach',
  type = 'email',
  subject = 'SuperStack AI Integration Proposal',
  content = 'Hi Sarah, following up on our conversation about integrating AI agents...',
  direction = 'outbound',
  status = 'completed',
  outcome = 'positive',
  metadata = {
    open_time: time::now() - 86400 * 1,
    click_time: time::now() - 86400 * 0.5,
    reply_time: time::now()
  },
  created_at = time::now() - 86400 * 2,
  updated_at = time::now() - 86400 * 1;

CREATE activity:techcorp_call1 SET
  id = 'activity:techcorp_call1',
  deal_id = 'deal:techcorp_main',
  contact_id = 'contact:techcorp_cto',
  company_id = 'company:techcorp',
  agent_id = 'agent:orchestrator',
  type = 'call',
  subject = 'Discovery Call - Technical Requirements',
  content = 'Discussed technical architecture, API requirements, and integration timeline. Sarah very interested in Q2 launch.',
  direction = 'outbound',
  status = 'completed',
  outcome = 'positive',
  metadata = {
    duration_seconds: 1845,
    recording: 'techcorp_call_20260316.wav',
    attendees: ['Sarah Chen', 'Michael Rodriguez']
  },
  created_at = time::now() - 86400 * 1,
  updated_at = time::now();

CREATE activity:innovate_email1 SET
  id = 'activity:innovate_email1',
  deal_id = 'deal:innovate_trial',
  contact_id = 'contact:innovate_founder',
  company_id = 'company:innovate',
  agent_id = 'agent:outreach',
  type = 'email',
  subject = 'Research Collaboration Opportunity',
  content = 'David, we believe your team would be ideal for a cutting-edge research initiative...',
  direction = 'outbound',
  status = 'completed',
  outcome = 'neutral',
  metadata = {
    open_time: time::now() - 86400 * 5,
    bounce: false
  },
  created_at = time::now() - 86400 * 7,
  updated_at = time::now() - 86400 * 5;

-- ===================================================================
-- SAMPLE AGENT MEMORIES
-- ===================================================================

-- Researcher's memory: Company analysis patterns
CREATE agent_memory:researcher_memory1 SET
  id = 'agent_memory:researcher_memory1',
  agent_id = 'agent:researcher',
  content = 'TechCorp Solutions shows strong signals for enterprise software adoption: high revenue ($50M+), large engineering team (250+), modern tech stack (Kubernetes, AWS). Previous interaction history shows they are actively seeking integration partners.',
  summary = 'TechCorp is high-quality enterprise lead with proven integration budget',
  memory_type = 'long_term',
  importance_score = 0.95,
  tags = ['company:techcorp', 'pattern:enterprise-buyer', 'signal:high-fit'],
  metadata = {
    source: 'web_research',
    confidence: 0.92,
    data_freshness: 'current'
  },
  vector_embedding = [0.1, 0.2, 0.15, 0.3, 0.25, 0.1, 0.05, 0.15, 0.2, 0.12, 0.18, 0.22, 0.19, 0.14, 0.16],
  created_at = time::now() - 86400 * 15,
  accessed_at = time::now() - 86400 * 2;

-- Scraper's memory: Data extraction insights
CREATE agent_memory:scraper_memory1 SET
  id = 'agent_memory:scraper_memory1',
  agent_id = 'agent:scraper',
  content = 'Successfully scraped 10,000 company records from public sources. Key insights: 34% of tech companies mention AI in their job descriptions, 67% have cloud infrastructure, 45% use workflow automation. Detection accuracy improved with new HTML parser.',
  summary = 'Scraped 10K companies, 34% AI-focused, improved parser accuracy',
  memory_type = 'episodic',
  importance_score = 0.80,
  tags = ['data:bulk-scrape', 'metric:company-analysis', 'pattern:ai-adoption'],
  metadata = {
    data_points: 10000,
    success_rate: 0.96,
    duration_hours: 2.5
  },
  vector_embedding = [0.2, 0.15, 0.25, 0.1, 0.2, 0.18, 0.22, 0.12, 0.16, 0.19, 0.14, 0.21, 0.17, 0.13, 0.11],
  created_at = time::now() - 86400 * 3,
  accessed_at = time::now() - 86400 * 1;

-- Outreach's memory: Email templates and response rates
CREATE agent_memory:outreach_memory1 SET
  id = 'agent_memory:outreach_memory1',
  agent_id = 'agent:outreach',
  content = 'Template performance analysis: "Problem-First" approach has 34% open rate and 8% reply rate, vs "Solution-First" at 28% open, 5% reply. Personalization by industry increases response 3.2x. Subject lines mentioning "AI" or "automation" get 40% higher opens. Best send times: Tuesday-Thursday 9-10am local time.',
  summary = 'Email template A (problem-first) outperforms B by 6pp, personalization critical',
  memory_type = 'long_term',
  importance_score = 0.88,
  tags = ['process:email-strategy', 'metric:open-rate', 'pattern:outreach-optimization'],
  metadata = {
    sample_size: 1500,
    confidence: 'high',
    updated: time::now()
  },
  vector_embedding = [0.3, 0.25, 0.2, 0.15, 0.22, 0.18, 0.21, 0.19, 0.17, 0.23, 0.16, 0.14, 0.2, 0.24, 0.12],
  created_at = time::now() - 86400 * 45,
  accessed_at = time::now() - 86400 * 0.5;

-- Analyst's memory: Scoring model insights
CREATE agent_memory:analyst_memory1 SET
  id = 'agent_memory:analyst_memory1',
  agent_id = 'agent:analyst',
  content = 'Lead scoring model v3 final weights: Revenue (25%), Employee Count (20%), Tech Stack Fit (25%), Decision Maker Contact (15%), Response Rate (15%). Model shows 0.87 AUC on validation set. Accounts for seasonal variations in buying cycles. Q2 typically 35% higher conversion than Q1.',
  summary = 'Lead score model v3: 0.87 AUC, revenue+tech-fit+contact are key',
  memory_type = 'long_term',
  importance_score = 0.92,
  tags = ['model:scoring', 'metric:auc-0.87', 'pattern:seasonal-cycles'],
  metadata = {
    model_version: 3,
    validation_auc: 0.87,
    test_auc: 0.84,
    last_trained: time::now() - 86400 * 7
  },
  vector_embedding = [0.25, 0.3, 0.2, 0.22, 0.18, 0.16, 0.24, 0.19, 0.21, 0.17, 0.23, 0.15, 0.26, 0.2, 0.14],
  created_at = time::now() - 86400 * 60,
  accessed_at = time::now() - 86400 * 1;

-- Orchestrator's memory: System coordination patterns
CREATE agent_memory:orchestrator_memory1 SET
  id = 'agent_memory:orchestrator_memory1',
  agent_id = 'agent:orchestrator',
  content = 'System orchestration workflow: Research -> Scrape (parallel) -> Analyze -> Outreach (sequential). Optimal parallelization reduces pipeline latency by 40%. Agent failure recovery: auto-retry researcher 3x, scraper 5x with exponential backoff. Cost optimization: route high-volume tasks to Haiku, complex reasoning to Sonnet. Monthly cost: $3,400.',
  summary = 'Orchestration pipeline 40% faster with parallelization, cost-optimized routing',
  memory_type = 'procedural',
  importance_score = 0.98,
  tags = ['process:orchestration', 'metric:pipeline-latency', 'pattern:cost-optimization'],
  metadata = {
    parallelization_gain: '40%',
    monthly_cost_usd: 3400,
    agents_managed: 4,
    uptime: 0.998
  },
  vector_embedding = [0.35, 0.3, 0.25, 0.22, 0.2, 0.18, 0.23, 0.19, 0.21, 0.24, 0.17, 0.16, 0.26, 0.2, 0.15],
  created_at = time::now() - 86400 * 90,
  accessed_at = time::now() - 86400 * 0.1;

-- ===================================================================
-- SAMPLE TASKS
-- ===================================================================

CREATE agent_task:research_techcorp SET
  id = 'agent_task:research_techcorp',
  agent_id = 'agent:researcher',
  task_type = 'company_research',
  description = 'Research TechCorp Solutions for lead qualification',
  input = {
    company_name: 'TechCorp Solutions',
    domain: 'techcorp.io',
    research_depth: 'detailed'
  },
  output = {
    company_profile: 'Enterprise SaaS, $50M revenue, 250 employees',
    fit_score: 0.92,
    key_insights: ['Strong engineering team', 'Active partnerships', 'Cloud-first architecture'],
    contacts_found: 2
  },
  status = 'completed',
  started_at = time::now() - 86400 * 5,
  completed_at = time::now() - 86400 * 4.9,
  duration_ms = 45000,
  tokens_used = {
    input_tokens: 500,
    output_tokens: 1200,
    total_tokens: 1700
  },
  cost_usd = 0.0051,
  retry_count = 0,
  created_at = time::now() - 86400 * 5,
  parent_task_id = NONE;

CREATE agent_task:outreach_email_techcorp SET
  id = 'agent_task:outreach_email_techcorp',
  agent_id = 'agent:outreach',
  task_type = 'send_email',
  description = 'Send initial outreach email to TechCorp CTO',
  input = {
    recipient: 'sarah.chen@techcorp.io',
    template: 'problem_first_v2',
    personalization: {
      name: 'Sarah',
      company: 'TechCorp',
      pain_point: 'integration_complexity'
    }
  },
  output = {
    email_id: 'msg_67890',
    sent_at: time::now() - 86400 * 2,
    open_status: 'opened',
    click_status: 'clicked'
  },
  status = 'completed',
  started_at = time::now() - 86400 * 2,
  completed_at = time::now() - 86400 * 1.99,
  duration_ms = 3000,
  tokens_used = {
    input_tokens: 300,
    output_tokens: 250,
    total_tokens: 550
  },
  cost_usd = 0.0012,
  retry_count = 0,
  created_at = time::now() - 86400 * 2;

-- ===================================================================
-- RELATIONSHIP EDGES (Company-Contact, Deal-Activity)
-- ===================================================================

CREATE has_contact SET
  in = 'company:techcorp',
  out = 'contact:techcorp_cto',
  primary_contact = true;

CREATE has_contact SET
  in = 'company:techcorp',
  out = 'contact:techcorp_vp',
  primary_contact = false;

CREATE has_contact SET
  in = 'company:innovate',
  out = 'contact:innovate_founder',
  primary_contact = true;

CREATE has_deal SET
  in = 'contact:techcorp_cto',
  out = 'deal:techcorp_main',
  role = 'decision_maker';

CREATE has_deal SET
  in = 'contact:innovate_founder',
  out = 'deal:innovate_trial',
  role = 'decision_maker';

CREATE has_activity SET
  in = 'deal:techcorp_main',
  out = 'activity:techcorp_email1';

CREATE has_activity SET
  in = 'deal:techcorp_main',
  out = 'activity:techcorp_call1';

CREATE has_activity SET
  in = 'deal:innovate_trial',
  out = 'activity:innovate_email1';

-- ===================================================================
-- AGENT MEMORY RELATIONSHIPS
-- ===================================================================

CREATE remembers SET
  in = 'agent:researcher',
  out = 'agent_memory:researcher_memory1',
  recall_count = 8,
  last_recalled = time::now() - 86400 * 2;

CREATE remembers SET
  in = 'agent:scraper',
  out = 'agent_memory:scraper_memory1',
  recall_count = 3,
  last_recalled = time::now() - 86400 * 1;

CREATE remembers SET
  in = 'agent:outreach',
  out = 'agent_memory:outreach_memory1',
  recall_count = 125,
  last_recalled = time::now() - 86400 * 0.5;

CREATE remembers SET
  in = 'agent:analyst',
  out = 'agent_memory:analyst_memory1',
  recall_count = 42,
  last_recalled = time::now() - 86400 * 1;

CREATE remembers SET
  in = 'agent:orchestrator',
  out = 'agent_memory:orchestrator_memory1',
  recall_count = 890,
  last_recalled = time::now();

-- ===================================================================
-- TASK ASSIGNMENTS
-- ===================================================================

CREATE assigned_to SET
  in = 'agent:researcher',
  out = 'agent_task:research_techcorp';

CREATE assigned_to SET
  in = 'agent:outreach',
  out = 'agent_task:outreach_email_techcorp';

-- ===================================================================
-- END OF SEED DATA
-- ===================================================================
-- Created: 5 Agents, 3 Companies, 3 Contacts, 3 Deals, 3 Activities
-- Created: 5 Agent Memories, 2 Agent Tasks, Graph relationships
-- ===================================================================
