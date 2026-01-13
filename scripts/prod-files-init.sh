#!/usr/bin/env bash
# ===========================================
# Artellico - Production Files Init (MinIO)
# ===========================================
#
# Kopiert lokale Entwicklungsdateien ins PROD MinIO Bucket.
#
# ACHTUNG: Überschreibt bestehende Dateien im Bucket!
# Nur für initiales Setup verwenden.
#
# Usage:
#   ./scripts/prod-files-init.sh           - Interaktiv
#   ./scripts/prod-files-init.sh --force   - Ohne Bestätigung

set -e

# ===========================================
# Konfiguration
# ===========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Lokale Dateien
LOCAL_STORAGE="$PROJECT_DIR/data/storage"
LOCAL_BACKUP_STORAGE="$PROJECT_DIR/data/dev-backup/storage"

# MinIO Konfiguration aus .env.production oder Umgebung
if [ -f "$PROJECT_DIR/.env.production" ]; then
    source "$PROJECT_DIR/.env.production"
elif [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# MinIO Endpoint (aus Umgebung oder Default)
MINIO_ENDPOINT="${STORAGE_ENDPOINT:-https://api.minio.pokorny.wien}"
MINIO_BUCKET="${STORAGE_BUCKET:-artellico}"
MINIO_ACCESS_KEY="${STORAGE_ACCESS_KEY:-}"
MINIO_SECRET_KEY="${STORAGE_SECRET_KEY:-}"
MINIO_ALIAS="artellico-prod"

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
# MinIO Client prüfen
# ===========================================
check_mc() {
    if ! command -v mc &> /dev/null; then
        log_warn "MinIO Client (mc) nicht installiert."
        echo
        echo "Installation:"
        echo "  Linux:  curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc && chmod +x /usr/local/bin/mc"
        echo "  macOS:  brew install minio/stable/mc"
        echo
        
        read -p "Jetzt installieren? (j/N) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Jj]$ ]]; then
            log_info "Installiere MinIO Client..."
            curl -sL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
            chmod +x /tmp/mc
            sudo mv /tmp/mc /usr/local/bin/mc
            log_success "MinIO Client installiert"
        else
            exit 1
        fi
    fi
}

# ===========================================
# MinIO Alias konfigurieren
# ===========================================
configure_minio() {
    log_info "Konfiguriere MinIO-Verbindung..."
    
    if [ -z "$MINIO_ACCESS_KEY" ] || [ -z "$MINIO_SECRET_KEY" ]; then
        log_warn "MinIO Credentials nicht in Umgebung gefunden."
        echo
        read -p "MinIO Access Key: " MINIO_ACCESS_KEY
        read -sp "MinIO Secret Key: " MINIO_SECRET_KEY
        echo
    fi
    
    mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" > /dev/null 2>&1
    
    # Test
    if mc ls "$MINIO_ALIAS" > /dev/null 2>&1; then
        log_success "MinIO-Verbindung OK"
    else
        log_error "MinIO-Verbindung fehlgeschlagen!"
        log_info "Endpoint: $MINIO_ENDPOINT"
        exit 1
    fi
}

# ===========================================
# Bucket erstellen falls nötig
# ===========================================
ensure_bucket() {
    if ! mc ls "$MINIO_ALIAS/$MINIO_BUCKET" > /dev/null 2>&1; then
        log_info "Erstelle Bucket: $MINIO_BUCKET"
        mc mb "$MINIO_ALIAS/$MINIO_BUCKET"
    fi
    log_success "Bucket existiert: $MINIO_BUCKET"
}

# ===========================================
# Hauptprozess
# ===========================================
main() {
    echo -e "${BOLD}=== Artellico - Files zu MinIO hochladen ===${NC}"
    echo
    
    # Welches Verzeichnis?
    local source_dir=""
    
    if [ -d "$LOCAL_STORAGE" ] && [ "$(ls -A "$LOCAL_STORAGE" 2>/dev/null | grep -v '.gitkeep')" ]; then
        source_dir="$LOCAL_STORAGE"
        log_info "Quelle: Lokaler Storage ($LOCAL_STORAGE)"
    elif [ -d "$LOCAL_BACKUP_STORAGE" ] && [ "$(ls -A "$LOCAL_BACKUP_STORAGE" 2>/dev/null)" ]; then
        source_dir="$LOCAL_BACKUP_STORAGE"
        log_info "Quelle: Backup Storage ($LOCAL_BACKUP_STORAGE)"
    else
        log_warn "Keine lokalen Dateien gefunden."
        log_info "Weder $LOCAL_STORAGE noch $LOCAL_BACKUP_STORAGE enthält Dateien."
        exit 0
    fi
    
    # Dateien zählen
    local file_count=$(find "$source_dir" -type f ! -name '.gitkeep' ! -name '*.meta.json' 2>/dev/null | wc -l | tr -d ' ')
    local total_size=$(du -sh "$source_dir" 2>/dev/null | cut -f1)
    
    echo
    log_info "Zu uploaden: $file_count Dateien ($total_size)"
    echo
    
    if [ "$1" != "--force" ]; then
        echo -e "${YELLOW}WARNUNG: Dies überschreibt gleichnamige Dateien im Bucket!${NC}"
        read -p "Fortfahren? (j/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Jj]$ ]]; then
            log_info "Abgebrochen."
            exit 0
        fi
    fi
    
    # MinIO vorbereiten
    check_mc
    configure_minio
    ensure_bucket
    
    # Upload
    log_info "Lade Dateien hoch..."
    echo
    
    mc mirror --overwrite "$source_dir" "$MINIO_ALIAS/$MINIO_BUCKET"
    
    echo
    log_success "Upload abgeschlossen!"
    
    # Status
    log_info "Bucket-Inhalt:"
    mc ls "$MINIO_ALIAS/$MINIO_BUCKET" --recursive --summarize
}

main "$@"
