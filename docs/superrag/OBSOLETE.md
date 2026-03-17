# Was NICHT nutzen — Obsolete Tools März 2026

## Rust Ecosystem

| Tool | Status | Ersatz | Grund |
|------|--------|--------|-------|
| `async-std` | DISCONTINUED 2025 | `tokio` / `smol` | Offiziell deprecated |
| `sled` | UNSTABLE | `redb` | APIs brechen, unstabiles On-Disk Format |
| `ethers-rs` | DEPRECATED | `Alloy 1.0` | Paradigm migriert komplett |
| `llm` (crate) | UNMAINTAINED | `mistral.rs` | Kein Maintainer mehr |
| `Yew` | ECLIPSED | `Leptos` / `Dioxus` | Schwere WASM Bundles, überholt |
| `Actix-web` | STAGNIERT | `Axum` | Funktioniert, aber moderneres Axum gewinnt |
| `Diesel` (sync) | VERALTET für async | `SeaORM 2.0` / `SQLx` | diesel-async fühlt sich unnatürlich an |
| `Pavex` | CLOSED BETA, stale | `Axum` | Seit April 2024 keine Updates |
| `GlueSQL` | NISCHE | `DuckDB` | Nur sinnvoll für pure-Rust no_std/WASM |

## JavaScript/TypeScript

| Tool | Status | Ersatz | Speedup |
|------|--------|--------|---------|
| Webpack | LEGACY | Vite 6 + Rolldown | 10-25x |
| Babel | LEGACY | SWC (Rust) | Native in Next.js |
| ESLint + Prettier | LEGACY | Oxlint 1.0 / Biome | 50-100x |
| Jest | LEGACY | Vitest | 10-20x |
| Redux | OVERKILL | Zustand + TanStack Query | Simpler |
| Styled Components | LEGACY | Tailwind v4 + shadcn/ui | Oxide/Rust Engine |
| TypeORM | LEGACY | Drizzle (lean) / Prisma 7 | 85% kleiner |
| npm | SLOW | pnpm (Monorepo) / Bun | Korrekte Isolation |

## Python

| Tool | Status | Ersatz | Speedup |
|------|--------|--------|---------|
| pip / Poetry / pipenv | LEGACY | **uv** (Astral, Rust) | 10-100x |
| Flake8 / Black / isort | LEGACY | **ruff** (Rust) | 150-200x |
| nvm / pyenv / rbenv | LEGACY | **mise** | 10-100x, ein Tool für alles |
| Selenium | LEGACY | Playwright / agent-browser | Moderneres API |
| BeautifulSoup | LEGACY | Crawl4AI (AI-native) | AI-gesteuert |

## Browser Automation

| Tool | Status | Ersatz |
|------|--------|--------|
| undetected-chromedriver | ABANDONED 12+ Mo | Patchright / NoDriver |
| Camoufox | ABANDONED 03/2025 | Scrapling / Browserbase |
| Puppeteer | LEGACY | Playwright / agent-browser |
| Selenium | LEGACY | Playwright (E2E) / spider-rs (Scraping) |

## Infrastructure

| Tool | Status | Ersatz |
|------|--------|--------|
| Electron | OBSOLET für neue Projekte | Tauri v2 (5-10x kleiner) |
| Heroku | TOT | Coolify / Railway / Kamal 2 |
| Datadog ($$$) | ZU TEUER | Sentry (free) + Vector + structured logs |
| n8n / Zapier | LEGACY GUI | PocketFlow / Inngest / Code-first |
| MCP Server | LEGACY (3-55K Tokens) | Skills + CLI (50-300 Tokens) |
| Docker Desktop | BLOATED | Colima (FOSS) / OrbStack (faster) |

## SEO/Marketing

| Strategie | Status | Realität 2026 |
|-----------|--------|---------------|
| Parasite SEO | TOT | 34% Penalty Rate, Google enforcement |
| AI Content Farms | PENALIZED | 60-90% Penalty Hit |
| Undisclosed AI Freelance | RISKANT | Disclosure jetzt Pflicht |

## Crypto

| Strategie | Status | Realität |
|-----------|--------|----------|
| Solo Crypto Arbitrage | UNMÖGLICH | Braucht $100K+ Capital, ms-Execution |
| Meme Coin Sniping (Solo) | EXTREM RISKANT | 90% Scams, Sub-Sekunden Competition |
