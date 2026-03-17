# Rust SuperStack 2026 — Definitiv

> 20 Haiku Research Agents + Opus Synthesis | Alle Tools verifiziert März 2026

## Tier 0: Foundation (jedes Projekt)

| Kategorie | Pick | Alternative | Benchmark |
|-----------|------|-------------|-----------|
| Async Runtime | **tokio** | smol (lightweight) | 10+ Jahre, LTS, canonical |
| HTTP Server | **axum** 0.8 | actix-web (10-15% schneller) | forbid(unsafe_code), Tokio-native |
| HTTP Client | **reqwest** | ureq (sync-only) | De-facto Standard |
| Serialization | **serde** + serde_json | rkyv (zero-copy) | 99% Ecosystem |
| CLI | **clap** | bpaf (schneller compile) | Battle-tested |
| Errors | **anyhow** (Apps) / **thiserror** (Libs) | eyre | Klare Trennung |
| Logging | **tracing** | log (simpler) | Structured, async-aware |
| Concurrency | **dashmap** + **rayon** + **crossbeam** | papaya (read-heavy) | Lock-free + parallel |
| TLS | **rustls** | ring (primitives) | 1.5-3x schneller als OpenSSL |
| Config | **toml** | figment | Human-friendly |

## Tier 1: AI Agent Core

| Kategorie | Pick | Warum |
|-----------|------|-------|
| Agent Framework | **Rig** (Production) + **ZeroClaw** (Edge) | Rig: 4+ Production Users; ZeroClaw: <5MB, 10ms Start |
| Multi-Agent | **AutoAgents** (Ractor-based) | 36% schneller als Python, 1GB vs 5GB RAM |
| LLM Inference | **mistral.rs** | PagedAttention, Speculative Decoding, OpenAI-API |
| Embeddings | **fastembed-rs** (Nomic V2 MoE) | Erste effiziente MoE Embeddings in Rust |
| Vector DB | **Qdrant** | $50M Series B, composable search, <1ms@1M+ |
| Full-Text | **tantivy** | 20x Whoosh, <5ms, 300% Adoption-Surge 2026 |
| Multi-Model DB | **SurrealDB 3.0** | Graph+Doc+Vector+FTS, $23M, AI Agent Memory |
| Embedded KV | **redb** | Pure Rust, ACID, stabiler als sled |
| gRPC | **tonic** + **prost** | Type-safe, binär, Mikrosekunden |
| P2P | **iroh** | QUIC, 200K concurrent, einfacher als libp2p |
| Messaging | **NATS** (async-nats) | <1ms, 15M+ ops/sec |
| Agent Auth | **OpenMLS** | Forward secrecy + post-compromise security |

## Tier 2: Data Processing

| Kategorie | Pick | Benchmark |
|-----------|------|-----------|
| DataFrames | **Polars** | 5-20x Pandas, 40% weniger RAM, 8x weniger Energie |
| Query Engine | **DataFusion** v52 | #1 ClickBench, 1TB/18min |
| Columnar | **Apache Arrow** | Universal, 0 breaking changes seit 2020 |
| ML Storage | **Lance** | 100x schneller random access vs Parquet |
| ACID Lake | **Delta Lake** (delta-rs) | 2M+ PyPI Downloads/Monat |
| Ingestion | **Vector** | 5-10x Fluentd (86 vs 18 MiB/s), 46 sources, 61 sinks |
| Analytics DB | **DuckDB** | Embedded SQL+OLAP, Postgres-wire-kompatibel |

## Tier 3: Web & Desktop

| Kategorie | Pick | Stars/Status |
|-----------|------|-------------|
| Desktop | **Tauri v2** | 81K Stars, 5-10x kleiner als Electron |
| Cross-Platform | **Dioxus** 0.7+ | 35.3K Stars, Web+Desktop+Mobile |
| Full-Stack Web | **Leptos** | 20.4K Stars, fine-grained Reactivity |
| Rails-like | **Loco** 0.16 | Rapid SaaS, auf Axum gebaut |
| TUI | **ratatui** | 18.9K Stars, Netflix/OpenAI/AWS |
| PKM/Notes | **Lokus** | Tauri v2, Knowledge Graph, 68 MCP Tools |
| Static Site | **Zola** | Single binary, built-in Search |
| Documents | **Typst** | Rust LaTeX-Alternative |

## Tier 4: Scraping & Browser

| Kategorie | Pick | Speed |
|-----------|------|-------|
| HTTP Crawler | **spider-rs** | 200-1000x Scrapy, 100K+ pages/min |
| Browser Auto | **chromiumoxide** | Async/Tokio CDP, production-ready |
| Anti-Detection | **chaser-oxide** (Jan 2026) | Protocol-level stealth, 50-100MB RAM |
| AI Browser | **agent-browser** | 93% Token-Spar, Rust CLI |
| Stealth Alt | **Patchright** > **NoDriver** > **Scrapling** | Playwright-Fork > Async CDP > Python+MCP |

## Tier 5: Security & DevOps

| Kategorie | Pick | Vorteil |
|-----------|------|---------|
| Encryption | **rage** (age Rust) | Modern, UNIX-style, kein Config |
| Port Scan | **RustScan** | 89x schneller als Nmap (3-19s alle Ports) |
| Network Mon | **Sniffnet** | GUI, Cross-Platform, MIT |
| Diagnostics | **Trippy** | mtr+traceroute, ASN Maps, World Viz |
| Container | **Youki** | 15-30% schneller als runc |
| WASM Runtime | **wasmtime** | Bytecode Alliance, LTS, Standards |
| WASM Deploy | **Spin** (Akamai) | Sub-second Cold Start, <10MB |
| Plugins | **Extism** | Universal WASM, 15+ Host SDKs |
| Cross-Compile | **cross** | Zero-Setup, 40+ Targets |
| Dep Audit | **cargo-deny** + **cargo-audit** | License+CVE+Duplicates |

## Tier 6: Web3 & Finance

| Kategorie | Pick | Status |
|-----------|------|--------|
| Ethereum | **Alloy** 1.0 | Paradigm, canonical seit 05/2025 |
| Node Client | **Reth** | Production, auf Alloy+revm |
| EVM | **revm** | no_std, WASM, Reth/Foundry/Optimism nutzen es |
| MEV Framework | **Artemis** (Paradigm) | Event-driven, Collectors→Strategies→Executors |
| Smart Contracts | **Foundry** (forge/cast/anvil) | Blazing fast Solidity Testing |
| Solana | **solana-sdk** v4.0 | Native Rust, Program Development |
| Substrate | **Substrate 4.0** | Cross-chain, formal verification |

## Tier 7: Interop (Rust Speed verkaufen)

| Kategorie | Pick | Beweis |
|-----------|------|--------|
| Python | **PyO3** + **maturin** | Pydantic 17x, Ruff 100x, Polars 20x |
| Node.js | **napi-rs** | 2-30x Throughput, auto TS Defs |
| Multi-Lang | **uniffi** (Mozilla) | Kotlin+Swift+Python+Ruby |
| C/C++ | **CXX** | Google Chromium, zero-overhead |
| Code Analysis | **GitNexus** + **ast-grep** | Knowledge Graph, MCP, Blast Radius |

## Tier 8: Terminal Stack (CLI-First)

```
Emulator:     Ghostty (Zig) / Alacritty (Rust)
Shell:        Nushell (structured data) / zsh (traditional)
Multiplexer:  Zellij (Rust, WASM plugins) / tmux (proven)
Prompt:       Starship 1.5
History:      Atuin (SQLite + fuzzy)
Smart cd:     zoxide
cat:          bat (syntax highlight)
grep:         ripgrep (50-100x faster)
find:         fd (50% faster)
ls:           eza (icons, git)
du:           dust
ps:           procs
monitor:      bottom (btm)
git TUI:      gitui (30-40% schneller als lazygit)
git diff:     delta (syntax highlight)
file mgr:     yazi (async, 33K stars)
benchmark:    hyperfine
code stats:   tokei
file watch:   watchexec
task runner:  just
man pages:    tealdeer
JS linter:    Oxlint 1.0 (50-100x ESLint)
JS bundler:   Rolldown (Oxc-based, preview)
formatter:    Biome (Prettier-kompatibel)
```

## RAG Pyramid (Suchstrategie)

```
Layer 1 (50%): ripgrep + fd + fzf         → <20ms, exakt
Layer 2 (20%): SurrealDB FTS / tantivy    → <50ms, Typos/Synonyme
Layer 3 (30%): Qdrant / SurrealDB HNSW    → <200ms, semantisch
```

## Model Routing (Kosten-Optimierung)

| Aufgabe | Model | Kosten |
|---------|-------|--------|
| Exploration, Datei-Ops, Bash | **Haiku 4.5** | $1/$5 per M |
| Code, Standard-Tasks | **Sonnet 4.6** | $3/$15 per M |
| Architektur, Planning | **Opus 4.6** | $5/$25 per M |
| Local Inference (gratis) | **mistral.rs** + Ollama | $0 |
| Embeddings (gratis) | **fastembed-rs** / Nomic V2 | $0 |
