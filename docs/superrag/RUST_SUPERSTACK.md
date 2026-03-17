# Rust Superstack 2026 — Synthesized from 20 Research Agents

> Compiled: 2026-03-17 | Sources: awesome-rust, blessed.rs, GitNexus, 20 parallel Haiku agents

## Holy Trinity (Every Rust Project)

```toml
serde = { version = "1.0", features = ["derive"] }  # Serialization king
tokio = { version = "1.50", features = ["full"] }    # Async runtime (async-std DEPRECATED)
anyhow = "1.0"           # Error handling (apps)
thiserror = "1.0"        # Error handling (libs)
tracing = "0.1"          # Structured logging (replaces log)
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
clap = { version = "4.4", features = ["derive"] }    # CLI args
```

## Web Frameworks (Pick One)

| Framework | Req/sec | Best For | Status |
|-----------|---------|----------|--------|
| **Axum** | 17-18K | General APIs, Tower ecosystem | **RECOMMENDED** |
| **Actix-web** | 19-23K | Max throughput | Production, 10-15% faster |
| **Loco.rs** | 100K raw | Rails-like DX, MVC | Production, single-binary |
| **Salvo** | Top tier | HTTP/3, WebSocket, OpenAPI | 1.0 imminent |
| **Poem** | Competitive | 100% safe Rust, OpenAPI | 32K LOC |
| **Rocket** | Lower | Rapid prototyping | Batteries-included |
| **Pavex** | N/A | Compile-time reflection | Experimental 0.2.x |

**Fullstack:** Leptos 0.6 (fine-grained reactivity) | Dioxus 0.7 (Desktop+Web+Mobile unified)

## AI/ML Frameworks

| Framework | Purpose | Status |
|-----------|---------|--------|
| **Rig** | AI agent framework | Production (24% CPU vs Python 64%) |
| **Candle** | ML inference (HuggingFace) | v0.9.2, CPU/CUDA/Metal/WASM |
| **Burn** | Deep learning + training | v0.20, PyTorch alternative |
| **mistral.rs** | LLM inference engine | Active, tool calling + vision |
| **Kalosm** | Local AI (Candle-based) | LLM/audio/vision |
| **ort** | ONNX Runtime bindings | Production-grade |
| **text-embeddings-inference** | Embedding server | HuggingFace production |
| **whisper-rs** | Speech-to-text | GPU support |

**Multi-LLM:** multi-llm (OpenAI+Anthropic+Ollama) | Rig (unified interface)

## Database Stack

| Tool | Purpose | Status |
|------|---------|--------|
| **SurrealDB 3.0** | Multi-model (graph+vector+doc+FTS) | GA Feb 2026, $23M funded |
| **SeaORM 2.0** | Async ORM (enterprise) | Jan 2026, 250K+ weekly DL |
| **SQLx** | Compile-time checked SQL | Zero unsafe, async native |
| **Diesel 2.3** | Compile-time safety ORM | Sync only, mature |
| **sled** | Embedded DB | Beta (komora rewrite) |

## Networking & Communication

| Tool | Purpose | Pick |
|------|---------|------|
| **Tokio** | Async runtime | Standard (async-std DEAD) |
| **Reqwest** | HTTP client | v0.13, HTTP/3 experimental |
| **Quinn** | QUIC protocol | Pure Rust, async |
| **async-nats** | Cloud messaging | NATS client (legacy crate deprecated) |
| **lapin** | RabbitMQ AMQP | Complex routing |
| **rumqttc** | MQTT IoT | v4/v5, Tokio-based |
| **libp2p** | Peer-to-peer | Ethereum/IPFS stack |
| **tarpc** | RPC (Google) | Code-first, no .proto |
| **ADK-Rust** | Agent-to-Agent Protocol | Production-ready |

## Security & Crypto

| Tool | Purpose | Status |
|------|---------|--------|
| **Rustls** | TLS (replaces OpenSSL) | Faster than OpenSSL, Let's Encrypt uses it |
| **RustCrypto** | Algorithm collection | SHA, BLAKE, Ed25519, ECDSA |
| **Ring** | Core crypto | Hybrid Rust/C/asm from BoringSSL |
| **Sequoia-OpenPGP** | PGP v2.0 alpha | RFC 9580, post-quantum prep |
| **Age/Rage** | File encryption | Modern, x25519+scrypt |
| **Vaultwarden** | Secret management | Self-hosted, <50MB RAM |

## Scraping & Automation

| Tool | Performance | Best For |
|------|-------------|----------|
| **spider** | 200-1000x faster | 100K+ pages/min, HTTP+headless |
| **chromiumoxide** | v1.85 | High-level async Chrome CDP |
| **chaser-oxide** | Hardened fork | Anti-detection stealth CDP |
| **scraper** | HTML parsing | CSS selectors, html5ever |
| **Fantoccini** | WebDriver | Multi-browser, async |

**Pipeline:** `reqwest → tokio → scraper → dashmap` + `governor` rate limiting

## Data Processing & ETL

| Tool | Purpose | Status |
|------|---------|--------|
| **Vector.dev** | Observability pipeline | 2X Fluent Bit throughput |
| **DataFusion** | Query engine (Arrow) | Powers InfluxDB 3.0 |
| **Polars** | DataFrame | 5-10x faster than Pandas |
| **Tantivy/Quickwit** | Full-text search | 2X faster than Lucene, 1PB/day |
| **Databend** | Cloud warehouse | 50% cheaper than Snowflake |
| **GlueSQL** | Portable SQL | Embedded, WASM, edge |

## Desktop & GUI

| Framework | Best For | Size |
|-----------|----------|------|
| **Tauri 2.0** | Web frontend + Rust backend | 10-20MB (vs 100MB Electron) |
| **Dioxus 0.7** | React-like, all platforms | Desktop+Web+Mobile |
| **Makepad** | GPU-rendered live design | Creative/AI UIs |
| **Slint 1.15** | Declarative DSL, embedded | <300KiB RAM |
| **egui** | Immediate mode, real-time | Games, dashboards |

## WASM & Edge

| Tool | Purpose | Status |
|------|---------|--------|
| **wasm-bindgen** | JS↔Rust interop | Standard, no competitor |
| **Wasmtime** | Standards runtime (Bytecode Alliance) | v35+, "JVM of WASM" |
| **Wasmer 7.0** | Meta-runtime (5 backends) | Jan 2026, WASIX extensions |
| **Spin 1.0** | Serverless WASM (Akamai) | 75M req/sec proven |

## DevOps & Containers

| Tool | Purpose | Notes |
|------|---------|-------|
| **Firecracker** | MicroVM (AWS Lambda) | <125ms start, <5MiB RAM |
| **youki** | OCI container runtime | Faster than runc (Go) |
| **Bottlerocket** | Container OS (AWS) | All Rust components |
| **cross** | Cross-compilation | Zero setup, Docker-based |
| **cargo-binstall** | Binary installation | Pre-compiled from GitHub |

## Testing & Quality

| Tool | Purpose |
|------|---------|
| **cargo-nextest** | 3x faster parallel test runner |
| **cargo-mutants** | Mutation testing |
| **cargo-audit** | Security vulnerability scan |
| **cargo-deny** | Dependency policy enforcement |
| **cargo-machete** | Unused dependency detection |
| **clippy** | Official linter |
| **miri** | Undefined behavior detector |
| **proptest** | Property-based testing |
| **insta** | Snapshot testing |

## CLI Essentials (Rust-Built)

| Tool | Replaces | Why |
|------|----------|-----|
| **ripgrep (rg)** | grep | Millisecond codebase search |
| **fd** | find | Sensible defaults |
| **bat** | cat | Syntax highlighting + git |
| **eza** | ls | Git awareness, icons |
| **zoxide** | cd | Learns navigation patterns |
| **just** | make | Rust-native command runner |
| **starship** | oh-my-zsh | Universal prompt |
| **watchexec** | nodemon | File watcher + auto-rerun |
| **hyperfine** | time | Statistical benchmarking |
| **tokei** | cloc | ~150 language stats |
| **bottom (btm)** | htop | TUI system monitor |
| **dust** | du | Disk usage with % bars |
| **delta** | diff | Git diff with syntax highlight |
| **ratatui** | ncurses | TUI framework |

## Observability Stack

```
tracing → tracing-opentelemetry → opentelemetry-otlp → SigNoz/Langfuse
                                → tracing-subscriber (stdout)
                                → tracing-appender (async file)
                                → tracing-flame (flamegraphs)
```

## Git & Code Intelligence

| Tool | Purpose | Status |
|------|---------|--------|
| **gitoxide (gix)** | Pure Rust git (replaces libgit2) | v0.51, production |
| **git-cliff** | Changelog generator | Mature, conventional commits |
| **onefetch** | Repo summary CLI | 100+ languages |
| **GitNexus** | Knowledge graph from repos | WASM, browser-based (TypeScript) |

## Rust + TypeScript Interop

| Method | Best For |
|--------|----------|
| **napi-rs** | Node.js native modules (26M+ DL) |
| **wasm-bindgen** | Browser WASM + auto .d.ts |
| **tsify-next** | Auto .d.ts from Rust structs |
| **Tauri pattern** | Desktop: Rust backend + TS frontend |
| **UniFFI** | Mobile (Kotlin/Swift/Python) |

**Recommended Hybrid:** Rust (hot path: embeddings, vector, crypto) + TS (API layer, UI)

## Super-Obsidian Architecture (Autonomous Knowledge Graph)

```
Markdown files (source of truth)
    ↓ file watcher
Vector.dev (Rust pipeline)
    ↓ transform + embed
SurrealDB 3.0 (graph + vector + FTS)
    ↓ semantic search
ZeroClaw agents (auto-link, auto-tag, auto-enrich)
    ↓ write back
AppFlowy / Obsidian (view layer)
```

## What's OBSOLETE / AVOID

- **async-std** → DEPRECATED, use Tokio or Smol
- **Camoufox** → Abandoned March 2025
- **undetected-chromedriver** → Abandoned 12+ months
- **OpenAI Assistants API** → Deprecated Aug 2026
- **sled** → Still beta, use SurrealDB/SQLx for production
- **Webpack/Babel/Jest** → Still active but Vite/SWC/Vitest are modern replacements
