#!/bin/bash

##############################################################################
# SuperStack Universal Start Script
# Usage: ./start.sh [profile]
#
# Profiles:
#   core         - SurrealDB, Dragonfly, NATS (foundation services)
#   dev          - core + Gateway + Meilisearch (development stack)
#   monitoring   - core + SigNoz, Uptime Kuma, Beszel (observability)
#   full         - core + Gateway + Meilisearch + monitoring + Windmill
#   all          - Everything (all services)
#   (default)    - Same as 'dev'
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default profile
PROFILE="${1:-dev}"

# Service groups
CORE_SERVICES=("surrealdb" "dragonfly" "nats")
GATEWAY_SERVICES=("caddy")
SEARCH_SERVICES=("meilisearch")
MONITORING_SERVICES=("signoz" "uptime-kuma" "beszel")
WORKFLOW_SERVICES=("windmill")
OPTIONAL_SERVICES=("langfuse" "seaweedfs" "umami" "coolify" "listmonk")

# Initialize services array
SERVICES_TO_START=()

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

##############################################################################
# Build Service List Based on Profile
##############################################################################

build_service_list() {
    local profile=$1

    case "$profile" in
        core)
            SERVICES_TO_START=("${CORE_SERVICES[@]}")
            ;;
        dev)
            SERVICES_TO_START=("${CORE_SERVICES[@]}" "${GATEWAY_SERVICES[@]}" "${SEARCH_SERVICES[@]}")
            ;;
        monitoring)
            SERVICES_TO_START=("${CORE_SERVICES[@]}" "${MONITORING_SERVICES[@]}")
            ;;
        full)
            SERVICES_TO_START=("${CORE_SERVICES[@]}" "${GATEWAY_SERVICES[@]}" "${SEARCH_SERVICES[@]}" "${MONITORING_SERVICES[@]}" "${WORKFLOW_SERVICES[@]}")
            ;;
        all)
            SERVICES_TO_START=("${CORE_SERVICES[@]}" "${GATEWAY_SERVICES[@]}" "${SEARCH_SERVICES[@]}" "${MONITORING_SERVICES[@]}" "${WORKFLOW_SERVICES[@]}" "${OPTIONAL_SERVICES[@]}")
            ;;
        *)
            print_error "Unknown profile: $profile"
            echo -e "\nAvailable profiles:"
            echo "  core       - Foundation services only"
            echo "  dev        - Development stack (recommended)"
            echo "  monitoring - With observability services"
            echo "  full       - Complete stack"
            echo "  all        - Everything including optional services"
            exit 1
            ;;
    esac
}

##############################################################################
# Pre-flight Checks
##############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed"
        exit 1
    fi
    print_success "Docker found"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose not installed"
        exit 1
    fi
    print_success "Docker Compose found"

    # Check project files
    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_error "docker-compose.yml not found in $PROJECT_ROOT"
        exit 1
    fi
    print_success "docker-compose.yml found"

    # Check configuration files
    if [ ! -f "$PROJECT_ROOT/config/Caddyfile" ]; then
        print_info "Caddyfile not found - will create with defaults"
    fi
    if [ ! -f "$PROJECT_ROOT/config/nats.conf" ]; then
        print_info "nats.conf not found - will create with defaults"
    fi
}

##############################################################################
# Create Network if Needed
##############################################################################

ensure_network() {
    local network_name="superstack-net"

    if ! docker network inspect "$network_name" &>/dev/null; then
        print_info "Creating Docker network: $network_name"
        docker network create "$network_name" || true
    else
        print_success "Network $network_name already exists"
    fi
}

##############################################################################
# Start Services
##############################################################################

start_services() {
    print_header "Starting Services"

    local services_str=$(IFS=' '; echo "${SERVICES_TO_START[*]}")

    print_info "Starting profile: ${PROFILE}"
    print_info "Services: $services_str"
    echo ""

    # Change to project directory
    cd "$PROJECT_ROOT"

    # Start services using Docker Compose
    if docker-compose up -d $services_str; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        return 1
    fi
}

##############################################################################
# Wait for Services to be Ready
##############################################################################

wait_for_services() {
    print_header "Waiting for Services to Be Ready"

    local max_attempts=30
    local attempt=1

    # Check core services if they're in the list
    for service in "${SERVICES_TO_START[@]}"; do
        case "$service" in
            surrealdb)
                print_info "Waiting for SurrealDB (port 8000)..."
                while [ $attempt -le $max_attempts ]; do
                    if nc -z localhost 8000 2>/dev/null; then
                        print_success "SurrealDB is ready"
                        break
                    fi
                    sleep 2
                    ((attempt++))
                done
                ;;
            nats)
                print_info "Waiting for NATS (port 4222)..."
                attempt=1
                while [ $attempt -le $max_attempts ]; do
                    if nc -z localhost 4222 2>/dev/null; then
                        print_success "NATS is ready"
                        break
                    fi
                    sleep 2
                    ((attempt++))
                done
                ;;
            meilisearch)
                print_info "Waiting for Meilisearch (port 7700)..."
                attempt=1
                while [ $attempt -le $max_attempts ]; do
                    if nc -z localhost 7700 2>/dev/null; then
                        print_success "Meilisearch is ready"
                        break
                    fi
                    sleep 2
                    ((attempt++))
                done
                ;;
            caddy)
                print_info "Waiting for Caddy (port 80)..."
                attempt=1
                while [ $attempt -le $max_attempts ]; do
                    if nc -z localhost 80 2>/dev/null; then
                        print_success "Caddy is ready"
                        break
                    fi
                    sleep 2
                    ((attempt++))
                done
                ;;
        esac
    done
}

##############################################################################
# Print Service URLs
##############################################################################

print_service_urls() {
    print_header "Service URLs"

    echo "Profile: ${PROFILE}"
    echo ""

    # Always available in core
    if [[ " ${SERVICES_TO_START[@]} " =~ " surrealdb " ]]; then
        echo -e "${GREEN}SurrealDB${NC}"
        echo "  API: http://localhost:8000"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " nats " ]]; then
        echo -e "${GREEN}NATS${NC}"
        echo "  Client: nats://localhost:4222"
        echo "  Monitoring: http://localhost:8222"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " dragonfly " ]]; then
        echo -e "${GREEN}Dragonfly (Redis)${NC}"
        echo "  redis://localhost:6379"
        echo ""
    fi

    # Gateway + Search
    if [[ " ${SERVICES_TO_START[@]} " =~ " caddy " ]]; then
        echo -e "${GREEN}Caddy Reverse Proxy${NC}"
        echo "  HTTP: http://localhost:80"
        echo "  HTTPS: https://localhost:443"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " meilisearch " ]]; then
        echo -e "${GREEN}Meilisearch${NC}"
        echo "  API: http://localhost:7700"
        echo "  Via Caddy: http://localhost/api/search"
        echo ""
    fi

    # Monitoring
    if [[ " ${SERVICES_TO_START[@]} " =~ " signoz " ]]; then
        echo -e "${GREEN}SigNoz (Monitoring)${NC}"
        echo "  Dashboard: http://localhost:3301"
        echo "  Via Caddy: http://localhost/monitoring"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " uptime-kuma " ]]; then
        echo -e "${GREEN}Uptime Kuma${NC}"
        echo "  Dashboard: http://localhost:3200"
        echo "  Via Caddy: http://localhost/uptime"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " beszel " ]]; then
        echo -e "${GREEN}Beszel (System Monitor)${NC}"
        echo "  Dashboard: http://localhost:8090"
        echo ""
    fi

    # Workflows
    if [[ " ${SERVICES_TO_START[@]} " =~ " windmill " ]]; then
        echo -e "${GREEN}Windmill${NC}"
        echo "  Dashboard: http://localhost:8100"
        echo "  Via Caddy: http://localhost/windmill"
        echo ""
    fi

    # Optional
    if [[ " ${SERVICES_TO_START[@]} " =~ " langfuse " ]]; then
        echo -e "${GREEN}Langfuse${NC}"
        echo "  Dashboard: http://localhost:3100"
        echo "  Via Caddy: http://localhost/langfuse"
        echo ""
    fi

    if [[ " ${SERVICES_TO_START[@]} " =~ " umami " ]]; then
        echo -e "${GREEN}Umami Analytics${NC}"
        echo "  Dashboard: http://localhost:3500"
        echo "  Via Caddy: http://localhost/analytics"
        echo ""
    fi

    echo -e "${YELLOW}Tip: Use './stop.sh' to stop services${NC}"
    echo -e "${YELLOW}Tip: Use './status.sh' to check service status${NC}"
}

##############################################################################
# Main Execution
##############################################################################

main() {
    print_header "SuperStack Service Manager"

    # Build service list
    build_service_list "$PROFILE"

    # Check prerequisites
    check_prerequisites

    # Ensure network exists
    ensure_network

    # Start services
    start_services || exit 1

    # Wait for services to be ready
    wait_for_services

    # Print URLs
    print_service_urls

    print_header "Startup Complete"
}

# Run main function
main "$@"
