# SuperStack Documentation Index

Complete documentation for the SuperStack AI infrastructure framework.

## Getting Started

Start here if you're new to SuperStack:

1. **README.md** (`/Users/master/superstack/README.md`)
   - Project overview and tagline
   - Quick start guide (5 minutes to running)
   - Architecture diagram
   - Stack components table
   - Profile configurations (core, dev, monitoring, full, all)
   - Environment setup
   - Resource requirements
   - Troubleshooting

2. **ARCHITECTURE.md** (`/Users/master/superstack/docs/ARCHITECTURE.md`)
   - Detailed system design
   - Service-by-service deep dives
   - Data flow patterns
   - Agent lifecycle management
   - Message patterns and use cases
   - Caching strategies
   - Search indexing
   - Monitoring pipeline
   - Performance optimization

## Configuration Files

Reference documentation for configuration:

- **Caddyfile** (`/Users/master/superstack/config/Caddyfile`)
  - Reverse proxy routes
  - Service endpoints
  - Rate limiting
  - CORS configuration

- **nats.conf** (`/Users/master/superstack/config/nats.conf`)
  - NATS server configuration
  - JetStream settings
  - Authorization rules
  - Performance tuning

## Service Directories

Each service has optional documentation in its directory:

- `/Users/master/superstack/services/surrealdb/` - Graph database
- `/Users/master/superstack/services/dragonfly/` - Cache (Redis-compatible)
- `/Users/master/superstack/services/nats/` - Messaging
- `/Users/master/superstack/services/meilisearch/` - Search engine
- `/Users/master/superstack/services/caddy/` - Reverse proxy
- `/Users/master/superstack/services/signoz/` - Monitoring
- `/Users/master/superstack/services/windmill/` - Workflows
- `/Users/master/superstack/services/uptime-kuma/` - Uptime monitoring
- `/Users/master/superstack/services/beszel/` - System monitoring
- Plus optional services: langfuse, umami, seaweedfs, listmonk, coolify

## Scripts

Operational scripts:

- **scripts/start.sh** - Start services by profile
- **scripts/status.sh** - Check service health
- **scripts/stop.sh** - Stop all services

## License

**LICENSE** (`/Users/master/superstack/LICENSE`)
- MIT License
- Copyright SuperSynergy 2026

## Quick Navigation

### By Use Case

**I want to...**

- **Run SuperStack locally** → README.md → Quick Start
- **Understand the architecture** → ARCHITECTURE.md → System Overview
- **Configure services** → README.md → Configuration
- **Use the SDK** → README.md → SDK Usage
- **Deploy to production** → README.md → Production Deployment
- **Monitor and observe** → ARCHITECTURE.md → Monitoring Pipeline
- **Scale horizontally** → README.md → Scaling Guide
- **Optimize performance** → ARCHITECTURE.md → Performance Optimization
- **Set up agents** → ARCHITECTURE.md → Agent Lifecycle

### By Role

**I'm a...**

- **Startup founder** → README.md (overview) + ARCHITECTURE.md (data flow)
- **Backend engineer** → ARCHITECTURE.md (service architecture) + README.md (SDK usage)
- **DevOps engineer** → README.md (deployment) + Config files
- **ML/AI engineer** → ARCHITECTURE.md (agent lifecycle) + README.md (integration)
- **Data engineer** → ARCHITECTURE.md (data flows, caching, indexing)

## Document Statistics

| Document | Lines | Sections | Code Examples |
|----------|-------|----------|----------------|
| README.md | 713 | 16+ | 40+ |
| ARCHITECTURE.md | 1483 | 10+ | 60+ |
| LICENSE | 21 | - | - |
| **Total** | **2217** | **26+** | **100+** |

## Key Features Covered

- Service composition and profiles
- SDK client libraries (SurrealDB, Dragonfly, NATS, Meilisearch)
- Message patterns (pub-sub, request-reply, work queues, event sourcing)
- Caching strategies (cache-aside, write-through, write-behind)
- Search indexing and optimization
- Monitoring with SigNoz, Uptime Kuma, Beszel
- Agent architecture and lifecycle
- Data flow from write to read
- Performance optimization techniques
- Production deployment best practices
- Colima setup for macOS
- Docker Compose configuration
- NATS JetStream for streaming
- Full-text search with Meilisearch

## External Resources

- **SurrealDB**: https://surrealdb.com/
- **NATS**: https://nats.io/
- **Dragonfly**: https://www.dragonflydb.io/
- **Meilisearch**: https://www.meilisearch.com/
- **Caddy**: https://caddyserver.com/
- **SigNoz**: https://signoz.io/
- **Windmill**: https://www.windmill.dev/

---

**Created**: March 16, 2026
**Documentation Version**: 1.0
**Framework**: SuperStack v1.0.0
