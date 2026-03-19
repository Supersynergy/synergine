# Idea → Ship Pipeline: 1 Prompt → Production Product

> The complete autonomous pipeline for turning a raw idea into a deployed product.
> Stack: ZeroClaw (77 agents) + Claude Code (GSD) + Synergine (infra+app template)

---

## The Vision

```
"Build me a SaaS that does X"
         │
         ▼
   ┌─────────────┐
   │  IDEA INTAKE │  ← 1 single prompt from you
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │   PLANNING   │  ← AI decomposes into phases, validates feasibility
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │  PROMPT CHAIN│  ← Sequential agent pipeline, each builds on previous output
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │  BUILD LOOP  │  ← Code → Test → Fix → Iterate until benchmarks pass
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │   SHIP       │  ← Deploy, monitor, iterate
   └─────────────┘
```

**Total human input: 1 prompt + approval gates.**

---

## Phase 0: The Megaprompt (Your Only Input)

You write ONE structured prompt. Everything else is autonomous.

### Template: The Idea Megaprompt

```markdown
# Product: [Name]

## What it does (1-3 sentences)
[Plain language description of the product]

## Who it's for
[Target user persona — be specific]

## How they pay
[Pricing model: free tier + paid, one-time, subscription, usage-based]

## Core features (max 5 for MVP)
1. [Feature — what the user can DO, not tech details]
2. [Feature]
3. [Feature]
4. [Feature]
5. [Feature]

## Non-goals (what it does NOT do in v1)
- [Explicit scope limitation]
- [Explicit scope limitation]

## Design vibe
[e.g., "Clean like Linear", "Playful like Notion", "Dense like Bloomberg Terminal"]

## Ship deadline
[Date — forces ruthless prioritization]
```

### Example:

```markdown
# Product: PitchCraft

## What it does
AI tool that turns a rough product idea into a complete investor pitch deck
with market data, competitive analysis, and financial projections.

## Who it's for
Solo founders and early-stage startups who can't afford consultants.

## How they pay
Free: 1 pitch/month. Pro: $29/mo unlimited. Team: $79/mo.

## Core features (max 5 for MVP)
1. Paste idea → get 12-slide pitch deck in 2 minutes
2. Auto-research: pulls real market data, competitors, TAM/SAM/SOM
3. Financial model generator (3-year projections based on inputs)
4. Export to PDF + editable Google Slides link
5. Iteration: "make slide 3 more aggressive" natural language editing

## Non-goals
- No real-time collaboration (v2)
- No video pitch generation (v2)
- No CRM integration (v2)

## Design vibe
Clean like Linear, with subtle GSAP scroll animations on landing page.

## Ship deadline
2026-03-26 (7 days)
```

---

## Phase 1: Autonomous Planning (ZeroClaw + Claude Code)

The megaprompt feeds into a **planning chain** that decomposes the idea.

### Step 1.1: Feasibility Check (Haiku, 30 sec)

```bash
# ZeroClaw agent validates the idea against the stack
zeroclaw agent --role architect --task "
Analyze this product idea for feasibility with the Synergine stack
(Hono+React+Bun+Drizzle+BetterAuth+SurrealDB+Tailwind+shadcn).

Megaprompt: [PASTE]

Output:
1. Can this be built in the stated timeline? YES/NO + reasoning
2. Which Synergine services are needed? (SurrealDB, Dragonfly, NATS, Meilisearch)
3. External APIs required? (list with pricing)
4. Biggest technical risk?
5. Recommended phase breakdown (3-5 phases)
" --model claude-sonnet
```

### Step 1.2: Architecture Decision Record (Sonnet, 2 min)

```bash
zeroclaw agent --role architect --task "
Based on the feasibility check, create an Architecture Decision Record:

1. Data model (SurrealDB tables + relations)
2. API routes (Hono endpoints)
3. Frontend pages (React routes)
4. Auth requirements (Better Auth config)
5. Third-party integrations
6. File structure (which Synergine packages to modify)

Output as structured YAML.
" --model claude-sonnet
```

### Step 1.3: GSD Project Init (Claude Code)

```bash
# In Claude Code session:
/gsd:new-project
# → Reads the megaprompt + ADR
# → Creates .planning/PROJECT.md, REQUIREMENTS.md, ROADMAP.md
# → Breaks into numbered phases with success criteria
```

**Gate: You review the plan. Approve or adjust. This is your last manual step.**

---

## Phase 2: The Prompt Chain (Autonomous Build)

Each phase runs as a **sequential chain** where the output of one step feeds the next.

### The Chain Architecture

```
Phase 1: Database + API skeleton
    │ output: working API with health check
    ▼
Phase 2: Core business logic
    │ output: main feature working end-to-end
    ▼
Phase 3: Frontend UI
    │ output: pages connected to API
    ▼
Phase 4: Auth + Payments
    │ output: login, signup, paywall working
    ▼
Phase 5: Polish + Landing Page
    │ output: animations, SEO, copy
    ▼
Phase 6: Deploy + Monitor
    │ output: live URL, Sentry, PostHog
```

### How Each Phase Executes

```bash
# Phase execution via GSD (Claude Code)
/gsd:plan-phase 1      # Research + create PLAN.md
/gsd:execute-phase 1    # Build with atomic commits
/gsd:verify-work 1      # Test against success criteria

# OR fully autonomous:
/gsd:autonomous         # Runs all phases: discuss → plan → execute → verify
```

### Parallel Agent Deployment (ZeroClaw)

For phases that can run in parallel:

```bash
# Phase 3 (Frontend) can run parallel sub-tasks
zeroclaw agent --role frontend-builder --task "Build the dashboard page using shadcn/ui + Tremor + Recharts. Use the API from Phase 2." --model claude-sonnet &
zeroclaw agent --role frontend-builder --task "Build the landing page using Magic UI + Motion + GSAP ScrollTrigger." --model claude-sonnet &
zeroclaw agent --role copywriter --task "Write landing page copy: headline, subheadline, 3 feature sections, CTA, FAQ." --model claude &
wait
```

---

## Phase 3: The Iterative Quality Loop

After each phase, an automatic quality loop runs:

### The Benchmark Chain

```
Build output
    │
    ▼
┌──────────────┐
│  LINT CHECK   │  biome check --write .
│  TYPE CHECK   │  bun run check-types
│  UNIT TESTS   │  bun run test
│  BUILD TEST   │  bun run build
└──────┬───────┘
       │ all pass?
       ├── YES → next phase
       │
       ├── NO → auto-fix loop (max 3 attempts)
       │         │
       │         ▼
       │   ┌──────────────┐
       │   │ READ ERROR    │
       │   │ DIAGNOSE      │
       │   │ FIX           │
       │   │ RE-RUN CHECK  │
       │   └──────┬───────┘
       │          │ fixed?
       │          ├── YES → next phase
       │          └── NO → escalate to human
       │
       └── CRITICAL → stop, alert human
```

### Implementation: GSD Stop Hook

This already exists in your GSD system. The Stop hook runs after every agent completion:

```json
// settings.json hook
{
  "hooks": {
    "Stop": [{
      "type": "command",
      "command": "bash -c 'cd $PROJECT_DIR && biome check . && bun run check-types && bun run test 2>&1 | tail -20'"
    }]
  }
}
```

### Lighthouse / Performance Benchmarks

```bash
# After Phase 5 (Polish), run performance audit
zeroclaw agent --role qa-tester --task "
Run Lighthouse audit on http://localhost:5173.
Targets: Performance >90, Accessibility >95, SEO >90, Best Practices >90.
If any score is below target, identify the top 3 fixes and implement them.
" --model claude-sonnet
```

---

## Phase 4: The Ship Pipeline

### Step 4.1: Pre-Ship Checklist (Automated)

```bash
zeroclaw agent --role qa-tester --task "
Run the pre-ship checklist for the Synergine app:

□ All tests pass (biome check + bun test + bun build)
□ Environment variables documented in env.example
□ Database migrations committed (bun run db:push works from scratch)
□ Auth flow works (signup → login → protected route → logout)
□ Payment flow works (free tier → upgrade → webhook → access granted)
□ Landing page loads in <2s (Lighthouse Performance >90)
□ Mobile responsive (test 375px, 768px, 1440px)
□ SEO meta tags on all pages (title, description, og:image)
□ Error tracking configured (Sentry DSN set)
□ Analytics configured (PostHog or Umami)
□ HTTPS works (Caddy or Cloudflare)
□ Backup strategy documented

Report: PASS/FAIL per item with details.
" --model claude-sonnet
```

### Step 4.2: Deploy

```bash
# Option A: Coolify (self-hosted, recommended)
# Push to GitHub → Coolify auto-deploys

# Option B: Railway (easy, managed)
railway up

# Option C: Cloudflare Workers (edge)
bun run build && wrangler deploy
```

### Step 4.3: Post-Ship Monitoring

```bash
# Start monitoring stack
cd ~/synergine-app && ./dev.sh monitoring
# → Langfuse: LLM cost tracking
# → Uptime Kuma: health monitoring
# → Sentry: error tracking
# → PostHog: user analytics
```

---

## The Complete Flow Script

Here's the entire pipeline as a single executable script:

```bash
#!/usr/bin/env bash
# ============================================================
# ship.sh — Idea to Production in One Script
# Usage: ./ship.sh <megaprompt.md>
# ============================================================
set -euo pipefail

PROMPT_FILE="${1:?Usage: ./ship.sh <megaprompt.md>}"
PROJECT_NAME=$(grep "^# Product:" "$PROMPT_FILE" | sed 's/# Product: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
PROJECT_DIR="$HOME/$PROJECT_NAME"

echo "🚀 Starting pipeline for: $PROJECT_NAME"

# ── Phase 0: Scaffold ──────────────────────────────────────
echo "📦 Phase 0: Scaffolding from Synergine template..."
cp -r ~/synergine-app "$PROJECT_DIR"
cd "$PROJECT_DIR"
rm -rf .git node_modules
git init && git add -A && git commit -m "init: scaffold from synergine-app template"
bun install

# ── Phase 1: Plan ──────────────────────────────────────────
echo "🧠 Phase 1: Planning with ZeroClaw architect..."
PLAN=$(zeroclaw agent --role architect --task "$(cat "$PROMPT_FILE")" --model claude-sonnet --output json 2>/dev/null)
echo "$PLAN" > .planning/ARCHITECT_OUTPUT.json

# Create GSD project structure
mkdir -p .planning
cat "$PROMPT_FILE" > .planning/MEGAPROMPT.md

echo "📋 Phase 1 complete. Review .planning/ and run:"
echo "   cd $PROJECT_DIR"
echo "   claude  # then /gsd:new-project"
echo ""
echo "   After approval:"
echo "   /gsd:autonomous  # builds all phases"

# ── Phase 2-5: Build (via GSD autonomous) ──────────────────
# This runs inside Claude Code:
# /gsd:autonomous
# → discuss → plan → execute → verify per phase

# ── Phase 6: Quality Gate ──────────────────────────────────
echo "✅ After build, run quality gate:"
echo "   biome check --write ."
echo "   bun run check-types"
echo "   bun run test"
echo "   bun run build"

# ── Phase 7: Ship ──────────────────────────────────────────
echo "🚢 Deploy:"
echo "   git remote add origin https://github.com/Supersynergy/$PROJECT_NAME.git"
echo "   git push -u origin main"
echo "   # Coolify auto-deploys from GitHub"
```

---

## Agent Roles for the Pipeline

These ZeroClaw roles are purpose-built for the pipeline:

### New Roles to Create

| Role | Model | Purpose |
|------|-------|---------|
| **idea-validator** | haiku | Quick feasibility check against Synergine stack |
| **architect** | sonnet | Architecture Decision Record, data model, API design |
| **db-designer** | haiku | SurrealDB schema + Drizzle migrations |
| **api-builder** | sonnet | Hono routes + RPC client types |
| **ui-builder** | sonnet | React pages with shadcn/ui + Tailwind |
| **landing-builder** | sonnet | Landing page with Motion + Magic UI + GSAP |
| **copywriter** | haiku | Headlines, CTAs, feature descriptions, FAQ |
| **qa-tester** | sonnet | Pre-ship checklist, Lighthouse, responsive test |
| **deploy-agent** | haiku | Coolify/Railway/CF Workers deployment |
| **monitor-agent** | haiku | Sentry + PostHog + Uptime Kuma setup |

### Role Template (TOML)

```toml
# ~/.zeroclaw/roles/idea-validator.toml
[agent]
name = "idea-validator"
description = "Validates product ideas against the Synergine stack"
model = "claude-haiku-4-5-20251001"
temperature = 0.3

[agent.system]
prompt = """You are a senior product architect. Given a product idea, evaluate:
1. Technical feasibility with Synergine (Hono+React+Bun+Drizzle+BetterAuth+SurrealDB)
2. Timeline realism
3. Required external APIs and their costs
4. Biggest technical risk
5. Phase breakdown (3-5 phases, each deliverable in 1-2 days)

Be brutally honest. If the idea is too complex for the timeline, say so.
Always output structured JSON."""

[agent.tools]
allowed = ["read", "write", "search"]
```

---

## Prompt Chain Patterns

### Pattern 1: Sequential Refinement

```
Prompt A → Output A
                 │
                 ▼
         Prompt B (includes Output A) → Output B
                                              │
                                              ▼
                                      Prompt C (includes Output B) → Final
```

**Use for:** Planning → Architecture → Implementation

### Pattern 2: Parallel Fan-Out + Merge

```
                    Prompt A
                   ╱   │   ╲
                  ╱    │    ╲
          Agent 1  Agent 2  Agent 3    (parallel)
                  ╲    │    ╱
                   ╲   │   ╱
                    Merge Agent          (synthesize)
                        │
                    Final Output
```

**Use for:** Research, content generation, multi-perspective analysis

### Pattern 3: Iterative Improvement Loop

```
Prompt → Output → Benchmark
                     │
              pass?  ├── YES → Done
                     │
                     └── NO → Feedback Prompt → Output → Benchmark → ...
                                                              (max 3 iterations)
```

**Use for:** Code quality, performance optimization, design polish

### Pattern 4: Gate-and-Continue

```
Phase 1 → Output → [HUMAN GATE] → approve? → Phase 2 → Output → [AUTO GATE] → tests pass? → Phase 3
                                                                                     │
                                                                              NO → auto-fix → re-test
```

**Use for:** The main build pipeline. Human gates for architecture, auto gates for quality.

---

## Benchmarks & Quality Targets

### Automatic Quality Gates (must pass before ship)

| Check | Tool | Target | Fail Action |
|-------|------|--------|-------------|
| Lint | `biome check` | 0 errors | Auto-fix |
| Types | `bun run check-types` | 0 errors | Fix in prompt chain |
| Tests | `bun run test` | All pass | Debug loop (max 3) |
| Build | `bun run build` | Success | Fix in prompt chain |
| Lighthouse Performance | Lighthouse CI | >90 | Optimize images, lazy load, code split |
| Lighthouse Accessibility | Lighthouse CI | >95 | Fix ARIA, contrast, labels |
| Lighthouse SEO | Lighthouse CI | >90 | Fix meta tags, sitemap |
| Bundle Size | `bun build --analyze` | <200KB first load | Tree shake, lazy load |
| Time to Interactive | Lighthouse | <3s on 3G | Code split, prefetch |
| CLS | Lighthouse | <0.1 | Fix layout shifts |

### Business Benchmarks (post-launch, week 1)

| Metric | Target | Tool |
|--------|--------|------|
| Landing page → Signup | >3% | PostHog funnel |
| Signup → First action | >50% | PostHog funnel |
| Day 1 retention | >30% | PostHog cohort |
| Error rate | <1% | Sentry |
| API p95 latency | <200ms | Uptime Kuma |
| Uptime | >99.5% | Uptime Kuma |

---

## Timeline: Idea to Ship

| Day | Activity | Agents |
|-----|----------|--------|
| **Day 0 (1h)** | Write megaprompt. Run `ship.sh`. Review plan. | You + idea-validator |
| **Day 1 (auto)** | DB schema + API skeleton + Auth | GSD Phase 1-2 |
| **Day 2 (auto)** | Core business logic + tests | GSD Phase 3 |
| **Day 3 (auto)** | Frontend UI (dashboard + pages) | GSD Phase 4 |
| **Day 4 (auto)** | Payments + email + edge cases | GSD Phase 5 |
| **Day 5 (2h)** | Landing page + copy + animations | landing-builder + copywriter |
| **Day 6 (1h)** | Quality gate + performance fixes | qa-tester + Lighthouse |
| **Day 7 (30min)** | Deploy + monitoring setup | deploy-agent + monitor-agent |

**Total human time: ~5 hours over 7 days.**
**Total AI time: ~40-60 agent hours (mostly haiku = cheap).**

---

## Cost Estimate (Per Product Ship)

| Component | Cost |
|-----------|------|
| Claude Haiku (80% of agents) | ~$2-5 |
| Claude Sonnet (20% planning/review) | ~$3-8 |
| Infrastructure (Colima, self-hosted) | $0 |
| Domain | $10/year |
| Coolify hosting (4GB VPS) | $5-10/month |
| **Total to ship MVP** | **~$15-25** |

---

## What This Enables

1. **1 idea per week** — With the pipeline automated, shipping speed is limited only by idea quality
2. **Portfolio strategy** — Ship 10 MVPs, see which gets traction, double down on winner
3. **Zero wasted effort** — Kill list prevents researching dead tools. Stack is locked in.
4. **Compound reuse** — Each shipped product makes the next one faster (shared components, patterns, roles)
5. **True autonomy** — ZeroClaw agents + GSD system = you're the CEO, not the coder

---

*"Real artists ship." — Steve Jobs*
*"Move fast and break things." — but with Vitest catching the breaks.*
