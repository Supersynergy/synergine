#!/usr/bin/env bash
# =============================================================================
# Synergine App — Development Startup
# =============================================================================
# Usage:
#   ./dev.sh              Start everything (infra + app)
#   ./dev.sh app          App only (no Docker)
#   ./dev.sh infra        Infrastructure only
#   ./dev.sh stop         Stop everything
#   ./dev.sh status       Show service status
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

# --- Ensure .env ---
[[ -f .env ]] || { cp env.example .env; echo -e "${CYAN}Created .env from env.example${NC}"; }

# --- Container runtime check ---
ensure_runtime() {
  if docker info &>/dev/null; then
    return 0
  fi
  echo -e "${CYAN}Starting Colima...${NC}"
  if command -v colima &>/dev/null; then
    colima start --cpu 4 --memory 8 --disk 60 2>&1 | tail -3
  else
    echo -e "${RED}No container runtime found. Install Colima or Docker Desktop.${NC}"
    echo "  brew install colima docker docker-compose"
    exit 1
  fi
}

case "${1:-all}" in
  infra)
    ensure_runtime
    echo -e "${GREEN}Starting infrastructure...${NC}"
    docker compose up -d
    echo -e "${GREEN}Core services:${NC}"
    echo "  SurrealDB  → http://localhost:8000"
    echo "  Dragonfly   → localhost:6379"
    echo "  NATS        → localhost:4222 (monitor: http://localhost:8222)"
    ;;

  app)
    echo -e "${GREEN}Starting app (Hono API + React frontend)...${NC}"
    bun run dev
    ;;

  stop)
    echo -e "${CYAN}Stopping...${NC}"
    docker compose --profile search --profile gateway down 2>/dev/null || true
    docker compose down 2>/dev/null || true
    echo -e "${GREEN}Stopped.${NC}"
    ;;

  status)
    echo -e "${CYAN}=== Docker Services ===${NC}"
    docker compose ps 2>/dev/null || echo "No containers running"
    echo ""
    echo -e "${CYAN}=== Bun Processes ===${NC}"
    pgrep -fl "bun" 2>/dev/null || echo "No bun processes"
    ;;

  all|"")
    ensure_runtime
    echo -e "${GREEN}Starting infrastructure...${NC}"
    docker compose up -d

    echo ""
    echo -e "${GREEN}Starting app...${NC}"
    echo -e "${CYAN}  API:      http://localhost:3001${NC}"
    echo -e "${CYAN}  Frontend: http://localhost:5173${NC}"
    echo -e "${CYAN}  SurrealDB: http://localhost:8000${NC}"
    echo -e "${CYAN}  NATS:      http://localhost:8222${NC}"
    echo ""

    bun run dev
    ;;

  *)
    echo "Usage: ./dev.sh [all|app|infra|stop|status]"
    exit 1
    ;;
esac
