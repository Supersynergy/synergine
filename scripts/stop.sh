#!/bin/bash

##############################################################################
# SuperStack Stop Script
# Gracefully stops all running services
#
# Usage: ./stop.sh [OPTIONS]
#
# Options:
#   --clean       Remove volumes (WARNING: destructive)
#   --force       Force stop without waiting for graceful shutdown
#   -h, --help    Show this help message
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

# Options
REMOVE_VOLUMES=false
FORCE_STOP=false

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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

show_help() {
    cat << EOF
SuperStack Stop Script
Usage: ./stop.sh [OPTIONS]

OPTIONS:
    --clean       Remove Docker volumes (WARNING: destructive - removes data!)
    --force       Force stop without waiting for graceful shutdown
    -h, --help    Show this help message

EXAMPLES:
    ./stop.sh                 # Graceful shutdown
    ./stop.sh --force         # Force stop all containers
    ./stop.sh --clean         # Stop and remove volumes
    ./stop.sh --force --clean # Force stop and remove volumes

EOF
}

##############################################################################
# Parse Arguments
##############################################################################

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --clean)
                REMOVE_VOLUMES=true
                shift
                ;;
            --force)
                FORCE_STOP=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

##############################################################################
# Pre-flight Checks
##############################################################################

check_prerequisites() {
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose not installed"
        exit 1
    fi

    # Check project files
    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
}

##############################################################################
# Check Running Services
##############################################################################

check_running_services() {
    print_header "Checking Running Services"

    cd "$PROJECT_ROOT"

    # Get list of running services
    local running=$(docker compose ps --services --filter "status=running" 2>/dev/null || true)

    if [ -z "$running" ]; then
        print_info "No services are currently running"
        return 1
    else
        echo "Running services:"
        echo "$running" | sed 's/^/  - /'
        return 0
    fi
}

##############################################################################
# Stop Services
##############################################################################

stop_services() {
    print_header "Stopping Services"

    cd "$PROJECT_ROOT"

    # All profiles flag to ensure all profile-gated services are also stopped
    local ALL_PROFILES="--profile gateway --profile search --profile monitoring --profile workflows --profile storage --profile email"

    if [ "$FORCE_STOP" = true ]; then
        print_warning "Force stopping all services..."
        print_info "Sending SIGKILL to all containers"

        if docker compose $ALL_PROFILES kill; then
            print_success "Force stopped all services"
        else
            print_error "Failed to force stop services"
            return 1
        fi
    else
        print_info "Gracefully stopping services..."
        print_info "Sending SIGTERM signal (60 second timeout)"

        if docker compose $ALL_PROFILES down --timeout=60; then
            print_success "Gracefully stopped all services"
        else
            print_error "Failed to stop services gracefully"
            return 1
        fi
    fi
}

##############################################################################
# Remove Volumes (if requested)
##############################################################################

remove_volumes() {
    if [ "$REMOVE_VOLUMES" = false ]; then
        return 0
    fi

    print_header "Removing Volumes"

    # Confirmation prompt
    echo -e "${RED}WARNING: This will delete all data in Docker volumes!${NC}"
    echo ""
    echo "The following data will be permanently deleted:"
    echo "  - SurrealDB data"
    echo "  - Dragonfly cache data"
    echo "  - NATS JetStream messages"
    echo "  - Meilisearch indexes"
    echo "  - All monitoring data"
    echo "  - All service configurations"
    echo ""

    read -p "Are you absolutely sure you want to continue? Type 'yes' to confirm: " -r

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Cancelled - volumes preserved"
        return 0
    fi

    cd "$PROJECT_ROOT"

    echo ""
    print_info "Removing volumes..."

    if docker compose --profile gateway --profile search --profile monitoring --profile workflows --profile storage --profile email down -v; then
        print_success "Removed all volumes"
    else
        print_error "Failed to remove volumes"
        return 1
    fi
}

##############################################################################
# Cleanup
##############################################################################

cleanup() {
    print_header "Cleanup"

    cd "$PROJECT_ROOT"

    # Remove any dangling containers
    print_info "Cleaning up dangling containers..."
    docker container prune -f --filter "label!=keep" > /dev/null 2>&1 || true

    # Optionally remove dangling images
    # docker image prune -f > /dev/null 2>&1 || true

    print_success "Cleanup complete"
}

##############################################################################
# Print Status
##############################################################################

print_final_status() {
    print_header "Shutdown Complete"

    cd "$PROJECT_ROOT"

    local remaining=$(docker-compose ps --services 2>/dev/null | wc -l)

    if [ "$remaining" -eq 0 ]; then
        print_success "All services have been stopped"
    else
        print_warning "Some services may still be stopping"
        echo ""
        print_info "To force stop remaining services, run:"
        echo "  ./stop.sh --force"
    fi

    if [ "$REMOVE_VOLUMES" = true ]; then
        print_info "All data volumes have been removed"
        echo ""
        print_warning "To restart with fresh data, run:"
        echo "  ./start.sh dev"
    else
        print_info "Data volumes are preserved"
        echo ""
        print_warning "To restart services with existing data, run:"
        echo "  ./start.sh dev"
        echo ""
        print_warning "To start fresh (remove all data), run:"
        echo "  ./stop.sh --clean"
        echo "  ./start.sh dev"
    fi
}

##############################################################################
# Main Execution
##############################################################################

main() {
    # Parse arguments first
    parse_arguments "$@"

    print_header "SuperStack Service Manager - Stop"

    # Check prerequisites
    check_prerequisites

    # Check if any services are running
    if ! check_running_services; then
        print_success "No services to stop"
        exit 0
    fi

    echo ""

    # Stop services
    stop_services || exit 1

    # Remove volumes if requested
    if [ "$REMOVE_VOLUMES" = true ]; then
        remove_volumes || exit 1
    fi

    # Cleanup
    cleanup

    # Print final status
    print_final_status
}

# Run main function
main "$@"
