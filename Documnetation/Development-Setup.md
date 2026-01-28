# Artellitext - Development Setup

Dieses Dokument beschreibt das lokale Development-Setup und die Deployment-Optionen.

## Voraussetzungen

- **Node.js** 22.x oder höher
- **Docker** und **Docker Compose**
- **pnpm** (oder npm/yarn)
- **Git**

## Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/alexanderpokorny/Artellitext.git
cd Artellitext

# 2. Dependencies installieren
pnpm install

# 3. Environment konfigurieren
cp .env.example .env

# 4. Docker Container starten (PostgreSQL + MinIO)
docker compose up -d

# 5. Datenbank initialisieren
./scripts/db-manage.sh init

# 6. Optional: Seed-Daten laden
./scripts/db-manage.sh seed

# 7. Development Server starten
pnpm dev
```

Die App ist dann unter http://localhost:5173 erreichbar.

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / PWA                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ SvelteKit UI │  │ Service Worker│  │ IndexedDB (Offline)   │ │
│  └──────┬───────┘  └──────────────┘  └────────────────────────┘ │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SvelteKit Server                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ API Routes   │  │ Auth/Session │  │ Storage Abstraction    │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
   ┌─────────────┐    ┌─────────────┐      ┌─────────────┐
   │ PostgreSQL  │    │ PostgreSQL  │      │ MinIO / S3  │
   │ + pgvector  │    │ (Sessions)  │      │ (Files)     │
   └─────────────┘    └─────────────┘      └─────────────┘
```

## Docker Services

### Development (docker-compose.yml)

```yaml
services:
  db:        # PostgreSQL 17 + pgvector
  minio:     # S3-kompatible Dateispeicherung
  minio-setup: # Bucket-Erstellung
```

**Starten:**
```bash
# Alle Services
docker compose up -d

# Nur Datenbank
docker compose up -d db

# Logs anzeigen
docker compose logs -f db
```

### Ports

| Service | Port | Beschreibung |
|---------|------|--------------|
| App | 5173 | SvelteKit Dev Server |
| PostgreSQL | 5432 | Datenbank |
| MinIO API | 9000 | S3-kompatible API |
| MinIO Console | 9001 | Web-Interface |

## Datenbank-Management

Das Script `./scripts/db-manage.sh` bietet alle DB-Operationen:

```bash
# Status anzeigen
./scripts/db-manage.sh status

# Datenbank initialisieren
./scripts/db-manage.sh init

# Seed-Daten laden
./scripts/db-manage.sh seed

# Migrationen ausführen
./scripts/db-manage.sh migrate

# Vollständiges Backup
./scripts/db-manage.sh dump

# Einzelne Tabelle exportieren
./scripts/db-manage.sh dump-table notes

# Backup wiederherstellen
./scripts/db-manage.sh restore

# Datenbank komplett zurücksetzen (ACHTUNG: Datenverlust)
./scripts/db-manage.sh reset

# psql Shell öffnen
./scripts/db-manage.sh connect
```

### Migrationen

Neue Migrationen werden in `scripts/sql/migrations/` angelegt:

```
scripts/sql/migrations/
├── 003_text_analysis_fields.sql
├── 004_next_feature.sql
└── ...
```

**Namenskonvention:** `NNN_beschreibung.sql`

Migrationen werden automatisch getracked in der `_migrations` Tabelle.

## Storage

### Lokale Entwicklung

Ohne S3-Konfiguration speichert die App Dateien lokal:

```
data/storage/
├── users/{user_id}/
│   ├── documents/
│   └── avatars/
└── public/
```

### MinIO (S3-kompatibel)

Für lokales S3-Testing mit MinIO:

1. MinIO starten: `docker compose up -d minio`
2. Console öffnen: http://localhost:9001 (minioadmin/minioadmin)
3. `.env` konfigurieren:

```env
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=artellitext
S3_REGION=eu-central-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

## Coolify Deployment

### Voraussetzungen auf Coolify

1. PostgreSQL-Datenbank erstellen
2. MinIO/S3-Bucket konfigurieren
3. Environment-Variablen setzen

### Deployment-Schritte

```bash
# 1. Produktions-Build
./scripts/build.sh

# 2. Deploy (automatisch via Coolify Git-Hook)
git push origin main
```

### Environment auf Coolify

```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db-host:5432/Artellitext
SESSION_SECRET=<generierter-secret>
S3_ENDPOINT=https://minio.example.com
S3_BUCKET=artellitext
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
PUBLIC_APP_URL=https://artellitext.app
```

## Troubleshooting

### Docker-Probleme

```bash
# Container neu starten
docker compose down && docker compose up -d

# Volumes löschen (ACHTUNG: Datenverlust)
docker compose down -v
```

### Datenbank-Verbindung

```bash
# Verbindung testen
./scripts/db-manage.sh connect

# Logs prüfen
docker compose logs db
```

### Port bereits belegt

```bash
# Prozess finden
lsof -i :5432
lsof -i :5173

# Alternative Ports in .env
DATABASE_PORT=5433
```

## Nützliche Befehle

```bash
# Development Server mit HTTPS
pnpm dev -- --https

# Type-Check
pnpm check

# Linting
pnpm lint

# Tests
pnpm test

# Build testen
pnpm build && pnpm preview
```
