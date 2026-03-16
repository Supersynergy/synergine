#!/bin/bash

##############################################################################
# SuperStack Status Script
# Shows all running containers with health status, port mappings, and resources
#
# Usage: ./status.sh [OPTIONS]
#
# Options:
#   --detailed    Show detailed resource usage
#   --watch       Continuously update status (Ctrl+C to exit)
#   -h, --help    Show this help message
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Options
DETAILED=false
WATCH=false

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

status_running() {
    echo -e "${GREEN}●${NC}"
}

status_stopped() {
    echo -e "${RED}●${NC}"
}

status_paused() {
    echo -e "${YELLOW}●${NC}"
}

status_health_healthy() {
    echo -e "${GREEN}healthy${NC}"
}

status_health_unhealthy() {
    echo -e "${RED}unhealthy${NC}"
}

status_health_none() {
    echo -e "${GRAY}none${NC}"
}

show_help() {
    cat << EOF
SuperStack Status Script
Usage: ./status.sh [OPTIONS]

OPTIONS:
    --detailed    Show detailed resource usage breakdown
    --watch       Continuously update status (refresh every 2 seconds)
    -h, --help    Show this help message

EXAMPLES:
    ./status.sh              # Show current status
    ./status.sh --detailed   # Show with detailed stats
    ./status.sh --watch      # Monitor status in real-time

EOF
}

##############################################################################
# Parse Arguments
##############################################################################

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --detailed)
                DETAILED=true
                shift
                ;;
            --watch)
                WATCH=true
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
# Check Prerequisites
##############################################################################

check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker not installed"
        exit 1
    fi

    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
}

##############################################################################
# Container Status
##############################################################################

get_container_status() {
    local container_id=$1

    docker inspect "$container_id" --format='{{.State.Status}}' 2>/dev/null || echo "unknown"
}

get_container_health() {
    local container_id=$1
    local status

    status=$(docker inspect "$container_id" --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || echo "none")

    case "$status" in
        healthy)
            status_health_healthy
            ;;
        unhealthy)
            status_health_unhealthy
            ;;
        starting)
            echo -e "${YELLOW}starting${NC}"
            ;;
        *)
            status_health_none
            ;;
    esac
}

get_container_ports() {
    local container_id=$1

    docker inspect "$container_id" --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} {{end}}' 2>/dev/null | sed 's/ /\n  /g' | grep -v '^$'
}

get_container_image() {
    local container_id=$1

    docker inspect "$container_id" --format='{{.Config.Image}}' 2>/dev/null
}

##############################################################################
# Display Container Status
##############################################################################

display_container_status() {
    local container_id=$1
    local container_name=$2

    local state=$(get_container_status "$container_id")
    local status_icon

    case "$state" in
        running)
            status_icon=$(status_running)
            ;;
        paused)
            status_icon=$(status_paused)
            ;;
        *)
            status_icon=$(status_stopped)
            ;;
    esac

    printf "  %-25s  %s  %-10s" "$container_name" "$status_icon" "$state"

    if [ "$state" = "running" ]; then
        local health=$(get_container_health "$container_id")
        printf "  Health: %s" "$health"
    fi

    echo ""
}

##############################################################################
# Show Container Port Mappings
##############################################################################

show_port_mappings() {
    print_header "Port Mappings"

    cd "$PROJECT_ROOT"

    local containers
    containers=$(docker compose ps --all -q 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        print_warning "No containers found"
        return
    fi

    # Get unique service names from compose file
    local services
    services=$(docker compose --profile gateway --profile search --profile monitoring --profile workflows --profile storage --profile email config --services 2>/dev/null | sort)

    for service in $services; do
        local container_id
        container_id=$(docker compose ps -q "$service" 2>/dev/null || echo "")

        if [ -n "$container_id" ]; then
            local state=$(get_container_status "$container_id")
            local status_icon

            case "$state" in
                running)
                    status_icon=$(status_running)
                    ;;
                *)
                    status_icon=$(status_stopped)
                    ;;
            esac

            echo -e "${CYAN}${service}${NC} ${status_icon}"

            # Show port mappings
            local ports
            ports=$(docker inspect "$container_id" --format='{{json .NetworkSettings.Ports}}' 2>/dev/null | jq -r 'to_entries[] | "\(.key) -> \(.value[0].HostPort)"' 2>/dev/null || true)

            if [ -n "$ports" ]; then
                echo "$ports" | sed 's/^/  /'
            else
                echo "  (no port mappings)"
            fi

            echo ""
        fi
    done
}

##############################################################################
# Show Resource Usage
##############################################################################

show_resource_usage() {
    print_header "Resource Usage"

    cd "$PROJECT_ROOT"

    local containers
    containers=$(docker compose ps -q 2>/dev/null || echo "")

    if [ -z "$containers" ]; then
        print_warning "No containers found"
        return
    fi

    echo "Service Name                     CPU        Memory     Memory Limit"
    echo "════════════════════════════════════════════════════════════════════"

    # Show stats for running containers only
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
}

##############################################################################
# Show Container Logs
##############################################################################

show_recent_logs() {
    print_header "Recent Logs (last 5 lines per service)"

    cd "$PROJECT_ROOT"

    local services
    services=$(docker compose --profile gateway --profile search --profile monitoring --profile workflows --profile storage --profile email config --services 2>/dev/null | sort)

    for service in $services; do
        local container_id
        container_id=$(docker compose ps -q "$service" 2>/dev/null || echo "")

        if [ -n "$container_id" ]; then
            echo -e "${CYAN}${service}:${NC}"
            docker logs --tail 5 "$container_id" 2>/dev/null | sed 's/^/  /' || echo "  (no logs)"
            echo ""
        fi
    done
}

##############################################################################
# Show Network Status
##############################################################################

show_network_status() {
    print_header "Network Status"

    # Check if network exists
    local network_name="superstack-net"

    if docker network inspect "$network_name" &>/dev/null; then
        print_success "Network '$network_name' exists"
        echo ""
        echo "Connected containers:"

        docker network inspect "$network_name" --format='{{range $name, $conf := .Containers}}  - {{$name}} ({{$conf.IPv4Address}}){{println}}{{end}}' 2>/dev/null || echo "  (none)"
    else
        print_warning "Network '$network_name' does not exist"
    fi
}

##############################################################################
# Show Overall Status
##############################################################################

show_overall_status() {
    print_header "SuperStack Status Overview"

    cd "$PROJECT_ROOT"

    local total=0
    local running=0
    local stopped=0
    local services

    services=$(docker compose --profile gateway --profile search --profile monitoring --profile workflows --profile storage --profile email config --services 2>/dev/null | sort)

    echo "Service Status:"
    echo "══════════════════════════════════════════════════════════════════════"
    echo ""

    for service in $services; do
        ((total++))

        local container_id
        container_id=$(docker compose ps -q "$service" 2>/dev/null || echo "")

        if [ -n "$container_id" ]; then
            local state=$(get_container_status "$container_id")

            if [ "$state" = "running" ]; then
                ((running++))
            else
                ((stopped++))
            fi

            display_container_status "$container_id" "$service"
        else
            ((stopped++))
            printf "  %-25s  $(status_stopped)  %-10s\n" "$service" "stopped"
        fi
    done

    echo ""
    echo "Summary:"
    echo "  Total:   $total services"
    echo "  Running: $running services"
    echo "  Stopped: $stopped services"
    echo ""
}

##############################################################################
# Continuous Monitoring (Watch Mode)
##############################################################################

monitor_status() {
    clear

    while true; do
        show_overall_status
        show_port_mappings
        show_resource_usage

        echo ""
        echo -e "${GRAY}Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
        echo -e "${GRAY}Press Ctrl+C to exit${NC}"
        echo ""

        sleep 2
        clear
    done
}

##############################################################################
# Main Execution
##############################################################################

main() {
    # Parse arguments first
    parse_arguments "$@"

    # Check prerequisites
    check_prerequisites

    if [ "$WATCH" = true ]; then
        # Watch mode
        monitor_status
    else
        # One-time display
        show_overall_status
        show_port_mappings
        show_network_status
        show_resource_usage

        if [ "$DETAILED" = true ]; then
            show_recent_logs
        fi

        echo ""
        print_info "To watch status in real-time, run: ./status.sh --watch"
        print_info "To see detailed logs, run: ./status.sh --detailed"
        echo ""
    fi
}

# Run main function
main "$@"
