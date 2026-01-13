#!/usr/bin/env bash
# ===========================================
# Artellico - Database CLI Helper
# ===========================================
#
# Schneller Zugriff auf die PostgreSQL Datenbank für Entwicklung.
#
# Usage:
#   ./scripts/db.sh [command] [args...]
#
# Commands:
#   psql          Interaktive psql Shell
#   query "SQL"   SQL-Query ausführen
#   tables        Alle Tabellen anzeigen
#   describe TBL  Tabellen-Schema anzeigen
#   count TBL     Zeilen in Tabelle zählen
#   dump TBL      Tabellen-Inhalt anzeigen
#   export TBL    Tabelle als CSV exportieren
#   reset         Datenbank komplett zurücksetzen (VORSICHT!)
#   backup        Datenbank sichern
#   restore FILE  Datenbank aus Backup wiederherstellen

set -e

# ===========================================
# Konfiguration
# ===========================================
CONTAINER_NAME="${DB_CONTAINER:-pgvector-db}"
DB_NAME="${DB_NAME:-Artellitext}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="./backups"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ===========================================
# Hilfsfunktionen
# ===========================================

# Prüfen ob Container läuft
check_container() {
    if ! docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
        echo -e "${RED}❌ Container '$CONTAINER_NAME' läuft nicht.${NC}"
        echo "   Starte mit: ./scripts/docker-postgres.sh"
        exit 1
    fi
}

# psql Befehl ausführen
run_psql() {
    docker exec -it "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

# psql Befehl ausführen (nicht interaktiv)
run_psql_cmd() {
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -A "$@"
}

# Hilfe anzeigen
show_help() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🐘 Artellico Database CLI${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Usage: ./scripts/db.sh [command] [args...]"
    echo ""
    echo "Commands:"
    echo "  psql              Interaktive psql Shell öffnen"
    echo "  query \"SQL\"       SQL-Query ausführen"
    echo "  tables            Alle Tabellen anzeigen"
    echo "  describe TABLE    Tabellen-Schema anzeigen"
    echo "  count [TABLE]     Zeilen zählen (alle oder spezifische Tabelle)"
    echo "  dump TABLE        Tabellen-Inhalt anzeigen (LIMIT 100)"
    echo "  export TABLE      Tabelle als CSV exportieren"
    echo "  users             Alle Benutzer anzeigen"
    echo "  notes [USER]      Notizen anzeigen (optional: für User)"
    echo "  reset             Datenbank zurücksetzen (VORSICHT!)"
    echo "  backup            Datenbank sichern"
    echo "  restore FILE      Aus Backup wiederherstellen"
    echo "  info              Datenbank-Info anzeigen"
    echo ""
    echo "Beispiele:"
    echo "  ./scripts/db.sh psql"
    echo "  ./scripts/db.sh query \"SELECT * FROM users LIMIT 5\""
    echo "  ./scripts/db.sh describe users"
    echo "  ./scripts/db.sh dump notes"
    echo ""
}

# ===========================================
# Befehle
# ===========================================

cmd_psql() {
    check_container
    echo -e "${BLUE}📡 Verbinde mit $DB_NAME...${NC}"
    run_psql
}

cmd_query() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${RED}❌ SQL-Query fehlt${NC}"
        echo "   Usage: ./scripts/db.sh query \"SELECT * FROM users\""
        exit 1
    fi
    run_psql -c "$1"
}

cmd_tables() {
    check_container
    echo -e "${BLUE}📋 Tabellen in $DB_NAME:${NC}"
    echo ""
    run_psql -c "\dt+"
}

cmd_describe() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Tabellenname fehlt${NC}"
        exit 1
    fi
    echo -e "${BLUE}📋 Schema für '$1':${NC}"
    echo ""
    run_psql -c "\d+ $1"
}

cmd_count() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${BLUE}📊 Zeilenanzahl aller Tabellen:${NC}"
        echo ""
        tables=$(run_psql_cmd -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name")
        for table in $tables; do
            count=$(run_psql_cmd -c "SELECT COUNT(*) FROM $table")
            printf "  %-20s %s\n" "$table" "$count"
        done
    else
        count=$(run_psql_cmd -c "SELECT COUNT(*) FROM $1")
        echo "$1: $count Zeilen"
    fi
}

cmd_dump() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Tabellenname fehlt${NC}"
        exit 1
    fi
    echo -e "${BLUE}📄 Inhalt von '$1' (LIMIT 100):${NC}"
    echo ""
    run_psql -c "SELECT * FROM $1 LIMIT 100"
}

cmd_export() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Tabellenname fehlt${NC}"
        exit 1
    fi
    
    mkdir -p "$BACKUP_DIR"
    filename="$BACKUP_DIR/${1}_$(date +%Y%m%d_%H%M%S).csv"
    
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" \
        -c "\COPY $1 TO STDOUT WITH CSV HEADER" > "$filename"
    
    echo -e "${GREEN}✓ Exportiert nach: $filename${NC}"
}

cmd_users() {
    check_container
    echo -e "${BLUE}👤 Benutzer:${NC}"
    echo ""
    run_psql -c "SELECT id, username, email, role, subscription_tier, created_at FROM users ORDER BY created_at"
}

cmd_notes() {
    check_container
    echo -e "${BLUE}📝 Notizen:${NC}"
    echo ""
    if [ -z "$1" ]; then
        run_psql -c "SELECT n.id, u.username, n.title, n.status, n.language, n.created_at FROM notes n JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC LIMIT 50"
    else
        run_psql -c "SELECT n.id, n.title, n.status, n.language, n.created_at FROM notes n JOIN users u ON n.user_id = u.id WHERE u.username = '$1' ORDER BY n.created_at DESC"
    fi
}

cmd_reset() {
    check_container
    echo -e "${RED}⚠️  WARNUNG: Dies löscht ALLE Daten!${NC}"
    read -p "Bist du sicher? (ja/nein): " confirm
    
    if [ "$confirm" != "ja" ]; then
        echo "Abgebrochen."
        exit 0
    fi
    
    echo -e "${YELLOW}🗑️  Lösche alle Tabellen...${NC}"
    
    run_psql -c "
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
    "
    
    echo -e "${GREEN}✓ Datenbank zurückgesetzt${NC}"
    echo ""
    echo "Führe jetzt aus:"
    echo "  npm run db:migrate"
    echo "  npm run db:seed"
}

cmd_backup() {
    check_container
    mkdir -p "$BACKUP_DIR"
    
    filename="$BACKUP_DIR/artellico_$(date +%Y%m%d_%H%M%S).sql"
    
    echo -e "${YELLOW}💾 Erstelle Backup...${NC}"
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$filename"
    
    # Komprimieren
    gzip "$filename"
    
    echo -e "${GREEN}✓ Backup erstellt: ${filename}.gz${NC}"
}

cmd_restore() {
    check_container
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Backup-Datei fehlt${NC}"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Datei nicht gefunden: $1${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Dies überschreibt die aktuelle Datenbank!${NC}"
    read -p "Fortfahren? (ja/nein): " confirm
    
    if [ "$confirm" != "ja" ]; then
        echo "Abgebrochen."
        exit 0
    fi
    
    echo -e "${YELLOW}📥 Stelle wieder her...${NC}"
    
    if [[ "$1" == *.gz ]]; then
        gunzip -c "$1" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    else
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$1"
    fi
    
    echo -e "${GREEN}✓ Wiederherstellung abgeschlossen${NC}"
}

cmd_info() {
    check_container
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🐘 Datenbank-Info${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Version
    version=$(run_psql_cmd -c "SELECT version()")
    echo -e "${GREEN}Version:${NC} $version"
    echo ""
    
    # Database size
    size=$(run_psql_cmd -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))")
    echo -e "${GREEN}Datenbankgröße:${NC} $size"
    echo ""
    
    # Extensions
    echo -e "${GREEN}Extensions:${NC}"
    run_psql_cmd -c "SELECT extname, extversion FROM pg_extension" | while read line; do
        echo "  • $line"
    done
    echo ""
    
    # Table sizes
    echo -e "${GREEN}Tabellengrößen:${NC}"
    run_psql -c "
        SELECT 
            table_name,
            pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
    "
}

# ===========================================
# Main
# ===========================================

case "${1:-help}" in
    psql)
        cmd_psql
        ;;
    query)
        cmd_query "$2"
        ;;
    tables)
        cmd_tables
        ;;
    describe|desc)
        cmd_describe "$2"
        ;;
    count)
        cmd_count "$2"
        ;;
    dump)
        cmd_dump "$2"
        ;;
    export)
        cmd_export "$2"
        ;;
    users)
        cmd_users
        ;;
    notes)
        cmd_notes "$2"
        ;;
    reset)
        cmd_reset
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore "$2"
        ;;
    info)
        cmd_info
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unbekannter Befehl: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
