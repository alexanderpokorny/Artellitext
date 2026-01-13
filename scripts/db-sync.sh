#!/usr/bin/env bash
# ===========================================
# Artellico - Database Sync for Development
# ===========================================
#
# Synchronisiert die Entwicklungsdatenbank zwischen Entwicklern via Git.
# 
# Usage:
#   ./scripts/db-sync.sh backup    - Backup erstellen (vor git push)
#   ./scripts/db-sync.sh restore   - Backup wiederherstellen (nach git pull)
#   ./scripts/db-sync.sh status    - Status anzeigen
#
# Git Hooks:
#   pre-push:   Automatisches Backup
#   post-merge: Automatische Wiederherstellung (optional)

set -e

# ===========================================
# Konfiguration
# ===========================================
CONTAINER_NAME="pgvector-db"
DB_NAME="Artellitext"
DB_USER="postgres"
DB_PASSWORD="postgres"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/data/dev-backup"
BACKUP_FILE="$BACKUP_DIR/dev-database.sql"
BACKUP_META="$BACKUP_DIR/backup-meta.json"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ===========================================
# Hilfsfunktionen
# ===========================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "PostgreSQL Container '$CONTAINER_NAME' läuft nicht."
        log_info "Starte mit: sudo docker start $CONTAINER_NAME"
        exit 1
    fi
}

ensure_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Backup-Verzeichnis erstellt: $BACKUP_DIR"
    fi
}

# ===========================================
# Backup erstellen
# ===========================================
do_backup() {
    log_info "Erstelle Datenbank-Backup..."
    
    check_container
    ensure_backup_dir
    
    # Backup mit pg_dump erstellen
    # --clean: DROP-Statements vor CREATE
    # --if-exists: IF EXISTS bei DROP
    # --no-owner: Keine OWNER-Statements (portabel)
    # --no-privileges: Keine GRANT-Statements
    docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        > "$BACKUP_FILE" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
        # Metadaten speichern
        local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        local git_branch=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        local git_commit=$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
        local file_size=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
        local hostname=$(hostname)
        local username=$(whoami)
        
        cat > "$BACKUP_META" << EOF
{
  "timestamp": "$timestamp",
  "git_branch": "$git_branch",
  "git_commit": "$git_commit",
  "hostname": "$hostname",
  "username": "$username",
  "file_size": $file_size,
  "database": "$DB_NAME"
}
EOF
        
        log_success "Backup erstellt: $BACKUP_FILE"
        log_info "  Größe: $(numfmt --to=iec $file_size 2>/dev/null || echo "$file_size bytes")"
        log_info "  Commit: $git_commit ($git_branch)"
    else
        log_error "Backup fehlgeschlagen!"
        exit 1
    fi
}

# ===========================================
# Backup wiederherstellen
# ===========================================
do_restore() {
    log_info "Stelle Datenbank aus Backup wieder her..."
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Kein Backup gefunden: $BACKUP_FILE"
        log_info "Führe zuerst './scripts/db-sync.sh backup' aus."
        exit 1
    fi
    
    check_container
    
    # Metadaten anzeigen
    if [ -f "$BACKUP_META" ]; then
        local timestamp=$(grep -o '"timestamp": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
        local git_commit=$(grep -o '"git_commit": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
        local username=$(grep -o '"username": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
        log_info "Backup von: $timestamp"
        log_info "  Erstellt von: $username"
        log_info "  Git Commit: $git_commit"
    fi
    
    # Bestätigung anfordern (außer wenn --force)
    if [ "$1" != "--force" ] && [ -t 0 ]; then
        echo -e "${YELLOW}WARNUNG: Dies überschreibt alle lokalen Datenbankänderungen!${NC}"
        read -p "Fortfahren? (j/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Jj]$ ]]; then
            log_info "Abgebrochen."
            exit 0
        fi
    fi
    
    # Backup wiederherstellen
    # Erst alle Verbindungen trennen, dann restore
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true
    
    # SQL-Datei ausführen
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Datenbank wiederhergestellt!"
    else
        log_error "Wiederherstellung fehlgeschlagen!"
        exit 1
    fi
}

# ===========================================
# Status anzeigen
# ===========================================
do_status() {
    echo -e "${BOLD}=== Artellico DB-Sync Status ===${NC}"
    echo
    
    # Container-Status
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_success "PostgreSQL Container läuft"
    else
        log_warn "PostgreSQL Container gestoppt"
    fi
    
    # Backup-Status
    if [ -f "$BACKUP_FILE" ]; then
        local file_size=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
        log_success "Backup vorhanden: $(numfmt --to=iec $file_size 2>/dev/null || echo "$file_size bytes")"
        
        if [ -f "$BACKUP_META" ]; then
            local timestamp=$(grep -o '"timestamp": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
            local git_commit=$(grep -o '"git_commit": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
            local username=$(grep -o '"username": *"[^"]*"' "$BACKUP_META" | cut -d'"' -f4)
            echo "  Erstellt: $timestamp"
            echo "  Von: $username"
            echo "  Commit: $git_commit"
        fi
    else
        log_warn "Kein Backup vorhanden"
    fi
    
    # Git Hooks Status
    echo
    echo -e "${BOLD}Git Hooks:${NC}"
    if [ -f "$PROJECT_DIR/.git/hooks/pre-push" ] && grep -q "db-sync" "$PROJECT_DIR/.git/hooks/pre-push" 2>/dev/null; then
        log_success "pre-push Hook installiert"
    else
        log_warn "pre-push Hook nicht installiert"
        log_info "  Installiere mit: ./scripts/db-sync.sh install-hooks"
    fi
    
    if [ -f "$PROJECT_DIR/.git/hooks/post-merge" ] && grep -q "db-sync" "$PROJECT_DIR/.git/hooks/post-merge" 2>/dev/null; then
        log_success "post-merge Hook installiert"
    else
        log_warn "post-merge Hook nicht installiert"
    fi
}

# ===========================================
# Git Hooks installieren
# ===========================================
install_hooks() {
    log_info "Installiere Git Hooks..."
    
    local hooks_dir="$PROJECT_DIR/.git/hooks"
    
    # pre-push Hook (Backup vor Push)
    cat > "$hooks_dir/pre-push" << 'EOF'
#!/usr/bin/env bash
# Artellico: Automatisches DB-Backup vor Push

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"

# Prüfen ob Container läuft
if docker ps --format '{{.Names}}' | grep -q "^pgvector-db$"; then
    echo "[DB-Sync] Erstelle Datenbank-Backup vor Push..."
    "$SCRIPT_DIR/scripts/db-sync.sh" backup
    
    # Backup zum Commit hinzufügen falls geändert
    if git -C "$SCRIPT_DIR" diff --quiet data/dev-backup/ 2>/dev/null; then
        : # Keine Änderungen
    else
        git -C "$SCRIPT_DIR" add data/dev-backup/
        git -C "$SCRIPT_DIR" commit --amend --no-edit > /dev/null 2>&1 || true
    fi
else
    echo "[DB-Sync] PostgreSQL Container nicht aktiv, überspringe Backup."
fi

exit 0
EOF
    chmod +x "$hooks_dir/pre-push"
    log_success "pre-push Hook installiert"
    
    # post-merge Hook (Info nach Pull)
    cat > "$hooks_dir/post-merge" << 'EOF'
#!/usr/bin/env bash
# Artellico: Info über DB-Backup nach Pull

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../.. && pwd)"
BACKUP_FILE="$SCRIPT_DIR/data/dev-backup/dev-database.sql"

# Prüfen ob Backup geändert wurde
if git diff HEAD@{1} --name-only | grep -q "data/dev-backup/"; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  📦 Datenbank-Backup wurde aktualisiert!                 ║"
    echo "║                                                          ║"
    echo "║  Zum Wiederherstellen:                                   ║"
    echo "║    ./scripts/db-sync.sh restore                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
fi

exit 0
EOF
    chmod +x "$hooks_dir/post-merge"
    log_success "post-merge Hook installiert"
    
    log_success "Git Hooks erfolgreich installiert!"
}

# ===========================================
# Hooks deinstallieren
# ===========================================
uninstall_hooks() {
    log_info "Deinstalliere Git Hooks..."
    
    local hooks_dir="$PROJECT_DIR/.git/hooks"
    
    [ -f "$hooks_dir/pre-push" ] && rm "$hooks_dir/pre-push" && log_success "pre-push Hook entfernt"
    [ -f "$hooks_dir/post-merge" ] && rm "$hooks_dir/post-merge" && log_success "post-merge Hook entfernt"
    
    log_success "Git Hooks deinstalliert."
}

# ===========================================
# Hilfe
# ===========================================
show_help() {
    cat << EOF
${BOLD}Artellico - Database Sync for Development${NC}

Synchronisiert die Entwicklungsdatenbank zwischen Entwicklern via Git.

${BOLD}Usage:${NC}
  ./scripts/db-sync.sh <command>

${BOLD}Commands:${NC}
  backup          Datenbank-Backup erstellen
  restore         Backup wiederherstellen
  restore --force Wiederherstellen ohne Bestätigung
  status          Status anzeigen
  install-hooks   Git Hooks installieren
  uninstall-hooks Git Hooks entfernen
  help            Diese Hilfe anzeigen

${BOLD}Workflow:${NC}
  1. Einmalig: ./scripts/db-sync.sh install-hooks
  2. Bei git push: Backup wird automatisch erstellt
  3. Nach git pull: Hinweis erscheint, wenn Backup aktualisiert wurde
  4. Optional: ./scripts/db-sync.sh restore

${BOLD}Dateien:${NC}
  data/dev-backup/dev-database.sql   - SQL Backup
  data/dev-backup/backup-meta.json   - Metadaten (Zeitstempel, User, etc.)

EOF
}

# ===========================================
# Main
# ===========================================
case "${1:-}" in
    backup)
        do_backup
        ;;
    restore)
        do_restore "$2"
        ;;
    status)
        do_status
        ;;
    install-hooks)
        install_hooks
        ;;
    uninstall-hooks)
        uninstall_hooks
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
