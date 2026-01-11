# Artellico

**Kognitive Denkplattform für akademisches Consulting und Wissensmanagement**

Eine High-End Webapplikation, die dem Prinzip der „Kognitiven Souveränität" folgt: keine unnötigen Abhängigkeiten, volle Kontrolle.

## Tech Stack

- **Framework**: SvelteKit 2.20 mit Svelte 5 (Runes)
- **Runtime**: Node.js 22+
- **Sprache**: TypeScript (Strict Mode)
- **Datenbank**: PostgreSQL 17 mit pgvector
- **Editor**: Editor.js
- **Styling**: Vanilla CSS (keine Frameworks)

## Architekturprinzipien

1. **Offline-First**: Alle Kernfunktionen funktionieren ohne Internet
2. **Lokale Schriften**: EB Garamond (Mensch), JetBrains Mono (Maschine)
3. **Vollständige Kontrolle**: Keine externen Services für Kernfunktionen
4. **Datenschutz**: DSGVO-konform, Daten gehören dem Nutzer

## Setup

### Voraussetzungen

- Node.js 22+
- Docker (für PostgreSQL mit pgvector)
- pnpm (empfohlen) oder npm

### Schnellstart (Neuer Computer)

```bash
# 1. Repository klonen
git clone https://github.com/alexanderpokorny/Artellitext.git
cd Artellitext

# 2. Abhängigkeiten installieren
pnpm install   # oder: npm install

# 3. Umgebungsvariablen einrichten
cp .env.example .env

# 4. PostgreSQL + pgvector mit Docker starten
# Für Debian/Ubuntu/Chromebook (Crostini):
chmod +x scripts/docker-postgres.sh
./scripts/docker-postgres.sh

# 5. Entwicklungsserver starten
pnpm dev   # oder: npm run dev
```

### Datenbank-Setup im Detail

Das Script `scripts/docker-postgres.sh` führt folgende Schritte aus:

1. Installiert Docker (falls nicht vorhanden)
2. Startet PostgreSQL 17 mit pgvector im Container `pgvector-db`
3. Erstellt die Datenbank `Artellitext`

**Connection-Details:**
| Parameter | Wert |
|-----------|------|
| Host | `localhost` |
| Port | `5432` |
| Database | `Artellitext` |
| User | `postgres` |
| Password | `postgres` |
| Connection String | `postgres://postgres:postgres@localhost:5432/Artellitext` |

**Manuelle Docker-Befehle:**
```bash
# Container starten (wenn bereits eingerichtet)
docker start pgvector-db

# Container stoppen
docker stop pgvector-db

# In PostgreSQL verbinden
docker exec -it pgvector-db psql -U postgres -d Artellitext

# Container-Status prüfen
docker ps -a | grep pgvector
```

### Auf macOS

```bash
# Docker Desktop installieren: https://docker.com/products/docker-desktop
# Dann:
docker run -d --name pgvector-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=Artellitext \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  pgvector/pgvector:pg17
```

### Font-Installation

Die Schriftarten müssen manuell heruntergeladen und in `/static/fonts/` abgelegt werden:

- **EB Garamond**: [Google Fonts](https://fonts.google.com/specimen/EB+Garamond) → Variable TTF
- **JetBrains Mono**: [JetBrains](https://www.jetbrains.com/lp/mono/) → Variable TTF
- **Special Elite**: [Google Fonts](https://fonts.google.com/specimen/Special+Elite)

Erwartete Dateistruktur:
```
static/fonts/
├── EBGaramond-Variable.ttf
├── EBGaramond-Italic-Variable.ttf
├── JetBrainsMono-Variable.ttf
└── SpecialElite-Regular.ttf
```

## Projektstruktur

```
src/
├── app.css              # Globales Theming
├── app.html             # HTML Template
├── app.d.ts             # TypeScript Declarations
├── hooks.server.ts      # Server Hooks (Auth, Security)
├── service-worker.ts    # PWA Service Worker
├── lib/
│   ├── components/      # Svelte Komponenten
│   │   ├── layout/      # Layout (Header, Sidebar, etc.)
│   │   └── ui/          # UI Elemente (Buttons, etc.)
│   ├── server/          # Server-only Code
│   │   ├── auth.ts      # Authentifizierung
│   │   ├── db.ts        # Datenbankanbindung
│   │   └── session.ts   # Session Management
│   ├── stores/          # Svelte Stores
│   │   ├── i18n.ts      # Internationalisierung
│   │   ├── theme.ts     # Theme Management
│   │   └── user.ts      # User State
│   └── types/           # TypeScript Types
└── routes/
    ├── +layout.svelte   # Root Layout
    ├── +page.svelte     # Dashboard
    ├── auth/            # Login/Register
    ├── editor/          # Block Editor
    ├── literatur/       # Dokumentenbibliothek
    ├── settings/        # Einstellungen
    └── api/             # REST API
```

## Verfügbare Skripte

```bash
pnpm dev       # Entwicklungsserver (Port 5173)
pnpm build     # Produktions-Build
pnpm preview   # Build-Vorschau
pnpm check     # TypeScript Check
pnpm lint      # ESLint
```

## Features

### Editor
- Block-basierter Editor (Editor.js)
- LaTeX-Unterstützung (KaTeX)
- Marginalien-System
- Tag-Verwaltung
- Auto-Save

### Literatur
- PDF/EPUB-Import
- Volltextsuche
- Semantische Suche (pgvector)
- Zitationsformate (APA, MLA, Chicago, etc.)

### Offline
- IndexedDB Cache
- Background Sync
- Service Worker
- Konfigurierbares Cache-Limit

### Theming
- Hell/Dunkel/Auto
- Lesemodus
- CSS Custom Properties
- Typografische Skala

## Umgebungsvariablen

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/artellico
SESSION_SECRET=your-session-secret-min-32-chars
PUBLIC_APP_URL=http://localhost:5173
```

## Lizenz

Proprietär – Alle Rechte vorbehalten

## Danksagungen und Lizenzen

- **SvelteKit**: MIT License
- **Editor.js**: Apache 2.0 License
- **PostgreSQL**: PostgreSQL License
- **pgvector**: PostgreSQL License
- **KaTeX**: MIT License
- **EB Garamond**: SIL Open Font License
- **JetBrains Mono**: SIL Open Font License
- **Special Elite**: Apache License 2.0
