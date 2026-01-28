# Artellitext – Feature Backlog

> **Stand**: 28. Januar 2026  
> **Quelle**: SaaS-Machbarkeitsanalyse PDF, Requirements.md, Konkurrenzanalyse  
> **Format**: Für GitHub Projects optimiert – wird automatisch via `gh` CLI synchronisiert
> **GitHub Project**: https://github.com/users/alexanderpokorny/projects/1

---

## Architektur-Prinzipien

### Deployment-Strategie: Local-First → Serverless-Ready

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Docker    │  │  PostgreSQL │  │    MinIO    │              │
│  │  Compose    │  │  + pgvector │  │    (S3)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│              ┌───────────▼───────────┐                          │
│              │    SvelteKit App      │                          │
│              │   (Node.js Adapter)   │                          │
│              └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Portable zu:
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVERLESS (Scaleway/Vercel)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Vercel/   │  │  Neon/      │  │  Scaleway   │              │
│  │  Coolify    │  │  Supabase   │  │  Object     │              │
│  │             │  │  PostgreSQL │  │  Storage    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side AI: Transformers.js + Whisper WebGPU

**NEU**: Lokale KI-Inferenz ohne Backend via Hugging Face Transformers.js

- **Whisper WebGPU**: Speech-to-Text komplett im Browser (V8 + WebGPU)
- **ONNX Runtime**: PyTorch-Modelle konvertiert für WASM/WebGPU
- **Modelle**: `whisper-base`, `whisper-small`, `distil-whisper` (quantisiert)
- **Vorteil**: Kein Server, keine API-Kosten, volle Datensouveränität

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Client-Side AI)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Transformers.js                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         ││
│  │  │   Whisper   │  │  Embedding  │  │    Text     │         ││
│  │  │   (STT)     │  │   Models    │  │  Generation │         ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         ││
│  │         │                │                │                 ││
│  │         └────────────────┴────────────────┘                 ││
│  │                          │                                   ││
│  │              ┌───────────▼───────────┐                      ││
│  │              │   WebGPU / WASM       │                      ││
│  │              │   (GPU Acceleration)  │                      ││
│  │              └───────────────────────┘                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Legende

**Priorität**:
- 🔴 P0 – Kritisch (MVP-Blocker)
- 🟠 P1 – Hoch (Core Feature)
- 🟡 P2 – Mittel (Enhancement)
- 🟢 P3 – Niedrig (Nice-to-have)

**Status**:
- ⬜ Offen
- 🔄 In Arbeit
- ✅ Erledigt

**Labels**: `editor`, `reader`, `ai`, `offline`, `api`, `ui`, `database`, `infrastructure`

---

## Epic 1: Dokumenten-Engine (Reader)

### 1.1 PDF Reader
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| R-001 | PDF.js Basis-Integration mit Web Worker | 🔴 P0 | ⬜ | `reader`, `infrastructure` |
| R-002 | PDF Canvas/SVG Rendering mit Zoom | 🔴 P0 | ⬜ | `reader`, `ui` |
| R-003 | PDF Text-Layer für Textauswahl | 🔴 P0 | ⬜ | `reader` |
| R-004 | PDF High-Contrast Mode (Dark Reader) | 🟠 P1 | ⬜ | `reader`, `ui` |
| R-005 | PDF Highlighting & Annotations | 🟠 P1 | ⬜ | `reader`, `database` |
| R-006 | PDF Seitennavigation & Thumbnails | 🟠 P1 | ⬜ | `reader`, `ui` |
| R-007 | PDF Suche im Dokument | 🟡 P2 | ⬜ | `reader` |
| R-008 | PDF Lesefortschritt speichern | 🟡 P2 | ⬜ | `reader`, `database` |

**Akzeptanzkriterien R-001**:
- [ ] PDF.js lädt asynchron nur im Browser (`onMount`)
- [ ] Web Worker korrekt konfiguriert (kein Main-Thread-Blocking)
- [ ] SSR für Reader-Route deaktiviert (`export const ssr = false`)

### 1.2 EPUB Reader
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| R-010 | EPUB.js Basis-Integration | 🟠 P1 | ⬜ | `reader`, `infrastructure` |
| R-011 | EPUB Reflow-Layout (responsive) | 🟠 P1 | ⬜ | `reader`, `ui` |
| R-012 | EPUB Theme-Injection (High Contrast) | 🟠 P1 | ⬜ | `reader`, `ui` |
| R-013 | EPUB CFI-Sync (Leseposition) | 🟡 P2 | ⬜ | `reader`, `database` |
| R-014 | EPUB Inhaltsverzeichnis-Navigation | 🟡 P2 | ⬜ | `reader`, `ui` |
| R-015 | EPUB Highlighting & Annotations | 🟡 P2 | ⬜ | `reader`, `database` |

### 1.3 Office-Dokumente
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| R-020 | DOCX Vorschau (Read-only) | 🟡 P2 | ⬜ | `reader` |
| R-021 | XLSX Vorschau (Tabellen) | 🟡 P2 | ⬜ | `reader` |
| R-022 | PPTX Vorschau (Slides) | 🟢 P3 | ⬜ | `reader` |
| R-023 | Google Docs externe Verlinkung | 🟢 P3 | ⬜ | `reader`, `integration` |

---

## Epic 2: Editor-Erweiterungen

### 2.1 Basis-Blöcke
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-001 | Editor.js Header Plugin (H1-H4) | ✅ | ✅ | `editor` |
| E-002 | Editor.js List Plugin | ✅ | ✅ | `editor` |
| E-003 | Editor.js Quote Plugin | ✅ | ✅ | `editor` |
| E-004 | Editor.js Code Plugin | ✅ | ✅ | `editor` |

### 2.2 Erweiterte Blöcke
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-010 | LaTeX Block (`$$...$$` Display) | 🔴 P0 | ⬜ | `editor`, `academic` |
| E-011 | LaTeX Inline (`$...$`) | 🔴 P0 | ⬜ | `editor`, `academic` |
| E-012 | Mermaid Diagramm-Block | 🟠 P1 | ⬜ | `editor`, `diagrams` |
| E-013 | Code Block mit Syntax Highlighting | 🟠 P1 | ⬜ | `editor` |
| E-014 | Bild-Upload & Einbettung | 🟠 P1 | ⬜ | `editor`, `storage` |
| E-015 | Video-Embed (YouTube, Vimeo) | 🟡 P2 | ⬜ | `editor` |
| E-016 | Excalidraw Embed | � P1 | ⬜ | `editor`, `diagrams` |
| E-017 | Draw.io Embed | 🟡 P2 | ⬜ | `editor`, `diagrams` |
| E-018 | PlantUML Block | 🟢 P3 | ⬜ | `editor`, `diagrams` |
| E-019 | Custom HTML Block (JS-sanitized) | 🟢 P3 | ⬜ | `editor`, `security` |

### 2.5 Inline Drawings (Canvas)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-050 | Canvas Drawing Block | 🟠 P1 | ⬜ | `editor`, `diagrams` |
| E-051 | Freihand-Zeichnung im Block | 🟠 P1 | ⬜ | `editor`, `diagrams` |
| E-052 | Stift-/Marker-/Radierer-Tools | 🟠 P1 | ⬜ | `editor`, `ui` |
| E-053 | Farb- und Strichstärken-Auswahl | 🟠 P1 | ⬜ | `editor`, `ui` |
| E-054 | Export als SVG/PNG | 🟡 P2 | ⬜ | `editor`, `export` |
| E-055 | Excalidraw-Integration (vollständig) | 🟠 P1 | ⬜ | `editor`, `diagrams` |
| E-056 | Touch/Stylus-Unterstützung | 🟠 P1 | ⬜ | `editor`, `mobile` |

**Akzeptanzkriterien E-050**:
- [ ] Canvas-Element als Editor.js Block
- [ ] Speicherung als Base64 oder SVG in Block-Data
- [ ] Responsive Darstellung bei Wiedergabe
- [ ] Dark/Light Mode Support für Zeichnung

### 2.6 Textanalyse & Metriken (Hemingway-Style)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-060 | Basis-Textmetriken (Wörter/Zeichen/Sätze) | 🟠 P1 | ⬜ | `editor`, `analysis` |
| E-061 | Lesezeit-Berechnung | 🟠 P1 | ⬜ | `editor`, `analysis` |
| E-062 | Lesbarkeits-Index (Flesch-Reading-Ease) | 🟠 P1 | ⬜ | `editor`, `analysis` |
| E-063 | Lesestufen-Zuordnung (Bildungsstufen) | 🟠 P1 | ⬜ | `editor`, `analysis` |
| E-064 | Hemingway-Style Highlighting | 🟠 P1 | ⬜ | `editor`, `analysis`, `ui` |
| E-065 | Schwierige Sätze markieren | 🟠 P1 | ⬜ | `editor`, `analysis` |
| E-066 | Adverb-Warnung | 🟡 P2 | ⬜ | `editor`, `analysis` |
| E-067 | Passiv-Konstruktionen erkennen | 🟡 P2 | ⬜ | `editor`, `analysis` |
| E-068 | Lesbarkeits-Modell Auswahl (wie Zettlr) | 🟠 P1 | ⬜ | `editor`, `analysis`, `settings` |
| E-069 | Sprachniveau A1-C2 (GER) | 🟡 P2 | ⬜ | `editor`, `analysis`, `i18n` |
| E-070 | Metriken-Panel Toggle | 🟠 P1 | ⬜ | `editor`, `ui` |

**Akzeptanzkriterien E-062 (Lesbarkeits-Index)**:
- [ ] Flesch-Reading-Ease für Deutsch (Amstad-Formel)
- [ ] Flesch-Kincaid für Englisch (US)
- [ ] Wiener Sachtextformel für Österreichisches Deutsch
- [ ] Modell-Auswahl in Settings

**Lesbarkeits-Modelle (E-068)**:

| Modell | Sprache | Formel | Anwendung |
|--------|---------|--------|----------|
| Flesch-Reading-Ease (DE) | Deutsch | Amstad-Formel | Standard DE |
| Flesch-Kincaid Grade | Englisch | US-Standard | Schuljahre US |
| Wiener Sachtextformel | Deutsch (AT) | 4 Varianten | Wissenschaft AT |
| LIX | Universal | Björnsson | Skandinavisch/International |
| SMOG | Englisch | McLaughlin | Medizinische Texte |
| Gunning-Fog | Englisch | Gunning | Business-Texte |

**Lesestufen-Zuordnung (E-063)**:

| Score-Bereich | DE Bildungsstufe | AT Bildungsstufe | US Grade Level | Verständliche Beschreibung |
|---------------|------------------|------------------|----------------|----------------------------|
| 90-100 | Grundschule (1-4) | Volksschule | 5th Grade | Sehr leicht - 10-Jährige |
| 80-89 | Unterstufe (5-6) | Unterstufe Gym | 6th Grade | Leicht - 11-12-Jährige |
| 70-79 | Mittelstufe (7-8) | 3.-4. Klasse AHS | 7th-8th Grade | Durchschnittlich - 13-14-Jährige |
| 60-69 | Oberstufe (9-10) | 5.-6. Klasse AHS | 9th-10th Grade | Etwas schwierig - 15-16-Jährige |
| 50-59 | Abitur/Matura | 7.-8. Klasse AHS | 11th-12th Grade | Schwierig - Maturanten |
| 30-49 | Hochschule | Universität | College | Akademisch - Studierende |
| 0-29 | Wissenschaftlich | Wissenschaftlich | Graduate | Sehr schwierig - Fachpublikum |

**Sprachniveau GER (E-069)**:

| GER-Stufe | Beschreibung | Typische Merkmale |
|-----------|--------------|-------------------|
| A1 | Anfänger | Einfache Sätze, Grundwortschatz (~500 Wörter) |
| A2 | Grundlegend | Alltägliche Ausdrücke, einfache Zusammenhänge |
| B1 | Mittelstufe | Standardsprache, bekannte Themen |
| B2 | Gute Mittelstufe | Komplexe Texte, abstrakte Themen |
| C1 | Fortgeschritten | Implizite Bedeutungen, akademische Texte |
| C2 | Annähernd Muttersprachlich | Nuancen, Fachsprache, Stilistik |

**Akzeptanzkriterien E-010**:
- [ ] KaTeX oder MathJax für LaTeX-Rendering
- [ ] Display-Modus automatisch nummeriert
- [ ] Syntax-Fehler werden angezeigt (nicht crashen)

### 2.3 Marginalien-System
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-030 | Marginalie erstellen (`/marginalie`) | 🟠 P1 | ⬜ | `editor`, `ui` |
| E-031 | Marginalie positioniert neben Absatz | 🟠 P1 | ⬜ | `editor`, `ui` |
| E-032 | Marginalie Drag & Drop verschieben | 🟡 P2 | ⬜ | `editor`, `ui` |
| E-033 | Marginalie nur Text (B/I/U) | 🟠 P1 | ⬜ | `editor` |
| E-034 | Marginalien in SpecialElite Font | 🟠 P1 | ⬜ | `editor`, `ui` |

### 2.4 Fußnoten & Zitationen
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| E-040 | Fußnoten-System im Block | 🟠 P1 | ⬜ | `editor`, `academic` |
| E-041 | Zitations-Einfügung `[1]` Format | 🔴 P0 | ⬜ | `editor`, `academic` |
| E-042 | Literaturverzeichnis-Block | 🔴 P0 | ⬜ | `editor`, `academic` |
| E-043 | Citation.js Integration | 🔴 P0 | ⬜ | `editor`, `api` |
| E-044 | BibTeX Import | 🟠 P1 | ⬜ | `editor`, `academic` |
| E-045 | RIS Import | 🟡 P2 | ⬜ | `editor`, `academic` |
| E-046 | Zitierformat-Auswahl (APA, IEEE, Chicago) | 🟠 P1 | ⬜ | `editor`, `academic` |
| E-047 | Deep-Link: Klick auf Zitat öffnet PDF | 🟡 P2 | ⬜ | `editor`, `reader` |

---

## Epic 3: KI-Integration (BYOK + Client-Side)

### 3.0 Client-Side AI (Transformers.js) – NEU
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-C01 | Transformers.js Integration Setup | 🔴 P0 | ⬜ | `ai`, `infrastructure` |
| AI-C02 | Whisper WebGPU Speech-to-Text | 🔴 P0 | ⬜ | `ai`, `editor` |
| AI-C03 | Modell-Download & Caching (IndexedDB) | 🔴 P0 | ⬜ | `ai`, `offline` |
| AI-C04 | WebGPU Feature Detection & Fallback | 🟠 P1 | ⬜ | `ai`, `infrastructure` |
| AI-C05 | Whisper Modell-Auswahl (base/small/distil) | 🟠 P1 | ⬜ | `ai`, `ui` |
| AI-C06 | Client-Side Embeddings (Semantic Search) | 🟠 P1 | ⬜ | `ai`, `search` |
| AI-C07 | Diktat-Modus für Editor | 🟠 P1 | ⬜ | `ai`, `editor` |
| AI-C08 | Progress-Anzeige bei Modell-Download | 🟠 P1 | ⬜ | `ai`, `ui` |
| AI-C09 | Transkription mit Zeitstempeln | 🟡 P2 | ⬜ | `ai`, `editor` |
| AI-C10 | Multi-Language Whisper (de/en/fr/es) | 🟡 P2 | ⬜ | `ai`, `i18n` |

**Akzeptanzkriterien AI-C01**:
- [ ] `@xenova/transformers` npm Package integriert
- [ ] ONNX Models werden in IndexedDB gecacht
- [ ] Inferenz läuft in Web Worker (kein UI-Blocking)
- [ ] WebGPU priorisiert, WASM als Fallback

**Akzeptanzkriterien AI-C02**:
- [ ] Audio-Aufnahme via MediaRecorder API
- [ ] Whisper-Modell lädt bei erstem Aufruf
- [ ] Transkription erfolgt in < 2s (für kurze Clips)
- [ ] Funktioniert komplett offline nach Modell-Download

### 3.1 Server-Side KI (BYOK)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-001 | KI-Proxy Endpunkt mit SSE | 🟠 P1 | ⬜ | `ai`, `api` |
| AI-002 | API-Key Verwaltung (verschlüsselt) | 🟠 P1 | ⬜ | `ai`, `database`, `security` |
| AI-003 | Model Registry UI (OpenAI, Anthropic, OpenRouter) | 🟠 P1 | ⬜ | `ai`, `ui` |
| AI-004 | Rate Limiting für KI-Calls | 🟡 P2 | ⬜ | `ai`, `security` |

**Akzeptanzkriterien AI-001**:
- [ ] SSE (Server-Sent Events) für Streaming
- [ ] Kein WebSocket (bessere Firewall-Kompatibilität)
- [ ] System-Prompt wird serverseitig injiziert

### 3.2 Sokratische KI (aus PDF)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-010 | Sokratischer System-Prompt | 🟠 P1 | ⬜ | `ai` |
| AI-011 | „Reviewer 2" Adversarial Mode | 🟡 P2 | ⬜ | `ai`, `academic` |
| AI-012 | Toulmin-Argumentation-Analyse | 🟢 P3 | ⬜ | `ai`, `academic` |

### 3.3 Text-Assistenz (inspiriert von Text-Well)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-020 | Grammatik & Stil Check | 🟠 P1 | ⬜ | `ai`, `editor` |
| AI-021 | Zusammenfassung generieren | 🟠 P1 | ⬜ | `ai`, `editor` |
| AI-022 | Übersetzung (Side-by-Side) | 🟡 P2 | ⬜ | `ai`, `editor` |
| AI-023 | Tag-Extraktion automatisch | 🟠 P1 | ⬜ | `ai`, `editor` |
| AI-024 | Block-Collapsed Summary generieren | 🟡 P2 | ⬜ | `ai`, `editor` |

### 3.4 Fortgeschrittene KI (aus PDF - Unique)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-030 | Epistemische Lücken-Analyse | 🟢 P3 | ⬜ | `ai`, `academic` |
| AI-031 | Bibliometrischer Bias-Check | 🟢 P3 | ⬜ | `ai`, `academic` |
| AI-032 | Syntopische Begriffs-Disambiguierung | 🟢 P3 | ⬜ | `ai`, `academic` |
| AI-033 | Semantic Drift Detection | 🟢 P3 | ⬜ | `ai`, `academic` |
| AI-034 | Prämissen-Belastungstest | 🟢 P3 | ⬜ | `ai`, `academic` |

### 3.5 Semantische Suche (RAG)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| AI-040 | pgvector Embedding-Speicherung | 🟠 P1 | ⬜ | `ai`, `database` |
| AI-041 | Dokument-Embeddings bei Upload | 🟠 P1 | ⬜ | `ai`, `database` |
| AI-042 | Semantische Suche über Notizen | 🟠 P1 | ⬜ | `ai`, `search` |
| AI-043 | Semantische Suche über PDFs | 🟠 P1 | ⬜ | `ai`, `search` |
| AI-044 | „Frag deine Dokumente" Chat | 🟡 P2 | ⬜ | `ai`, `search` |

---

## Epic 4: Offline & PWA

### 4.1 Service Worker
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| PWA-001 | Service Worker Basis | ✅ | ✅ | `offline` |
| PWA-002 | Asset Caching (StaleWhileRevalidate) | 🟠 P1 | ⬜ | `offline` |
| PWA-003 | API Caching (NetworkFirst) | 🟠 P1 | ⬜ | `offline` |
| PWA-004 | Offline Fallback Page | 🟠 P1 | ⬜ | `offline`, `ui` |

### 4.2 IndexedDB
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| PWA-010 | IndexedDB Setup (Dexie.js) | 🔴 P0 | ⬜ | `offline`, `database` |
| PWA-011 | Notizen lokal speichern | 🔴 P0 | ⬜ | `offline`, `database` |
| PWA-012 | Cache-Limit konfigurierbar | 🟠 P1 | ⬜ | `offline`, `settings` |
| PWA-013 | Dokument-Thumbnails cachen | 🟡 P2 | ⬜ | `offline`, `storage` |
| PWA-014 | Vollständige PDFs offline | 🟡 P2 | ⬜ | `offline`, `storage` |

### 4.3 Synchronisation
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| PWA-020 | Sync-Queue für Offline-Änderungen | 🔴 P0 | ⬜ | `offline`, `api` |
| PWA-021 | Conflict Resolution (Last Write Wins) | 🔴 P0 | ⬜ | `offline`, `database` |
| PWA-022 | Sync-Status Anzeige (Ampel) | 🟠 P1 | 🔄 | `offline`, `ui` |
| PWA-023 | Manuelle Sync-Option | 🟡 P2 | ⬜ | `offline`, `ui` |
| PWA-024 | Background Sync API | 🟢 P3 | ⬜ | `offline` |

---

## Epic 5: Dokumenten-Management

### 5.1 Upload & Storage
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| DOC-001 | S3/MinIO Integration | 🔴 P0 | ⬜ | `storage`, `infrastructure` |
| DOC-002 | Presigned URLs für Downloads | 🔴 P0 | ⬜ | `storage`, `api` |
| DOC-003 | File Upload Endpunkt | 🔴 P0 | ⬜ | `storage`, `api` |
| DOC-004 | Thumbnail-Generierung | 🟠 P1 | ⬜ | `storage` |
| DOC-005 | Metadaten-Extraktion (Title, Author) | 🟠 P1 | ⬜ | `storage` |
| DOC-006 | Storage Quota pro User | 🟠 P1 | ⬜ | `storage`, `billing` |

### 5.2 Bibliothek UI
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| DOC-010 | Grid-Ansicht mit Thumbnails | 🟠 P1 | ⬜ | `ui`, `literatur` |
| DOC-011 | Listen-Ansicht | 🟠 P1 | ⬜ | `ui`, `literatur` |
| DOC-012 | Sortierung (Datum, Name, Typ) | 🟠 P1 | ⬜ | `ui`, `literatur` |
| DOC-013 | Filter nach Dateityp | 🟡 P2 | ⬜ | `ui`, `literatur` |
| DOC-014 | Drag & Drop Upload | 🟡 P2 | ⬜ | `ui`, `literatur` |
| DOC-015 | Bulk-Aktionen (Löschen, Taggen) | 🟡 P2 | ⬜ | `ui`, `literatur` |
| DOC-016 | SW/Farbe Toggle für Thumbnails | 🟢 P3 | ⬜ | `ui`, `literatur` |

### 5.3 Volltext-Extraktion
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| DOC-020 | PDF Text-Extraktion | 🟠 P1 | ⬜ | `search`, `storage` |
| DOC-021 | EPUB Text-Extraktion | 🟠 P1 | ⬜ | `search`, `storage` |
| DOC-022 | DOCX Text-Extraktion | 🟡 P2 | ⬜ | `search`, `storage` |
| DOC-023 | OCR für gescannte PDFs | 🟢 P3 | ⬜ | `search`, `ai` |

---

## Epic 6: UI/UX Verbesserungen

### 6.1 Dashboard
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| UI-001 | Letzte Notizen Widget | 🟠 P1 | 🔄 | `ui`, `dashboard` |
| UI-002 | Quick Actions (Neu, Upload) | 🟠 P1 | ⬜ | `ui`, `dashboard` |
| UI-003 | Speicherplatz-Anzeige | 🟡 P2 | ⬜ | `ui`, `dashboard` |
| UI-004 | Aktivitäts-Feed | 🟢 P3 | ⬜ | `ui`, `dashboard` |

### 6.2 Suche
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| UI-010 | Globale Suchleiste | 🟠 P1 | 🔄 | `ui`, `search` |
| UI-011 | Such-Settings Dropdown (wie Gmail) | 🟠 P1 | ⬜ | `ui`, `search` |
| UI-012 | Tag-Filter in Suche | 🟠 P1 | ⬜ | `ui`, `search` |
| UI-013 | Datumsbereich-Filter | 🟡 P2 | ⬜ | `ui`, `search` |
| UI-014 | Semantische Suche Toggle | 🟡 P2 | ⬜ | `ui`, `search`, `ai` |

### 6.3 Notizen-Ansichten
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| UI-020 | Vollbreite-Ansicht | 🟠 P1 | ⬜ | `ui`, `editor` |
| UI-021 | Karten-Ansicht mit Preview | 🟠 P1 | ⬜ | `ui`, `editor` |
| UI-022 | Kompakte Zeilen-Ansicht | 🟡 P2 | ⬜ | `ui`, `editor` |
| UI-023 | Lazy Load beim Scrollen | 🟠 P1 | ⬜ | `ui`, `performance` |
| UI-024 | Block Expand/Collapse | 🟠 P1 | ⬜ | `ui`, `editor` |

### 6.4 Mobile & Responsive
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| UI-030 | Mobile Hamburger Menu | ✅ | ✅ | `ui`, `mobile` |
| UI-031 | Touch-optimierte Touch Targets (44px) | 🟠 P1 | ⬜ | `ui`, `mobile` |
| UI-032 | Swipe-Gesten für Navigation | 🟡 P2 | ⬜ | `ui`, `mobile` |
| UI-033 | Tablet 2-Spalten Layout | 🟡 P2 | ⬜ | `ui`, `responsive` |

---

## Epic 7: Admin & Billing

### 7.1 Admin-Panel
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| ADM-001 | Admin Dashboard | 🟡 P2 | ⬜ | `admin` |
| ADM-002 | User Management | 🟡 P2 | ⬜ | `admin` |
| ADM-003 | Übersetzungs-Editor | 🟡 P2 | ⬜ | `admin`, `i18n` |
| ADM-004 | Feature Flags | 🟡 P2 | ⬜ | `admin` |
| ADM-005 | System-Statistiken | 🟢 P3 | ⬜ | `admin` |

### 7.2 Subscription & Billing
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| BIL-001 | Subscription Tiers Tabelle | 🟡 P2 | ⬜ | `billing`, `database` |
| BIL-002 | LemonSqueezy Integration | 🟡 P2 | ⬜ | `billing`, `integration` |
| BIL-003 | Storage Quota Enforcement | 🟡 P2 | ⬜ | `billing`, `storage` |
| BIL-004 | Feature-Gating nach Tier | 🟡 P2 | ⬜ | `billing` |
| BIL-005 | Upgrade/Downgrade Flow | 🟡 P2 | ⬜ | `billing`, `ui` |

---

## Epic 8: Sicherheit & Compliance

### 8.1 Authentifizierung
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| SEC-001 | Session Management | ✅ | ✅ | `security` |
| SEC-002 | Passwort-Reset Flow | 🟠 P1 | ⬜ | `security`, `auth` |
| SEC-003 | E-Mail Verifizierung | 🟠 P1 | ⬜ | `security`, `auth` |
| SEC-004 | 2FA (TOTP) | 🟢 P3 | ⬜ | `security`, `auth` |

### 8.2 Datenschutz
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| SEC-010 | DSGVO Datenexport | 🟠 P1 | ⬜ | `security`, `gdpr` |
| SEC-011 | DSGVO Account-Löschung | 🟠 P1 | ⬜ | `security`, `gdpr` |
| SEC-012 | API-Key Verschlüsselung (AES-256) | 🔴 P0 | ⬜ | `security`, `ai` |
| SEC-013 | Audit Log | 🟢 P3 | ⬜ | `security`, `admin` |

---

## Epic 9: Export & Import

### 9.1 Export
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| EXP-001 | Notiz als Markdown exportieren | 🟠 P1 | ⬜ | `export` |
| EXP-002 | Notiz als PDF exportieren | 🟡 P2 | ⬜ | `export` |
| EXP-003 | Notiz als DOCX exportieren | 🟡 P2 | ⬜ | `export` |
| EXP-004 | Alle Notizen als ZIP | 🟡 P2 | ⬜ | `export`, `gdpr` |
| EXP-005 | Literaturverzeichnis als BibTeX | 🟠 P1 | ⬜ | `export`, `academic` |

### 9.2 Import
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| IMP-001 | Markdown Import | 🟠 P1 | ⬜ | `import` |
| IMP-002 | Notion Import | 🟡 P2 | ⬜ | `import`, `migration` |
| IMP-003 | BibTeX Import | 🟠 P1 | ⬜ | `import`, `academic` |
| IMP-004 | Bulk-Document Upload (ZIP) | 🟡 P2 | ⬜ | `import`, `storage` |

---

## Epic 10: Infrastructure & DevOps

### 10.1 Local Development (Docker)
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| INF-001 | Docker Compose Setup (Postgres + MinIO) | 🔴 P0 | ⬜ | `infrastructure`, `devops` |
| INF-002 | PostgreSQL 17 + pgvector Container | 🔴 P0 | ⬜ | `infrastructure`, `database` |
| INF-003 | MinIO S3-kompatibles Storage | 🔴 P0 | ⬜ | `infrastructure`, `storage` |
| INF-004 | Dev Database Seeding Script | 🟠 P1 | ⬜ | `infrastructure`, `devops` |
| INF-005 | Hot Reload für alle Services | 🟠 P1 | ⬜ | `infrastructure`, `devops` |

**Akzeptanzkriterien INF-001**:
- [ ] `docker-compose up` startet alle Services
- [ ] Volumes für persistente Daten
- [ ] .env.example mit allen Variablen
- [ ] Health Checks für alle Container

### 10.2 Serverless Portability
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| INF-010 | Environment-agnostische DB-Connection | 🔴 P0 | ⬜ | `infrastructure`, `database` |
| INF-011 | S3-kompatible Storage Abstraktion | 🔴 P0 | ⬜ | `infrastructure`, `storage` |
| INF-012 | Coolify Deployment Config | 🟠 P1 | ⬜ | `infrastructure`, `devops` |
| INF-013 | Scaleway Serverless Config | 🟡 P2 | ⬜ | `infrastructure`, `devops` |
| INF-014 | Neon PostgreSQL Migration Guide | 🟡 P2 | ⬜ | `infrastructure`, `database` |
| INF-015 | Vercel Edge Adapter | 🟡 P2 | ⬜ | `infrastructure`, `devops` |

**Akzeptanzkriterien INF-010**:
- [ ] `DATABASE_URL` als einzige Konfiguration
- [ ] Automatische SSL-Erkennung
- [ ] Connection Pooling (PgBouncer-kompatibel)
- [ ] Migrations laufen auf beiden Targets

### 10.3 CI/CD
| ID | Feature | Priorität | Status | Labels |
|----|---------|-----------|--------|--------|
| INF-020 | GitHub Actions: Build & Test | 🟠 P1 | ⬜ | `infrastructure`, `ci` |
| INF-021 | GitHub Actions: Deploy to Coolify | 🟠 P1 | ⬜ | `infrastructure`, `cd` |
| INF-022 | Database Migration CI Check | 🟠 P1 | ⬜ | `infrastructure`, `database` |
| INF-023 | E2E Tests mit Playwright | 🟡 P2 | ⬜ | `infrastructure`, `testing` |

---

## Zusammenfassung nach Priorität

### P0 – MVP Kritisch (30 Features)
Must-have für ein funktionierendes Produkt:
- **Reader**: PDF.js Basis, Text-Layer, Rendering
- **Editor**: LaTeX Blöcke, Citation.js + Literaturverzeichnis
- **Client-Side AI**: Transformers.js Setup, Whisper WebGPU, Modell-Caching
- **Offline**: IndexedDB + Sync-Queue
- **Storage**: S3/MinIO Integration + File Upload
- **Security**: API-Key Verschlüsselung
- **Infrastructure**: Docker Compose, DB/S3 Abstraktionen

### P1 – Core Features (55 Features)
Notwendig für Wettbewerbsfähigkeit:
- EPUB Reader komplett
- Mermaid, Marginalien, Fußnoten
- Client-Side Embeddings, Diktat-Modus
- Sokratischer Modus, Text-Assistenz (Server-Side BYOK)
- pgvector Semantic Search
- Offline Caching Strategie
- Thumbnail-Generierung
- Grid/Listen-Ansichten
- Passwort-Reset, E-Mail-Verifizierung
- CI/CD Pipeline

### P2 – Enhancements (35 Features)
Verbessern das Produkt signifikant:
- Office-Vorschau, Deep-Links
- Übersetzung Side-by-Side
- Admin-Panel, Billing
- Notion Import, PDF Export

### P3 – Nice-to-have (15 Features)
Für spätere Iterationen:
- Fortgeschrittene KI (Bias-Check, Drift Detection)
- 2FA, Audit Logs
- PlantUML, Custom HTML

---

## Nächste Schritte

1. **Sprint Planning**: P0 Features in ersten 4-6 Sprints aufteilen
2. **GitHub Issues erstellen**: Dieses Dokument als Vorlage nutzen
3. **Dependencies beachten**: Manche Features bauen aufeinander auf

---

*Dieses Backlog wird kontinuierlich aktualisiert. Letzte Änderung: 28. Januar 2026*
