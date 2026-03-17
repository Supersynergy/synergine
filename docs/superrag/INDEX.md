# SuperRAG — Master Index

> Autonomous AI Cashmaschine Knowledge Base | March 2026
> 25 Research Agents | 800K+ Tokens analysiert | 200+ Quellen

## Quick Access

| File | Inhalt | Wann lesen |
|------|--------|-----------|
| **SUPERSTACK.md** | Definitiver Rust+AI Stack 2026, alle Tiers | Stack-Entscheidungen |
| **CASHMAKERS.md** | 100 Use Cases + Stealth Ops + Monetarisierung | Revenue-Ideen |
| **ARCHITECTURE.md** | Super-Obsidian + Pyramidal AI + Colima 24/7 + Context Mgmt | System Design |
| **OBSOLETE.md** | Was NICHT nutzen + Warum | Vor jeder Tool-Wahl |
| **ZEROCLAW_COMBOS.md** | ZeroClaw x Rust Combos + 100 Cashmaker mit CLI Commands | Revenue-Ideen mit ZeroClaw |

## Deep-Dive Docs (load on demand, nicht dupliziert)

| File | Location | Inhalt |
|------|----------|--------|
| toolstack-2026.md | `~/.claude/toolstack-2026.md` | Solo Dev Stack Referenz |
| RUST_AI_ML_2026.md | `~/.claude/RUST_AI_ML_2026.md` | Deep Dive AI/ML in Rust |
| RUST_AI_QUICKSTART.md | `~/.claude/RUST_AI_QUICKSTART.md` | Code Templates AI Agents |
| RUST_AI_USECASES.md | `~/.claude/RUST_AI_USECASES.md` | 10 detaillierte AI Use Cases |
| VECTOR_COMPLETE_GUIDE.md | `~/VECTOR_COMPLETE_GUIDE.md` | Vector Pipeline Deep Dive |
| VECTOR_IMPLEMENTATION_PATTERNS.md | `~/VECTOR_IMPLEMENTATION_PATTERNS.md` | Production Configs |
| RUST_SCRAPING_CODE_EXAMPLES.md | `~/RUST_SCRAPING_CODE_EXAMPLES.md` | 9 Scraping Code Templates |
| RUST_VS_PYTHON_SCRAPING.md | `~/RUST_VS_PYTHON_SCRAPING.md` | Benchmark Vergleich |
| TOOLSTACK_KB_OPTIMIZATION.md | `~/.claude/TOOLSTACK_KB_OPTIMIZATION.md` | SurrealDB KB Guide |
| PYRAMIDAL_AGENT_ARCHITECTURE_2026.md | `~/PYRAMIDAL_AGENT_ARCHITECTURE_2026.md` | 74KB Deep Dive: 5-Layer Pyramid, Self-Healing, Context Mgmt |
| AGENT_PATTERNS_IMPLEMENTATION_GUIDE.md | `~/AGENT_PATTERNS_IMPLEMENTATION_GUIDE.md` | 38KB Code Templates: alle 5 Layers production-ready |
| AGENT_DEPLOYMENT_OPERATIONAL_GUIDE.md | `~/AGENT_DEPLOYMENT_OPERATIONAL_GUIDE.md` | 22KB Docker/K8s, Monitoring, Emergency Runbooks |
| RESEARCH_SUMMARY.md | `~/RESEARCH_SUMMARY.md` | Agent Architecture Executive Summary |

## SurrealDB Toolstack (Live)

```bash
source ~/.claude/scripts/sdb.sh && sdb_start
sdb "SELECT name, category FROM tool WHERE status = 'modern' ORDER BY category"
sdb "SELECT ->integrates_with->tool.name FROM tool:astro"
```
- 121 Tools, 28 Kategorien, 86 Graph-Relations
- 5198 Knowledge Chunks + 5059 Vector Embeddings
- Port 9926 | NS: toolstack | DB: tools | root/root

## ZeroClaw Agents

```bash
# Spawn Agent
bash ~/supersynergyapp/sscrmapp-agents/spawn.sh <role> "<task>" --model claude-haiku
# Round Table
bash ~/supersynergyapp/sscrmapp-agents/roundtable.sh --council
# Fusion
python ~/zeroClawUltimate/zeroclaw_fusion.py "<task>"
```
- 38 Rollen in `~/supersynergyapp/sscrmapp-agents/roles/`
- Dashboard: http://localhost:7777

## Hardware

- MacBook M4 Max | 128GB RAM | 8TB SSD
- Colima: 64GB Workers + 32GB DBs + 20GB Host + 12GB Ollama
- 24/7 via LaunchD + autoheal Container
- Kosten: ~$100/Jahr Strom vs $36K-60K/Jahr Cloud
