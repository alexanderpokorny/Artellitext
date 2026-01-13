#!/usr/bin/env bash
# ===========================================
# Artellico - Production Database Init
# ===========================================
#
# ACHTUNG: Überschreibt die komplette PROD-Datenbank!
# Nur für initiales Setup oder komplettes Reset verwenden.
#
# Usage:
#   ./scripts/prod-db-init.sh           - Interaktiv
#   ./scripts/prod-db-init.sh --force   - Ohne Bestätigung

set -e

# ===========================================
# Konfiguration
# ===========================================
COOLIFY_SERVER="root@152.53.33.104"
PROD_DB_CONTAINER="artellitext-db"  # Container-Name in Coolify
PROD_DB_NAME="Artellitext"
PROD_DB_USER="postgres"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCAL_BACKUP="$PROJECT_DIR/data/dev-backup/dev-database.sql"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===========================================
# Hauptprozess
# ===========================================
main() {
    echo -e "${RED}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  WARNUNG: PRODUCTION DATABASE ÜBERSCHREIBEN!         ║"
    echo "║                                                          ║"
    echo "║  Dies löscht ALLE bestehenden Daten in der Produktion!   ║"
    echo "║  Benutzer, Notizen, Einstellungen - ALLES weg!           ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    if [ "$1" != "--force" ]; then
        echo "Tippe 'ÜBERSCHREIBEN' um fortzufahren:"
        read -r confirmation
        if [ "$confirmation" != "ÜBERSCHREIBEN" ]; then
            log_info "Abgebrochen."
            exit 0
        fi
    fi
    
    # 1. Prüfen ob lokales Backup existiert
    if [ ! -f "$LOCAL_BACKUP" ]; then
        log_error "Kein lokales Backup gefunden: $LOCAL_BACKUP"
        log_info "Erstelle zuerst ein Backup: ./scripts/db-sync.sh backup"
        exit 1
    fi
    
    log_info "Lokales Backup: $LOCAL_BACKUP"
    log_info "  Größe: $(du -h "$LOCAL_BACKUP" | cut -f1)"
    
    # 2. SSH-Verbindung testen
    log_info "Teste SSH-Verbindung..."
    if ! ssh -o ConnectTimeout=10 "$COOLIFY_SERVER" "echo ok" > /dev/null 2>&1; then
        log_error "SSH-Verbindung fehlgeschlagen!"
        exit 1
    fi
    log_success "SSH-Verbindung OK"
    
    # 3. PROD DB Container finden
    log_info "Suche Datenbank-Container..."
    
    local db_container=$(ssh "$COOLIFY_SERVER" "docker ps --format '{{.Names}}' | grep -iE '(postgres|pgvector|db)' | grep -i artelli | head -1" 2>/dev/null || echo "")
    
    if [ -z "$db_container" ]; then
        log_warn "Kein Container mit Namen '*artelli*db*' gefunden."
        log_info "Verfügbare Container:"
        ssh "$COOLIFY_SERVER" "docker ps --format '{{.Names}}'"
        echo
        read -p "Container-Name eingeben: " db_container
    fi
    
    if [ -z "$db_container" ]; then
        log_error "Kein Container angegeben!"
        exit 1
    fi
    
    log_info "Verwende Container: $db_container"
    
    # 4. Backup hochladen
    log_info "Lade Backup auf Server..."
    scp "$LOCAL_BACKUP" "$COOLIFY_SERVER:/tmp/prod-db-restore.sql"
    log_success "Backup hochgeladen"
    
    # 5. Backup in PROD DB einspielen
    log_info "Spiele Backup in Produktion ein..."
    
    # Verbindungen trennen
    ssh "$COOLIFY_SERVER" "docker exec $db_container psql -U $PROD_DB_USER -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PROD_DB_NAME' AND pid <> pg_backend_pid();\"" > /dev/null 2>&1 || true
    
    # SQL ausführen
    ssh "$COOLIFY_SERVER" "docker exec -i $db_container psql -U $PROD_DB_USER -d $PROD_DB_NAME < /tmp/prod-db-restore.sql" 2>&1 | tail -5
    
    # Aufräumen
    ssh "$COOLIFY_SERVER" "rm /tmp/prod-db-restore.sql"
    
    log_success "Datenbank erfolgreich initialisiert!"
    echo
    log_warn "WICHTIG: Die PROD-Datenbank enthält jetzt die DEV-Daten!"
    log_info "Test-Logins funktionieren jetzt auch in Produktion."
}

main "$@"
