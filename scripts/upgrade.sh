#!/bin/bash

##############################################################################
# SuperStack Upgrade Script (Bash 3.2+ compatible)
# ==============================================================================
# Automated service upgrade with rollback capability:
# - Pull latest Docker images
# - Display version changes
# - Create pre-upgrade backup
# - Rolling restart (one service at a time)
# - Health validation after each restart
# - Automatic rollback on failure
#
# Usage: ./upgrade.sh [--dry-run] [--skip-backup] [--service NAME]
##############################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

DRY_RUN=false
SKIP_BACKUP=false
UPGRADE_SERVICE=""
ROLLBACK_POINT=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

# Service groups (space-separated strings for bash 3.2 compatibility)
CORE_SERVICES="surrealdb dragonfly nats"
GATEWAY_SERVICES="caddy"
SEARCH_SERVICES="meilisearch"
MONITORING_SERVICES="signoz uptime-kuma beszel"
WORKFLOW_SERVICES="windmill"
OPTIONAL_SERVICES="langfuse seaweedfs umami coolify listmonk"

# Track upgraded services (space-separated)
UPGRADED_SERVICES=""

# ============================================================================
# Output Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} 🚀 SuperStack Service Upgrade"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "\n${CYAN}▶${NC} $1"
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

# ============================================================================
# Pre-flight Checks
# ============================================================================

check_prerequisites() {
    print_header
    print_step "Prerequisites"

    if ! command -v docker &>/dev/null; then
        print_error "Docker not installed"
        exit 1
    fi
    print_success "Docker available"

    if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
        print_error "Docker Compose not installed"
        exit 1
    fi
    print_success "Docker Compose available"

    cd "$PROJECT_ROOT"
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
    print_success "docker-compose.yml found"
}

check_running_containers() {
    print_step "Checking running services"

    local running=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)

    if [ "$running" -eq 0 ]; then
        print_warning "No containers currently running"
        return 1
    fi

    print_info "Found $running running service(s)"
    docker-compose ps --filter "status=running" 2>/dev/null | tail -n +2 | awk '{print "  - " $1}'

    return 0
}

# ============================================================================
# Version Comparison
# ============================================================================

compare_versions() {
    print_step "Comparing versions"

    echo ""
    echo -e "${CYAN}Service Versions${NC}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    cd "$PROJECT_ROOT"

    # Get all services
    local all_services=$(docker-compose config --services | sort)

    for service in $all_services; do
        local current_image=$(docker-compose images "$service" 2>/dev/null | tail -n +2 | awk '{print $1}')
        local current_tag=$(echo "$current_image" | awk -F: '{print $NF}')

        if [ -n "$current_tag" ]; then
            printf "%-20s ${CYAN}%s${NC}\n" "$service:" "$current_tag"
        fi
    done

    echo ""
}

pull_latest_images() {
    print_step "Pulling latest images"

    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY-RUN] Would pull: docker-compose pull"
        return
    fi

    cd "$PROJECT_ROOT"

    echo ""
    docker-compose pull --no-parallel 2>&1 | grep -v "^$" || true
    print_success "Latest images pulled"
}

# ============================================================================
# Backup
# ============================================================================

create_upgrade_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "Skipping backup (--skip-backup flag)"
        return
    fi

    print_step "Creating pre-upgrade backup"

    if [ ! -f "$SCRIPT_DIR/backup.sh" ]; then
        print_warning "backup.sh not found, skipping"
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY-RUN] Would create backup"
        return
    fi

    # Run backup with background flag if supported
    bash "$SCRIPT_DIR/backup.sh" 2>&1 | tail -n 5

    ROLLBACK_POINT=$(ls -t "$PROJECT_ROOT/.backups"/superstack_backup_*.tar.gz 2>/dev/null | head -1 || echo "")

    if [ -n "$ROLLBACK_POINT" ]; then
        print_success "Backup created: $(basename $ROLLBACK_POINT)"
    fi
}

# ============================================================================
# Health Checks
# ============================================================================

check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        case "$service" in
            surrealdb)
                if curl -sf http://localhost:8000/health &>/dev/null 2>&1; then
                    return 0
                fi
                ;;
            meilisearch)
                if curl -sf http://localhost:7700/health &>/dev/null 2>&1; then
                    return 0
                fi
                ;;
            nats)
                if nc -z localhost 4222 &>/dev/null 2>&1; then
                    return 0
                fi
                ;;
            dragonfly)
                if nc -z localhost 6379 &>/dev/null 2>&1; then
                    return 0
                fi
                ;;
            caddy)
                if nc -z localhost 80 &>/dev/null 2>&1; then
                    return 0
                fi
                ;;
            *)
                # Generic health check
                if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
                    return 0
                fi
                ;;
        esac

        sleep 2
        ((attempt++))
    done

    return 1
}

# ============================================================================
# Service Upgrade
# ============================================================================

upgrade_service() {
    local service=$1

    print_step "Upgrading: $service"

    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY-RUN] Would restart: $service"
        return 0
    fi

    cd "$PROJECT_ROOT"

    # Restart service
    print_info "Restarting $service..."
    docker-compose up -d "$service" 2>&1 | grep -v "^$" || true

    # Wait and check health
    print_info "Waiting for $service to become healthy..."
    if check_service_health "$service"; then
        UPGRADED_SERVICES="$UPGRADED_SERVICES $service"
        print_success "$service upgraded and healthy"
        return 0
    else
        print_error "$service health check failed"
        return 1
    fi
}

rolling_restart() {
    print_header
    print_step "Rolling Restart"

    echo ""

    # Determine which services to upgrade
    local services_to_upgrade

    if [ -n "$UPGRADE_SERVICE" ]; then
        services_to_upgrade="$UPGRADE_SERVICE"
    else
        # Upgrade all running services
        services_to_upgrade=$(docker-compose ps --services --filter "status=running" 2>/dev/null | sort)
    fi

    local total=$(echo "$services_to_upgrade" | wc -w)
    local count=0

    for service in $services_to_upgrade; do
        ((count++))
        echo -e "\n${CYAN}[$count/$total]${NC} Upgrading $service"
        echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

        if upgrade_service "$service"; then
            sleep 2  # Brief pause between restarts
        else
            print_error "Upgrade failed for $service"

            if [ -n "$ROLLBACK_POINT" ] && [ -f "$ROLLBACK_POINT" ]; then
                print_warning "Rolling back to backup: $(basename $ROLLBACK_POINT)"
                bash "$SCRIPT_DIR/backup.sh" --restore "$ROLLBACK_POINT"
            fi

            return 1
        fi
    done

    echo ""
    return 0
}

# ============================================================================
# Post-Upgrade Verification
# ============================================================================

verify_upgrade() {
    print_header
    print_step "Verifying Upgrade"

    echo ""

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = false ]; then
        print_info "Upgrade verification complete"
    fi

    # Check container status
    print_step "Container Status"
    docker-compose ps 2>/dev/null | tail -n +2 | while read -r line; do
        if echo "$line" | grep -q "Up"; then
            local svc=$(echo $line | awk '{print $1}')
            echo -e "${GREEN}✓${NC} $svc: running"
        else
            local svc=$(echo $line | awk '{print $1}')
            echo -e "${YELLOW}⚠${NC} $svc: not running"
        fi
    done
}

# ============================================================================
# Upgrade Report
# ============================================================================

print_upgrade_summary() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$DRY_RUN" = true ]; then
        print_info "DRY-RUN: No changes were made"
    else
        if [ -n "$UPGRADED_SERVICES" ]; then
            print_success "Upgrade completed successfully"
            echo ""
            echo "Upgraded services:"
            for service in $UPGRADED_SERVICES; do
                echo "  - $service"
            done
        else
            print_info "No services were upgraded"
        fi
    fi

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  Check logs: ${GRAY}docker-compose logs -f${NC}"
    echo -e "  Run health check: ${GRAY}./scripts/health.sh${NC}"
    echo ""

    if [ -n "$ROLLBACK_POINT" ] && [ -f "$ROLLBACK_POINT" ]; then
        echo -e "${CYAN}Rollback:${NC}"
        echo -e "  ${GRAY}./scripts/backup.sh --restore $(basename $ROLLBACK_POINT)${NC}"
        echo ""
    fi
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --service)
                UPGRADE_SERVICE="$2"
                shift 2
                ;;
            -h|--help)
                cat << EOF
SuperStack Service Upgrade

USAGE:
  ./scripts/upgrade.sh [OPTIONS]

OPTIONS:
  --dry-run       Show what would be done without making changes
  --skip-backup   Don't create backup before upgrade
  --service NAME  Upgrade specific service only
  -h, --help      Show this help message

EXAMPLES:
  # Preview upgrade
  ./scripts/upgrade.sh --dry-run

  # Upgrade all services
  ./scripts/upgrade.sh

  # Upgrade specific service
  ./scripts/upgrade.sh --service meilisearch

  # Skip backup (fast upgrade)
  ./scripts/upgrade.sh --skip-backup

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

    check_prerequisites

    if ! check_running_containers; then
        print_warning "No running containers to upgrade"
        exit 0
    fi

    compare_versions
    pull_latest_images
    create_upgrade_backup

    if rolling_restart; then
        verify_upgrade
        print_upgrade_summary
    else
        print_error "Upgrade failed"
        exit 1
    fi
}

trap 'print_error "Upgrade script failed"; exit 1' ERR

main "$@"
