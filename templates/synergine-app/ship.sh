#!/usr/bin/env bash
# ============================================================
# ship.sh — Idea to Production Pipeline
# ============================================================
# Usage:
#   ./ship.sh <megaprompt.md>              Full pipeline
#   ./ship.sh <megaprompt.md> --plan-only  Just scaffold + plan
#   ./ship.sh --template                   Generate megaprompt template
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# --- Template Mode ---
if [[ "${1:-}" == "--template" ]]; then
  cat << 'TMPL'
# Product: [Name]

## What it does (1-3 sentences)
[Plain language description]

## Who it's for
[Target user persona]

## How they pay
[Free tier + paid pricing]

## Core features (max 5 for MVP)
1. [Feature]
2. [Feature]
3. [Feature]
4. [Feature]
5. [Feature]

## Non-goals (what it does NOT do in v1)
- [Scope limitation]
- [Scope limitation]

## Design vibe
[e.g., "Clean like Linear", "Playful like Notion"]

## Ship deadline
[YYYY-MM-DD]
TMPL
  exit 0
fi

# --- Validate Input ---
PROMPT_FILE="${1:?Usage: ./ship.sh <megaprompt.md> | ./ship.sh --template}"
[[ -f "$PROMPT_FILE" ]] || { echo -e "${RED}File not found: $PROMPT_FILE${NC}"; exit 1; }
PLAN_ONLY="${2:-}"

# --- Extract Project Name ---
PROJECT_NAME=$(grep -m1 "^# Product:" "$PROMPT_FILE" | sed 's/# Product: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
[[ -n "$PROJECT_NAME" ]] || { echo -e "${RED}Could not extract project name. First line must be '# Product: Name'${NC}"; exit 1; }
PROJECT_DIR="$HOME/$PROJECT_NAME"

echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     SYNERGINE SHIP PIPELINE              ║"
echo "  ║     Idea → Production in 7 Days          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${CYAN}Project:${NC} $PROJECT_NAME"
echo -e "${CYAN}Target:${NC}  $PROJECT_DIR"
echo ""

# --- Phase 0: Scaffold from Synergine Template ---
echo -e "${GREEN}Phase 0: Scaffolding...${NC}"

if [[ -d "$PROJECT_DIR" ]]; then
  echo -e "${RED}Directory $PROJECT_DIR already exists. Use a different name or remove it.${NC}"
  exit 1
fi

TEMPLATE_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$TEMPLATE_DIR/package.json" ]] && grep -q "synergine-app" "$TEMPLATE_DIR/package.json" 2>/dev/null; then
  # Running from within synergine-app template
  rsync -a --exclude='node_modules' --exclude='.env' --exclude='bun.lock' --exclude='local.db' --exclude='.git' "$TEMPLATE_DIR/" "$PROJECT_DIR/"
else
  # Running standalone — look for template
  SYNERGINE_TEMPLATE="$HOME/synergine-app"
  [[ -d "$SYNERGINE_TEMPLATE" ]] || { echo -e "${RED}Synergine template not found at $SYNERGINE_TEMPLATE${NC}"; exit 1; }
  rsync -a --exclude='node_modules' --exclude='.env' --exclude='bun.lock' --exclude='local.db' --exclude='.git' "$SYNERGINE_TEMPLATE/" "$PROJECT_DIR/"
fi

cd "$PROJECT_DIR"

# Rename references
find . -type f -name "*.json" -not -path "*/node_modules/*" -exec sed -i '' "s/synergine-app/$PROJECT_NAME/g" {} + 2>/dev/null || true

# Copy megaprompt
mkdir -p .planning
cp "$PROMPT_FILE" .planning/MEGAPROMPT.md

# Init git
git init -q
git add -A
git commit -q -m "init: scaffold $PROJECT_NAME from synergine-app template"

echo -e "${GREEN}  Scaffolded at $PROJECT_DIR${NC}"

# --- Phase 1: Validate Idea ---
echo ""
echo -e "${GREEN}Phase 1: Validating idea...${NC}"

if command -v zeroclaw &>/dev/null; then
  echo -e "${CYAN}  Running idea-validator agent...${NC}"
  zeroclaw agent \
    --config-dir "$HOME/.zeroclaw" \
    --task "Validate this product idea for feasibility with the Synergine stack. Output structured analysis.

$(cat "$PROMPT_FILE")" \
    --model claude-haiku-4-5-20251001 \
    --output .planning/VALIDATION.md 2>/dev/null || echo "  (ZeroClaw validation skipped — run manually)"
else
  echo -e "${CYAN}  ZeroClaw not found. Skipping auto-validation.${NC}"
  echo "  Run manually: zeroclaw agent --role idea-validator --task \"\$(cat .planning/MEGAPROMPT.md)\""
fi

# --- Phase 2: Install + Setup ---
echo ""
echo -e "${GREEN}Phase 2: Installing dependencies...${NC}"
cp env.example .env
bun install --silent 2>/dev/null || bun install

# Push schema
bun run db:push 2>/dev/null && echo -e "${GREEN}  Database schema pushed${NC}" || echo -e "${CYAN}  DB push skipped (start infra first: ./dev.sh infra)${NC}"

# --- Summary ---
echo ""
echo -e "${BOLD}${GREEN}Pipeline ready!${NC}"
echo ""
echo -e "${CYAN}Your project is at:${NC} $PROJECT_DIR"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review the plan:"
echo "     cat .planning/MEGAPROMPT.md"
echo "     cat .planning/VALIDATION.md  # if ZeroClaw ran"
echo ""
echo "  2. Start infrastructure:"
echo "     ./dev.sh infra"
echo ""
echo "  3. Open Claude Code and build autonomously:"
echo "     claude"
echo "     /gsd:new-project        # reads .planning/MEGAPROMPT.md"
echo "     /gsd:autonomous         # builds all phases automatically"
echo ""
echo "  4. Or build phase by phase:"
echo "     /gsd:plan-phase 1"
echo "     /gsd:execute-phase 1"
echo "     /gsd:verify-work 1"
echo ""
echo "  5. When done, ship:"
echo "     biome check --write ."
echo "     bun run build"
echo "     git remote add origin https://github.com/Supersynergy/$PROJECT_NAME.git"
echo "     git push -u origin main"
echo ""

if [[ "$PLAN_ONLY" == "--plan-only" ]]; then
  echo -e "${CYAN}Plan-only mode. Stopping here.${NC}"
  exit 0
fi

echo -e "${GREEN}Happy shipping!${NC}"
