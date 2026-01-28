#!/bin/bash
# ===========================================
# Artellitext - Database Management Script
# ===========================================
#
# Unified script for database operations
#
# Usage:
#   ./scripts/db-manage.sh <command> [options]
#
# Commands:
#   init          - Initialize fresh database with schema
#   reset         - Drop and recreate database
#   migrate       - Run pending migrations
#   seed          - Insert development seed data
#   dump          - Export full database dump
#   dump-schema   - Export schema only (no data)
#   dump-table    - Export specific table
#   restore       - Restore from dump
#   status        - Show database status
#   connect       - Open psql shell
#
# Examples:
#   ./scripts/db-manage.sh init
#   ./scripts/db-manage.sh dump-table notes
#   ./scripts/db-manage.sh restore data/dev-backup/dev-database.sql

set -e

# ===========================================
# Configuration
# ===========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if exists
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

# Default values
DB_CONTAINER="${DB_CONTAINER:-pgvector-db}"
DB_NAME="${DATABASE_NAME:-Artellitext}"
DB_USER="${DATABASE_USER:-postgres}"
DB_PASSWORD="${DATABASE_PASSWORD:-artellitext_dev}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"

SQL_DIR="$SCRIPT_DIR/sql"
BACKUP_DIR="$PROJECT_DIR/data/dev-backup"
MIGRATIONS_DIR="$SQL_DIR/migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===========================================
# Helper Functions
# ===========================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Execute SQL via Docker
docker_psql() {
    sudo docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Execute SQL file via Docker
docker_psql_file() {
    local file="$1"
    sudo docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$file"
}

# Check if container is running
check_container() {
    if ! sudo docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        log_error "Database container '$DB_CONTAINER' is not running"
        echo "Start it with: docker compose up -d db"
        exit 1
    fi
}

# Check if database exists
check_database() {
    if ! sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        return 1
    fi
    return 0
}

# ===========================================
# Commands
# ===========================================

cmd_init() {
    log_info "Initializing database '$DB_NAME'..."
    check_container
    
    # Create database if not exists
    if ! check_database; then
        log_info "Creating database..."
        sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null || true
    fi
    
    # Run schema
    if [ -f "$SQL_DIR/init/001_schema.sql" ]; then
        log_info "Applying schema..."
        docker_psql_file "$SQL_DIR/init/001_schema.sql"
        log_success "Schema applied"
    else
        log_error "Schema file not found: $SQL_DIR/init/001_schema.sql"
        exit 1
    fi
    
    # Run migrations
    cmd_migrate
    
    log_success "Database initialized"
}

cmd_reset() {
    log_warn "This will DROP and recreate the database '$DB_NAME'"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Aborted"
        exit 0
    fi
    
    check_container
    
    log_info "Dropping database..."
    sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>/dev/null || true
    
    log_info "Creating fresh database..."
    sudo docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE \"$DB_NAME\";"
    
    # Re-initialize
    cmd_init
}

cmd_migrate() {
    log_info "Running migrations..."
    check_container
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        log_info "No migrations directory found, skipping"
        return
    fi
    
    # Get applied migrations
    applied=$(docker_psql -t -c "SELECT name FROM _migrations ORDER BY name;" 2>/dev/null | tr -d ' ' || echo "")
    
    # Find and run pending migrations
    for file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$file" ]; then
            name=$(basename "$file" .sql)
            
            if echo "$applied" | grep -q "^${name}$"; then
                log_info "Skipping $name (already applied)"
            else
                log_info "Applying $name..."
                docker_psql_file "$file"
                log_success "Applied $name"
            fi
        fi
    done
    
    log_success "Migrations complete"
}

cmd_seed() {
    log_info "Inserting seed data..."
    check_container
    
    if [ -f "$SQL_DIR/init/002_seed.sql" ]; then
        docker_psql_file "$SQL_DIR/init/002_seed.sql"
        log_success "Seed data inserted"
    else
        log_warn "Seed file not found: $SQL_DIR/init/002_seed.sql"
    fi
}

cmd_dump() {
    local output="${1:-$BACKUP_DIR/dev-database.sql}"
    
    log_info "Dumping database to $output..."
    check_container
    
    mkdir -p "$(dirname "$output")"
    
    sudo docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        > "$output"
    
    # Update backup metadata
    cat > "$BACKUP_DIR/backup-meta.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "database": "$DB_NAME",
    "file": "$(basename "$output")",
    "size": $(stat -c%s "$output" 2>/dev/null || stat -f%z "$output"),
    "tables": [$(docker_psql -t -c "SELECT string_agg('\"' || table_name || '\"', ', ') FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' \n')]
}
EOF
    
    log_success "Dump created: $output"
}

cmd_dump_schema() {
    local output="${1:-$BACKUP_DIR/schema-only.sql}"
    
    log_info "Dumping schema to $output..."
    check_container
    
    mkdir -p "$(dirname "$output")"
    
    sudo docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-acl \
        > "$output"
    
    log_success "Schema dump created: $output"
}

cmd_dump_table() {
    local table="$1"
    
    if [ -z "$table" ]; then
        log_error "Usage: $0 dump-table <table_name>"
        exit 1
    fi
    
    local output="$BACKUP_DIR/tables/${table}.sql"
    
    log_info "Dumping table '$table' to $output..."
    check_container
    
    mkdir -p "$(dirname "$output")"
    
    sudo docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
        --table="$table" \
        --no-owner \
        --no-acl \
        > "$output"
    
    log_success "Table dump created: $output"
}

cmd_restore() {
    local input="${1:-$BACKUP_DIR/dev-database.sql}"
    
    if [ ! -f "$input" ]; then
        log_error "Backup file not found: $input"
        exit 1
    fi
    
    log_info "Restoring database from $input..."
    check_container
    
    docker_psql_file "$input"
    
    log_success "Database restored"
}

cmd_status() {
    log_info "Database Status"
    echo "-----------------------------------"
    check_container
    
    echo -e "Container:\t${GREEN}$DB_CONTAINER${NC}"
    echo -e "Database:\t$DB_NAME"
    echo -e "User:\t\t$DB_USER"
    echo ""
    
    echo "Tables:"
    docker_psql -c "SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    
    echo ""
    echo "Applied Migrations:"
    docker_psql -c "SELECT name, applied_at FROM _migrations ORDER BY applied_at;"
    
    echo ""
    echo "Row Counts:"
    for table in users notes documents literature sessions; do
        count=$(docker_psql -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
        echo -e "  $table:\t$count"
    done
}

cmd_connect() {
    log_info "Connecting to database '$DB_NAME'..."
    check_container
    
    sudo docker exec -it "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
}

# ===========================================
# Main
# ===========================================

show_help() {
    echo "Artellitext Database Management"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init          Initialize fresh database with schema"
    echo "  reset         Drop and recreate database (WARNING: data loss)"
    echo "  migrate       Run pending migrations"
    echo "  seed          Insert development seed data"
    echo "  dump [file]   Export full database dump"
    echo "  dump-schema   Export schema only (no data)"
    echo "  dump-table    Export specific table"
    echo "  restore [file] Restore from dump"
    echo "  status        Show database status"
    echo "  connect       Open psql shell"
    echo ""
    echo "Environment:"
    echo "  DB_CONTAINER  Docker container name (default: pgvector-db)"
    echo "  DB_NAME       Database name (default: Artellitext)"
    echo "  DB_USER       Database user (default: postgres)"
}

case "${1:-help}" in
    init)
        cmd_init
        ;;
    reset)
        cmd_reset
        ;;
    migrate)
        cmd_migrate
        ;;
    seed)
        cmd_seed
        ;;
    dump)
        cmd_dump "$2"
        ;;
    dump-schema)
        cmd_dump_schema "$2"
        ;;
    dump-table)
        cmd_dump_table "$2"
        ;;
    restore)
        cmd_restore "$2"
        ;;
    status)
        cmd_status
        ;;
    connect)
        cmd_connect
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
