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
  <em>Ship production AI products in hours, not months.</em>
</p>

<p align="center">
  <a href="#-quickstart">Quickstart</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-app-template">App Template</a> &bull;
  <a href="#-100-use-cases">100 Use Cases</a> &bull;
  <a href="#-tool-knowledge-base">Tool KB</a> &bull;
  <a href="#-rust-superstack">Rust Layer</a>
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

| Component | Choice | Why Not the Alternative |
|-----------|--------|----------------------|
| **Database** | SurrealDB | Graph + Vector + Doc + FTS in ONE db. No Postgres+Redis+Elastic combo needed |
| **Cache** | Dragonfly | 25x faster than Redis, drop-in compatible, single-threaded simplicity |
| **Messaging** | NATS | 10x lighter than Kafka, JetStream for persistence, perfect for agents |
| **Search** | Meilisearch | Typo-tolerant, instant, open-source Algolia replacement |
| **API** | Hono | 402K ops/sec, runs everywhere (Bun/Node/CF Workers/Deno), 14KB |
| **Auth** | Better Auth | Free, self-hosted, TypeScript-native, Passkeys ready |
| **ORM** | Drizzle | Edge-compatible, type-safe, lighter than Prisma |
| **Runtime** | Bun | 89K req/sec, 8ms cold start, native TypeScript |
| **CSS** | Tailwind v4 | Oxide engine (Rust), Lightning CSS, zero-runtime |
| **Components** | shadcn/ui | Copy-paste, Radix primitives, fully customizable |
| **Container** | Colima | Free, lightweight, no Docker Desktop license needed |

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

| # | Use Case | Key Stack |
|---|----------|-----------|
| 1 | **AI Customer Support Bot** | Hono API + SurrealDB (memory) + NATS (queue) + Claude API |
| 2 | **Multi-Agent Orchestrator** | NATS pub/sub + SurrealDB (state) + Dragonfly (cache) |
| 3 | **RAG Knowledge Base** | SurrealDB vectors + Meilisearch FTS + Ollama embeddings |
| 4 | **AI Code Review Tool** | Hono webhook + Claude API + GitHub integration |
| 5 | **Voice Assistant** | whisper-rs + Hono WebSocket + SurrealDB (context) |
| 6 | **AI Writing Assistant** | React + Hono + Claude API + SurrealDB (drafts) |
| 7 | **Autonomous Research Agent** | NATS tasks + Crawl4AI + SurrealDB graph (knowledge) |
| 8 | **AI Image Pipeline** | Candle/ONNX + Dragonfly queue + SurrealDB metadata |
| 9 | **Chatbot with Memory** | SurrealDB graph relations + vector similarity search |
| 10 | **AI Email Responder** | Resend + Claude API + SurrealDB (templates) |

### SaaS Products

| # | Use Case | Key Stack |
|---|----------|-----------|
| 11 | **CRM System** | SurrealDB graph + Hono API + React dashboard + Tremor |
| 12 | **Project Management** | SurrealDB relations + NATS real-time + shadcn/ui |
| 13 | **Invoice & Billing** | Stripe + Drizzle + React Email + PDF generation |
| 14 | **Analytics Dashboard** | Recharts/ECharts + SurrealDB + Dragonfly (caching) |
| 15 | **Subscription Platform** | Better Auth + Stripe/Polar + Drizzle |
| 16 | **Multi-Tenant App** | SurrealDB namespaces + Better Auth + Hono middleware |
| 17 | **Form Builder** | React DnD + SurrealDB (schemas) + Hono (submissions) |
| 18 | **Booking System** | SurrealDB (availability graph) + Stripe + React Email |
| 19 | **Feedback Collection** | Hono API + SurrealDB + PostHog analytics |
| 20 | **White-Label Platform** | Tailwind theming + SurrealDB per-tenant + Caddy routing |

### E-Commerce

| # | Use Case | Key Stack |
|---|----------|-----------|
| 21 | **Online Store** | MedusaJS v2 + Stripe + Meilisearch (product search) |
| 22 | **Digital Product Shop** | Polar.sh + Hono + SurrealDB (licenses) |
| 23 | **Marketplace** | SurrealDB graph (sellers→products→buyers) + Stripe Connect |
| 24 | **AI Product Recommendations** | SurrealDB vectors + collaborative filtering |
| 25 | **Inventory Management** | SurrealDB + NATS events + Recharts dashboard |
| 26 | **Price Comparison Engine** | Spider scraping + SurrealDB + Meilisearch |
| 27 | **Subscription Box** | Stripe recurring + SurrealDB (curation) + React Email |
| 28 | **Auction Platform** | NATS real-time bids + SurrealDB + Dragonfly (leaderboard) |
| 29 | **Affiliate Dashboard** | SurrealDB graph (referrals) + Recharts + Hono API |
| 30 | **Gift Card System** | SurrealDB + Dragonfly (redemption cache) + Stripe |

### Data & Analytics

| # | Use Case | Key Stack |
|---|----------|-----------|
| 31 | **Business Intelligence Dashboard** | Tremor + ECharts + SurrealDB analytics |
| 32 | **Real-Time Metrics** | NATS streaming + Dragonfly + Recharts live |
| 33 | **Log Analysis Platform** | Vector.dev + SurrealDB + Meilisearch |
| 34 | **Survey & Polling** | Hono + SurrealDB + Nivo charts |
| 35 | **A/B Testing Platform** | PostHog + Dragonfly (feature flags) + Recharts |
| 36 | **SEO Rank Tracker** | Spider crawler + SurrealDB time-series + Recharts |
| 37 | **Social Media Analytics** | Crawl4AI + SurrealDB + Tremor dashboard |
| 38 | **Financial Dashboard** | ECharts (candlestick) + SurrealDB + Dragonfly |
| 39 | **Geospatial Analytics** | Deck.gl + MapLibre + SurrealDB |
| 40 | **Data Pipeline Monitor** | NATS + Vector.dev + Tremor |

### Automation & Scraping

| # | Use Case | Key Stack |
|---|----------|-----------|
| 41 | **Lead Generation Engine** | Spider/Crawl4AI + SurrealDB + Meilisearch |
| 42 | **Price Monitoring** | Patchright + Dragonfly (diffs) + NATS alerts |
| 43 | **Content Aggregator** | Spider + SurrealDB + Meilisearch (search) |
| 44 | **Job Board Scraper** | Crawl4AI + SurrealDB + React Email (alerts) |
| 45 | **Review Monitoring** | Spider + Claude sentiment + SurrealDB |
| 46 | **Competitor Tracker** | Spider + SurrealDB graph + Tremor dashboard |
| 47 | **Social Listening** | Crawl4AI + NATS streaming + SurrealDB |
| 48 | **Email Finder** | Spider + Dragonfly cache + SurrealDB (contacts) |
| 49 | **Maps Lead Scraper** | GoSom + SurrealDB + React dashboard |
| 50 | **Automated Outreach** | SurrealDB pipeline + Resend + NATS scheduling |

### Developer Tools

| # | Use Case | Key Stack |
|---|----------|-----------|
| 51 | **API Gateway** | Hono + Caddy + Dragonfly (rate limiting) |
| 52 | **Feature Flag System** | Dragonfly + Hono middleware + React SDK |
| 53 | **Webhook Manager** | Hono + NATS + SurrealDB (logs) + Dragonfly (retry) |
| 54 | **Status Page** | Hono health checks + SurrealDB + React |
| 55 | **Documentation Site** | Astro + Meilisearch (doc search) |
| 56 | **CLI Tool Builder** | Ratatui (Rust TUI) + Hono API backend |
| 57 | **Database Admin Panel** | React + SurrealDB direct + Drizzle Studio |
| 58 | **Deployment Dashboard** | Docker API + NATS events + Tremor |
| 59 | **Log Viewer** | SurrealDB + Meilisearch FTS + React virtual scroll |
| 60 | **Error Tracking** | Hono middleware + SurrealDB + Sentry integration |

### Content & Media

| # | Use Case | Key Stack |
|---|----------|-----------|
| 61 | **Blog / CMS** | Astro + SurrealDB + Meilisearch + Caddy |
| 62 | **Newsletter Platform** | React Email + Resend + SurrealDB (subscribers) |
| 63 | **Podcast Platform** | Hono (uploads) + SurrealDB + React audio player |
| 64 | **Video Course Platform** | Hono + SurrealDB + Stripe + Better Auth |
| 65 | **Image Gallery** | Hono upload + Dragonfly (thumbnails) + React lightbox |
| 66 | **Portfolio Generator** | Astro + GSAP animations + Three.js hero |
| 67 | **Social Media Scheduler** | SurrealDB (queue) + NATS (timing) + React calendar |
| 68 | **Wiki / Knowledge Base** | SurrealDB graph (links) + Meilisearch + React |
| 69 | **Event Platform** | SurrealDB + Stripe + React Email + QR codes |
| 70 | **Recipe / Cookbook App** | SurrealDB + Meilisearch + React + Zustand |

### Communication

| # | Use Case | Key Stack |
|---|----------|-----------|
| 71 | **Real-Time Chat** | NATS WebSocket + SurrealDB (history) + React |
| 72 | **Notification Center** | NATS pub/sub + Dragonfly + Sonner (toasts) |
| 73 | **Team Collaboration** | SurrealDB graph + NATS real-time + React |
| 74 | **Customer Support Desk** | SurrealDB (tickets) + NATS (assignment) + React |
| 75 | **Internal Messaging** | NATS + SurrealDB + Better Auth (teams) |
| 76 | **Email Campaign Manager** | React Email + Resend + SurrealDB (analytics) |
| 77 | **SMS Gateway** | Hono + Twilio + SurrealDB (logs) + NATS |
| 78 | **Push Notification Service** | NATS + Dragonfly (tokens) + Hono |
| 79 | **Video Call Integration** | WebRTC + NATS signaling + SurrealDB (rooms) |
| 80 | **Comment System** | SurrealDB graph (threads) + React + Hono |

### Desktop & Mobile

| # | Use Case | Key Stack |
|---|----------|-----------|
| 81 | **Desktop AI Assistant** | Tauri 2 + Ollama + SurrealDB embedded |
| 82 | **Local-First Note App** | Tauri 2 + SurrealDB + Markdown editor |
| 83 | **Desktop Dashboard** | Tauri 2 + React + Tremor + system tray |
| 84 | **File Manager** | Tauri 2 + Rust fs + React file browser |
| 85 | **Offline-First Mobile App** | React Native + SurrealDB + sync protocol |
| 86 | **CLI Productivity Tool** | Ratatui + Hono API + SurrealDB |
| 87 | **System Monitor** | Tauri 2 + bottom (btm) + React charts |
| 88 | **Password Manager** | Tauri 2 + age encryption + SurrealDB |
| 89 | **Screenshot Tool** | Tauri 2 + Rust image processing + cloud sync |
| 90 | **Time Tracker** | Tauri 2 + SurrealDB + Recharts reports |

### Security & Infrastructure

| # | Use Case | Key Stack |
|---|----------|-----------|
| 91 | **Vulnerability Scanner** | Axum + Spider crawler + SurrealDB (findings) |
| 92 | **Secret Manager** | Rustls + age encryption + Hono API |
| 93 | **Access Control System** | Better Auth + SurrealDB (permissions graph) |
| 94 | **Audit Log System** | NATS events + SurrealDB (immutable log) |
| 95 | **Firewall Dashboard** | Hono + SurrealDB + Recharts + real-time NATS |

### 3D & Creative

| # | Use Case | Key Stack |
|---|----------|-----------|
| 96 | **3D Product Configurator** | Three.js + R3F + React + Hono API |
| 97 | **Interactive Data Globe** | Three.js + Deck.gl + SurrealDB |
| 98 | **Animated Landing Page** | GSAP ScrollTrigger + Magic UI + Motion + Astro |
| 99 | **Architecture Viewer** | Three.js + Spline models + React controls |
| 100 | **Generative Art Platform** | p5.js + Three.js + SurrealDB (gallery) + Stripe |

---

## Tool Knowledge Base

Synergine includes a **curated knowledge base of 171 tools** across 35+ categories, stored in SurrealDB with vector embeddings for semantic search.

### Categories

| Category | Count | Examples |
|----------|-------|---------|
| **Web Frameworks** | 11 | Hono, Axum, Astro, Next.js, Loco.rs |
| **UI Components** | 10 | shadcn/ui, Magic UI, Radix, HeroUI, Mantine |
| **Animation** | 6 | Motion, GSAP 3 (all free!), Rive, Lottie |
| **3D / WebGL** | 3 | Three.js + R3F, Spline, Pixi.js |
| **Data Viz** | 7 | Tremor, Recharts, Nivo, ECharts, Deck.gl |
| **AI / ML** | 7 | Rig, Candle, Burn, Claude Agent SDK |
| **Databases** | 8 | SurrealDB, PostgreSQL, Turso, DuckDB |
| **Scraping** | 9 | Spider, Crawl4AI, Firecrawl, GoSom |
| **CLI Tools** | 11 | ripgrep, fd, bat, just, zoxide, Ratatui |
| **DevOps** | 2 | Firecracker, gitoxide |
| **Security** | 1 | Rustls |
| **Testing** | 5 | Vitest, Playwright, cargo-nextest |
| **...and 20+ more** | — | See `docs/superrag/` for full catalog |

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

| Tool | Purpose | Why |
|------|---------|-----|
| **Axum** | Web APIs | Tokio ecosystem, 17-18K req/sec |
| **Rig** | AI Agents | 24% CPU vs Python's 64%, modular |
| **Candle** | ML Inference | CPU/CUDA/Metal/WASM, HuggingFace |
| **Tauri 2** | Desktop Apps | 10-20MB (vs 100MB Electron) |
| **Spider** | Web Crawling | 200-1000x faster, 100K+ pages/min |
| **SeaORM** | Database ORM | Async, 250K+ weekly downloads |
| **Rustls** | TLS | Faster than OpenSSL, memory-safe |
| **gitoxide** | Git Operations | Pure Rust, no libgit2 dependency |

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

| Library | Size | Best For |
|---------|------|----------|
| **Motion** | 17 KB | React animations, layout, gestures |
| **GSAP 3** | 18 KB | Complex timelines — **ALL plugins now free** |
| **View Transitions API** | 0 KB | Page transitions (native browser) |
| **AutoAnimate** | 1.9 KB | Zero-config list animations |
| **Rive** | 200 KB | Interactive state-machine animations |

### Data Visualization

| Tool | Best For |
|------|----------|
| **Tremor** | Dashboard KPIs (Vercel-backed) |
| **Recharts** | Simple React charts |
| **Apache ECharts** | Millions of data points (GPU) |
| **Deck.gl** | Geospatial maps (100K+ points) |
| **Visx** | Custom visualizations (Airbnb) |

### 3D

| Tool | Best For |
|------|----------|
| **Three.js + R3F** | 3D web (WebGPU ready, 2.7M DL/wk) |
| **Spline** | No-code 3D design with AI |

Full catalog: [`docs/superrag/UI_STACK.md`](docs/superrag/UI_STACK.md)

---

## Infrastructure Services

| Service | Port | Purpose | Profile |
|---------|------|---------|---------|
| **SurrealDB** | 8000 | Multi-model DB (graph+vector+doc+FTS) | core |
| **Dragonfly** | 6379 | Redis-compatible cache (25x faster) | core |
| **NATS** | 4222 | Cloud-native messaging + JetStream | core |
| **Meilisearch** | 7700 | Full-text search (typo-tolerant) | search |
| **Caddy** | 80/443 | Reverse proxy + auto HTTPS | gateway |
| **SigNoz** | 3301 | OpenTelemetry traces + metrics | monitoring |
| **Langfuse** | 3100 | LLM observability + evals | monitoring |
| **Windmill** | 8100 | Workflow automation | workflows |
| **Listmonk** | 9000 | Newsletter + email campaigns | email |

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

| Document | Description |
|----------|-------------|
| [`docs/superrag/RUST_SUPERSTACK.md`](docs/superrag/RUST_SUPERSTACK.md) | Rust tool catalog (Axum, Rig, Candle, Tauri, Spider...) |
| [`docs/superrag/UI_STACK.md`](docs/superrag/UI_STACK.md) | UI Components + Animation + 3D + DataViz |
| [`docs/superrag/STACK_FIT.md`](docs/superrag/STACK_FIT.md) | What fits your stack and what doesn't |
| [`docs/superrag/SUPERSTACK.md`](docs/superrag/SUPERSTACK.md) | Master stack reference (8 tiers, 100+ tools) |
| [`docs/superrag/CASHMAKERS.md`](docs/superrag/CASHMAKERS.md) | 100 monetizable use cases with ZeroClaw |
| [`docs/superrag/ARCHITECTURE.md`](docs/superrag/ARCHITECTURE.md) | System architecture + knowledge graph design |
| [`docs/superrag/OBSOLETE.md`](docs/superrag/OBSOLETE.md) | What NOT to use in 2026 |

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
