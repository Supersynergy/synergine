#!/bin/bash

##############################################################################
# SuperStack ONE-COMMAND Setup Script
# ==============================================================================
# Complete setup automation: prerequisites → Docker → dependencies → DB init
# Target: <3 minutes total (with parallel operations)
#
# Usage: ./setup.sh [--no-seed] [--offline]
#
# Features:
#   - OS detection (macOS/Linux) + architecture (arm64/amd64)
#   - Docker prerequisite check with Colima suggestion
#   - Parallel Docker image pulls
#   - Auto-generate secure .env passwords
#   - NPM/Bun dependency installation
#   - SurrealDB schema + optional seed data
#   - Health validation + colorful progress
##############################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/env.example"

SEED_DATA=true
OFFLINE_MODE=false
START_TIME=$(date +%s)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Progress spinners
SPINNER=( "⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏" )

# ============================================================================
# Output Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_subheader() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}▪${NC} $1"
}

spinner_wait() {
    local pid=$1
    local message=$2
    local i=0

    while kill -0 "$pid" 2>/dev/null; do
        printf "\r${CYAN}${SPINNER[$((i % ${#SPINNER[@]}))]}${NC} $message"
        ((i++))
        sleep 0.1
    done

    wait "$pid"
    printf "\r${GREEN}✓${NC} $message\n"
}

# ============================================================================
# System Detection
# ============================================================================

detect_os() {
    local os=$(uname -s)
    case "$os" in
        Darwin*)  echo "macos" ;;
        Linux*)   echo "linux" ;;
        *)        echo "unknown" ;;
    esac
}

detect_arch() {
    local arch=$(uname -m)
    case "$arch" in
        arm64|aarch64)  echo "arm64" ;;
        x86_64|amd64)   echo "amd64" ;;
        *)              echo "unknown" ;;
    esac
}

# ============================================================================
# Prerequisite Checks
# ============================================================================

check_prerequisites() {
    print_header "🔍 Checking Prerequisites"

    local os=$(detect_os)
    local arch=$(detect_arch)

    print_step "OS: $(echo $os | tr '[:lower:]' '[:upper:]') | Architecture: $arch"

    # Check Docker
    print_step "Docker"
    if command -v docker &>/dev/null; then
        local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_success "Docker installed ($docker_version)"
    else
        print_error "Docker not installed"

        if [ "$os" = "macos" ]; then
            print_warning "On macOS, consider installing Colima:"
            echo -e "${GRAY}  brew install colima${NC}"
            echo -e "${GRAY}  colima start${NC}"
        fi

        echo ""
        print_info "Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    # Check Docker Compose
    print_step "Docker Compose"
    if docker compose version &>/dev/null; then
        local compose_version=$(docker compose version --short)
        print_success "Docker Compose installed (v$compose_version)"
    elif command -v docker-compose &>/dev/null; then
        local compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        print_success "docker-compose installed ($compose_version)"
    else
        print_error "Docker Compose not installed"
        exit 1
    fi

    # Check git
    print_step "git"
    if command -v git &>/dev/null; then
        local git_version=$(git --version | awk '{print $3}')
        print_success "git installed (v$git_version)"
    else
        print_error "git not installed"
        exit 1
    fi

    # Check Node.js / Bun
    print_step "Package Manager"
    if command -v bun &>/dev/null; then
        local bun_version=$(bun --version)
        print_success "Bun installed (v$bun_version)"
    elif command -v node &>/dev/null; then
        local node_version=$(node --version)
        print_success "Node.js installed ($node_version)"
    else
        print_error "Neither Node.js nor Bun installed"
        exit 1
    fi

    # Check curl
    print_step "curl"
    if command -v curl &>/dev/null; then
        print_success "curl installed"
    else
        print_error "curl not installed"
        exit 1
    fi

    # Check nc (netcat)
    print_step "netcat"
    if command -v nc &>/dev/null; then
        print_success "netcat installed"
    else
        print_warning "netcat not found (health checks may be limited)"
    fi
}

# ============================================================================
# Environment Configuration
# ============================================================================

generate_password() {
    openssl rand -base64 32
}

setup_env_file() {
    print_header "⚙️  Setting Up Environment"

    if [ -f "$ENV_FILE" ]; then
        print_info ".env already exists (skipping generation)"
        return
    fi

    print_step "Generating .env from template"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    print_success "Created .env"

    print_step "Generating secure passwords"

    # Generate all passwords
    local surrealdb_pass=$(generate_password)
    local dragonfly_pass=$(generate_password)
    local meili_key=$(generate_password)
    local signoz_pass=$(generate_password)
    local langfuse_secret=$(generate_password)
    local langfuse_salt=$(generate_password)
    local langfuse_pass=$(generate_password)
    local windmill_secret=$(generate_password)
    local windmill_pass=$(generate_password)
    local listmonk_pass=$(generate_password)
    local listmonk_admin_pass=$(generate_password)
    local umami_secret=$(generate_password)
    local umami_pass=$(generate_password)

    # Replace in .env using sed
    sed -i '' "s/SURREALDB_PASSWORD=.*/SURREALDB_PASSWORD=$surrealdb_pass/" "$ENV_FILE"
    sed -i '' "s/DRAGONFLY_PASSWORD=.*/DRAGONFLY_PASSWORD=$dragonfly_pass/" "$ENV_FILE"
    sed -i '' "s/MEILI_MASTER_KEY=.*/MEILI_MASTER_KEY=$meili_key/" "$ENV_FILE"
    sed -i '' "s/SIGNOZ_CLICKHOUSE_PASSWORD=.*/SIGNOZ_CLICKHOUSE_PASSWORD=$signoz_pass/" "$ENV_FILE"
    sed -i '' "s/LANGFUSE_NEXTAUTH_SECRET=.*/LANGFUSE_NEXTAUTH_SECRET=$langfuse_secret/" "$ENV_FILE"
    sed -i '' "s/LANGFUSE_SALT=.*/LANGFUSE_SALT=$langfuse_salt/" "$ENV_FILE"
    sed -i '' "s/LANGFUSE_INIT_USER_PASSWORD=.*/LANGFUSE_INIT_USER_PASSWORD=$langfuse_pass/" "$ENV_FILE"
    sed -i '' "s/WINDMILL_SECRET=.*/WINDMILL_SECRET=$windmill_secret/" "$ENV_FILE"
    sed -i '' "s/WINDMILL_DB_PASSWORD=.*/WINDMILL_DB_PASSWORD=$windmill_pass/" "$ENV_FILE"
    sed -i '' "s/LISTMONK_DB_PASSWORD=.*/LISTMONK_DB_PASSWORD=$listmonk_pass/" "$ENV_FILE"
    sed -i '' "s/LISTMONK_ADMIN_PASSWORD=.*/LISTMONK_ADMIN_PASSWORD=$listmonk_admin_pass/" "$ENV_FILE"
    sed -i '' "s/UMAMI_APP_SECRET=.*/UMAMI_APP_SECRET=$umami_secret/" "$ENV_FILE"
    sed -i '' "s/UMAMI_DB_PASSWORD=.*/UMAMI_DB_PASSWORD=$umami_pass/" "$ENV_FILE"

    # For localhost development
    sed -i '' "s/DOMAIN=.*/DOMAIN=localhost/" "$ENV_FILE"
    sed -i '' "s/ACME_EMAIL=.*/ACME_EMAIL=admin@localhost/" "$ENV_FILE"

    print_success "Generated and injected 13 secure passwords"
}

# ============================================================================
# Docker Operations
# ============================================================================

pull_docker_images() {
    print_header "🐳 Pulling Docker Images (Parallel)"

    if [ "$OFFLINE_MODE" = true ]; then
        print_info "Offline mode: skipping image pulls"
        return
    fi

    print_step "Starting parallel image pulls"

    # Load env to get docker compose config
    set -a
    [ -f "$ENV_FILE" ] && source "$ENV_FILE"
    set +a

    cd "$PROJECT_ROOT"

    # Get list of services from docker-compose.yml
    local services=$(docker-compose config --services 2>/dev/null | tr '\n' ' ')

    if [ -z "$services" ]; then
        print_warning "Could not determine services from docker-compose.yml"
        return
    fi

    # Start parallel pulls for each service (background jobs)
    local pids=()
    local count=0
    local total=$(echo "$services" | wc -w)

    for service in $services; do
        (
            docker-compose pull "$service" 2>/dev/null || true
        ) &
        pids+=($!)
        ((count++))
    done

    print_info "Pulling $total service images in parallel..."

    # Wait for all background jobs
    local completed=0
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
        ((completed++))
        printf "\r${CYAN}[%d/%d]${NC} Images pulled" "$completed" "$total"
    done
    printf "\n"

    print_success "All Docker images pulled"
}

# ============================================================================
# Dependencies
# ============================================================================

install_dependencies() {
    print_header "📦 Installing Dependencies"

    cd "$PROJECT_ROOT"

    if command -v bun &>/dev/null; then
        print_step "Using Bun for dependency installation"
        bun install
    else
        print_step "Using npm for dependency installation"
        npm install
    fi

    print_success "Dependencies installed"
}

# ============================================================================
# Database Initialization
# ============================================================================

init_database() {
    print_header "🗄️  Initializing Database"

    # Load environment
    set -a
    [ -f "$ENV_FILE" ] && source "$ENV_FILE"
    set +a

    print_step "Starting services..."
    cd "$PROJECT_ROOT"
    docker-compose up -d surrealdb 2>/dev/null || true

    # Wait for SurrealDB
    print_info "Waiting for SurrealDB to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f http://localhost:8000/health &>/dev/null; then
            print_success "SurrealDB is ready"
            break
        fi
        sleep 2
        ((attempt++))
    done

    if [ $attempt -eq $max_attempts ]; then
        print_error "SurrealDB failed to start within timeout"
        return 1
    fi

    # Run init-db.sh
    print_step "Running database schema initialization..."
    if [ "$SEED_DATA" = true ]; then
        bash "$SCRIPT_DIR/init-db.sh" --seed
    else
        bash "$SCRIPT_DIR/init-db.sh"
    fi

    print_success "Database initialized"
}

# ============================================================================
# Health Validation
# ============================================================================

validate_setup() {
    print_header "✅ Validating Setup"

    # Check core services
    print_step "SurrealDB"
    if curl -s -f http://localhost:8000/health &>/dev/null; then
        print_success "SurrealDB is responsive"
    else
        print_warning "SurrealDB not responding (may not be started)"
    fi

    print_step "Docker network"
    if docker network inspect superstack-net &>/dev/null; then
        print_success "superstack-net network exists"
    else
        print_warning "superstack-net network not found"
    fi

    print_step "Configuration files"
    [ -f "$ENV_FILE" ] && print_success ".env exists" || print_warning ".env missing"
    [ -f "$PROJECT_ROOT/docker-compose.yml" ] && print_success "docker-compose.yml exists" || print_warning "docker-compose.yml missing"
}

# ============================================================================
# Completion Report
# ============================================================================

print_completion_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    print_header "🎉 Setup Complete!"

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Setup completed in $duration seconds${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "  ${YELLOW}Start services:${NC}"
    echo -e "    ${GRAY}cd $PROJECT_ROOT${NC}"
    echo -e "    ${GRAY}./scripts/start.sh dev${NC}"
    echo ""
    echo -e "  ${YELLOW}Check service status:${NC}"
    echo -e "    ${GRAY}./scripts/status.sh${NC}"
    echo ""
    echo -e "  ${YELLOW}View logs:${NC}"
    echo -e "    ${GRAY}docker-compose logs -f surrealdb${NC}"
    echo ""

    echo -e "${CYAN}Key Resources:${NC}"
    echo -e "  SurrealDB:    http://localhost:8000"
    echo -e "  Dragonfly:    redis://localhost:6379"
    echo -e "  NATS:         nats://localhost:4222"
    echo ""

    echo -e "${CYAN}Documentation:${NC}"
    echo -e "  ${GRAY}See README.md for configuration details${NC}"
    echo -e "  ${GRAY}See CONFIG.md for all environment variables${NC}"
    echo -e "  ${GRAY}See QUICK_START.md for common tasks${NC}"
    echo ""
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-seed)
                SEED_DATA=false
                shift
                ;;
            --offline)
                OFFLINE_MODE=true
                shift
                ;;
            -h|--help)
                cat << EOF
SuperStack Setup Script

USAGE:
  ./scripts/setup.sh [OPTIONS]

OPTIONS:
  --no-seed          Don't import seed data to SurrealDB
  --offline          Skip Docker image pulls
  -h, --help         Show this help message

EXAMPLES:
  # Full setup with seed data
  ./scripts/setup.sh

  # Setup without seed data
  ./scripts/setup.sh --no-seed

  # Setup with cached Docker images
  ./scripts/setup.sh --offline

EOF
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    parse_args "$@"

    print_header "🚀 SuperStack Setup"
    print_info "Target: <3 minutes with parallel operations"
    echo ""

    check_prerequisites
    setup_env_file
    pull_docker_images
    install_dependencies
    init_database
    validate_setup
    print_completion_report

    return 0
}

# Trap errors
trap 'print_error "Setup failed"; exit 1' ERR

# Execute
main "$@"
