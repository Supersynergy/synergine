![An interconnected engine of software components](docs/assets/cover.png)

<p align="center">
  <img src="https://img.shields.io/badge/Synergine-v2.0-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyTDIgNy41djlMMTIgMjJsNi0zLjI3VjEyaC0ydjVuMzdMOCAxOSA0IDExLjQ3VjguNTNMMTIgNCIvPjwvc3ZnPg==" alt="Synergine v2.0">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Tools-171+-orange?style=for-the-badge" alt="171+ Tools">
  <img src="https://img.shields.io/badge/Rust+TypeScript-Hybrid-red?style=for-the-badge" alt="Hybrid">
</p>

<h1 align="center">Synergine</h1>

<p align="center">
  <strong>The Modern Full-Stack AI Framework</strong><br>
  Infrastructure + App Template + 171 Curated Tools + Rust Superstack<br>
  <em>Explore an integrated stack for building AI applications.</em>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#app-template">App Template</a> &bull;
  <a href="#100-use-cases">100 Use Cases</a> &bull;
  <a href="#tool-knowledge-base">Tool KB</a> &bull;
  <a href="#rust-superstack">Rust Layer</a>
</p>

---

## What is Synergine?

Synergine is a **complete production framework** that combines:

1. **Infrastructure Layer** — SurrealDB + Dragonfly + NATS + Meilisearch + Caddy (Docker/Colima)
2. **App Template** — Hono + React + Bun + Drizzle + Better Auth + Tailwind v4 + shadcn/ui
3. **Tool Knowledge Base** — 171 curated tools with vector embeddings + graph relations in SurrealDB
4. **Rust Superstack** — Axum, Rig, Candle, Tauri 2, Spider + blessed.rs essentials
5. **UI/Animation/3D/DataViz Stack** — Motion, GSAP, Three.js, Tremor, Recharts, Deck.gl

One command to start. Zero vendor lock-in. MIT licensed.

```bash
git clone https://github.com/supersynergy/synergine.git && cd synergine
cp env.example .env
./scripts/start.sh dev    # Infrastructure
cd templates/synergine-app && ./dev.sh  # Full app
```

---

## Quickstart

### Prerequisites

- **Colima** (recommended) or Docker Desktop
- **Bun** 1.0+ (runtime + package manager)
- macOS / Linux

### 30-Second Setup

```bash
# 1. Clone
git clone https://github.com/supersynergy/synergine.git && cd synergine

# 2. Start infrastructure (SurrealDB + Dragonfly + NATS)
colima start --cpu 4 --memory 8 --disk 60
docker compose up -d

# 3. Start the app template
cd templates/synergine-app
cp env.example .env
bun install && bun run db:push && bun run dev
```

**That's it.** API at `localhost:3001`, Frontend at `localhost:5173`.

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │         YOUR PRODUCT             │
                    │    (SaaS, AI Tool, Dashboard)    │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼─────────┐  ┌──────▼──────┐  ┌──────────▼─────────┐
    │   APP TEMPLATE     │  │  RUST LAYER │  │   UI/ANIMATION     │
    │                    │  │             │  │                    │
    │  Hono (API)        │  │  Axum       │  │  Motion / GSAP     │
    │  React (Frontend)  │  │  Rig (AI)   │  │  Three.js / R3F    │
    │  Bun (Runtime)     │  │  Candle     │  │  Tremor / Recharts │
    │  Drizzle (ORM)     │  │  Tauri 2    │  │  shadcn/ui         │
    │  Better Auth       │  │  Spider     │  │  Tailwind v4       │
    │  Tailwind + shadcn │  │             │  │                    │
    └─────────┬─────────┘  └──────┬──────┘  └──────────┬─────────┘
              │                    │                     │
              └────────────────────┼────────────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │          INFRASTRUCTURE LAYER            │
              │                                         │
              │  ┌───────────┐  ┌──────────┐  ┌──────┐ │
              │  │ SurrealDB │  │Dragonfly │  │ NATS │ │
              │  │ Graph+Vec │  │  Cache   │  │ Msg  │ │
              │  └───────────┘  └──────────┘  └──────┘ │
              │                                         │
              │  ┌───────────┐  ┌──────────┐  ┌──────┐ │
              │  │Meilisearch│  │  Caddy   │  │Colima│ │
              │  │  Search   │  │  Proxy   │  │Docker│ │
              │  └───────────┘  └──────────┘  └──────┘ │
              └─────────────────────────────────────────┘
```

### Why These Choices?

<details>
<summary><strong>📋 Show 11 entries</strong></summary>

- **Database**<br>
  Choice: SurrealDB<br>
  Why Not the Alternative: Graph + Vector + Doc + FTS in ONE db. No Postgres+Redis+Elastic combo needed

- **Cache**<br>
  Choice: Dragonfly<br>
  Why Not the Alternative: 25x faster than Redis, drop-in compatible, single-threaded simplicity

- **Messaging**<br>
  Choice: NATS<br>
  Why Not the Alternative: 10x lighter than Kafka, JetStream for persistence, perfect for agents

- **Search**<br>
  Choice: Meilisearch<br>
  Why Not the Alternative: Typo-tolerant, instant, open-source Algolia replacement

- **API**<br>
  Choice: Hono<br>
  Why Not the Alternative: 402K ops/sec, runs everywhere (Bun/Node/CF Workers/Deno), 14KB

- **Auth**<br>
  Choice: Better Auth<br>
  Why Not the Alternative: Free, self-hosted, TypeScript-native, Passkeys ready

- **ORM**<br>
  Choice: Drizzle<br>
  Why Not the Alternative: Edge-compatible, type-safe, lighter than Prisma

- **Runtime**<br>
  Choice: Bun<br>
  Why Not the Alternative: 89K req/sec, 8ms cold start, native TypeScript

- **CSS**<br>
  Choice: Tailwind v4<br>
  Why Not the Alternative: Oxide engine (Rust), Lightning CSS, zero-runtime

- **Components**<br>
  Choice: shadcn/ui<br>
  Why Not the Alternative: Copy-paste, Radix primitives, fully customizable

- **Container**<br>
  Choice: Colima<br>
  Why Not the Alternative: Free, lightweight, no Docker Desktop license needed

</details>


---

## App Template

The `templates/synergine-app/` is a production-ready **Turborepo monorepo**:

```
synergine-app/
├── apps/
│   ├── server/          # Hono API (port 3001)
│   └── web/             # React + TanStack Router + Vite (port 5173)
├── packages/
│   ├── auth/            # Better Auth configuration
│   ├── db/              # Drizzle ORM + libSQL/Turso
│   ├── env/             # Zod environment validation
│   ├── ui/              # shadcn/ui component library
│   └── config/          # Shared TypeScript config
├── docker-compose.yml   # Infrastructure services
├── dev.sh               # One-command startup
└── turbo.json           # Turborepo pipeline
```

### Commands

```bash
./dev.sh              # Start everything (infra + app)
./dev.sh app          # App only (no Docker)
./dev.sh infra        # Infrastructure only
./dev.sh stop         # Stop everything
bun run dev           # Turborepo dev (API + frontend)
bun run build         # Production build
bun run db:push       # Push DB schema
bun run db:studio     # Drizzle Studio
bun run check         # Biome lint + format
```

---

## 100 Use Cases

What you can build with Synergine — from hours to days, not months.

### AI & Agents

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **AI Customer Support Bot**<br>
  #: 1<br>
  Key Stack: Hono API + SurrealDB (memory) + NATS (queue) + Claude API

- **Multi-Agent Orchestrator**<br>
  #: 2<br>
  Key Stack: NATS pub/sub + SurrealDB (state) + Dragonfly (cache)

- **RAG Knowledge Base**<br>
  #: 3<br>
  Key Stack: SurrealDB vectors + Meilisearch FTS + Ollama embeddings

- **AI Code Review Tool**<br>
  #: 4<br>
  Key Stack: Hono webhook + Claude API + GitHub integration

- **Voice Assistant**<br>
  #: 5<br>
  Key Stack: whisper-rs + Hono WebSocket + SurrealDB (context)

- **AI Writing Assistant**<br>
  #: 6<br>
  Key Stack: React + Hono + Claude API + SurrealDB (drafts)

- **Autonomous Research Agent**<br>
  #: 7<br>
  Key Stack: NATS tasks + Crawl4AI + SurrealDB graph (knowledge)

- **AI Image Pipeline**<br>
  #: 8<br>
  Key Stack: Candle/ONNX + Dragonfly queue + SurrealDB metadata

- **Chatbot with Memory**<br>
  #: 9<br>
  Key Stack: SurrealDB graph relations + vector similarity search

- **AI Email Responder**<br>
  #: 10<br>
  Key Stack: Resend + Claude API + SurrealDB (templates)

</details>


### SaaS Products

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **CRM System**<br>
  #: 11<br>
  Key Stack: SurrealDB graph + Hono API + React dashboard + Tremor

- **Project Management**<br>
  #: 12<br>
  Key Stack: SurrealDB relations + NATS real-time + shadcn/ui

- **Invoice & Billing**<br>
  #: 13<br>
  Key Stack: Stripe + Drizzle + React Email + PDF generation

- **Analytics Dashboard**<br>
  #: 14<br>
  Key Stack: Recharts/ECharts + SurrealDB + Dragonfly (caching)

- **Subscription Platform**<br>
  #: 15<br>
  Key Stack: Better Auth + Stripe/Polar + Drizzle

- **Multi-Tenant App**<br>
  #: 16<br>
  Key Stack: SurrealDB namespaces + Better Auth + Hono middleware

- **Form Builder**<br>
  #: 17<br>
  Key Stack: React DnD + SurrealDB (schemas) + Hono (submissions)

- **Booking System**<br>
  #: 18<br>
  Key Stack: SurrealDB (availability graph) + Stripe + React Email

- **Feedback Collection**<br>
  #: 19<br>
  Key Stack: Hono API + SurrealDB + PostHog analytics

- **White-Label Platform**<br>
  #: 20<br>
  Key Stack: Tailwind theming + SurrealDB per-tenant + Caddy routing

</details>


### E-Commerce

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Online Store**<br>
  #: 21<br>
  Key Stack: MedusaJS v2 + Stripe + Meilisearch (product search)

- **Digital Product Shop**<br>
  #: 22<br>
  Key Stack: Polar.sh + Hono + SurrealDB (licenses)

- **Marketplace**<br>
  #: 23<br>
  Key Stack: SurrealDB graph (sellers→products→buyers) + Stripe Connect

- **AI Product Recommendations**<br>
  #: 24<br>
  Key Stack: SurrealDB vectors + collaborative filtering

- **Inventory Management**<br>
  #: 25<br>
  Key Stack: SurrealDB + NATS events + Recharts dashboard

- **Price Comparison Engine**<br>
  #: 26<br>
  Key Stack: Spider scraping + SurrealDB + Meilisearch

- **Subscription Box**<br>
  #: 27<br>
  Key Stack: Stripe recurring + SurrealDB (curation) + React Email

- **Auction Platform**<br>
  #: 28<br>
  Key Stack: NATS real-time bids + SurrealDB + Dragonfly (leaderboard)

- **Affiliate Dashboard**<br>
  #: 29<br>
  Key Stack: SurrealDB graph (referrals) + Recharts + Hono API

- **Gift Card System**<br>
  #: 30<br>
  Key Stack: SurrealDB + Dragonfly (redemption cache) + Stripe

</details>


### Data & Analytics

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Business Intelligence Dashboard**<br>
  #: 31<br>
  Key Stack: Tremor + ECharts + SurrealDB analytics

- **Real-Time Metrics**<br>
  #: 32<br>
  Key Stack: NATS streaming + Dragonfly + Recharts live

- **Log Analysis Platform**<br>
  #: 33<br>
  Key Stack: Vector.dev + SurrealDB + Meilisearch

- **Survey & Polling**<br>
  #: 34<br>
  Key Stack: Hono + SurrealDB + Nivo charts

- **A/B Testing Platform**<br>
  #: 35<br>
  Key Stack: PostHog + Dragonfly (feature flags) + Recharts

- **SEO Rank Tracker**<br>
  #: 36<br>
  Key Stack: Spider crawler + SurrealDB time-series + Recharts

- **Social Media Analytics**<br>
  #: 37<br>
  Key Stack: Crawl4AI + SurrealDB + Tremor dashboard

- **Financial Dashboard**<br>
  #: 38<br>
  Key Stack: ECharts (candlestick) + SurrealDB + Dragonfly

- **Geospatial Analytics**<br>
  #: 39<br>
  Key Stack: Deck.gl + MapLibre + SurrealDB

- **Data Pipeline Monitor**<br>
  #: 40<br>
  Key Stack: NATS + Vector.dev + Tremor

</details>


### Automation & Scraping

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Lead Generation Engine**<br>
  #: 41<br>
  Key Stack: Spider/Crawl4AI + SurrealDB + Meilisearch

- **Price Monitoring**<br>
  #: 42<br>
  Key Stack: Patchright + Dragonfly (diffs) + NATS alerts

- **Content Aggregator**<br>
  #: 43<br>
  Key Stack: Spider + SurrealDB + Meilisearch (search)

- **Job Board Scraper**<br>
  #: 44<br>
  Key Stack: Crawl4AI + SurrealDB + React Email (alerts)

- **Review Monitoring**<br>
  #: 45<br>
  Key Stack: Spider + Claude sentiment + SurrealDB

- **Competitor Tracker**<br>
  #: 46<br>
  Key Stack: Spider + SurrealDB graph + Tremor dashboard

- **Social Listening**<br>
  #: 47<br>
  Key Stack: Crawl4AI + NATS streaming + SurrealDB

- **Email Finder**<br>
  #: 48<br>
  Key Stack: Spider + Dragonfly cache + SurrealDB (contacts)

- **Maps Lead Scraper**<br>
  #: 49<br>
  Key Stack: GoSom + SurrealDB + React dashboard

- **Automated Outreach**<br>
  #: 50<br>
  Key Stack: SurrealDB pipeline + Resend + NATS scheduling

</details>


### Developer Tools

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **API Gateway**<br>
  #: 51<br>
  Key Stack: Hono + Caddy + Dragonfly (rate limiting)

- **Feature Flag System**<br>
  #: 52<br>
  Key Stack: Dragonfly + Hono middleware + React SDK

- **Webhook Manager**<br>
  #: 53<br>
  Key Stack: Hono + NATS + SurrealDB (logs) + Dragonfly (retry)

- **Status Page**<br>
  #: 54<br>
  Key Stack: Hono health checks + SurrealDB + React

- **Documentation Site**<br>
  #: 55<br>
  Key Stack: Astro + Meilisearch (doc search)

- **CLI Tool Builder**<br>
  #: 56<br>
  Key Stack: Ratatui (Rust TUI) + Hono API backend

- **Database Admin Panel**<br>
  #: 57<br>
  Key Stack: React + SurrealDB direct + Drizzle Studio

- **Deployment Dashboard**<br>
  #: 58<br>
  Key Stack: Docker API + NATS events + Tremor

- **Log Viewer**<br>
  #: 59<br>
  Key Stack: SurrealDB + Meilisearch FTS + React virtual scroll

- **Error Tracking**<br>
  #: 60<br>
  Key Stack: Hono middleware + SurrealDB + Sentry integration

</details>


### Content & Media

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Blog / CMS**<br>
  #: 61<br>
  Key Stack: Astro + SurrealDB + Meilisearch + Caddy

- **Newsletter Platform**<br>
  #: 62<br>
  Key Stack: React Email + Resend + SurrealDB (subscribers)

- **Podcast Platform**<br>
  #: 63<br>
  Key Stack: Hono (uploads) + SurrealDB + React audio player

- **Video Course Platform**<br>
  #: 64<br>
  Key Stack: Hono + SurrealDB + Stripe + Better Auth

- **Image Gallery**<br>
  #: 65<br>
  Key Stack: Hono upload + Dragonfly (thumbnails) + React lightbox

- **Portfolio Generator**<br>
  #: 66<br>
  Key Stack: Astro + GSAP animations + Three.js hero

- **Social Media Scheduler**<br>
  #: 67<br>
  Key Stack: SurrealDB (queue) + NATS (timing) + React calendar

- **Wiki / Knowledge Base**<br>
  #: 68<br>
  Key Stack: SurrealDB graph (links) + Meilisearch + React

- **Event Platform**<br>
  #: 69<br>
  Key Stack: SurrealDB + Stripe + React Email + QR codes

- **Recipe / Cookbook App**<br>
  #: 70<br>
  Key Stack: SurrealDB + Meilisearch + React + Zustand

</details>


### Communication

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Real-Time Chat**<br>
  #: 71<br>
  Key Stack: NATS WebSocket + SurrealDB (history) + React

- **Notification Center**<br>
  #: 72<br>
  Key Stack: NATS pub/sub + Dragonfly + Sonner (toasts)

- **Team Collaboration**<br>
  #: 73<br>
  Key Stack: SurrealDB graph + NATS real-time + React

- **Customer Support Desk**<br>
  #: 74<br>
  Key Stack: SurrealDB (tickets) + NATS (assignment) + React

- **Internal Messaging**<br>
  #: 75<br>
  Key Stack: NATS + SurrealDB + Better Auth (teams)

- **Email Campaign Manager**<br>
  #: 76<br>
  Key Stack: React Email + Resend + SurrealDB (analytics)

- **SMS Gateway**<br>
  #: 77<br>
  Key Stack: Hono + Twilio + SurrealDB (logs) + NATS

- **Push Notification Service**<br>
  #: 78<br>
  Key Stack: NATS + Dragonfly (tokens) + Hono

- **Video Call Integration**<br>
  #: 79<br>
  Key Stack: WebRTC + NATS signaling + SurrealDB (rooms)

- **Comment System**<br>
  #: 80<br>
  Key Stack: SurrealDB graph (threads) + React + Hono

</details>


### Desktop & Mobile

<details>
<summary><strong>📋 Show 10 entries</strong></summary>

- **Desktop AI Assistant**<br>
  #: 81<br>
  Key Stack: Tauri 2 + Ollama + SurrealDB embedded

- **Local-First Note App**<br>
  #: 82<br>
  Key Stack: Tauri 2 + SurrealDB + Markdown editor

- **Desktop Dashboard**<br>
  #: 83<br>
  Key Stack: Tauri 2 + React + Tremor + system tray

- **File Manager**<br>
  #: 84<br>
  Key Stack: Tauri 2 + Rust fs + React file browser

- **Offline-First Mobile App**<br>
  #: 85<br>
  Key Stack: React Native + SurrealDB + sync protocol

- **CLI Productivity Tool**<br>
  #: 86<br>
  Key Stack: Ratatui + Hono API + SurrealDB

- **System Monitor**<br>
  #: 87<br>
  Key Stack: Tauri 2 + bottom (btm) + React charts

- **Password Manager**<br>
  #: 88<br>
  Key Stack: Tauri 2 + age encryption + SurrealDB

- **Screenshot Tool**<br>
  #: 89<br>
  Key Stack: Tauri 2 + Rust image processing + cloud sync

- **Time Tracker**<br>
  #: 90<br>
  Key Stack: Tauri 2 + SurrealDB + Recharts reports

</details>


### Security & Infrastructure

<details>
<summary><strong>📋 Show 5 entries</strong></summary>

- **Vulnerability Scanner**<br>
  #: 91<br>
  Key Stack: Axum + Spider crawler + SurrealDB (findings)

- **Secret Manager**<br>
  #: 92<br>
  Key Stack: Rustls + age encryption + Hono API

- **Access Control System**<br>
  #: 93<br>
  Key Stack: Better Auth + SurrealDB (permissions graph)

- **Audit Log System**<br>
  #: 94<br>
  Key Stack: NATS events + SurrealDB (immutable log)

- **Firewall Dashboard**<br>
  #: 95<br>
  Key Stack: Hono + SurrealDB + Recharts + real-time NATS

</details>


### 3D & Creative

<details>
<summary><strong>📋 Show 5 entries</strong></summary>

- **3D Product Configurator**<br>
  #: 96<br>
  Key Stack: Three.js + R3F + React + Hono API

- **Interactive Data Globe**<br>
  #: 97<br>
  Key Stack: Three.js + Deck.gl + SurrealDB

- **Animated Landing Page**<br>
  #: 98<br>
  Key Stack: GSAP ScrollTrigger + Magic UI + Motion + Astro

- **Architecture Viewer**<br>
  #: 99<br>
  Key Stack: Three.js + Spline models + React controls

- **Generative Art Platform**<br>
  #: 100<br>
  Key Stack: p5.js + Three.js + SurrealDB (gallery) + Stripe

</details>


---

## Tool Knowledge Base

Synergine includes a **curated knowledge base of 171 tools** across 35+ categories, stored in SurrealDB with vector embeddings for semantic search.

### Categories

<details>
<summary><strong>📋 Show 13 entries</strong></summary>

- **Web Frameworks**<br>
  Count: 11<br>
  Examples: Hono, Axum, Astro, Next.js, Loco.rs

- **UI Components**<br>
  Count: 10<br>
  Examples: shadcn/ui, Magic UI, Radix, HeroUI, Mantine

- **Animation**<br>
  Count: 6<br>
  Examples: Motion, GSAP 3 (all free!), Rive, Lottie

- **3D / WebGL**<br>
  Count: 3<br>
  Examples: Three.js + R3F, Spline, Pixi.js

- **Data Viz**<br>
  Count: 7<br>
  Examples: Tremor, Recharts, Nivo, ECharts, Deck.gl

- **AI / ML**<br>
  Count: 7<br>
  Examples: Rig, Candle, Burn, Claude Agent SDK

- **Databases**<br>
  Count: 8<br>
  Examples: SurrealDB, PostgreSQL, Turso, DuckDB

- **Scraping**<br>
  Count: 9<br>
  Examples: Spider, Crawl4AI, Firecrawl, GoSom

- **CLI Tools**<br>
  Count: 11<br>
  Examples: ripgrep, fd, bat, just, zoxide, Ratatui

- **DevOps**<br>
  Count: 2<br>
  Examples: Firecracker, gitoxide

- **Security**<br>
  Count: 1<br>
  Examples: Rustls

- **Testing**<br>
  Count: 5<br>
  Examples: Vitest, Playwright, cargo-nextest

- **...and 20+ more**<br>
  Count: —<br>
  Examples: See `docs/superrag/` for full catalog

</details>


### Semantic Search

Query the knowledge base with natural language:

```bash
# Start the local SurrealDB toolstack
source ~/.claude/scripts/sdb.sh && sdb_start

# Semantic search
python3 -c "
from embed_toolstack import embed, sql
vec = embed('animation library for React')
results = sql(f'SELECT name, score FROM tool WHERE embedding != NONE ORDER BY vector::similarity::cosine(embedding, {vec}) DESC LIMIT 5')
"
# → Motion, Motion One, GSAP 3, AutoAnimate, Lottie
```

### Graph Relations

```surql
-- What integrates with SurrealDB?
SELECT ->integrates_with->tool.name FROM tool:surrealdb;
-- → [Axum, Rig, Tauri, Vector.dev, DataFusion, ...]

-- What competes with Hono?
SELECT ->competes_with->tool.name FROM tool:hono;
-- → [Axum, FastAPI, Elysia]
```

---

## Rust Superstack

For performance-critical components, Synergine includes a curated Rust layer.

### Core Picks

<details>
<summary><strong>📋 Show 8 entries</strong></summary>

- **Axum**<br>
  Purpose: Web APIs<br>
  Why: Tokio ecosystem, 17-18K req/sec

- **Rig**<br>
  Purpose: AI Agents<br>
  Why: 24% CPU vs Python's 64%, modular

- **Candle**<br>
  Purpose: ML Inference<br>
  Why: CPU/CUDA/Metal/WASM, HuggingFace

- **Tauri 2**<br>
  Purpose: Desktop Apps<br>
  Why: 10-20MB (vs 100MB Electron)

- **Spider**<br>
  Purpose: Web Crawling<br>
  Why: 200-1000x faster, 100K+ pages/min

- **SeaORM**<br>
  Purpose: Database ORM<br>
  Why: Async, 250K+ weekly downloads

- **Rustls**<br>
  Purpose: TLS<br>
  Why: Faster than OpenSSL, memory-safe

- **gitoxide**<br>
  Purpose: Git Operations<br>
  Why: Pure Rust, no libgit2 dependency

</details>


### Hybrid Architecture

```
TypeScript (Hono/React)     Rust (Axum/Rig)
━━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━
  API Routes                  Embeddings
  Frontend UI                 Vector Search
  Auth/Sessions               Crypto/TLS
  Dashboard                   Web Crawling
  Business Logic              ML Inference
```

**Bridge:** napi-rs (Node.js) | wasm-bindgen (Browser) | Tauri (Desktop)

Full catalog: [`docs/superrag/RUST_SUPERSTACK.md`](docs/superrag/RUST_SUPERSTACK.md)

---

## UI / Animation / 3D Stack

### Animation (all free in 2026!)

<details>
<summary><strong>📋 Show 5 entries</strong></summary>

- **Motion**<br>
  Size: 17 KB<br>
  Best For: React animations, layout, gestures

- **GSAP 3**<br>
  Size: 18 KB<br>
  Best For: Complex timelines — **ALL plugins now free**

- **View Transitions API**<br>
  Size: 0 KB<br>
  Best For: Page transitions (native browser)

- **AutoAnimate**<br>
  Size: 1.9 KB<br>
  Best For: Zero-config list animations

- **Rive**<br>
  Size: 200 KB<br>
  Best For: Interactive state-machine animations

</details>


### Data Visualization

<details>
<summary><strong>📋 Show 5 entries</strong></summary>

- **Tremor**<br>
  Best For: Dashboard KPIs (Vercel-backed)

- **Recharts**<br>
  Best For: Simple React charts

- **Apache ECharts**<br>
  Best For: Millions of data points (GPU)

- **Deck.gl**<br>
  Best For: Geospatial maps (100K+ points)

- **Visx**<br>
  Best For: Custom visualizations (Airbnb)

</details>


### 3D

<details>
<summary><strong>📋 Show 2 entries</strong></summary>

- **Three.js + R3F**<br>
  Best For: 3D web (WebGPU ready, 2.7M DL/wk)

- **Spline**<br>
  Best For: No-code 3D design with AI

</details>


Full catalog: [`docs/superrag/UI_STACK.md`](docs/superrag/UI_STACK.md)

---

## Infrastructure Services

<details>
<summary><strong>📋 Show 9 entries</strong></summary>

- **SurrealDB**<br>
  Port: 8000<br>
  Purpose: Multi-model DB (graph+vector+doc+FTS)<br>
  Profile: core

- **Dragonfly**<br>
  Port: 6379<br>
  Purpose: Redis-compatible cache (25x faster)<br>
  Profile: core

- **NATS**<br>
  Port: 4222<br>
  Purpose: Cloud-native messaging + JetStream<br>
  Profile: core

- **Meilisearch**<br>
  Port: 7700<br>
  Purpose: Full-text search (typo-tolerant)<br>
  Profile: search

- **Caddy**<br>
  Port: 80/443<br>
  Purpose: Reverse proxy + auto HTTPS<br>
  Profile: gateway

- **SigNoz**<br>
  Port: 3301<br>
  Purpose: OpenTelemetry traces + metrics<br>
  Profile: monitoring

- **Langfuse**<br>
  Port: 3100<br>
  Purpose: LLM observability + evals<br>
  Profile: monitoring

- **Windmill**<br>
  Port: 8100<br>
  Purpose: Workflow automation<br>
  Profile: workflows

- **Listmonk**<br>
  Port: 9000<br>
  Purpose: Newsletter + email campaigns<br>
  Profile: email

</details>


### Profiles

```bash
# Minimal (4GB RAM)
docker compose up -d                                    # core only

# Development (8GB RAM)
docker compose --profile search up -d                   # + Meilisearch

# Production (16GB RAM)
docker compose --profile search --profile gateway --profile monitoring up -d

# Everything (24GB RAM)
docker compose --profile search --profile gateway --profile monitoring \
  --profile workflows --profile email up -d
```

---

## Stack Fit Guide

What to add to your Synergine app, and when:

### Day 1 (included)
Hono, React, Bun, Drizzle, Better Auth, Tailwind v4, shadcn/ui, Biome, Turborepo

### Week 1 (one `bun add` away)
```bash
bun add motion gsap zustand @tanstack/react-query   # State + Animation
bun add sonner vaul cmdk                             # Micro-interactions
bun add recharts @tremor/react                       # Charts + Dashboard
bun add react-email resend                           # Email
bun add stripe                                       # Payments
bun add -D vitest @playwright/test                   # Testing
```

### When Product Ships
- **Sentry** — Error tracking (free tier)
- **PostHog** — Analytics (free tier)
- **GSAP ScrollTrigger** — Landing page animations
- **Passkeys/WebAuthn** — Better Auth plugin
- **Coolify** — Self-hosted deploy

### Only If Needed
- **Astro** — Separate marketing/content site
- **Tauri 2** — Desktop version
- **MedusaJS** — E-Commerce backend
- **Axum/Rig** — Rust microservice for performance
- **Three.js** — 3D product viewer

### Never Touch
Redux, Webpack, Babel, Jest, TypeORM, Styled Components, Prisma, n8n, Heroku, Datadog

Full analysis: [`docs/superrag/STACK_FIT.md`](docs/superrag/STACK_FIT.md)

---

## Documentation

<details>
<summary><strong>📋 Show 7 entries</strong></summary>

- **[`docs/superrag/RUST_SUPERSTACK.md`](docs/superrag/RUST_SUPERSTACK.md)**<br>
  Description: Rust tool catalog (Axum, Rig, Candle, Tauri, Spider...)

- **[`docs/superrag/UI_STACK.md`](docs/superrag/UI_STACK.md)**<br>
  Description: UI Components + Animation + 3D + DataViz

- **[`docs/superrag/STACK_FIT.md`](docs/superrag/STACK_FIT.md)**<br>
  Description: What fits your stack and what doesn't

- **[`docs/superrag/SUPERSTACK.md`](docs/superrag/SUPERSTACK.md)**<br>
  Description: Master stack reference (8 tiers, 100+ tools)

- **[`docs/superrag/CASHMAKERS.md`](docs/superrag/CASHMAKERS.md)**<br>
  Description: 100 monetizable use cases with ZeroClaw

- **[`docs/superrag/ARCHITECTURE.md`](docs/superrag/ARCHITECTURE.md)**<br>
  Description: System architecture + knowledge graph design

- **[`docs/superrag/OBSOLETE.md`](docs/superrag/OBSOLETE.md)**<br>
  Description: What NOT to use in 2026

</details>


---

## Development

```bash
# Clone
git clone https://github.com/supersynergy/synergine.git
cd synergine

# Infrastructure
colima start --cpu 4 --memory 8 --disk 60
docker compose up -d

# App development
cd templates/synergine-app
bun install
bun run dev             # API + Frontend
bun run build           # Production build
bun run check           # Lint + Format (Biome)
bun run db:push         # Push schema
bun run db:studio       # Drizzle Studio
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with Synergine by <a href="https://github.com/Supersynergy">SuperSynergy</a><br>
  <em>Ship fast. Ship modern. Ship now.</em>
</p>
