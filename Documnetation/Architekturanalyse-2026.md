# Artellitext – Strategische Architekturanalyse Januar 2026

> **Dokument-Typ**: Strategische Analyse mit Handlungsempfehlungen  
> **Erstellt**: 28. Januar 2026  
> **Grundlage**: SaaS-Machbarkeitsanalyse PDF, Requirements.md, Design.md, Konkurrenzanalyse

---

## Executive Summary

Die Analyse des „SaaS-App Machbarkeitsanalyse SvelteKit.pdf" bestätigt die strategische Positionierung von Artellitext als **„Cognitive Assurance System"** – eine Plattform, die sich bewusst von der „Generativen Sackgasse" der KI-Tools absetzt. Der gewählte Tech-Stack (SvelteKit, PostgreSQL mit pgvector, Node.js, S3) ist technisch fundiert und ermöglicht die Vision der **„Kognitiven Souveränität"**.

### Kernerkenntnisse

1. **Marktpositionierung**: Artellitext ist kein „Produktivitätstool", sondern eine „Resilienz-Plattform" gegen kognitive Atrophie
2. **Technische Validierung**: Der „Sovereign Stack" (EuroStack) ist enterprise-ready
3. **USP-Differenzierung**: „Produktive Reibung" statt „Seamlessness" – KI für Reduktion und Präzision, nicht für Expansion
4. **Architekturlücken**: Einige Features aus dem PDF sind noch nicht implementiert

---

## 1. Konkurrenzanalyse

### 1.1 Text-Well.com

**Positionierung**: AI Writing Workflow Platform mit Fokus auf kontrollierte Text-Optimierung

| Aspekt | Text-Well | Artellitext (Ziel) |
|--------|-----------|-------------------|
| **Kernkonzept** | „AI provides suggestions, you decide" | „Kognitive Souveränität" |
| **KI-Integration** | Fest integriert (Token-basiert) | BYOK (Bring Your Own Key) |
| **Zielgruppe** | Content Creator, Blogger | Akademiker, Forscher, B2B |
| **Preismodell** | Free/Pro $5.99/Max $19.99 | Noch zu definieren |

**Text-Well Features (relevant für Artellitext)**:
- ✅ AI Text Check (Grammatik, Stil)
- ✅ AI Review Panel (Multi-Perspektiven)
- ✅ Side-by-Side Translation
- ✅ Title Generation
- ✅ AI Illustration Search
- ✅ Multiple Check Modes (Academic, Formal, Native Expression)

**Schwächen von Text-Well**:
- Kein Offline-Modus
- Keine Dokumentenverwaltung (PDF/EPUB)
- Keine Zitationsverwaltung
- Keine semantische Suche über eigene Dokumente
- Vendor Lock-in durch feste KI-Integration

### 1.2 Docmost.com

**Positionierung**: Enterprise-ready Wiki für Teams (Open-Source Alternative zu Notion/Confluence)

| Aspekt | Docmost | Artellitext (Ziel) |
|--------|---------|-------------------|
| **Kernkonzept** | Kollaboratives Wiki | Persönliches Wissensmanagement |
| **Deployment** | Self-Hosted/Cloud | Self-Hosted prioritär |
| **Lizenz** | AGPL 3.0 / Enterprise | Proprietär |
| **Fokus** | Team-Kollaboration | Individuelles Denken |

**Docmost Features (relevant für Artellitext)**:
- ✅ Real-time Collaboration
- ✅ Diagrams (Draw.io, Excalidraw, Mermaid) – **bereits in Requirements**
- ✅ Spaces (entspricht Workspaces)
- ✅ AI Search (Ask AI) – **entspricht Sokratischer KI**
- ✅ Comments System
- ✅ Page History / Versioning
- ✅ File Attachments
- ✅ PDF/DOCX Search (Enterprise)
- ✅ Import/Export (Notion, Confluence, Markdown)

**Schwächen von Docmost**:
- Kein Offline-First-Design
- Keine PWA-Installation
- Kein BYOK für KI
- Keine Marginalienfunktion
- Kein Fokus auf akademisches Schreiben

### 1.3 Differenzierungsmatrix

```
                    KI-Integration
                    Fest │ BYOK (Souverän)
              ┌─────────┼─────────────────┐
Team-         │ Docmost │     (Lücke)     │
Kollaboration │         │                 │
              ├─────────┼─────────────────┤
Individuell   │Text-Well│  ARTELLITEXT    │
              │         │                 │
              └─────────┴─────────────────┘
                    Offline: ❌    Offline: ✅
```

**Artellitext USP**: Einzige Plattform mit BYOK + Offline-First + Akademischem Fokus

---

## 2. Architektur-Bewertung (IST-Zustand)

### 2.1 Tech-Stack Bewertung

| Komponente | Status | Bewertung | Notizen |
|------------|--------|-----------|---------|
| **SvelteKit 2.20 + Svelte 5** | ✅ Implementiert | Exzellent | Runes-System optimal für komplexe States |
| **PostgreSQL 17 + pgvector** | ✅ Implementiert | Exzellent | Hybrid DB für Relational + Vektor |
| **Node.js 22** | ✅ Implementiert | Sehr gut | TypeScript durchgängig |
| **Editor.js** | ⚠️ Basis vorhanden | Gut | Erweiterungen nötig |
| **S3 Storage** | ⚠️ Vorbereitet | - | Noch nicht produktiv |
| **PWA** | ⚠️ Service Worker vorhanden | Teilweise | Caching-Strategie ausbaufähig |
| **PDF.js** | ❌ Nicht implementiert | - | Kritisch für Literatur |
| **EPUB.js** | ❌ Nicht implementiert | - | Kritisch für Literatur |
| **Citation.js** | ❌ Nicht implementiert | - | Kritisch für akademischen Fokus |

### 2.2 Architektur-Stärken

1. **Saubere Projektstruktur**
   - Klare Trennung: `lib/server`, `lib/stores`, `lib/components`
   - Repository-Pattern für Datenbankzugriffe
   - Konsistentes CSS-System mit Theme-Variablen

2. **Svelte 5 Runes korrekt eingesetzt**
   - `$state`, `$derived`, `$effect` durchgängig verwendet
   - Keine veralteten Store-Patterns

3. **CSS-Architektur vorbildlich**
   - Zentrale Styles in `app.css`
   - Theme-Variablen für alle Farben
   - Responsive Grid-Layout implementiert

4. **i18n-System vorhanden**
   - Mehrsprachigkeit vorbereitet
   - Sprachauswahl funktional

### 2.3 Architektur-Lücken (Kritisch)

#### 2.3.1 Fehlende Dokumenten-Engine (Kritisch)

Das PDF identifiziert den Dokumenten-Reader als „technisches Herzstück". Aktuell:

```
SOLL (aus PDF):                  IST (Codebase):
├── PDF.js Integration           ├── ❌ Nicht vorhanden
│   ├── Web Worker              │
│   ├── Canvas/SVG Renderer     │
│   └── Text-Layer für Suche    │
├── EPUB.js Integration          ├── ❌ Nicht vorhanden
│   ├── CFI-Sync                │
│   └── Theme-Injection         │
└── Citation.js                  └── ❌ Nicht vorhanden
```

**Empfehlung**: Höchste Priorität – ohne dies ist der USP „Literaturverwaltung" nicht realisierbar.

#### 2.3.2 Editor.js Erweiterungen fehlen

Laut Requirements fehlen:
- ❌ LaTeX-Blöcke (`$$...$$` und `$...$`)
- ❌ Mermaid-Diagramme
- ❌ Excalidraw/Draw.io Integration
- ❌ Marginalien-System
- ❌ Fußnoten-System
- ❌ Custom HTML Blocks (mit JS-Sanitization)

#### 2.3.3 KI-Integration nicht vorhanden

```
SOLL (aus PDF):                  IST:
├── SSE Streaming Proxy          ├── ❌ Nicht implementiert
├── BYOK Settings UI             ├── ❌ Nicht implementiert
├── Sokratischer System-Prompt   ├── ❌ Nicht implementiert
└── Adversarial Review Mode      └── ❌ Nicht implementiert
```

#### 2.3.4 Offline-Strategie unvollständig

- Service Worker existiert, aber:
  - ❌ IndexedDB-Caching für Notizen fehlt
  - ❌ Conflict Resolution (Last Write Wins) nicht implementiert
  - ❌ Sync-Queue für Offline-Änderungen fehlt

---

## 3. Empfehlungen: Architektur-Korrekturen

### 3.1 Sofortige Maßnahmen (Sprint 1-2)

#### 3.1.1 SSR/CSR-Strategie für Reader

Wie im PDF beschrieben, muss für Reader-Routen SSR deaktiviert werden:

```typescript
// src/routes/reader/[docId]/+page.ts
export const ssr = false;
export const csr = true;
```

#### 3.1.2 API-Struktur erweitern

Aktuelle API (`/api/notes`): Basis vorhanden

Benötigt:
```
/api/
├── notes/
│   ├── [id]/
│   │   ├── +server.ts         ✅ Existiert
│   │   └── versions/+server.ts ❌ Neu
│   └── search/+server.ts       ❌ Neu (Semantic Search)
├── documents/
│   ├── +server.ts              ❌ Neu
│   ├── [id]/
│   │   ├── +server.ts          ❌ Neu
│   │   └── presigned/+server.ts ❌ Neu (S3 URLs)
│   └── upload/+server.ts       ❌ Neu
├── ai/
│   ├── chat/+server.ts         ❌ Neu (SSE Proxy)
│   ├── summarize/+server.ts    ❌ Neu
│   └── tags/+server.ts         ❌ Neu
└── citations/
    └── +server.ts              ❌ Neu
```

#### 3.1.3 Datenbank-Schema erweitern

Empfohlene Ergänzungen basierend auf PDF:

```sql
-- Dokumente
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'epub', 'docx', etc.
    storage_key TEXT NOT NULL, -- S3 key
    file_size BIGINT,
    thumbnail_key TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- für semantische Suche
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zitationen (Citation.js kompatibel)
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    csl_json JSONB NOT NULL, -- CSL-JSON Format
    bibtex TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note-Document Verknüpfung
CREATE TABLE note_citations (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    citation_id UUID NOT NULL REFERENCES citations(id) ON DELETE CASCADE,
    position INTEGER, -- Reihenfolge im Text
    PRIMARY KEY (note_id, citation_id)
);

-- API Keys (verschlüsselt)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'openai', 'anthropic', 'openrouter'
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Mittelfristige Maßnahmen (Sprint 3-6)

#### 3.2.1 PDF.js Integration (Woche 5-7)

Implementierungsstrategie aus dem PDF:

```typescript
// src/lib/components/reader/PDFViewer.svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    let container: HTMLElement;
    let pdfDoc = $state<any>(null);
    let currentPage = $state(1);
    let scale = $state(1.0);
    
    onMount(async () => {
        if (!browser) return;
        
        const pdfjs = await import('pdfjs-dist');
        // Worker-Konfiguration (kritisch!)
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).href;
        
        // ... Rendering-Logik
    });
</script>
```

#### 3.2.2 KI-Proxy mit SSE (Woche 8-10)

```typescript
// src/routes/api/ai/chat/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const { prompt, context } = await request.json();
    const user = locals.user;
    
    // API-Key aus verschlüsselter DB holen
    const apiKey = await getDecryptedApiKey(user.id, 'openrouter');
    
    // Sokratischer System-Prompt
    const systemPrompt = `
        Du bist ein Sokratischer Assistent. Dein Ziel ist NICHT,
        direkte Antworten zu geben, sondern den Nutzer zum Nachdenken
        anzuregen. Stelle Gegenfragen zu Prämissen.
    `;
    
    // SSE Stream
    const stream = new ReadableStream({
        async start(controller) {
            // ... Streaming-Logik
        }
    });
    
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        }
    });
};
```

### 3.3 Langfristige Maßnahmen (Sprint 7+)

#### 3.3.1 Fortgeschrittene KI-Features aus dem PDF

1. **Epistemische Lücken-Analyse**
   - Bibliometrischer Bias-Check
   - Perspektiven-Vakuum-Erkennung

2. **Syntopische Begriffs-Disambiguierung**
   - Semantic Drift Detection
   - Definitionsabgleich User vs. Quelle

3. **Prämissen-Belastungstest**
   - Counterfactual Stability Check
   - Dependency-Graph für Argumente

---

## 4. Priorisierte Roadmap

### Phase 1: Foundation (Wochen 1-4)
| Woche | Task | Abhängigkeiten |
|-------|------|----------------|
| 1-2 | Datenbank-Schema erweitern | - |
| 1-2 | S3/MinIO Integration | Docker-Setup |
| 3-4 | API-Endpunkte für Documents | Schema |
| 3-4 | Editor.js LaTeX-Plugin | - |

### Phase 2: Reader (Wochen 5-10)
| Woche | Task | Abhängigkeiten |
|-------|------|----------------|
| 5-6 | PDF.js Basis-Integration | SSR-Config |
| 6-7 | PDF Text-Layer + Highlighting | PDF.js |
| 8 | EPUB.js Integration | - |
| 9-10 | Citation.js + Literaturverwaltung | Documents API |

### Phase 3: Intelligence (Wochen 11-14)
| Woche | Task | Abhängigkeiten |
|-------|------|----------------|
| 11-12 | KI-Proxy mit SSE | API-Keys Tabelle |
| 12-13 | BYOK Settings UI | Encryption |
| 13-14 | Sokratischer Modus | Proxy |

### Phase 4: Sovereignty (Wochen 15-16)
| Woche | Task | Abhängigkeiten |
|-------|------|----------------|
| 15 | PWA Offline-Strategie | IndexedDB |
| 16 | Sync-Queue + Conflict Resolution | Offline |

---

## 5. Risikobewertung

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Svelte 5 Library-Inkompatibilität | Mittel | Mittel | Headless UI (Bits UI) |
| PDF.js SSR-Konflikte | Hoch | Hoch | `ssr = false` für Reader |
| S3-Kosten bei großen Dateien | Niedrig | Mittel | Presigned URLs, Quotas |
| Komplexität Citation-System | Mittel | Mittel | Iterative Implementierung |

---

## 6. Fazit

Die Architekturanalyse bestätigt:

1. **Der gewählte Tech-Stack ist korrekt** – SvelteKit + PostgreSQL + S3 ist die optimale Wahl für den „Sovereign Stack"

2. **Die Basis-Architektur ist solide** – CSS-System, i18n, Svelte 5 Patterns sind gut implementiert

3. **Kritische Lücken existieren**:
   - Dokumenten-Engine (PDF.js, EPUB.js) fehlt komplett
   - KI-Integration nicht vorhanden
   - Editor-Erweiterungen unvollständig

4. **Die Differenzierung zum Wettbewerb ist klar**:
   - BYOK vs. fest integrierte KI
   - Offline-First vs. Cloud-Only
   - „Produktive Reibung" vs. „Seamlessness"

**Empfehlung**: Priorität auf die Dokumenten-Engine legen – ohne diese ist der akademische USP nicht realisierbar. Die KI-Features können danach schrittweise ergänzt werden.

---

*Dieses Dokument basiert auf der Analyse des PDFs „SaaS-App Machbarkeitsanalyse SvelteKit.pdf" sowie der bestehenden Artellitext-Codebasis.*
