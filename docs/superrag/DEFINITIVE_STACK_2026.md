# The Definitive Stack 2026 — Synergine Edition

> Synthesized: 2026-03-18 | Sources: 23 research agents, Gemini deep analysis, blessed.rs, awesome-rust, npm/GitHub data
> Strategy: Anti-fragile, AI-ready, zero vendor lock-in, MIT-only where possible

---

## The Philosophy: Why This Stack Wins

Three principles drive every decision:

1. **Code Ownership > npm Dependency** — Copy-paste (shadcn model) beats installed packages. You own the code, AI agents can modify it, no breaking updates.
2. **Native Browser APIs > JavaScript Libraries** — View Transitions API (0KB) > page transition libraries. CSS scroll-driven animations (0KB) > ScrollTrigger. Less JS = faster.
3. **Rust Under the Hood > JavaScript Tooling** — Vite (Rolldown/Rust), Biome/Oxlint (Rust), Tailwind v4 (Oxide/Rust), SurrealDB (Rust), Dragonfly (C++). The tools you interact with are TS/React. The engines are Rust.

---

## LAYER 1: Toolchain — The Invisible Foundation

### Vite 6 + Rolldown (Rust Bundler)

| Aspect | Detail |
|--------|--------|
| **Version** | Vite 6.4 (March 2026), Rolldown replacing Rollup |
| **Why** | Environment API for edge rendering, Rust-powered bundling 10-100x faster |
| **HMR** | <50ms hot reload in dev |
| **Vite+ (vp CLI)** | VoidZero's unified toolchain — bundles Vite + Rolldown + Oxc + Vitest under one CLI |

### Bun 1.3 (Runtime + Package Manager)

| Aspect | Detail |
|--------|--------|
| **Performance** | 89K req/sec, 8-15ms cold start (vs Node 60-120ms) |
| **Why** | Runtime + bundler + test runner + package manager in one binary |
| **Limitation** | 34% native addon compatibility — use Node 22 for Lambda/heavy native deps |

### Biome 2.2 (Lint + Format)

| Aspect | Detail |
|--------|--------|
| **Speed** | 10-25x faster than ESLint+Prettier |
| **Why** | Single tool replaces ESLint + Prettier + import sorting. One config file. |
| **Alternative** | Oxlint (50-100x faster, but less rules) — use if Biome is too slow (unlikely) |

### Turborepo 2.8 (Monorepo)

| Aspect | Detail |
|--------|--------|
| **Why** | Intelligent caching, parallel task execution, Vercel-backed |
| **Pattern** | `turbo dev` runs API + frontend + packages simultaneously |

### KILL LIST — Toolchain

| Tool | Why Kill It |
|------|------------|
| **Webpack** | Dead. 10-100x slower than Vite. No HMR. Legacy config hell. |
| **Babel** | Replaced by SWC (Rust). Vite/Next.js use SWC automatically. |
| **ESLint + Prettier** | Two tools, constant config conflicts. Biome does both, 25x faster. |
| **Create React App** | Officially deprecated. Use Vite. |
| **npm** | Slow. pnpm for monorepos, Bun for speed. |
| **nvm/pyenv** | Use mise (Rust, one tool for all runtimes, <5ms init). |

---

## LAYER 2: UI Components — Code You Own

### PRIMARY: shadcn/ui CLI v4 (March 2026)

| Aspect | Detail |
|--------|--------|
| **Stars** | 94K+ GitHub |
| **Model** | Copy-paste (not npm install). You own every line. |
| **CLI v4 News** | `--dry-run`, `--diff`, `--view` flags. Presets engine. Base UI support. |
| **shadcn/skills** | AI agent context — Claude Code, Cursor, Copilot understand your components |
| **Primitives** | Radix UI (default) or Base UI (better TS types, MUI engineering team) |
| **Why #1** | AI-readiest design system. v0, Claude, Cursor all trained on shadcn patterns. |

### SPECIALIST: Mantine v8.3 → v9

| Aspect | Detail |
|--------|--------|
| **Stars** | 27K+ |
| **Components** | 120+ components, 100+ hooks, Rich Text Editor, Date Picker, Spotlight |
| **v9** | React 19.2+, FloatingWindow, OverflowList, @mantine/schedule (calendar) |
| **When** | Internal tools, admin dashboards where speed > branding. 20min sortable table vs 1 day with shadcn. |
| **When NOT** | Customer-facing products where design differentiation matters. |

### COPY-PASTE ANIMATION COMPONENTS

| Library | Stars | Best For |
|---------|-------|----------|
| **Magic UI** | 15K+ | Animated landing page sections |
| **Aceternity UI** | 10K+ | Premium hero sections, glassmorphism |
| **Origin UI** | New | Beautiful prebuilt blocks |

### MICRO-INTERACTION PRIMITIVES

| Tool | Purpose | Size |
|------|---------|------|
| **Sonner** | Toast notifications | Tiny |
| **Vaul** | Drawer/bottom sheet | Tiny |
| **cmdk** | Command palette (Cmd+K) | Tiny |
| **React Email** | Email templates in React | Build-time |

### KILL LIST — UI Components

| Tool | Why Kill It |
|------|------------|
| **MUI (Material UI)** | 100-200KB gzipped. Google's design language, not yours. v5→v6→v7 migration hell. **Exception:** MUI X Data Grid Pro for complex tables — nothing else comes close. |
| **Ant Design** | Enterprise bloat, Chinese market focus, huge bundle, docs partially Chinese-only. |
| **Chakra UI** | Downloads sinking. v2→v3 rewrite on Panda CSS broke ecosystem. Stuck in the middle. |
| **Headless UI** | Redundant. shadcn + Radix/Base UI does everything Headless UI does, better. |
| **Park UI / Ark UI** | Panda CSS ecosystem too small. Interesting concept, wrong timing. Watch, don't adopt. |
| **Styled Components / Emotion** | Runtime CSS-in-JS. Conflicts with Server Components. Tailwind v4 is zero-runtime. |
| **Bootstrap** | 2015 called. |

---

## LAYER 3: Animation & Motion — Native First

### PRIMARY: Motion v12.36 (March 2026)

| Aspect | Detail |
|--------|--------|
| **Downloads** | 30M+/month (10x GSAP) |
| **Bundle** | ~17KB (animate), LazyMotion ~15KB |
| **License** | MIT, irrevocable. Sponsored by Framer, Figma, Tailwind, LottieFiles. |
| **Performance** | 2.5x faster than GSAP (unknown values), 6x faster (type transitions) |
| **Engine** | Hybrid: Web Animations API + ScrollTimeline for 120fps. Falls back to JS only when needed (spring physics, gesture tracking). |
| **Framework** | React, Vue, vanilla JS (no longer React-only!) |
| **Why #1** | Declarative, React-native, MIT, fastest, biggest community. No contest. |

### NATIVE BROWSER APIS (0KB!)

| API | Support | Replaces |
|-----|---------|----------|
| **View Transitions API** | MPA + SPA, all browsers | Page transition libraries |
| **CSS scroll-driven animations** | 83-85% browsers | GSAP ScrollTrigger for simple cases |
| **CSS @starting-style** | New | Entry animations without JS |

**Strategy:** Use native APIs as default. Motion for complex interactions. GSAP only for extremely complex timeline choreography.

### SPECIALIST

| Tool | Size | When |
|------|------|------|
| **Rive** | 200KB runtime | Interactive state-machine animations (icons that react, onboarding flows). Lottie killer. |
| **AutoAnimate** | 1.9KB | Zero-config list/DOM animations. One line of code. |
| **Lottie/dotLottie** | 50KB | Only as a format exported from After Effects. dotLottie is 80% smaller. |

### KILL LIST — Animation

| Tool | Why Kill It |
|------|------------|
| **GSAP** | **CRITICAL LICENSE RISK.** Closed source, owned by Webflow. License says Webflow can terminate at their discretion. Prohibited in tools competing with Webflow. Motion does 95% of what GSAP does, with MIT license. **Only exception:** Extremely complex 50+ element timeline choreography where GSAP's timeline system is still superior. |
| **Anime.js** | 319K downloads vs Motion's 30M. Solves nothing Motion doesn't solve better. No React integration. |
| **React Spring** | Motion has built-in spring physics (`spring: { stiffness, damping }`). Declining trend. |
| **Popmotion** | Not maintained. Was Framer Motion's predecessor. Legacy. |
| **Motion One** | Same author as Motion (Matt Perry). Motion subsumes everything Motion One does, plus more. No reason for separate import. |
| **Lottie (as primary)** | Linear animations only (no state machines). Heavy JSON. Use Rive instead. Keep Lottie only as import format. |
| **Theatre.js** | Development stalled. v1.0 promised 2024, never shipped. Unreliable. |

---

## LAYER 4: 3D & WebGL — WebGPU Is Here

### PRIMARY: Three.js r171+ & React Three Fiber

| Aspect | Detail |
|--------|--------|
| **Downloads** | 2.7M/week (270x more than Babylon.js) |
| **WebGPU** | Production-ready since r171 (Sept 2025). Zero-config import. |
| **Browser support** | Chrome 113+, Firefox 141+, Safari macOS Tahoe/iOS 26. ~95% coverage. |
| **Fallback** | Automatic WebGL 2 fallback. Zero risk. |
| **Ecosystem** | Drei (helpers), @react-three/postprocessing, Theatre.js (animation), Rapier (physics) |

```javascript
// WebGPU in 3 lines — automatic WebGL fallback
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
```

### SPECIALIST

| Tool | When |
|------|------|
| **Spline** | No-code 3D prototyping. Designer creates, dev embeds React component. Quick demos, not production. |
| **Pixi.js** | 2D WebGL renderer (43K stars). Only if building 2D games/slot machines. |

### KILL LIST — 3D

| Tool | Why Kill It |
|------|------------|
| **Babylon.js** | 270x less downloads than Three.js. Only relevant for VR/AR games. Tiny ecosystem. |
| **PlayCanvas** | Game engine with editor. Wrong approach for web experiences. |
| **Vanilla Three.js in React** | Imperative code = spaghetti. Use R3F for declarative 3D. |
| **Any WebGPU engine without Three.js** | No community support. Three.js HAS WebGPU. You don't need a separate engine. |

---

## LAYER 5: Data Visualization — By Data Volume

### Decision Matrix

| Data Points | Best Tool | Bundle | Why |
|------------|-----------|--------|-----|
| **<1,000** | **Tremor** | 40KB | Tailwind-native, 300 free blocks, Vercel-backed (acquired Jan 2026) |
| **1K-10K** | **Recharts** (via Tremor) | 50-70KB | Declarative React, beautiful defaults |
| **Exotic charts** | **Nivo** | 80-100KB | Choropleth, Sankey, Voronoi, Radar — D3-powered |
| **10K-100K** | **Apache ECharts** | 200-250KB | GPU-accelerated Canvas+WebGL |
| **Custom/bespoke** | **Visx** (Airbnb) | 15KB modular | D3 math + React rendering. Build your own. |
| **100K+ geospatial** | **Deck.gl** | 150KB | WebGL2/WebGPU, 1M+ data points |
| **Maps** | **MapLibre GL** | 100KB | Free open-source Mapbox fork |

### KILL LIST — Data Viz

| Tool | Why Kill It |
|------|------------|
| **D3.js directly in React** | Imperative DOM manipulation conflicts with React's declarative model. Use Visx (D3 math + React rendering). |
| **Chart.js / react-chartjs-2** | Canvas-based, no Tailwind integration, not React-first. Tremor/Recharts are better in every way. |
| **Plotly.js** | Python/R ecosystem. Huge bundle. Not React-first. |
| **Recharts directly** | Tremor and Mantine Charts both wrap Recharts with better defaults. Don't use raw Recharts unless you need specific customization. |
| **LightningChart** | Commercial, expensive, niche (100M+ points in real-time finance). Not your market. |
| **Google Charts** | Vendor lock-in, requires internet, limited customization. |

---

## LAYER 6: Backend & Infrastructure

### The Synergine Stack

| Service | Role | Why This One |
|---------|------|-------------|
| **Hono** | API Server | 402K ops/sec, 14KB, runs everywhere (Bun/Node/CF Workers/Deno). Hono RPC = type-safe without tRPC overhead. |
| **Better Auth** | Authentication | Free, MIT, self-hosted, TS-native, Passkeys/WebAuthn ready. No Clerk/Auth0 bills. |
| **Drizzle ORM** | Database layer | Edge-compatible, type-safe, lighter than Prisma (85% smaller). |
| **SurrealDB 3.0** | Multi-model DB | Graph + Vector + Doc + FTS in ONE database. Replaces Postgres + Redis + Elastic combo. |
| **Dragonfly** | Cache | 25x faster than Redis, drop-in compatible. |
| **NATS** | Messaging | 10x lighter than Kafka, JetStream for persistence. Perfect for AI agents. |
| **Meilisearch** | Search | Typo-tolerant, instant, open-source Algolia replacement. |
| **Caddy** | Reverse Proxy | Auto HTTPS, zero-config. |
| **Colima** | Container Runtime | Free, lightweight. No Docker Desktop license. |

### KILL LIST — Backend

| Tool | Why Kill It | Replacement |
|------|------------|-------------|
| **tRPC** | Hono RPC does the same thing, simpler. Less overhead, same type safety. | Hono RPC |
| **GraphQL** | Overkill for solo/small teams. Schema maintenance overhead for no benefit. | REST + Hono RPC |
| **Redis** | You have Dragonfly (25x faster, drop-in compatible). | Dragonfly |
| **Algolia** | Expensive SaaS. You have Meilisearch (free, self-hosted). | Meilisearch |
| **Clerk / Auth0** | Monthly bills for auth. You have Better Auth (free, MIT). | Better Auth |
| **Prisma** | Heavy, not edge-compatible, slow migrations. | Drizzle |
| **Vercel** | Vendor lock-in, expensive at scale. | Coolify + Caddy + Cloudflare |
| **n8n** | GUI workflow tool. Code-first is faster and more maintainable. | Inngest / Trigger.dev |
| **Heroku** | Dead. Expensive. No innovation since 2018. | Railway / Coolify |
| **Datadog** | $$$$$. | Sentry (free) + Langfuse (LLM observability) |
| **Express** | Slow, no type safety, 2015 patterns. | Hono |

---

## LAYER 7: Rust Superstack (Performance Layer)

When TypeScript isn't fast enough, drop to Rust for the hot path.

### Core Rust Picks

| Tool | Purpose | Why |
|------|---------|-----|
| **Axum** | Web APIs | Tokio ecosystem, 17-18K req/sec, Tower middleware |
| **Rig** | AI Agents | 24% CPU vs Python's 64%, modular, multi-LLM |
| **Candle** | ML Inference | CPU/CUDA/Metal/WASM, HuggingFace ecosystem |
| **Tauri 2** | Desktop Apps | 10-20MB vs 100MB Electron, web frontend + Rust backend |
| **Spider** | Web Crawling | 200-1000x faster, 100K+ pages/min |
| **SeaORM** | Database ORM | Async, 250K+ weekly DL, enterprise-grade |
| **Rustls** | TLS | Faster than OpenSSL, memory-safe, used by Let's Encrypt |

### Hybrid Architecture Pattern

```
TypeScript (Hono/React)          Rust (Axum/Rig)
━━━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━━━━
  API Routes                      Embeddings generation
  Frontend UI                     Vector search
  Auth / Sessions                 Crypto / TLS
  Dashboard / Charts              Web crawling at scale
  Business Logic                  ML inference
  Real-time (WebSocket)           Data pipeline (Vector.dev)

Bridge: napi-rs (Node) | wasm-bindgen (Browser) | Tauri (Desktop)
```

---

## CORRELATIONS & SYNERGIES

### The Tailwind Ecosystem Convergence

Everything speaks Tailwind v4:
- shadcn/ui → Tailwind
- Tremor → Tailwind + Radix
- Magic UI / Aceternity UI → Tailwind
- Motion → works with Tailwind classes
- Mantine → has Tailwind integration

**One styling language. Zero context switches.**

### The Vercel Ecosystem Synergy

- shadcn/ui → Part of Vercel ecosystem (v0 trained on it)
- Tremor → Acquired by Vercel (Jan 2026)
- Turborepo → Vercel product
- Next.js → Vercel product

**Even without deploying on Vercel, their tools are MIT and best-in-class.**

### The Copy-Paste Pattern

| Tool | Model |
|------|-------|
| shadcn/ui | Copy components into your codebase |
| Tremor | Copy dashboard blocks into your codebase |
| Magic UI | Copy animated sections into your codebase |

**No npm lock-in. If any tool dies, you have the source code. AI agents can freely modify everything.**

### The Rust Under the Hood Pattern

You write TypeScript. Rust does the heavy lifting invisibly:
- Vite → Rolldown (Rust bundler)
- Biome → Rust linter/formatter
- Tailwind v4 → Oxide engine (Rust)
- SurrealDB → Pure Rust database
- Dragonfly → C++ (Rust-level performance)
- ripgrep, fd, bat → Rust CLI tools

---

## THE COMPLETE KILL LIST

### Never Touch (Legacy)

| Category | Kill | Why | Replacement |
|----------|------|-----|-------------|
| Bundler | Webpack, Babel, CRA | 10-100x slower, config hell | Vite 6 + Rolldown |
| Linter | ESLint + Prettier | Two tools, constant conflicts | Biome (one tool, 25x faster) |
| Testing | Jest | Slow, complex config | Vitest (10-20x faster) |
| CSS | Styled Components, Emotion, CSS Modules | Runtime overhead, RSC conflicts | Tailwind v4 (zero runtime) |
| State | Redux | Overengineered boilerplate | Zustand + TanStack Query |
| ORM | TypeORM, Prisma | Bloated, not edge-compatible | Drizzle |
| UI | MUI, Ant Design, Chakra | Bundle bloat, vendor lock-in | shadcn/ui |
| Animation | Anime.js, React Spring, Popmotion | Declining, Motion does it better | Motion v12 |
| Animation | Lottie (as primary) | Linear only, heavy JSON | Rive (state machines) |
| Auth | Lucia (deprecated), Clerk ($$$) | Dead or expensive | Better Auth |
| Hosting | Heroku | Dead | Coolify / Railway |
| Monitoring | Datadog | $$$$$$ | Sentry (free) + Langfuse |
| Workflow | n8n | GUI dependency, not code-first | Inngest / Trigger.dev |
| Package | npm, nvm, pyenv | Slow, multiple tools | Bun (JS), mise (polyglot), uv (Python) |
| Scraping | BeautifulSoup, Selenium | Python legacy, slow | Crawl4AI, Spider (Rust) |
| Browser | undetected-chromedriver, Camoufox | Abandoned | Patchright |
| GraphQL | GraphQL for CRUD | Schema overhead, overkill for small teams | REST + Hono RPC |

### Strategic Risks (Use With Caution)

| Tool | Risk | Mitigation |
|------|------|-----------|
| **GSAP** | Webflow-owned, restrictive license, can be terminated | Use Motion for 95% of cases. GSAP only for extreme timeline choreography. |
| **Radix UI** | WorkOS acquisition slowed development | shadcn/ui now supports Base UI as alternative primitive layer |
| **Next.js** | Vercel lock-in pressure (middleware, caching) | Use Hono + React if you want framework independence |
| **Bun** | 34% native addon compatibility | Use Node 22 for Lambda / heavy native deps |

---

## ANTI-PATTERNS

### 1. The "Just Add Another Library" Trap
**Wrong:** Need a toast? `npm install react-hot-toast`. Need a drawer? `npm install react-drawer`. Need a modal? `npm install react-modal`.
**Right:** shadcn/ui has Toast (Sonner), Drawer (Vaul), Dialog (Radix) — all copy-pasted, all Tailwind, all consistent.

### 2. The "CSS-in-JS in 2026" Trap
**Wrong:** `styled(Button)` with runtime style injection that breaks SSR.
**Right:** Tailwind v4 classes. Zero runtime. Works with RSC. AI agents understand it.

### 3. The "D3 in React" Trap
**Wrong:** `useEffect(() => { d3.select(ref).append('svg')... })` — D3 fighting React for DOM control.
**Right:** Visx (D3 math + React SVG rendering) or Tremor/Recharts (pre-built).

### 4. The "GraphQL for Everything" Trap
**Wrong:** GraphQL schema + resolvers + code generation for a CRUD app with 10 endpoints.
**Right:** Hono routes with RPC client. Full type safety, zero schema overhead.

### 5. The "Kubernetes for Solo Dev" Trap
**Wrong:** K8s cluster with Helm charts for 3 services.
**Right:** Colima + Docker Compose. Scale when you actually have traffic.

### 6. The "Premium Auth" Trap
**Wrong:** Clerk at $25/month for auth that Better Auth does free.
**Right:** Better Auth (MIT, self-hosted, Passkeys, Social Login, 2FA).

### 7. The "Vendor Lock-in" Trap
**Wrong:** Vercel-only features (middleware, edge config) that only work on Vercel.
**Right:** Standard APIs that run anywhere. Hono works on Bun, Node, CF Workers, Deno.

---

## THE STACK ON ONE PAGE

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR PRODUCT                              │
│              (SaaS, AI Tool, Dashboard, Shop)               │
├─────────────────────────────────────────────────────────────┤
│  UI: shadcn/ui CLI v4 + Base UI │ Tailwind v4 (Oxide/Rust) │
│      + Sonner + Vaul + cmdk     │ + Magic UI / Aceternity  │
├─────────────┬───────────────────┼───────────────────────────┤
│  Animation  │  Data Viz         │  3D (on demand)           │
│  Motion v12 │  Tremor           │  Three.js + R3F           │
│  (+ Rive)   │  (+ Visx/ECharts) │  WebGPU ready            │
├─────────────┴───────────────────┴───────────────────────────┤
│  API: Hono 4 │ Auth: Better Auth │ State: Zustand + TQ      │
│  ORM: Drizzle │ DB: SQLite/Turso │ Email: React Email+Resend│
│  Pay: Stripe/Polar │ Analytics: PostHog │ Errors: Sentry    │
├─────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (Docker via Colima)                         │
│  SurrealDB │ Dragonfly │ NATS │ Meilisearch │ Caddy        │
├─────────────────────────────────────────────────────────────┤
│  RUST LAYER (hot path only)                                 │
│  Axum │ Rig │ Candle │ Tauri 2 │ Spider │ Rustls           │
├─────────────────────────────────────────────────────────────┤
│  TOOLCHAIN                                                  │
│  Bun │ Vite 6+Rolldown │ Biome │ Vitest │ Turborepo │ mise │
└─────────────────────────────────────────────────────────────┘
```

---

## WHAT BECOMES POSSIBLE

With this stack, you can:

1. **Ship an MVP in 72 hours** — `./dev.sh` → Hono API + React frontend + Auth + DB + Infra running
2. **Build dashboards in 2 hours** — Tremor blocks + shadcn/ui + Recharts
3. **Run 10K+ AI agents on a $10 VPS** — ZeroClaw + NATS + SurrealDB (Rust efficiency)
4. **Score 95-100 Lighthouse** — Tailwind (zero runtime) + Astro (zero JS default) + Motion (WAAPI)
5. **Full offline desktop apps** — Tauri 2 + SurrealDB embedded + Ollama
6. **Scrape at scale** — Spider (100K pages/min) + SurrealDB + Meilisearch
7. **Real-time everything** — NATS WebSocket + Dragonfly + SurrealDB LIVE queries
8. **AI-generated UI** — shadcn/skills + Claude Code = 3-5x faster development
9. **Zero monthly bills** — All infrastructure self-hosted on Colima. Better Auth free. Sentry free tier. PostHog free tier.
10. **Switch any component** — Copy-paste model means zero lock-in. If anything dies, you have the source code.

---

*"The impediment to action advances action. What stands in the way becomes the way." — Marcus Aurelius*

*Ship fast. Ship modern. Ship now.*
