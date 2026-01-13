#!/usr/bin/env bash
# ===========================================
# Artellico - Coolify Deployment Script
# ===========================================
#
# Deployment auf Coolify Server (Production)
#
# Usage:
#   ./scripts/deploy-coolify.sh init       - Erstes Setup auf Coolify
#   ./scripts/deploy-coolify.sh deploy     - Code-Update (Delta, keine Daten)
#   ./scripts/deploy-coolify.sh status     - Status prüfen
#
# Separate Scripts für Daten:
#   ./scripts/prod-db-init.sh              - DB komplett überschreiben
#   ./scripts/prod-files-init.sh           - Files ins MinIO kopieren

set -e

# ===========================================
# Konfiguration
# ===========================================
COOLIFY_SERVER="root@152.53.33.104"
COOLIFY_PROJECT="productivity"
COOLIFY_SERVICE="Artellitext"
PUBLIC_URL="https://app.artellitext.com"

# GitHub Repository (für Coolify)
GITHUB_REPO="alexanderpokorny/Artellitext"
GITHUB_BRANCH="main"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

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
# SSH Verbindung testen
# ===========================================
test_ssh() {
    log_info "Teste SSH-Verbindung zu $COOLIFY_SERVER..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$COOLIFY_SERVER" "echo ok" > /dev/null 2>&1; then
        log_success "SSH-Verbindung erfolgreich"
        return 0
    else
        log_error "SSH-Verbindung fehlgeschlagen!"
        log_info "Stelle sicher, dass dein SSH-Key auf dem Server hinterlegt ist."
        exit 1
    fi
}

# ===========================================
# Coolify CLI prüfen
# ===========================================
check_coolify_cli() {
    log_info "Prüfe Coolify auf Server..."
    
    # Prüfe ob Coolify läuft
    if ssh "$COOLIFY_SERVER" "docker ps | grep -q coolify" 2>/dev/null; then
        log_success "Coolify läuft auf dem Server"
    else
        log_warn "Coolify Container nicht gefunden - eventuell anderer Name?"
    fi
}

# ===========================================
# Status prüfen
# ===========================================
do_status() {
    echo -e "${BOLD}=== Artellico Production Status ===${NC}"
    echo
    
    test_ssh
    
    log_info "Prüfe Container auf dem Server..."
    
    # Container-Status
    ssh "$COOLIFY_SERVER" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -i artelli || echo 'Kein Artellitext Container gefunden'"
    
    echo
    log_info "Prüfe ob App erreichbar ist..."
    
    if curl -sI "$PUBLIC_URL" | head -1 | grep -q "200\|301\|302"; then
        log_success "App erreichbar unter $PUBLIC_URL"
    else
        log_warn "App nicht erreichbar oder HTTP-Fehler"
    fi
}

# ===========================================
# Initiales Setup
# ===========================================
do_init() {
    echo -e "${BOLD}=== Artellico Production - Erstes Setup ===${NC}"
    echo
    
    test_ssh
    
    log_info "Dieses Script richtet Artellico auf Coolify ein."
    echo
    echo -e "${YELLOW}Wichtig: Du musst in der Coolify Web-UI folgendes tun:${NC}"
    echo "  1. Projekt '$COOLIFY_PROJECT' erstellen (falls nicht vorhanden)"
    echo "  2. Neuen Service hinzufügen: 'Docker Compose'"
    echo "  3. GitHub Repository verbinden: $GITHUB_REPO"
    echo "  4. Branch: $GITHUB_BRANCH"
    echo "  5. Docker Compose File: docker-compose.prod.yml"
    echo "  6. Domain eintragen: ${PUBLIC_URL#https://}"
    echo "  7. Let's Encrypt aktivieren"
    echo
    
    read -p "Hast du das Coolify-Setup abgeschlossen? (j/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        log_info "Bitte zuerst das Coolify Web-UI Setup abschließen."
        echo
        echo "Coolify Web-UI öffnen:"
        echo "  https://$(echo $COOLIFY_SERVER | cut -d@ -f2):8000"
        exit 0
    fi
    
    # Environment-Variablen auf Server prüfen
    log_info "Prüfe ob .env.production auf dem Server existiert..."
    
    ssh "$COOLIFY_SERVER" "ls -la /data/coolify/services/*/artellitext/.env 2>/dev/null || echo 'Keine .env gefunden'"
    
    echo
    log_warn "Stelle sicher, dass folgende Umgebungsvariablen in Coolify gesetzt sind:"
    echo "  - DATABASE_URL"
    echo "  - STORAGE_ENDPOINT"
    echo "  - STORAGE_ACCESS_KEY"
    echo "  - STORAGE_SECRET_KEY"
    echo "  - STORAGE_BUCKET"
    echo
    
    log_success "Setup-Anleitung abgeschlossen!"
    log_info "Führe jetzt './scripts/deploy-coolify.sh deploy' für das erste Deployment aus."
}

# ===========================================
# Deployment (Code-Update ohne Daten)
# ===========================================
do_deploy() {
    echo -e "${BOLD}=== Artellico Production Deployment ===${NC}"
    echo
    
    # 1. Git Status prüfen
    log_info "Prüfe Git-Status..."
    
    if ! git -C "$PROJECT_DIR" diff --quiet; then
        log_warn "Es gibt uncommittete Änderungen!"
        read -p "Trotzdem fortfahren? (j/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Jj]$ ]]; then
            exit 0
        fi
    fi
    
    # 2. Auf main Branch sein
    local current_branch=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        log_warn "Du bist auf Branch '$current_branch', nicht 'main'!"
        read -p "Trotzdem deployen? (j/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Jj]$ ]]; then
            exit 0
        fi
    fi
    
    # 3. Push zu GitHub
    log_info "Pushe zu GitHub..."
    git -C "$PROJECT_DIR" push origin "$current_branch"
    
    # 4. Coolify Webhook triggern (falls konfiguriert)
    log_info "Deployment wird von Coolify automatisch getriggert..."
    log_info "  (Coolify pollt GitHub oder nutzt Webhook)"
    
    echo
    log_success "Code wurde gepusht!"
    log_info "Coolify wird das Deployment automatisch starten."
    log_info "Status prüfen: ./scripts/deploy-coolify.sh status"
    log_info "Oder in der Coolify Web-UI nachschauen."
    
    echo
    echo -e "${BOLD}Wichtig:${NC} Dieses Deployment enthält NUR Code-Änderungen."
    echo "  - Datenbank wird NICHT geändert"
    echo "  - Uploads/Files werden NICHT geändert"
    echo
    echo "Für initiale Daten-Migration nutze:"
    echo "  ./scripts/prod-db-init.sh    - Datenbank initialisieren"
    echo "  ./scripts/prod-files-init.sh - Files hochladen"
}

# ===========================================
# Manueller Redeploy via API
# ===========================================
do_redeploy() {
    log_info "Triggere manuellen Redeploy..."
    
    # Coolify API (falls Token konfiguriert)
    if [ -n "$COOLIFY_API_TOKEN" ]; then
        curl -X POST "https://$(echo $COOLIFY_SERVER | cut -d@ -f2):8000/api/v1/deploy" \
            -H "Authorization: Bearer $COOLIFY_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"uuid\": \"$COOLIFY_SERVICE\"}"
    else
        log_warn "Kein COOLIFY_API_TOKEN gesetzt."
        log_info "Manueller Redeploy in der Web-UI oder:"
        log_info "  export COOLIFY_API_TOKEN=dein-token"
    fi
}

# ===========================================
# Logs anzeigen
# ===========================================
do_logs() {
    log_info "Hole Container-Logs vom Server..."
    
    test_ssh
    
    # Container-Name finden
    local container=$(ssh "$COOLIFY_SERVER" "docker ps --format '{{.Names}}' | grep -i artelli | head -1")
    
    if [ -n "$container" ]; then
        log_info "Container: $container"
        ssh "$COOLIFY_SERVER" "docker logs --tail 100 -f $container"
    else
        log_error "Kein Artellitext Container gefunden!"
    fi
}

# ===========================================
# Hilfe
# ===========================================
show_help() {
    cat << EOF
${BOLD}Artellico - Coolify Deployment${NC}

Deployment auf Coolify Server (Production).

${BOLD}Usage:${NC}
  ./scripts/deploy-coolify.sh <command>

${BOLD}Commands:${NC}
  init      Erstes Setup (Anleitung für Coolify Web-UI)
  deploy    Code deployen (Delta, keine Daten)
  redeploy  Manuellen Redeploy triggern
  status    Status prüfen
  logs      Container-Logs anzeigen
  help      Diese Hilfe

${BOLD}Separate Daten-Scripts:${NC}
  ./scripts/prod-db-init.sh      Datenbank komplett initialisieren
  ./scripts/prod-files-init.sh   Files ins MinIO hochladen

${BOLD}Konfiguration:${NC}
  Server:   $COOLIFY_SERVER
  Projekt:  $COOLIFY_PROJECT
  Service:  $COOLIFY_SERVICE
  URL:      $PUBLIC_URL

${BOLD}Workflow für erstes Setup:${NC}
  1. In Coolify Web-UI: Projekt + Service erstellen
  2. ./scripts/deploy-coolify.sh init
  3. ./scripts/deploy-coolify.sh deploy
  4. ./scripts/prod-db-init.sh (optional: Datenbank)
  5. ./scripts/prod-files-init.sh (optional: Files)

${BOLD}Workflow für Updates:${NC}
  ./scripts/deploy-coolify.sh deploy

EOF
}

# ===========================================
# Main
# ===========================================
case "${1:-}" in
    init)
        do_init
        ;;
    deploy)
        do_deploy
        ;;
    redeploy)
        do_redeploy
        ;;
    status)
        do_status
        ;;
    logs)
        do_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
