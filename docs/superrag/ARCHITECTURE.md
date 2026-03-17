# Architektur — Super-Obsidian + Pyramidal AI + Colima 24/7

## I. SUPER-OBSIDIAN — Autonomous Knowledge Engine

### Architektur

```
┌─────────────────────────────────────────────────────────┐
│  TAURI v2 Desktop (Lokus oder Custom React+Monaco)      │
│  + petgraph/egui_graphs (2D/3D Knowledge Graph Viz)     │
└────────────────────┬────────────────────────────────────┘
                     │ Tauri Commands (IPC)
┌────────────────────▼────────────────────────────────────┐
│  RUST CORE ENGINE                                       │
│  ZeroClaw (Orchestrator) + mistral.rs (Inference)       │
│  + Vector (Ingestion) + fastembed-rs (Embeddings)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  SURREALDB 3.0 (Single Database)                        │
│  Documents + Graph + Vectors (HNSW) + FTS               │
│  RAG: ripgrep(50%) > FTS(20%) > Vector(30%)             │
└─────────────────────────────────────────────────────────┘
```

### 3 Autonome Agenten

**Agent 1: Structurer** — Inbox → Saubere Notizen
- Vector watchet Ordner (PDFs, Texte, Memos, Web-Clips)
- VRL transformiert Rohtext → Chunks
- mistral.rs: Markdown + YAML Frontmatter + Tags
- fastembed-rs: Embedding generieren
- SurrealDB: Document + Embedding + FTS speichern

**Agent 2: Connector** — Automatisches Verknüpfen
- Neue Notiz → Embedding → KNN in SurrealDB
- Top 5 ähnliche finden
- Graph-Kanten: `RELATE note:new -> links_to -> note:similar`
- [[Wikilinks]] automatisch einfügen
- Wissensnetz wächst autonom

**Agent 3: Researcher** — Nachts anreichern
- Notizen scannen nach unklaren Konzepten
- Wikipedia/Docs scrapen (reqwest)
- Infoboxen + Fußnoten einfügen
- Veraltetes aktualisieren

### Warum SurrealDB statt Split-Stack

- 1 Query-Sprache statt 2+ APIs
- ACID über alle Modelle (Document+Graph+Vector+FTS)
- Native RELATE für Graphen
- $23M Funding speziell für AI Agent Memory
- Weniger Maintenance (1 Binary)

### Alternative: Cozo

Wenn Datalog Rekursion nötig (PageRank, transitive Closures):
- Cozo: Embeddable wie SQLite, Hybrid relational-graph-vector
- Besser für analytische Graph-Traversals

---

## II. PYRAMIDAL AI — Self-Healing Agent Hierarchie

### 5-Layer Architektur

```
Layer 5: SUPERVISORS (self-healing, quality control)
    │ Ractor Supervision Trees + Circuit Breakers
    │ Erkennt Fehler → Restart/Escalate/Reroute
    ▼
Layer 4: EXECUTORS (browser, API calls, transactions)
    │ agent-browser + Alloy + reqwest + chromiumoxide
    │ Führt Entscheidungen aus
    ▼
Layer 3: DECISION MAKERS (trading, content, outreach)
    │ Rig + mistral.rs (Sonnet für Entscheidungen)
    │ Analysiert Daten → entscheidet Aktionen
    ▼
Layer 2: ANALYZERS (patterns, sentiment, pricing)
    │ Polars + fastembed-rs + DataFusion
    │ Strukturierte Analyse, ML Features
    ▼
Layer 1: COLLECTORS (scraping, monitoring, ingestion)
    │ spider-rs + Vector + reqwest + NATS
    │ Rohdaten sammeln, 24/7 laufen
    └──────────────────────────────────────
```

### Self-Healing Patterns

**Circuit Breaker (Tokio):**
```rust
// Agent erkennt N Fehler → schaltet auf Fallback
// Nach Timeout → probiert Primary wieder
enum CircuitState { Closed, Open(Instant), HalfOpen }
```

**Supervisor Trees (Ractor):**
```
Supervisor
├── Worker A (restarts on panic, max 3x/min)
├── Worker B (escalates to parent after 3 failures)
└── Worker C (replaces with fresh instance)
```

**State Checkpointing:**
- Jeder Agent speichert State in SurrealDB
- Bei Crash: State laden, ab letztem Checkpoint weitermachen
- LIVE SELECT für Echtzeit-Sync zwischen Agents

**Error Escalation:**
```
Agent fails → Retry 3x (exponential backoff)
  → Circuit opens → Supervisor notified
  → Supervisor: restart/reroute/escalate
  → Top-level: Alert + Graceful Degradation
```

### Context Management für 50+ Agents

**Hierarchisch:**
- Jeder Agent kennt nur seinen Scope
- Supervisor kennt alle Children
- Top-Level kennt Gesamt-Status

**Shared Memory (SurrealDB):**
```sql
-- Agent schreibt Context
CREATE agent_context:scraper_1 SET
  status = 'running',
  last_data = time::now(),
  items_processed = 1547;

-- Supervisor liest alle
SELECT * FROM agent_context WHERE status != 'running';

-- Echtzeit-Updates
LIVE SELECT * FROM agent_context;
```

**Event-Driven (NATS):**
```
agent.scraper.data_ready  → Analyzer subscribes
agent.analyzer.insight    → Decision Maker subscribes
agent.executor.completed  → Supervisor subscribes
agent.*.error             → Supervisor subscribes (wildcard)
```

**Kosten-Optimierung:**
- Layer 1-2: Haiku ($1/$5/M) — 80% aller Agent-Calls
- Layer 3: Sonnet ($3/$15/M) — Entscheidungen
- Layer 4: Lokal (mistral.rs) — $0 für Execution Logic
- Layer 5: Haiku — Monitoring ist günstig

### ReConcile Consensus (Multi-Agent Entscheidungen)

Wenn mehrere Agents verschiedene Meinungen haben:
- Jeder Agent gibt Antwort + Confidence Score
- Runde 2: Agents sehen andere Antworten, können revidieren
- Ergebnis: **7.7% Accuracy Boost** vs Single-Agent
- Perfekt für: Scoring, Pricing, Content-Quality Decisions
- Ref: `~/PYRAMIDAL_AGENT_ARCHITECTURE_2026.md` (74KB Deep Dive)

### Model Routing (88.7% Kostenersparnis)

```
70% Haiku  ($1/$5/M)  → Layer 1+2: Scraping, Analyse, Monitoring
20% Sonnet ($3/$15/M) → Layer 3: Entscheidungen, Scoring
10% Opus   ($5/$25/M) → Layer 5: Supervision, komplexe Fälle
Lokal: mistral.rs     → Layer 4: Execution Logic ($0)
```
- All-Sonnet: $1000/mo → 70/20/10 Split: $113/mo = **88.7% gespart**
- Real Case: 10K Leads Pipeline = $90/mo AI Cost, 99.4% Marge

### Flywheel Effect

```
Mehr Daten (Layer 1)
  → Bessere Analyse (Layer 2)
  → Bessere Entscheidungen (Layer 3)
  → Mehr Revenue (Layer 4)
  → Mehr Budget für Daten (Layer 1)
  → COMPOUNDING
```

### Production Code Templates

Alle 5 Layers als Code: `~/AGENT_PATTERNS_IMPLEMENTATION_GUIDE.md` (38KB)
- Layer 1: Web Scraper mit Circuit Breaker
- Layer 2: Haiku Analyzers (Email Validation, Revenue Estimation)
- Layer 3: Sonnet Scorers mit Feedback Loops
- Layer 4: Executors (Browser, Email, API)
- Layer 5: Supervisors mit ReConcile Roundtable

Deployment: `~/AGENT_DEPLOYMENT_OPERATIONAL_GUIDE.md` (22KB)
- Docker Compose + Kubernetes
- Prometheus/Grafana Monitoring
- Emergency Runbooks (Cascading Failures, DB Corruption)

---

## III. COLIMA 24/7 — M4 Max 128GB Worker Architektur

### RAM-Aufteilung

```
128GB MacBook M4 Max
├── 64GB → Colima Workers VM (Docker, 12 CPU)
│   ├── 8x API Workers (1GB each = 8GB)
│   ├── 8x Batch Workers (2GB each = 16GB)
│   ├── 4x Browser Workers (3GB each = 12GB)
│   ├── Redis (2GB) + Vector (1GB) + Autoheal
│   └── 25GB Reserve
├── 32GB → Colima Databases VM (8 CPU)
│   ├── SurrealDB (8GB)
│   ├── Qdrant (8GB)
│   ├── PostgreSQL (4GB)
│   └── 12GB Reserve
├── 20GB → Host macOS + Claude Code + IDE
└── 12GB → Ollama nativ (GPU Metal, NICHT Docker!)
```

### Colima Start Commands

```bash
# Workers VM
colima start default \
  --cpu 12 --memory 64 --disk 500 \
  --vm-type vz --mount-type virtiofs

# Databases VM
colima start databases \
  --cpu 8 --memory 32 --disk 300 \
  --vm-type vz --profile databases

# Ollama NATIV (nicht Docker — GPU broken in Docker)
brew install ollama && ollama serve
```

### Worker Setup (Colima + Compose, KEIN Docker Desktop/K8s)

```bash
# Workers starten (compose via Colima Docker Socket)
colima start default --cpu 12 --memory 64 --disk 500 --vm-type vz
docker compose up -d  # 20 Workers + autoheal + Vector Logs
docker compose ps     # Status
docker compose logs -f --tail=100  # Live Logs
docker compose up -d --scale api-worker=12  # Skalieren
```

Worker-Typen (alle mit autoheal + healthcheck + restart:always):
- **8x API Workers** (1 CPU, 1GB) — Axum/Hono stateless endpoints
- **8x Batch Workers** (2 CPU, 2GB) — Polars/DataFusion long-running
- **4x Browser Workers** (2 CPU, 3GB, shm_size:2gb!) — chromiumoxide/agent-browser
- **Infra:** Valkey (Redis-Fork, 2GB) + Vector (Logs) + autoheal

Deep Dive: `~/AGENT_DEPLOYMENT_OPERATIONAL_GUIDE.md` (22KB, Docker Compose + Monitoring)

### 24/7 LaunchD Auto-Start

```bash
# ~/Library/LaunchAgents/com.docker.compose.workers.plist
# KeepAlive: true → Restart bei Crash
# RunAtLoad: true → Start bei Login

# Aktivieren:
launchctl load ~/Library/LaunchAgents/com.docker.compose.workers.plist

# Health-Check Loop im Start-Script:
# Alle 60s prüfen ob alle Container laufen
# Bei Fehler: docker-compose restart
```

### Kosten-Vergleich

| Aspekt | M4 Max Lokal | AWS Cloud Equivalent |
|--------|-------------|---------------------|
| Hardware | €0/mo (bereits besessen) | $3K-5K/mo (20x t4g.large) |
| Strom | ~$100/Jahr (90-110W 24/7) | Inkludiert |
| Jahreskosten | **~$100** | **$36K-60K** |
| Latency | <1ms (lokal) | 50-200ms |
| GPU (Ollama) | Metal (6x schneller) | Separat bezahlen |

### OrbStack vs Colima

| Feature | Colima | OrbStack |
|---------|--------|----------|
| Kosten | Free (FOSS) | Free |
| Startup | 15-30s | 2-5s |
| Container Boot | 1-2s | <100ms |
| RAM idle | 400MB | <200MB |
| Empfehlung | Production 24/7 | Development |

---

## IV. CONTEXT MANAGEMENT — Optimal für Claude Code

### Wie Claude Code den SuperRAG liest

```
Claude Code startet
  → ~/.claude/CLAUDE.md geladen (immer)
  → ~/.claude/projects/-Users-master/memory/MEMORY.md geladen (immer)
  → Bei Bedarf: Read ~/.claude/superrag/INDEX.md
  → Dann gezielt: Read SUPERSTACK.md / CASHMAKERS.md etc.
```

### Optimale Nutzung

1. **Stack-Frage:** → `Read SUPERSTACK.md`
2. **Revenue-Idee:** → `Read CASHMAKERS.md`
3. **Architecture:** → `Read ARCHITECTURE.md`
4. **Tool obsolet?:** → `Read OBSOLETE.md`
5. **Deep Dive AI/ML:** → `Read ~/.claude/RUST_AI_ML_2026.md`
6. **Deep Dive Scraping:** → `Read ~/RUST_SCRAPING_CODE_EXAMPLES.md`
7. **Deep Dive Vector:** → `Read ~/VECTOR_COMPLETE_GUIDE.md`
8. **SurrealDB Query:** → `source ~/.claude/scripts/sdb.sh && sdb "QUERY"`

### Token-Budget

| File | Größe | ~Tokens | Wann laden |
|------|-------|---------|-----------|
| INDEX.md | 2KB | ~800 | Immer zuerst |
| SUPERSTACK.md | 8KB | ~3200 | Stack-Fragen |
| CASHMAKERS.md | 12KB | ~4800 | Revenue/Usecases |
| ARCHITECTURE.md | 8KB | ~3200 | System Design |
| OBSOLETE.md | 3KB | ~1200 | Tool-Entscheidungen |
| **Total SuperRAG** | **~33KB** | **~13200** | Selektiv laden! |

### ZeroClaw + Claude Code Integration

```bash
# ZeroClaw Agent mit SuperRAG Context
zeroclaw spawn researcher "Finde beste Stack für Lead Gen" \
  --context ~/.claude/superrag/CASHMAKERS.md \
  --model claude-haiku

# Round Table mit Stack-Wissen
bash sscrmapp-agents/roundtable.sh --council \
  --context "Lies ~/.claude/superrag/SUPERSTACK.md"

# GSD Quick Task
/gsd:quick "Baue Lead Gen API mit Axum + spider-rs"
```
