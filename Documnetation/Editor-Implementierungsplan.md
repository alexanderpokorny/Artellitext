# Editor-Implementierungsplan

> **Stand**: 28. Januar 2026  
> **Basis**: SaaS-Machbarkeitsanalyse PDF, Requirements.md, aktueller Code

---

## Übersicht: Editor-Architektur

Der Editor ist das Herzstück von Artellitext. Er basiert auf **Editor.js** und muss um akademische Features erweitert werden.

```
┌─────────────────────────────────────────────────────────────┐
│                    Editor Page Layout                        │
├──────────┬─────────────────────────────────┬────────────────┤
│ Marginalie│         Main Content            │     Tags       │
│ (Special  │         (EB Garamond)           │   (Sidebar)    │
│  Elite)   │                                 │                │
│           │  ┌─────────────────────────┐   │  ┌──────────┐  │
│ ┌───────┐ │  │ Block: Header (H1-H4)   │   │  │ Tag 1    │  │
│ │ Note  │ │  ├─────────────────────────┤   │  │ Tag 2    │  │
│ │ 1     │ │  │ Block: Paragraph        │   │  │ Tag 3    │  │
│ └───────┘ │  ├─────────────────────────┤   │  └──────────┘  │
│           │  │ Block: LaTeX ($$...$$)  │   │                │
│           │  ├─────────────────────────┤   │                │
│           │  │ Block: Code             │   │                │
│           │  ├─────────────────────────┤   │                │
│           │  │ Block: Mermaid          │   │                │
│           │  ├─────────────────────────┤   │                │
│           │  │ Block: Citation [1]     │   │                │
│           │  └─────────────────────────┘   │                │
│           │                                 │                │
│           │  ┌─────────────────────────┐   │                │
│           │  │ Literaturverzeichnis    │   │                │
│           │  │ [1] Autor (2024)...     │   │                │
│           │  └─────────────────────────┘   │                │
└──────────┴─────────────────────────────────┴────────────────┘
```

---

## Phase 1: Basis-Verbesserungen (Woche 1-2)

### 1.1 Editor.js Konfiguration optimieren

**Aktueller Stand** ([editor/+page.svelte](src/routes/editor/+page.svelte)):
- Editor.js Basis vorhanden
- Header, List, Quote, Code Plugins geladen
- onChange Handler implementiert

**Verbesserungen**:

```typescript
// Erweiterte Tool-Konfiguration
const tools = {
  header: {
    class: Header,
    config: {
      placeholder: 'Überschrift eingeben...',
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
    },
    shortcut: 'CMD+SHIFT+H',
  },
  paragraph: {
    class: Paragraph,
    config: {
      placeholder: 'Beginne zu schreiben oder drücke "/" für Befehle...',
    },
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered',
    },
  },
  checklist: {
    class: Checklist,
    inlineToolbar: true,
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: 'Zitat eingeben...',
      captionPlaceholder: 'Quelle',
    },
  },
  delimiter: Delimiter,
  table: {
    class: Table,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3,
    },
  },
};
```

### 1.2 Auto-Save verbessern

```typescript
// Debounced Auto-Save
let saveTimeout: ReturnType<typeof setTimeout>;

async function handleChange() {
  saveStatus = 'unsaved';
  updateWordCount();
  
  // Debounce: 2 Sekunden nach letzter Änderung speichern
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await save();
  }, 2000);
}

// Vor Seitenverlassen warnen
$effect(() => {
  if (!browser) return;
  
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (saveStatus === 'unsaved') {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
});
```

---

## Phase 2: LaTeX-Integration (Woche 3-4)

### 2.1 Custom LaTeX Block Tool

```typescript
// src/lib/editor/tools/MathTool.ts
import katex from 'katex';

interface MathData {
  latex: string;
  displayMode: boolean;
}

export default class MathTool {
  static get toolbox() {
    return {
      title: 'Formel',
      icon: '<svg>...</svg>',
    };
  }

  private data: MathData;
  private wrapper: HTMLElement;
  private input: HTMLTextAreaElement;
  private preview: HTMLElement;

  constructor({ data }: { data: MathData }) {
    this.data = {
      latex: data.latex || '',
      displayMode: data.displayMode !== false,
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('math-block');

    // Eingabefeld
    this.input = document.createElement('textarea');
    this.input.classList.add('math-input');
    this.input.placeholder = 'LaTeX eingeben: z.B. \\frac{a}{b}';
    this.input.value = this.data.latex;
    this.input.addEventListener('input', () => this.updatePreview());

    // Preview
    this.preview = document.createElement('div');
    this.preview.classList.add('math-preview');

    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(this.preview);

    this.updatePreview();
    return this.wrapper;
  }

  private updatePreview(): void {
    try {
      this.preview.innerHTML = katex.renderToString(this.input.value, {
        displayMode: this.data.displayMode,
        throwOnError: false,
      });
      this.preview.classList.remove('math-error');
    } catch (e) {
      this.preview.innerHTML = `<span class="error">Syntax-Fehler</span>`;
      this.preview.classList.add('math-error');
    }
  }

  save(): MathData {
    return {
      latex: this.input.value,
      displayMode: this.data.displayMode,
    };
  }

  static get isReadOnlySupported(): boolean {
    return true;
  }
}
```

### 2.2 Inline Math (via InlineTool)

```typescript
// src/lib/editor/tools/InlineMath.ts
export default class InlineMath {
  static get isInline() {
    return true;
  }

  static get title() {
    return 'Inline-Formel';
  }

  render(): HTMLElement {
    const button = document.createElement('button');
    button.innerHTML = '∑';
    button.type = 'button';
    return button;
  }

  surround(range: Range): void {
    const selectedText = range.extractContents().textContent || '';
    const span = document.createElement('span');
    span.classList.add('inline-math');
    span.dataset.latex = selectedText;
    
    try {
      span.innerHTML = katex.renderToString(selectedText, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      span.textContent = `$${selectedText}$`;
    }
    
    range.insertNode(span);
  }

  checkState(): boolean {
    const selection = window.getSelection();
    if (!selection) return false;
    const anchor = selection.anchorNode?.parentElement;
    return anchor?.classList.contains('inline-math') || false;
  }
}
```

---

## Phase 3: Mermaid-Diagramme (Woche 5)

### 3.1 Mermaid Block Tool

```typescript
// src/lib/editor/tools/MermaidTool.ts
import mermaid from 'mermaid';

interface MermaidData {
  code: string;
}

export default class MermaidTool {
  static get toolbox() {
    return {
      title: 'Diagramm',
      icon: '<svg>...</svg>',
    };
  }

  private data: MermaidData;
  private wrapper: HTMLElement;
  private input: HTMLTextAreaElement;
  private preview: HTMLElement;

  constructor({ data }: { data: MermaidData }) {
    this.data = {
      code: data.code || `graph TD
    A[Start] --> B{Entscheidung}
    B -->|Ja| C[Ergebnis 1]
    B -->|Nein| D[Ergebnis 2]`,
    };
    
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
    });
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('mermaid-block');

    // Code-Editor
    this.input = document.createElement('textarea');
    this.input.classList.add('mermaid-input');
    this.input.value = this.data.code;
    this.input.addEventListener('input', () => this.updatePreview());

    // Preview
    this.preview = document.createElement('div');
    this.preview.classList.add('mermaid-preview');

    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(this.preview);

    this.updatePreview();
    return this.wrapper;
  }

  private async updatePreview(): Promise<void> {
    try {
      const { svg } = await mermaid.render(
        `mermaid-${Date.now()}`,
        this.input.value
      );
      this.preview.innerHTML = svg;
      this.preview.classList.remove('mermaid-error');
    } catch (e) {
      this.preview.innerHTML = `<span class="error">Diagramm-Fehler</span>`;
      this.preview.classList.add('mermaid-error');
    }
  }

  save(): MermaidData {
    return {
      code: this.input.value,
    };
  }
}
```

---

## Phase 4: Marginalien-System (Woche 6-7)

### 4.1 Architektur

Marginalien sind **keine Editor.js Blöcke**, sondern ein separates System, das neben dem Editor existiert.

```
┌────────────────────────────────────────────────┐
│ EditorPage                                      │
│ ┌──────────┬────────────────────┬────────────┐ │
│ │ Marginalia│    Editor.js      │   Tags     │ │
│ │ Container │    Container      │   Panel    │ │
│ │           │                   │            │ │
│ │ ┌───────┐│                    │            │ │
│ │ │Note 1 ││ ← Verknüpft via   │            │ │
│ │ └───────┘│   Block-ID        │            │ │
│ │           │                   │            │ │
│ │ ┌───────┐│                    │            │ │
│ │ │Note 2 ││                    │            │ │
│ │ └───────┘│                    │            │ │
│ └──────────┴────────────────────┴────────────┘ │
└────────────────────────────────────────────────┘
```

### 4.2 Marginalie Komponente

```svelte
<!-- src/lib/components/editor/Marginalia.svelte -->
<script lang="ts">
  interface Marginalia {
    id: string;
    blockId: string;
    content: string;
    top: number;
  }
  
  let { marginalia = $bindable<Marginalia[]>([]) } = $props();
  let editingId = $state<string | null>(null);
  
  function addMarginalia(blockId: string, top: number) {
    const newNote: Marginalia = {
      id: crypto.randomUUID(),
      blockId,
      content: '',
      top,
    };
    marginalia = [...marginalia, newNote];
    editingId = newNote.id;
  }
  
  function updatePosition(id: string, newTop: number) {
    marginalia = marginalia.map(m => 
      m.id === id ? { ...m, top: newTop } : m
    );
  }
</script>

<div class="marginalia-container">
  {#each marginalia as note (note.id)}
    <div 
      class="marginalia-note"
      style="top: {note.top}px"
      class:editing={editingId === note.id}
      draggable="true"
      ondragend={(e) => updatePosition(note.id, e.clientY)}
    >
      {#if editingId === note.id}
        <textarea
          bind:value={note.content}
          onblur={() => editingId = null}
          autofocus
        />
      {:else}
        <div 
          class="marginalia-content"
          onclick={() => editingId = note.id}
        >
          {note.content || 'Klicken zum Bearbeiten...'}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .marginalia-container {
    position: relative;
    width: 150px;
  }
  
  .marginalia-note {
    position: absolute;
    width: 100%;
    font-family: var(--font-typewriter);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    padding: var(--space-2);
    background: var(--color-bg-elevated);
    border-left: 2px solid var(--color-border);
    cursor: grab;
  }
  
  .marginalia-note:hover {
    background: var(--color-bg-hover);
  }
  
  .marginalia-note.editing {
    cursor: auto;
  }
  
  textarea {
    width: 100%;
    min-height: 60px;
    font-family: inherit;
    font-size: inherit;
    background: transparent;
    border: none;
    resize: vertical;
  }
</style>
```

---

## Phase 5: Zitations-System (Woche 8-10)

### 5.1 Citation.js Integration

```typescript
// src/lib/citations/citationManager.ts
import Cite from 'citation-js';

export interface Citation {
  id: string;
  csl: any; // CSL-JSON Format
  bibtex?: string;
  documentId?: string; // Verknüpfung zu PDF
}

export class CitationManager {
  private citations: Map<string, Citation> = new Map();
  
  async addFromBibtex(bibtex: string): Promise<Citation[]> {
    const cite = new Cite(bibtex);
    const cslArray = cite.format('data', { format: 'object' });
    
    return cslArray.map((csl: any) => {
      const citation: Citation = {
        id: csl.id || crypto.randomUUID(),
        csl,
        bibtex,
      };
      this.citations.set(citation.id, citation);
      return citation;
    });
  }
  
  format(ids: string[], style: 'apa' | 'ieee' | 'chicago' = 'apa'): string {
    const cslItems = ids
      .map(id => this.citations.get(id)?.csl)
      .filter(Boolean);
    
    const cite = new Cite(cslItems);
    return cite.format('bibliography', {
      format: 'html',
      template: style,
      lang: 'de-DE',
    });
  }
  
  getReference(id: string, index: number): string {
    return `[${index + 1}]`;
  }
}
```

### 5.2 Literaturverzeichnis Block

```typescript
// src/lib/editor/tools/BibliographyTool.ts
export default class BibliographyTool {
  static get toolbox() {
    return {
      title: 'Literaturverzeichnis',
      icon: '<svg>...</svg>',
    };
  }

  private citationIds: string[];
  private style: 'apa' | 'ieee' | 'chicago';
  private manager: CitationManager;

  constructor({ data, api, config }) {
    this.citationIds = data.citationIds || [];
    this.style = data.style || 'apa';
    this.manager = config.citationManager;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('bibliography-block');
    
    const header = document.createElement('h3');
    header.textContent = 'Literaturverzeichnis';
    wrapper.appendChild(header);
    
    const list = document.createElement('div');
    list.classList.add('bibliography-list');
    list.innerHTML = this.manager.format(this.citationIds, this.style);
    wrapper.appendChild(list);
    
    return wrapper;
  }

  save() {
    return {
      citationIds: this.citationIds,
      style: this.style,
    };
  }
}
```

### 5.3 Inline Zitation

```typescript
// src/lib/editor/tools/CitationInline.ts
export default class CitationInline {
  static get isInline() {
    return true;
  }

  private manager: CitationManager;
  
  render(): HTMLElement {
    const button = document.createElement('button');
    button.innerHTML = '[1]';
    button.type = 'button';
    button.onclick = () => this.showCitationPicker();
    return button;
  }

  private showCitationPicker(): void {
    // Modal öffnen mit verfügbaren Zitationen
    // Bei Auswahl: insertCitation() aufrufen
  }

  private insertCitation(citationId: string, index: number): void {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.classList.add('citation-ref');
    span.dataset.citationId = citationId;
    span.textContent = `[${index + 1}]`;
    
    range.insertNode(span);
  }

  checkState(): boolean {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode?.parentElement;
    return anchor?.classList.contains('citation-ref') || false;
  }
}
```

---

## Phase 6: Referenz-Panel (Woche 11)

### 6.1 Referenz-Seitenpanel

```svelte
<!-- src/lib/components/editor/ReferencePanel.svelte -->
<script lang="ts">
  import type { Citation } from '$lib/citations/citationManager';
  
  let { 
    citations = $bindable<Citation[]>([]),
    style = $bindable<'apa' | 'ieee' | 'chicago'>('apa'),
    open = $bindable(false)
  } = $props();
  
  let searchQuery = $state('');
  
  const filteredCitations = $derived(
    citations.filter(c => 
      JSON.stringify(c.csl).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

{#if open}
  <aside class="reference-panel">
    <header class="panel-header">
      <h3>Quellen</h3>
      <button onclick={() => open = false}>×</button>
    </header>
    
    <div class="panel-controls">
      <input 
        type="search"
        placeholder="Suchen..."
        bind:value={searchQuery}
      />
      
      <select bind:value={style}>
        <option value="apa">APA</option>
        <option value="ieee">IEEE</option>
        <option value="chicago">Chicago</option>
      </select>
    </div>
    
    <div class="citation-list">
      {#each filteredCitations as citation, i (citation.id)}
        <div class="citation-item">
          <span class="citation-number">[{i + 1}]</span>
          <div class="citation-content">
            <strong>{citation.csl.title}</strong>
            <span class="citation-author">
              {citation.csl.author?.map(a => a.family).join(', ')}
            </span>
            <span class="citation-year">
              ({citation.csl.issued?.['date-parts']?.[0]?.[0]})
            </span>
          </div>
          <button 
            class="insert-btn"
            onclick={() => insertCitation(citation.id, i)}
          >
            Einfügen
          </button>
        </div>
      {/each}
    </div>
    
    <footer class="panel-footer">
      <button class="add-citation-btn">
        + Neue Quelle
      </button>
    </footer>
  </aside>
{/if}
```

---

## CSS für Editor-Erweiterungen

```css
/* In app.css ergänzen */

/* ===========================================
   EDITOR TOOLS - Math, Mermaid, Citations
   =========================================== */

/* Math Blocks */
.math-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
}

.math-input {
  font-family: var(--font-machine);
  font-size: var(--font-size-sm);
  padding: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  resize: vertical;
  min-height: 60px;
}

.math-preview {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--font-size-lg);
}

.math-preview.math-error {
  color: var(--color-error);
}

/* Inline Math */
.inline-math {
  display: inline;
  padding: 0 var(--space-1);
}

/* Mermaid Blocks */
.mermaid-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-sunken);
  border-radius: var(--radius-md);
}

.mermaid-input {
  font-family: var(--font-machine);
  font-size: var(--font-size-xs);
  padding: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  min-height: 100px;
  resize: vertical;
}

.mermaid-preview {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}

.mermaid-preview svg {
  max-width: 100%;
  height: auto;
}

/* Citations */
.citation-ref {
  color: var(--color-link);
  cursor: pointer;
  font-weight: 600;
}

.citation-ref:hover {
  text-decoration: underline;
}

/* Bibliography */
.bibliography-block {
  padding: var(--space-6);
  border-top: 2px solid var(--color-border);
  margin-top: var(--space-8);
}

.bibliography-block h3 {
  font-family: var(--font-human);
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-4);
}

.bibliography-list {
  font-family: var(--font-human);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

/* Reference Panel */
.reference-panel {
  position: fixed;
  right: 0;
  top: var(--header-height);
  width: 320px;
  height: calc(100vh - var(--header-height) - var(--footer-height));
  background: var(--color-bg-sidebar);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-fixed);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.panel-controls {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
}

.citation-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.citation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.citation-number {
  font-family: var(--font-machine);
  font-weight: 600;
  color: var(--color-link);
}
```

---

## Abhängigkeiten installieren

```bash
# Editor-Tools
pnpm add @editorjs/editorjs @editorjs/header @editorjs/list @editorjs/quote @editorjs/code @editorjs/delimiter @editorjs/table @editorjs/checklist

# Math
pnpm add katex
pnpm add -D @types/katex

# Diagrams
pnpm add mermaid

# Citations
pnpm add citation-js
```

---

## Zusammenfassung Timeline

| Phase | Wochen | Deliverables |
|-------|--------|--------------|
| 1 | 1-2 | Editor.js optimiert, Auto-Save |
| 2 | 3-4 | LaTeX Block + Inline |
| 3 | 5 | Mermaid Diagramme |
| 4 | 6-7 | Marginalien-System |
| 5 | 8-10 | Citation.js + Literaturverzeichnis |
| 6 | 11 | Referenz-Panel |

**Gesamtdauer**: ~11 Wochen für vollständige Editor-Erweiterung

---

*Dieser Plan kann je nach Priorisierung angepasst werden. Die LaTeX- und Zitations-Features sind für den akademischen USP kritisch.*
