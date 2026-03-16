#!/usr/bin/env bash

# ===================================================================
# SurrealDB Initialization Script for SuperStack AI Framework
# ===================================================================
# Waits for SurrealDB to be healthy, imports schema and optional seed
# Usage: ./init-db.sh [--seed] [--url URL] [--user USER] [--pass PASS]
# ===================================================================

set -e

# Configuration with environment variable overrides
SURREAL_URL="${SURREAL_URL:-http://localhost:8000}"
SURREAL_USER="${SURREAL_USER:-admin}"
SURREAL_PASS="${SURREAL_PASS:-admin123}"
SEED_FLAG=false
VERBOSE=false
MAX_RETRIES=30
RETRY_DELAY=2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_DIR="$(dirname "$SCRIPT_DIR")/services/surrealdb"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===================================================================
# FUNCTIONS
# ===================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Initialize SurrealDB for SuperStack AI Framework

OPTIONS:
    --seed              Import seed data after schema creation
    --url URL           SurrealDB URL (default: $SURREAL_URL)
    --user USER         Database user (default: $SURREAL_USER)
    --pass PASS         Database password (default: $SURREAL_PASS)
    --verbose           Enable verbose output
    --no-wait           Skip health check, attempt immediate import
    --dry-run           Show what would be done, don't execute
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    SURREAL_URL         Override default URL
    SURREAL_USER        Override default user
    SURREAL_PASS        Override default password

EXAMPLES:
    # Initialize with defaults
    $0

    # Initialize with seed data
    $0 --seed

    # Initialize with custom credentials
    $0 --url http://localhost:8000 --user admin --pass secret123 --seed

EOF
}

# Wait for SurrealDB to be healthy
wait_for_health() {
    local retries=0
    local url="$1"

    log_info "Waiting for SurrealDB to be healthy (max ${MAX_RETRIES} retries, ${RETRY_DELAY}s delay)..."

    while [ $retries -lt $MAX_RETRIES ]; do
        debug "Health check attempt $((retries + 1))/$MAX_RETRIES..."

        if response=$(curl -s -f -X GET "$url/health" 2>/dev/null); then
            if echo "$response" | grep -q "ok\|true"; then
                log_success "SurrealDB is healthy"
                return 0
            fi
        fi

        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            debug "Health check failed, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done

    log_error "SurrealDB did not become healthy within $((MAX_RETRIES * RETRY_DELAY))s"
    return 1
}

# Import SQL file via HTTP API
import_sql_file() {
    local file="$1"
    local url="$2"
    local user="$3"
    local pass="$4"

    if [[ ! -f "$file" ]]; then
        log_error "File not found: $file"
        return 1
    fi

    local filename=$(basename "$file")
    log_info "Importing $filename..."

    debug "URL: $url"
    debug "User: $user"
    debug "File size: $(wc -c < "$file") bytes"

    # Read SQL file and POST to SurrealDB HTTP API
    # SurrealDB HTTP API accepts raw SQL in request body
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$url/sql" \
        -u "$user:$pass" \
        -H "Content-Type: application/sql" \
        -d @"$file" 2>&1)

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    debug "HTTP Status: $http_code"

    if [[ "$http_code" == "200" ]]; then
        log_success "Successfully imported $filename"
        return 0
    else
        log_error "Failed to import $filename (HTTP $http_code)"
        debug "Response: $body"
        return 1
    fi
}

# Verify database schema was created
verify_schema() {
    local url="$1"
    local user="$2"
    local pass="$3"

    log_info "Verifying schema creation..."

    # Check if agent table exists
    response=$(curl -s -X POST "$url/sql" \
        -u "$user:$pass" \
        -H "Content-Type: application/sql" \
        -d "SELECT COUNT() FROM agent;" 2>&1)

    if echo "$response" | grep -q "count\|\"0\"\|\"[0-9]*\""; then
        log_success "Schema verification passed - agent table exists"
        return 0
    else
        log_error "Schema verification failed - agent table not found"
        debug "Response: $response"
        return 1
    fi
}

# Verify seed data was created
verify_seed() {
    local url="$1"
    local user="$2"
    local pass="$3"

    log_info "Verifying seed data..."

    # Check if sample agents exist
    response=$(curl -s -X POST "$url/sql" \
        -u "$user:$pass" \
        -H "Content-Type: application/sql" \
        -d "SELECT COUNT() FROM agent WHERE role IN ['researcher', 'scraper', 'outreach', 'analyst', 'orchestrator'];" 2>&1)

    if echo "$response" | grep -q "count"; then
        log_success "Seed data verification passed"
        return 0
    else
        log_error "Seed data verification failed"
        debug "Response: $response"
        return 1
    fi
}

# Print initialization summary
print_summary() {
    local url="$1"
    local seed="$2"

    echo ""
    log_success "SurrealDB Initialization Complete"
    echo ""
    echo "Configuration:"
    echo "  URL:             $url"
    echo "  Namespace:       superstack"
    echo "  Database:        agents"
    echo "  Schema File:     $SCHEMA_DIR/init.surql"
    if [[ "$seed" == "true" ]]; then
        echo "  Seed File:       $SCHEMA_DIR/seed.surql"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Connect via: surreal sql --endpoint $url"
    echo "  2. Query: SELECT * FROM agent;"
    echo "  3. Check schema: INFO FOR DB;"
    echo ""
}

# ===================================================================
# MAIN EXECUTION
# ===================================================================

main() {
    log_info "SuperStack SurrealDB Initialization Script"
    echo "=============================================="
    echo ""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --seed)
                SEED_FLAG=true
                shift
                ;;
            --url)
                SURREAL_URL="$2"
                shift 2
                ;;
            --user)
                SURREAL_USER="$2"
                shift 2
                ;;
            --pass)
                SURREAL_PASS="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --no-wait)
                MAX_RETRIES=0
                shift
                ;;
            --dry-run)
                log_warning "DRY-RUN MODE: No changes will be made"
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done

    # Validate files exist
    if [[ ! -f "$SCHEMA_DIR/init.surql" ]]; then
        log_error "Schema file not found: $SCHEMA_DIR/init.surql"
        exit 1
    fi

    if [[ "$SEED_FLAG" == "true" && ! -f "$SCHEMA_DIR/seed.surql" ]]; then
        log_error "Seed file not found: $SCHEMA_DIR/seed.surql"
        exit 1
    fi

    # Display configuration
    log_info "Configuration:"
    echo "  SurrealDB URL:  $SURREAL_URL"
    echo "  User:           $SURREAL_USER"
    echo "  Import seed:    $SEED_FLAG"
    echo "  Verbose:        $VERBOSE"
    echo ""

    # Health check (unless --no-wait flag)
    if [[ $MAX_RETRIES -gt 0 ]]; then
        if ! wait_for_health "$SURREAL_URL"; then
            log_error "Cannot proceed without healthy SurrealDB instance"
            exit 1
        fi
    else
        log_warning "Skipping health check (--no-wait flag)"
    fi

    # Import schema
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "[DRY-RUN] Would import: $SCHEMA_DIR/init.surql"
    else
        if ! import_sql_file "$SCHEMA_DIR/init.surql" "$SURREAL_URL" "$SURREAL_USER" "$SURREAL_PASS"; then
            log_error "Failed to import schema. Aborting."
            exit 1
        fi
    fi

    # Verify schema
    if [[ "$DRY_RUN" != "true" ]]; then
        sleep 1  # Brief delay for schema to settle
        if ! verify_schema "$SURREAL_URL" "$SURREAL_USER" "$SURREAL_PASS"; then
            log_warning "Schema verification failed, but continuing..."
        fi
    fi

    # Import seed data if requested
    if [[ "$SEED_FLAG" == "true" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_warning "[DRY-RUN] Would import: $SCHEMA_DIR/seed.surql"
        else
            log_info "Importing seed data..."
            if ! import_sql_file "$SCHEMA_DIR/seed.surql" "$SURREAL_URL" "$SURREAL_USER" "$SURREAL_PASS"; then
                log_error "Failed to import seed data"
                exit 1
            fi

            sleep 1  # Brief delay for seed data to settle
            if ! verify_seed "$SURREAL_URL" "$SURREAL_USER" "$SURREAL_PASS"; then
                log_warning "Seed data verification failed, but continuing..."
            fi
        fi
    fi

    # Success!
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry-run complete (no changes made)"
    else
        print_summary "$SURREAL_URL" "$SEED_FLAG"
    fi

    return 0
}

# Execute main
main "$@"
exit $?
