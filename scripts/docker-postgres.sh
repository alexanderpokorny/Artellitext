#!/usr/bin/env bash
# ===========================================
# Artellico - Complete Development Setup
# ===========================================
#
# All-in-One Script für die komplette Entwicklungsumgebung:
# - Docker Installation (falls nötig)
# - PostgreSQL 18 + pgvector Container
# - PostgreSQL Client für direkten psql-Zugriff
# - Datenbank-Schema und Testdaten
#
# Usage:
#   ./scripts/docker-postgres.sh [options]
#
# Options:
#   --full           Komplette Neuinstallation (Docker + Client + DB)
#   --reset          Datenbank zurücksetzen (Container + Volume löschen)
#   --client-only    Nur PostgreSQL Client installieren
#   --migrate        Schema erstellen/aktualisieren
#   --seed           Testdaten einfügen
#   -h, --help       Hilfe anzeigen
#
# Erstmalige Einrichtung auf neuem Gerät:
#   ./scripts/docker-postgres.sh --full

set -e

# ===========================================
# Konfiguration
# ===========================================
CONTAINER_NAME="pgvector-db"
VOLUME_NAME="pgdata-artellico"
POSTGRES_VERSION="18"
IMAGE="pgvector/pgvector:pg${POSTGRES_VERSION}"
DB_NAME="Artellitext"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Script-Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ===========================================
# Argument-Parsing
# ===========================================
DO_FULL_INSTALL=false
DO_RESET=false
DO_CLIENT_ONLY=false
DO_MIGRATE=false
DO_SEED=false

for arg in "$@"; do
    case $arg in
        --full)
            DO_FULL_INSTALL=true
            ;;
        --reset)
            DO_RESET=true
            ;;
        --client-only)
            DO_CLIENT_ONLY=true
            ;;
        --migrate)
            DO_MIGRATE=true
            ;;
        --seed)
            DO_SEED=true
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
    esac
done

# ===========================================
# Hilfsfunktionen
# ===========================================

show_help() {
    echo -e "${BOLD}Artellico Development Setup${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --full           Komplette Neuinstallation (Docker + Client + DB + Schema)"
    echo "  --reset          Datenbank zurücksetzen (Container + Volume löschen)"
    echo "  --client-only    Nur PostgreSQL Client installieren"
    echo "  --migrate        Schema erstellen/aktualisieren"
    echo "  --seed           Testdaten einfügen"
    echo "  -h, --help       Diese Hilfe anzeigen"
    echo ""
    echo "Beispiele:"
    echo "  # Erstmalige Einrichtung auf neuem Gerät:"
    echo "  $0 --full"
    echo ""
    echo "  # Nur DB neu aufsetzen:"
    echo "  $0 --reset --migrate --seed"
    echo ""
    echo "  # Container starten (wenn schon eingerichtet):"
    echo "  $0"
}

log_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ===========================================
# 1. Docker Installation
# ===========================================
install_docker() {
    log_step "Docker wird installiert..."

    echo "  [1/6] System-Update..."
    sudo apt-get update -qq

    echo "  [2/6] Abhängigkeiten installieren..."
    sudo apt-get install -y -qq \
        ca-certificates curl gnupg lsb-release apt-transport-https software-properties-common

    echo "  [3/6] Docker GPG-Key hinzufügen..."
    sudo mkdir -p /usr/share/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg \
        | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/docker.gpg 2>/dev/null

    echo "  [4/6] Docker Repository einrichten..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    echo "  [5/6] Docker Engine installieren..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin

    echo "  [6/6] Benutzerrechte konfigurieren..."
    sudo groupadd -f docker
    sudo usermod -aG docker "$USER"

    # Docker-Dienst starten
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl enable docker 2>/dev/null || true
        sudo systemctl start docker 2>/dev/null || true
    fi

    log_success "Docker installiert"
}

check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        return 1
    fi
    
    # Prüfen ob Docker ohne sudo läuft
    if ! docker info >/dev/null 2>&1; then
        # Versuche mit sg (switch group)
        if groups "$USER" | grep -q docker; then
            log_warning "Docker-Gruppenrechte aktivieren..."
            # Re-execute script with docker group
            exec sg docker "$0 $*"
        fi
        return 1
    fi
    
    return 0
}

# ===========================================
# 2. PostgreSQL Client Installation
# ===========================================
install_psql_client() {
    log_step "PostgreSQL Client wird installiert..."

    # PostgreSQL APT Repository hinzufügen für neueste Version
    echo "  [1/4] PostgreSQL Repository hinzufügen..."
    sudo apt-get install -y -qq curl ca-certificates
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/postgresql.gpg 2>/dev/null
    
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] \
http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
        | sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null

    echo "  [2/4] Paketlisten aktualisieren..."
    sudo apt-get update -qq

    echo "  [3/4] PostgreSQL Client installieren..."
    sudo apt-get install -y -qq postgresql-client-18 || \
    sudo apt-get install -y -qq postgresql-client-17 || \
    sudo apt-get install -y -qq postgresql-client-16 || \
    sudo apt-get install -y -qq postgresql-client

    echo "  [4/4] Client-Konfiguration..."
    setup_psql_config

    log_success "PostgreSQL Client installiert"
}

setup_psql_config() {
    # .pgpass für passwortlosen Zugang
    PGPASS_FILE="$HOME/.pgpass"
    PGPASS_ENTRY="${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASSWORD}"
    
    # Prüfen ob Eintrag bereits existiert
    if [ -f "$PGPASS_FILE" ]; then
        if ! grep -qF "$PGPASS_ENTRY" "$PGPASS_FILE" 2>/dev/null; then
            echo "$PGPASS_ENTRY" >> "$PGPASS_FILE"
        fi
    else
        echo "$PGPASS_ENTRY" > "$PGPASS_FILE"
    fi
    chmod 600 "$PGPASS_FILE"
    
    # Auch Wildcard für alle DBs auf localhost
    PGPASS_WILDCARD="${DB_HOST}:${DB_PORT}:*:${DB_USER}:${DB_PASSWORD}"
    if ! grep -qF "$PGPASS_WILDCARD" "$PGPASS_FILE" 2>/dev/null; then
        echo "$PGPASS_WILDCARD" >> "$PGPASS_FILE"
    fi

    # Umgebungsvariablen in Shell-Profil
    setup_shell_profile
}

setup_shell_profile() {
    # Finde das richtige Profil
    if [ -f "$HOME/.bashrc" ]; then
        PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.profile" ]; then
        PROFILE="$HOME/.profile"
    else
        PROFILE="$HOME/.bashrc"
        touch "$PROFILE"
    fi

    # Prüfen ob Block bereits existiert
    if grep -q "# Artellico PostgreSQL" "$PROFILE" 2>/dev/null; then
        log_warning "Shell-Profil bereits konfiguriert"
        return
    fi

    # PostgreSQL Umgebungsvariablen hinzufügen
    cat >> "$PROFILE" << 'PGEOF'

# Artellico PostgreSQL Configuration
export PGHOST="localhost"
export PGPORT="5432"
export PGUSER="postgres"
export PGDATABASE="Artellitext"
# Aliases für schnellen DB-Zugriff
alias dbpsql='psql'
alias dbstart='docker start pgvector-db'
alias dbstop='docker stop pgvector-db'
alias dblogs='docker logs -f pgvector-db'
PGEOF

    log_success "Shell-Profil aktualisiert ($PROFILE)"
    echo -e "  ${YELLOW}→ Führe 'source $PROFILE' aus oder starte ein neues Terminal${NC}"
}

# ===========================================
# 3. Container Setup
# ===========================================
setup_container() {
    # Reset wenn gewünscht
    if [ "$DO_RESET" = true ]; then
        log_step "Reset: Container und Volume werden gelöscht..."
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
        docker volume rm "$VOLUME_NAME" 2>/dev/null || true
        log_success "Reset abgeschlossen"
        echo ""
    fi

    # Prüfen ob Container bereits läuft
    if docker ps -q -f name="^${CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
        log_success "Container '$CONTAINER_NAME' läuft bereits"
        return 0
    fi

    # Prüfen ob gestoppter Container existiert
    if docker ps -aq -f name="^${CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
        log_step "Starte existierenden Container..."
        docker start "$CONTAINER_NAME"
        wait_for_postgres
        log_success "Container gestartet"
        return 0
    fi

    # Neuen Container erstellen
    log_step "Lade Image: $IMAGE"
    docker pull "$IMAGE"

    log_step "Erstelle Container '$CONTAINER_NAME'..."
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DB_PORT":5432 \
        -v "$VOLUME_NAME":/var/lib/postgresql \
        "$IMAGE"

    wait_for_postgres
    
    # pgvector Extension aktivieren
    log_step "Aktiviere pgvector Extension..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" \
        -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
    
    log_success "Container erstellt und konfiguriert"
}

wait_for_postgres() {
    log_step "Warte auf PostgreSQL..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
            log_success "PostgreSQL ist bereit"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_error "PostgreSQL nicht erreichbar nach ${max_attempts}s"
    return 1
}

# ===========================================
# 4. Schema Migration
# ===========================================
run_migration() {
    log_step "Führe Datenbank-Migration aus..."
    
    if [ -f "$PROJECT_DIR/scripts/migrate.js" ]; then
        cd "$PROJECT_DIR"
        node scripts/migrate.js
    else
        log_error "migrate.js nicht gefunden"
        return 1
    fi
}

# ===========================================
# 5. Seed Data
# ===========================================
run_seed() {
    log_step "Füge Testdaten ein..."
    
    if [ -f "$PROJECT_DIR/scripts/seed.js" ]; then
        cd "$PROJECT_DIR"
        node scripts/seed.js
    else
        log_error "seed.js nicht gefunden"
        return 1
    fi
}

# ===========================================
# Info anzeigen
# ===========================================
show_info() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ PostgreSQL ${POSTGRES_VERSION} + pgvector bereit${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "  📊 Verbindungsdaten:"
    echo "     Host:     $DB_HOST"
    echo "     Port:     $DB_PORT"
    echo "     Database: $DB_NAME"
    echo "     User:     $DB_USER"
    echo "     Password: $DB_PASSWORD"
    echo ""
    echo "  🔗 Connection String:"
    echo "     postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo ""
    
    # Prüfen ob psql verfügbar ist
    if command -v psql >/dev/null 2>&1; then
        echo "  📝 Direkte Befehle:"
        echo "     psql                    # Verbinden (Umgebungsvariablen gesetzt)"
        echo "     psql -c \"SELECT 1\"     # Query ausführen"
        echo ""
    fi
    
    echo "  🐳 Docker Befehle:"
    echo "     docker start $CONTAINER_NAME"
    echo "     docker stop $CONTAINER_NAME"
    echo "     docker logs $CONTAINER_NAME"
    echo ""
    echo "  🛠️  npm Scripts:"
    echo "     npm run db:psql         # psql Shell"
    echo "     npm run db:migrate      # Schema aktualisieren"
    echo "     npm run db:seed         # Testdaten"
    echo "     npm run db:reset        # Alles neu"
    echo ""
}

test_connection() {
    echo ""
    log_step "Teste Direktverbindung..."
    
    if command -v psql >/dev/null 2>&1; then
        # Setze Umgebungsvariablen für diesen Aufruf
        export PGHOST="$DB_HOST"
        export PGPORT="$DB_PORT"
        export PGUSER="$DB_USER"
        export PGDATABASE="$DB_NAME"
        export PGPASSWORD="$DB_PASSWORD"
        
        if psql -c "SELECT version();" 2>/dev/null | grep -q "PostgreSQL"; then
            log_success "Direktverbindung funktioniert!"
            echo ""
            echo -e "  ${GREEN}Du kannst jetzt 'psql' direkt verwenden:${NC}"
            echo "     psql"
            echo "     psql -c \"\\dt\""
            echo "     psql -c \"SELECT * FROM users\""
        else
            log_warning "psql installiert, aber Verbindung fehlgeschlagen"
            echo "  Versuche: source ~/.bashrc && psql"
        fi
    else
        log_warning "psql nicht installiert - verwende: docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
    fi
}

# ===========================================
# Main
# ===========================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🐘 Artellico Development Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Client-only Modus
if [ "$DO_CLIENT_ONLY" = true ]; then
    install_psql_client
    test_connection
    exit 0
fi

# Full Installation
if [ "$DO_FULL_INSTALL" = true ]; then
    echo -e "${BOLD}Führe komplette Installation durch...${NC}"
    echo ""
    
    # 1. Docker
    if ! check_docker; then
        install_docker
        echo ""
        log_warning "Docker wurde installiert."
        echo -e "  ${YELLOW}Bitte führe einen der folgenden Befehle aus und starte das Script erneut:${NC}"
        echo "     newgrp docker"
        echo "     # ODER"
        echo "     # Logge dich aus und wieder ein"
        echo ""
        echo "  Dann:"
        echo "     $0 --full"
        exit 0
    fi
    log_success "Docker verfügbar"
    echo ""
    
    # 2. PostgreSQL Client
    if ! command -v psql >/dev/null 2>&1; then
        install_psql_client
        echo ""
    else
        log_success "PostgreSQL Client bereits installiert"
        setup_psql_config
        echo ""
    fi
    
    # 3. Container
    setup_container
    echo ""
    
    # 4. Migration
    run_migration
    echo ""
    
    # 5. Seed (optional bei Full)
    run_seed
    echo ""
    
    show_info
    test_connection
    exit 0
fi

# Standard: Container starten (oder prüfen)
if ! check_docker; then
    log_error "Docker nicht verfügbar. Führe aus: $0 --full"
    exit 1
fi

setup_container

# Optionale Schritte
if [ "$DO_MIGRATE" = true ]; then
    echo ""
    run_migration
fi

if [ "$DO_SEED" = true ]; then
    echo ""
    run_seed
fi

show_info

# Verbindungstest wenn psql verfügbar
if command -v psql >/dev/null 2>&1; then
    test_connection
fi
