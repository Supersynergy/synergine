# Stack Fit Analysis — Was passt, was nicht

> Basis: Synergine App Stack (Hono+React+Bun+Drizzle+BetterAuth+Tailwind+shadcn)
> Infra: SurrealDB+Dragonfly+NATS+Meilisearch+Caddy+Colima
> 171 Tools in der KB, bewertet nach Fit

## ✅ PASST PERFEKT (bereits im Stack oder 1:1 kompatibel)

### Core Stack
| Tool | Rolle | Status |
|------|-------|--------|
| **Hono** | API Server | ✅ Im Stack |
| **React + TanStack Router** | Frontend | ✅ Im Stack |
| **Bun** | Runtime + Pkg Manager | ✅ Im Stack |
| **Drizzle ORM** | DB Layer (SQLite/Turso) | ✅ Im Stack |
| **Better Auth** | Authentication | ✅ Im Stack |
| **Tailwind v4** | CSS | ✅ Im Stack |
| **shadcn/ui** | UI Components | ✅ Im Stack |
| **Turborepo** | Monorepo Tasks | ✅ Im Stack |
| **Biome** | Linter + Formatter | ✅ Im Stack |

### Infra
| Tool | Rolle | Status |
|------|-------|--------|
| **SurrealDB 3.0** | Multi-Model DB | ✅ Docker |
| **Dragonfly** | Redis-Cache | ✅ Docker |
| **NATS** | Messaging | ✅ Docker |
| **Meilisearch** | Search | ✅ Profile:search |
| **Caddy** | Reverse Proxy | ✅ Profile:gateway |
| **Colima** | Container Runtime | ✅ Running |
| **Coolify** | Self-hosted Deploy | ✅ Kompatibel |

### Tools die sofort reinpassen
| Tool | Warum passt es | Aufwand |
|------|---------------|---------|
| **Motion** | Standard React Animation, 17KB | `bun add motion` |
| **GSAP 3** | Alle Plugins GRATIS, ScrollTrigger | `bun add gsap` |
| **Sonner** | Toasts (schon in Better-T-Stack catalog) | ✅ Schon da |
| **cmdk** | Command Palette | `bun add cmdk` |
| **Vaul** | Drawer/Sheet | `bun add vaul` |
| **Recharts** | Dashboard Charts | `bun add recharts` |
| **Tremor** | Dashboard Components (Vercel) | `bun add @tremor/react` |
| **Vitest** | Testing | `bun add -D vitest` |
| **Playwright** | E2E Testing | `bun add -D playwright` |
| **React Email** | Email Templates | `bun add react-email` |
| **Resend** | Email Sending | `bun add resend` |
| **Zustand** | Client State | `bun add zustand` |
| **TanStack Query** | Server State | `bun add @tanstack/react-query` |
| **Sentry** | Error Tracking | `bun add @sentry/react` |
| **PostHog** | Analytics | `bun add posthog-js` |
| **Polar.sh** | Payments (Digital) | API integration |
| **Stripe** | Payments (General) | `bun add stripe` |
| **Passkeys/WebAuthn** | Better Auth Plugin | Config only |

## ⚡ PASST MIT WENIG AUFWAND (Add-on Layer)

### UI Upgrades
| Tool | Wann einsetzen | Aufwand |
|------|---------------|---------|
| **Magic UI** | Animated Landing Pages | Copy-paste components |
| **Aceternity UI** | Premium Hero Sections | Copy-paste |
| **HeroUI** | Alternative zu shadcn wenn mehr "designed" | Swap möglich |
| **Radix UI** | Schon drin (via shadcn) | ✅ |
| **AutoAnimate** | Quick list animations | 1.9KB, 1 Zeile |

### Animation
| Tool | Wann einsetzen |
|------|---------------|
| **View Transitions API** | Page transitions (0KB, native!) |
| **CSS scroll-driven** | Scroll animations (0KB, native!) |
| **Motion One** | Wenn Motion zu groß (3.8KB vs 17KB) |
| **Rive** | Interaktive Animationen mit State Machine |
| **Lottie** | After Effects Export |

### 3D (wenn nötig)
| Tool | Wann |
|------|------|
| **Three.js + R3F** | 3D Product Viewer, Hero Section |
| **Spline** | Designer macht 3D, dev embedded |

### Data Viz (wenn nötig)
| Tool | Wann |
|------|------|
| **Tremor** | Dashboard KPIs |
| **Recharts** | Simple Charts |
| **ECharts** | Big Data, 10K+ Punkte |
| **Deck.gl** | Geospatial Maps |

## ⚠️ PASST BEDINGT (nur für spezifische Use Cases)

| Tool | Wann JA | Wann NEIN |
|------|---------|-----------|
| **Astro 5** | Content/Marketing/SEO Sites | Nicht für SaaS Dashboard |
| **Next.js 15** | Wenn du Vercel-Ökosystem willst | Du hast schon Hono+React |
| **tRPC** | TS Monorepo intern | Hono RPC macht dasselbe simpler |
| **Axum (Rust)** | Performance-kritische Microservices | Nicht als Hauptstack |
| **Tauri 2.0** | Desktop App bauen | Nur wenn Desktop nötig |
| **Dioxus** | Fullstack Rust UI | Nur wenn ALL-Rust gewollt |
| **Leptos** | Rust Web App | Nur wenn ALL-Rust gewollt |
| **PostgreSQL** | Wenn du relationale Garantien brauchst | Du hast SurrealDB |
| **Temporal.io** | Lange Workflows (Stunden/Tage) | Overkill für einfache Tasks |
| **Inngest** | Event-driven Serverless | Wenn Cloudflare Workers |
| **MedusaJS v2** | E-Commerce Backend | Nur wenn Shop-Projekt |
| **Mantine** | Wenn du mehr "out of the box" als shadcn willst | Nicht mischen mit shadcn |

## ❌ PASST NICHT (Legacy, Redundant oder Overkill)

### Legacy (NICHT nutzen)
| Tool | Warum nicht | Alternative |
|------|------------|-------------|
| **Webpack** | Tot | Vite (schon im Stack) |
| **Babel** | Tot | SWC (schon via Vite) |
| **ESLint + Prettier** | Langsam | Biome (schon im Stack) |
| **Jest** | Langsam | Vitest |
| **Redux** | Overengineered | Zustand + TanStack Query |
| **TypeORM** | Bloated | Drizzle (schon im Stack) |
| **Styled Components** | Runtime CSS | Tailwind (schon im Stack) |
| **npm/nvm/pip/Poetry** | Langsam | Bun/mise/uv |
| **n8n** | GUI Workflow | Code-first (Inngest/Trigger.dev) |
| **Heroku** | Tot/teuer | Coolify/Railway |
| **Datadog** | $$$$ | Sentry (free) |
| **Selenium** | Veraltet | Playwright |
| **Camoufox** | Abandoned | Patchright |
| **BeautifulSoup** | Python legacy | Crawl4AI |
| **Lucia** | Deprecated | Better Auth |

### Redundant (du hast schon was Besseres)
| Tool | Redundant weil |
|------|---------------|
| **Redis/Valkey** | Du hast Dragonfly (25x schneller) |
| **Algolia** | Du hast Meilisearch (kostenlos) |
| **Clerk/Auth0** | Du hast Better Auth (kostenlos) |
| **Prisma** | Du hast Drizzle (leichter, edge-kompatibel) |
| **Vercel** | Du hast Coolify + Caddy |
| **GraphQL** | Overkill, Hono RPC reicht |
| **Mem0** | SurrealDB macht alles nativ |
| **D3.js direkt** | Recharts/Nivo wrappen D3 bereits |

### Overkill für Solo Dev
| Tool | Warum nicht jetzt |
|------|------------------|
| **LangGraph** | Zu komplex, PocketFlow/Claude Agent SDK reicht |
| **Temporal.io** | Enterprise Workflows, brauchst du nicht |
| **Kubernetes** | Colima + Docker Compose reicht |
| **ClickHouse** | Analytics-DB, brauchst DuckDB lokal |
| **Firecracker** | AWS-Level Isolation, brauchst du nicht |
| **Wasmer/Wasmtime** | WASM Runtimes, nur wenn WASM-Produkt |

## 🎯 EMPFOHLENE REIHENFOLGE — Was als Nächstes einbauen

### Sofort (< 1 Stunde)
```bash
cd ~/synergine-app
bun add motion gsap zustand @tanstack/react-query
bun add sonner vaul cmdk  # (Sonner evtl. schon da)
bun add -D vitest @playwright/test
```

### Diese Woche
1. **Recharts + Tremor** → Dashboard-Seite bauen
2. **React Email + Resend** → Transaktionale Emails
3. **Polar.sh oder Stripe** → Payment integration
4. **Sentry** → Error tracking (free tier)
5. **PostHog** → Analytics (free tier)

### Wenn Produkt steht
1. **GSAP ScrollTrigger** → Landing Page Animationen
2. **Magic UI / Aceternity UI** → Premium Hero Sections
3. **Three.js + R3F** → 3D Product Viewer (wenn relevant)
4. **Passkeys** → Better Auth Plugin aktivieren
5. **Coolify** → Production Deploy

### Nur bei Bedarf
- Astro → Wenn du eine separate Marketing Site brauchst
- Tauri → Wenn Desktop App
- MedusaJS → Wenn E-Commerce
- Axum/Rig → Wenn Rust Microservice für Performance
