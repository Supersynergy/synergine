#!/bin/bash

##############################################################################
# SuperStack Health Check Script (Bash 3.2+ compatible)
# ==============================================================================
# Comprehensive system health monitoring:
# - Service endpoint pings (response times)
# - Database connectivity validation
# - Disk/memory usage analysis
# - Overall health score (0-100%)
#
# Usage: ./health.sh [--verbose] [--json]
##############################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

VERBOSE=false
JSON_OUTPUT=false
CHECK_TIMEOUT=5

# Service endpoints (parallel arrays for bash 3.2 compatibility)
SERVICES="SurrealDB Dragonfly NATS NATS_Monitor Meilisearch Caddy SigNoz Uptime_Kuma Beszel Windmill Langfuse Listmonk Umami SeaweedFS_Master SeaweedFS_Volume SeaweedFS_S3"
ENDPOINTS="http://localhost:8000/health redis://localhost:6379 nats://localhost:4222 http://localhost:8222 http://localhost:7700/health http://localhost:80 http://localhost:3301/api/v1/health http://localhost:3200 http://localhost:8090/api/health http://localhost:8100/api/auth/login http://localhost:3100 http://localhost:9000 http://localhost:3500 http://localhost:9333 http://localhost:8080 http://localhost:8333"

# Health status tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m'

# ============================================================================
# Output Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} 🏥 SuperStack Health Check"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

status_indicator() {
    local status=$1
    case "$status" in
        ok)     echo -e "${GREEN}✓${NC}" ;;
        warn)   echo -e "${YELLOW}⚠${NC}" ;;
        fail)   echo -e "${RED}✗${NC}" ;;
        *)      echo -e "${GRAY}?${NC}" ;;
    esac
}

# ============================================================================
# Service Health Checks
# ============================================================================

check_http_service() {
    local name=$1
    local url=$2

    if timeout $CHECK_TIMEOUT curl -sf "$url" &>/dev/null 2>&1; then
        echo "ok"
        ((PASSED_CHECKS++))
        return 0
    else
        echo "fail"
        ((FAILED_CHECKS++))
        return 1
    fi
}

check_redis_service() {
    if command -v redis-cli &>/dev/null; then
        if timeout $CHECK_TIMEOUT redis-cli -p 6379 ping &>/dev/null 2>&1; then
            echo "ok"
            ((PASSED_CHECKS++))
            return 0
        fi
    else
        if command -v nc &>/dev/null; then
            if nc -z -w 1 localhost 6379 &>/dev/null 2>&1; then
                echo "ok"
                ((PASSED_CHECKS++))
                return 0
            fi
        fi
    fi

    echo "fail"
    ((FAILED_CHECKS++))
    return 1
}

check_nats_service() {
    if command -v nc &>/dev/null; then
        if nc -z -w 1 localhost 4222 &>/dev/null 2>&1; then
            echo "ok"
            ((PASSED_CHECKS++))
            return 0
        fi
    fi

    echo "fail"
    ((FAILED_CHECKS++))
    return 1
}

check_surreal_db() {
    if timeout $CHECK_TIMEOUT curl -sf http://localhost:8000/health &>/dev/null 2>&1; then
        echo "ok"
        ((PASSED_CHECKS++))
        return 0
    fi

    echo "fail"
    ((FAILED_CHECKS++))
    return 1
}

# ============================================================================
# System Resource Checks
# ============================================================================

check_disk_space() {
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Disk usage: ${disk_usage}% (healthy)"
        return 0
    elif [ "$disk_usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} Disk usage: ${disk_usage}% (warning)"
        return 1
    else
        echo -e "${RED}✗${NC} Disk usage: ${disk_usage}% (critical)"
        return 1
    fi
}

check_memory() {
    local os=$(uname -s)
    local mem_usage

    if [ "$os" = "Darwin" ]; then
        mem_usage=$(vm_stat 2>/dev/null | grep "Pages active" | awk '{print $3}' | sed 's/\.//' | awk '{print int($1 * 4 / 1024 / 1024)}' || echo "0")
    else
        mem_usage=$(free 2>/dev/null | grep Mem | awk '{printf "%d", $3 / $2 * 100}' || echo "0")
    fi

    if [ "$mem_usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Memory usage: ${mem_usage}% (healthy)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Memory usage: ${mem_usage}% (high)"
        return 1
    fi
}

check_docker_health() {
    if ! command -v docker &>/dev/null; then
        echo -e "${YELLOW}⚠${NC} Docker not installed"
        return 1
    fi

    if docker info &>/dev/null; then
        local running=$(docker ps --quiet 2>/dev/null | wc -l)
        echo -e "${GREEN}✓${NC} Docker daemon is running"
        echo -e "  ${CYAN}→${NC} $running container(s) running"
        return 0
    else
        echo -e "${RED}✗${NC} Docker daemon not responding"
        return 1
    fi
}

# ============================================================================
# Health Report
# ============================================================================

print_service_checks() {
    echo -e "\n${BLUE}Service Health${NC}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    # Parse services and endpoints
    local service_array=($SERVICES)
    local endpoint_array=($ENDPOINTS)
    local idx=0

    for service in "${service_array[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        local endpoint="${endpoint_array[$idx]}"

        # Determine check type
        local status="fail"
        case "$service" in
            SurrealDB)
                status=$(check_surreal_db)
                ;;
            Dragonfly)
                status=$(check_redis_service)
                ;;
            NATS)
                status=$(check_nats_service)
                ;;
            *)
                status=$(check_http_service "$service" "$endpoint")
                ;;
        esac

        local indicator=$(status_indicator "$status")
        printf "%-20s %s\n" "$service" "$indicator"

        if [ "$VERBOSE" = true ] && [ "$status" = "fail" ]; then
            echo -e "  ${GRAY}→ Connection failed (endpoint: $endpoint)${NC}"
        fi

        idx=$((idx + 1))
    done
}

print_system_checks() {
    echo -e "\n${BLUE}System Resources${NC}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    check_disk_space
    check_memory
    echo ""
    check_docker_health
}

calculate_health_score() {
    if [ $TOTAL_CHECKS -eq 0 ]; then
        echo "0"
        return
    fi

    local score=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "$score"
}

print_health_summary() {
    echo -e "\n${BLUE}Summary${NC}"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    local score=$(calculate_health_score)

    echo -e "Service Health:  ${CYAN}${PASSED_CHECKS}/${TOTAL_CHECKS}${NC} checks passed"
    echo -e "Health Score:    ${CYAN}${score}%${NC}"

    # Visual score bar
    local bar_length=20
    local filled=$((score * bar_length / 100))
    printf "Score Bar:       "

    for ((i = 0; i < bar_length; i++)); do
        if [ $i -lt $filled ]; then
            printf "${GREEN}█${NC}"
        else
            printf "${GRAY}░${NC}"
        fi
    done
    printf " ${score}%%\n"

    echo ""

    if [ "$score" -eq 100 ]; then
        echo -e "${GREEN}✓ All systems operational${NC}"
    elif [ "$score" -ge 80 ]; then
        echo -e "${YELLOW}⚠ Most systems operational (some issues detected)${NC}"
    elif [ "$score" -ge 50 ]; then
        echo -e "${YELLOW}⚠ Multiple systems down${NC}"
    else
        echo -e "${RED}✗ Critical issues - check services${NC}"
    fi
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            -h|--help)
                cat << EOF
SuperStack Health Check

USAGE:
  ./scripts/health.sh [OPTIONS]

OPTIONS:
  --verbose    Show additional details for failed services
  --json       Output results in JSON format
  -h, --help   Show this help message

EXAMPLES:
  # Basic health check
  ./scripts/health.sh

  # With verbose output
  ./scripts/health.sh --verbose

  # JSON output for monitoring
  ./scripts/health.sh --json | jq .

EOF
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
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

    if [ "$JSON_OUTPUT" = false ]; then
        print_header
        print_service_checks
        print_system_checks
        print_health_summary
    else
        local score=$(calculate_health_score)
        echo "{ \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"health_score\": $score, \"services_passed\": $PASSED_CHECKS, \"services_total\": $TOTAL_CHECKS }"
    fi
}

main "$@"
