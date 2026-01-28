# Artellitext – Epistemische & Sokratische KI-Features

> **Dokument-Typ**: Strategische Feature-Analyse mit ROI-basierter Priorisierung  
> **Erstellt**: 28. Januar 2026  
> **Grundlage**: SaaS-Machbarkeitsanalyse PDF, philosophische Epistemologie, akademische Schreibpraxis  
> **Ziel**: Artellitext als führende „Epistemische KI" für kognitive Souveränität positionieren

---

## Executive Summary

Dieses Dokument definiert die **KI-Features, die Artellitext fundamental von generativen KI-Tools abheben**. Der Fokus liegt auf:

1. **Sokratischer Methodik**: Fragen statt Antworten – Dialektik statt Autovervollständigung
2. **Epistemischer Integrität**: Wissen validieren, nicht generieren
3. **Kognitiver Souveränität**: Der Mensch bleibt Autor, die KI ist Gesprächspartner

### Philosophische Grundlage

> „Ich weiß, dass ich nichts weiß" (Sokrates)

Im Gegensatz zu ChatGPT/Claude-Assistenten, die „alles wissen" vorgeben, soll Artellitext:
- **Unwissen explizit machen** (Epistemische Lücken aufzeigen)
- **Fragen provozieren** (Sokratische Maieutik)
- **Argumente prüfen** (Toulmin-Modell, Adversarial Review)
- **Denken verlangsamen** (Produktive Reibung)

---

## Feature-Kategorien

```
┌────────────────────────────────────────────────────────────────────┐
│                    EPISTEMISCHE KI-ARCHITEKTUR                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  SOKRATISCHER   │  │   ADVERSARIAL   │  │   SEMANTISCHE   │   │
│  │     DIALOG      │  │     PRÜFUNG     │  │     ANALYSE     │   │
│  │                 │  │                 │  │                 │   │
│  │ • Gegenfragen   │  │ • Reviewer 2    │  │ • Begriffs-Drift│   │
│  │ • Maieutik      │  │ • Devil's Adv.  │  │ • Lücken-Erken. │   │
│  │ • Implikationen │  │ • Prämissen-Test│  │ • Bias-Analyse  │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│           │                    │                    │             │
│           └────────────────────┼────────────────────┘             │
│                                │                                  │
│                    ┌───────────▼───────────┐                     │
│                    │    GRAPH-RAG HYBRID   │                     │
│                    │  • Inferenz-Ketten    │                     │
│                    │  • Zitat-Tracking     │                     │
│                    │  • Confidence Scores  │                     │
│                    └───────────────────────┘                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Tier 1: Kernfeatures (P0 – MVP-kritisch)

### SK-001: Sokratischer System-Prompt

**Beschreibung**: Der fundamentale Prompt, der alle KI-Interaktionen in Artellitext steuert.

**Prinzipien**:
1. **Niemals direkte Antworten** auf offene Fragen
2. **Immer Gegenfragen** zur Präzisierung
3. **Explizite Unsicherheit** kommunizieren („Ich bin mir nicht sicher, ob...")
4. **Quellen einfordern** („Worauf basiert diese Annahme?")

**System-Prompt (Referenzimplementierung)**:
```
Du bist ein sokratischer Gesprächspartner, kein Assistent.

KERNPRINZIPIEN:
1. FRAGEN > ANTWORTEN: Stelle klärende Fragen, bevor du antwortest
2. UNWISSEN ZEIGEN: Sage explizit, wenn du etwas nicht weißt
3. IMPLIKATIONEN PRÜFEN: „Was würde das bedeuten, wenn..."
4. QUELLEN VERLANGEN: „Auf welche Evidenz stützt du das?"
5. ALTERNATIVEN ANBIETEN: „Hast du auch X in Betracht gezogen?"

VERBOTEN:
- Direkte Zusammenfassungen ohne Rückfrage
- Generierung von Inhalten ohne explizite Aufforderung
- Aussagen ohne Confidence-Einschätzung
- Komplettierung von Sätzen/Gedanken

FORMAT:
- Beginne jede Antwort mit einer Frage oder Reflexion
- Ende mit offenen Punkten zum Weiterdenken
- Nutze Bayesian Confidence: „Mit ~70% Sicherheit würde ich sagen..."
```

**Aufwand**: 🟢 Niedrig (Prompt-Engineering, kein Code)  
**Kundennutzen**: 🔴 Hoch (Kernunterscheidung zu ChatGPT)  
**ROI-Score**: ⭐⭐⭐⭐⭐ (5/5)

---

### SK-002: Maieutik-Modus für Editor

**Beschreibung**: KI generiert keine Texte, sondern stellt Fragen zu geschriebenem Text.

**Beispiel-Interaktion**:
```
USER schreibt: "Die Klimakrise erfordert sofortige Maßnahmen."

KI-Antwort (Maieutik):
- Was verstehst du unter „sofort"? Welchen Zeithorizont meinst du?
- Welche „Maßnahmen" hast du im Sinn? Politische, technologische, individuelle?
- Für wen „erfordert" die Krise Maßnahmen? Wer definiert das?
- Welche Gegenposition könnte jemand zu dieser These einnehmen?
```

**Implementation**:
```typescript
// Inline-Trigger: Nutzer markiert Text und wählt "Hinterfragen"
const maieutikPrompt = `
Analysiere folgenden Text und stelle 3-5 klärende Fragen.
Fokussiere auf:
- Implizite Annahmen
- Unklare Begriffe
- Fehlende Belege
- Logische Sprünge

Text: "${selectedText}"

Antworte NUR mit Fragen, keine Behauptungen.
`;
```

**Aufwand**: 🟢 Niedrig (Prompt + UI-Button)  
**Kundennutzen**: 🔴 Hoch (Schreibprozess-Verbesserung)  
**ROI-Score**: ⭐⭐⭐⭐⭐ (5/5)

---

### SK-003: Implikations-Analyse

**Beschreibung**: KI zeigt logische Konsequenzen einer Aussage auf.

**Beispiel**:
```
USER: "Alle Menschen sind gleich."

KI-Analyse (Implikationen):
→ WENN alle Menschen gleich sind, DANN...
  • ...müssten Unterschiede in Talent/Fähigkeit konstruiert sein
  • ...wäre jede Form von Leistungsmessung problematisch
  • ...müsste Gleichbehandlung zu gleichen Ergebnissen führen

→ ABER gleichzeitig gilt:
  • Menschen unterscheiden sich empirisch (Genetik, Umfeld)
  • „Gleich" kann „gleich an Würde" oder „gleich an Fähigkeiten" bedeuten

→ DAHER: Präzisiere, welche Art von Gleichheit du meinst.
```

**Aufwand**: 🟡 Mittel (Prompt + strukturiertes Output-Parsing)  
**Kundennutzen**: 🔴 Hoch (Argumentationsqualität)  
**ROI-Score**: ⭐⭐⭐⭐ (4/5)

---

## Tier 2: Differenzierende Features (P1 – Core)

### ADV-001: „Reviewer 2" Adversarial Mode

**Beschreibung**: KI nimmt die Rolle eines kritischen Gutachters ein (der berüchtigte „Reviewer 2" aus akademischen Journals).

**Modi**:
| Modus | Strenge | Anwendung |
|-------|---------|-----------|
| Constructive Critic | Mild | Frühe Entwürfe |
| Skeptical Reviewer | Mittel | Überarbeitung |
| **Reviewer 2** | Hart | Finale Prüfung |
| Devil's Advocate | Extrem | Stresstest |

**System-Prompt (Reviewer 2)**:
```
Du bist "Reviewer 2" – der gefürchtetste Gutachter in akademischen Journals.

DEINE AUFGABE:
1. Finde JEDE logische Schwäche im Argument
2. Hinterfrage JEDE unbelegte Behauptung
3. Fordere Evidenz für ALLE Aussagen
4. Zeige methodische Mängel auf
5. Identifiziere, was FEHLT (nicht nur was falsch ist)

TON: Sachlich-kritisch, nicht beleidigend
FORMAT: Nummerierte Liste der Kritikpunkte mit Schweregrad (Major/Minor)

WICHTIG: Du bist NICHT hier, um zu loben. Jeder Text hat Schwächen – finde sie.
```

**Aufwand**: 🟢 Niedrig (Prompt-Variation)  
**Kundennutzen**: 🔴 Hoch (Akademiker lieben/fürchten das)  
**ROI-Score**: ⭐⭐⭐⭐⭐ (5/5)

---

### ADV-002: Toulmin-Argumentationsanalyse

**Beschreibung**: Zerlegt Argumente in ihre Bestandteile nach dem Toulmin-Modell.

**Toulmin-Schema**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    TOULMIN-ARGUMENTMODELL                       │
│                                                                 │
│   DATA (Grund)          WARRANT (Regel)          CLAIM (These) │
│   ┌─────────┐          ┌─────────────┐          ┌───────────┐  │
│   │ Fakten, │────so────│ Allgemeine  │────also──│ Behaup-   │  │
│   │ Evidenz │          │ Schlussregel│          │ tung      │  │
│   └─────────┘          └──────┬──────┘          └───────────┘  │
│                               │                                 │
│                        BACKING (Stützung)                       │
│                        ┌─────────────┐                         │
│                        │ Begründung  │                         │
│                        │ der Regel   │                         │
│                        └─────────────┘                         │
│                               │                                 │
│   QUALIFIER (Einschränkung)   │   REBUTTAL (Widerlegung)       │
│   ┌───────────────────┐       │   ┌───────────────────┐        │
│   │ „vermutlich",     │       └───│ Ausnahmen, Gegen- │        │
│   │ „in den meisten   │           │ beispiele         │        │
│   │ Fällen"           │           └───────────────────┘        │
│   └───────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Beispiel-Output**:
```json
{
  "claim": "Wir sollten Remote Work fördern",
  "data": "Studien zeigen 15% höhere Produktivität",
  "warrant": "Was Produktivität steigert, sollte gefördert werden",
  "backing": "Unternehmensziel ist Produktivitätsmaximierung",
  "qualifier": "In wissensbasierten Berufen",
  "rebuttal": "Gilt nicht für Teambuilding-intensive Phasen",
  "strength": "Moderately Strong",
  "gaps": [
    "Welche Studien? Methodische Qualität?",
    "Ist Produktivität der einzige Wert?",
    "Was ist mit Langzeit-Effekten auf Unternehmenskultur?"
  ]
}
```

**Aufwand**: 🟡 Mittel (Strukturierte Prompts + JSON-Schema)  
**Kundennutzen**: 🟠 Hoch (Akademisch extrem wertvoll)  
**ROI-Score**: ⭐⭐⭐⭐ (4/5)

---

### SEM-001: Epistemische Lücken-Analyse

**Beschreibung**: Identifiziert, was in einem Text NICHT gesagt wird, aber relevant wäre.

**Konzept**: „Negative Knowledge Discovery" – Wissen über Unwissen

**Analyse-Dimensionen**:
1. **Fehlende Perspektiven**: Wessen Stimme fehlt?
2. **Unbeantwortete Fragen**: Was bleibt offen?
3. **Implizite Annahmen**: Was wird als selbstverständlich vorausgesetzt?
4. **Methodische Lücken**: Wie wurde (nicht) untersucht?
5. **Temporale Lücken**: Welche Zeiträume fehlen?

**Beispiel-Output**:
```markdown
## Epistemische Lücken in: "Analyse der Digitalisierung in Schulen"

### 🔴 Fehlende Perspektiven
- Schülerperspektive kaum vertreten (nur Lehrer/Admins)
- Keine Elternstimmen
- Datenschutzbeauftragte nicht erwähnt

### 🟠 Unbeantwortete Fragen
- Wie verhält sich Bildschirmzeit zur Konzentrationsfähigkeit?
- Welche Langzeiteffekte auf Lernverhalten?
- Kostenvergleich: Digital vs. traditionell?

### 🟡 Implizite Annahmen
- "Digitalisierung = Fortschritt" wird nicht hinterfragt
- Technische Kompetenz der Lehrer wird vorausgesetzt
- Infrastruktur wird als gegeben angenommen

### 📊 Konfidenz der Lücken-Erkennung: 78%
```

**Aufwand**: 🟡 Mittel (Komplexer Prompt, strukturiertes Output)  
**Kundennutzen**: 🔴 Hoch (Einzigartig im Markt)  
**ROI-Score**: ⭐⭐⭐⭐ (4/5)

---

### SEM-002: Syntopische Begriffs-Disambiguierung

**Beschreibung**: Erkennt, wenn derselbe Begriff in verschiedenen Quellen unterschiedlich verwendet wird.

**Problem**: „Freiheit" bei Kant ≠ „Freiheit" bei Hayek ≠ „Freiheit" in der Werbebranche

**Beispiel-Workflow**:
```
1. User hat 5 PDFs zum Thema "Nachhaltigkeit" geladen
2. System analysiert Begriff "Nachhaltigkeit" in allen Dokumenten
3. Output: Begriffsnetz mit Bedeutungsvarianten

┌─────────────────────────────────────────────────────────────────┐
│           BEGRIFFS-DISAMBIGUIERUNG: "Nachhaltigkeit"           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Dokument A (Brundtland-Report, 1987):                        │
│   └─ "Entwicklung, die Bedürfnisse der Gegenwart befriedigt,   │
│       ohne künftige Generationen zu gefährden"                 │
│   → Fokus: Intergenerationale Gerechtigkeit                    │
│                                                                 │
│   Dokument B (Corporate Sustainability Report):                 │
│   └─ "Langfristige wirtschaftliche Tragfähigkeit"              │
│   → Fokus: Business Continuity                                 │
│                                                                 │
│   Dokument C (Ökologische Studie):                             │
│   └─ "Erhalt ökosystemarer Gleichgewichte"                     │
│   → Fokus: Biodiversität, Klimastabilität                      │
│                                                                 │
│   ⚠️ WARNUNG: Begriffsverwendung inkompatibel!                 │
│   Ohne Klärung führt Argumentation zu Äquivokation.            │
└─────────────────────────────────────────────────────────────────┘
```

**Aufwand**: 🔴 Hoch (Embedding-Analyse, Cross-Document-Vergleich)  
**Kundennutzen**: 🔴 Hoch (Wissenschaftlich sehr relevant)  
**ROI-Score**: ⭐⭐⭐ (3/5) – Aufwand reduziert ROI

---

### SEM-003: Semantic Drift Detection

**Beschreibung**: Erkennt, wenn ein Begriff innerhalb eines Textes seine Bedeutung schleicht verändert.

**Beispiel**:
```
Absatz 1: "Intelligenz zeigt sich in Problemlösefähigkeit"
Absatz 5: "Intelligenz ist genetisch determiniert"
→ WARNUNG: "Intelligenz" hat zwischen Absatz 1 und 5 
   die Bedeutung von "Fähigkeit" zu "Anlage" verschoben.
```

**Implementation**: 
- Embedding-Vergleich desselben Begriffs an verschiedenen Stellen
- Cosine-Similarity unter Schwellwert = Drift

**Aufwand**: 🟡 Mittel (Embedding + Tracking)  
**Kundennutzen**: 🟠 Mittel-Hoch (Nischenfeature für Akademiker)  
**ROI-Score**: ⭐⭐⭐ (3/5)

---

## Tier 3: Fortgeschrittene Features (P2 – Enhancement)

### ADV-003: Prämissen-Belastungstest (Counterfactual Stability)

**Beschreibung**: Testet, ob ein Argument auch unter veränderten Prämissen hält.

**Methodik**:
1. Extrahiere Kernprämissen
2. Invertiere/modifiziere jede Prämisse einzeln
3. Prüfe, ob Schlussfolgerung noch gültig

**Beispiel**:
```
Original-Argument:
"Demokratie ist das beste System, weil Menschen rational entscheiden."

Prämissen-Test:
✗ "Wenn Menschen NICHT rational entscheiden..."
  → Hält das Argument? NEIN
  → Kritische Abhängigkeit erkannt!

Alternative Prämisse vorgeschlagen:
"Demokratie ist robust, weil sie Korrekturen durch Wahlen ermöglicht"
→ Weniger abhängig von Rationalitätsannahme
```

**Aufwand**: 🟡 Mittel (Prompt-Chain + Logik-Prüfung)  
**Kundennutzen**: 🟠 Mittel (Philosophisch wertvoll, Nische)  
**ROI-Score**: ⭐⭐⭐ (3/5)

---

### SEM-004: Bibliometrischer Bias-Check

**Beschreibung**: Analysiert die Zitationsstruktur auf systematische Verzerrungen.

**Prüfungen**:
| Bias-Typ | Beschreibung | Warnung |
|----------|--------------|---------|
| **Gender Bias** | Überrepräsentation männlicher Autoren | ⚠️ 85% männliche Erstautoren |
| **Geographical Bias** | Dominanz bestimmter Regionen | ⚠️ 90% US/UK-zentriert |
| **Temporal Bias** | Veraltete Quellen | ⚠️ 60% älter als 10 Jahre |
| **Citation Cartel** | Selbstreferenz-Cluster | ⚠️ 3 Autoren zitieren nur sich |
| **Paradigmatic Bias** | Einseitige Theorieschulen | ⚠️ Nur quantitative Studien |

**Aufwand**: 🔴 Hoch (Metadaten-Analyse, Statistik)  
**Kundennutzen**: 🟠 Mittel (Akademisch relevant, aber Nische)  
**ROI-Score**: ⭐⭐ (2/5)

---

### RAG-001: Graph-RAG Hybrid für Inferenz-Ketten

**Beschreibung**: Kombiniert Vector-RAG mit Knowledge-Graph für nachvollziehbare Schlüsse.

**Unterschied zu Standard-RAG**:
```
Standard-RAG:
  Query → Embedding → Nearest Chunks → LLM → Answer
  Problem: "Black Box" – woher kommt die Antwort?

Graph-RAG Hybrid:
  Query → Embedding → Chunks + Graph-Relationen → LLM → Answer + Inferenz-Pfad
  Vorteil: Nachvollziehbare Argumentationskette
```

**Beispiel**:
```
Query: "Ist Remote Work gut für die Produktivität?"

Graph-RAG Output:
Answer: "Die Evidenz ist gemischt."

Inferenz-Pfad:
1. [Quelle A, S.45] "Produktivität stieg um 15% bei Senior-Entwicklern"
   ↓ ABER
2. [Quelle B, S.12] "Junior-Mitarbeiter zeigten 20% weniger Output"
   ↓ UND
3. [Quelle C, S.78] "Langfristige Innovation sank um 30%"
   ↓ DAHER
4. [Synthese] "Kurzfristig positiv, langfristig fraglich"

Konfidenz: 65% (Studien methodisch heterogen)
```

**Aufwand**: 🔴 Hoch (Graph-DB, komplexe Pipeline)  
**Kundennutzen**: 🟠 Mittel-Hoch (Differenzierend, aber komplex zu verstehen)  
**ROI-Score**: ⭐⭐ (2/5)

---

### RAG-002: Bayesian Confidence Scoring

**Beschreibung**: Jede KI-Aussage erhält einen probabilistischen Konfidenzwert.

**Faktoren**:
```
Confidence = f(
  source_quality,     # Wie valide sind die Quellen?
  source_agreement,   # Stimmen Quellen überein?
  query_specificity,  # Wie präzise ist die Frage?
  knowledge_coverage, # Wie gut deckt RAG das Thema ab?
  temporal_relevance  # Wie aktuell sind die Informationen?
)
```

**Output-Format**:
```
"Mit einer Konfidenz von 73% lässt sich sagen, dass..."

Konfidenz-Aufschlüsselung:
• Quellenqualität: 80% (3 peer-reviewed Studien)
• Quellenübereinstimmung: 60% (1 abweichende Studie)
• Themenabdeckung: 85% (gute RAG-Coverage)
• Aktualität: 70% (älteste Quelle: 2019)
```

**Aufwand**: 🟡 Mittel (Scoring-System implementieren)  
**Kundennutzen**: 🟠 Mittel (Wissenschaftlich korrekt, aber komplex)  
**ROI-Score**: ⭐⭐⭐ (3/5)

---

## Tier 4: Visionäre Features (P3 – Nice-to-have)

### VIS-001: Epistemische Kartographie

**Beschreibung**: Visualisiert das „Wissensgelände" zu einem Thema – inklusive Wissenslücken.

**Konzept**: Eine Karte, die zeigt:
- 🟢 Gut erforschte Bereiche
- 🟡 Umstrittene Gebiete
- 🔴 Terra Incognita (Wissenslücken)

**Aufwand**: 🔴 Sehr Hoch (Visualisierung, komplexe Analyse)  
**Kundennutzen**: 🟢 Niedrig-Mittel (Wow-Effekt, aber Nische)  
**ROI-Score**: ⭐ (1/5)

---

### VIS-002: Argumentationsfluss-Diagramm

**Beschreibung**: Automatische Visualisierung der Argumentstruktur eines Textes.

**Output**: Mermaid/D3.js Diagramm mit:
- Thesen als Knoten
- Stützungen als Kanten
- Widersprüche als rot markierte Konflikte

**Aufwand**: 🔴 Hoch (NLP + Visualisierung)  
**Kundennutzen**: 🟠 Mittel (Akademisch interessant)  
**ROI-Score**: ⭐⭐ (2/5)

---

## Priorisierungsmatrix

### ROI-basierte Priorisierung (Aufwand vs. Nutzen)

```
            │ Kundennutzen
            │ HOCH                  │ MITTEL               │ NIEDRIG
────────────┼───────────────────────┼──────────────────────┼─────────────────
Aufwand     │                       │                      │
NIEDRIG     │ ⭐⭐⭐⭐⭐ SOFORT      │ ⭐⭐⭐⭐ BALD         │ ⭐⭐⭐ OPTIONAL
            │ • SK-001 Sokrat.Prompt│ • RAG-002 Confidence │
            │ • SK-002 Maieutik     │                      │
            │ • ADV-001 Reviewer 2  │                      │
────────────┼───────────────────────┼──────────────────────┼─────────────────
MITTEL      │ ⭐⭐⭐⭐ BALD         │ ⭐⭐⭐ SPÄTER         │ ⭐⭐ OPTIONAL
            │ • SK-003 Implikationen│ • ADV-003 Prämissen  │ • VIS-002 Arg.Fluss
            │ • ADV-002 Toulmin     │ • SEM-003 Drift      │
            │ • SEM-001 Lücken      │                      │
────────────┼───────────────────────┼──────────────────────┼─────────────────
HOCH        │ ⭐⭐⭐ SPÄTER         │ ⭐⭐ BACKLOG          │ ⭐ PARKEN
            │ • SEM-002 Disambig.   │ • SEM-004 Bias-Check │ • VIS-001 Karto.
            │                       │ • RAG-001 Graph-RAG  │
```

---

## Implementierungs-Roadmap

### Phase 1: Foundation (Woche 1-4)

| Feature | ID | Aufwand | Abhängigkeiten |
|---------|-----|---------|----------------|
| Sokratischer System-Prompt | SK-001 | 2 Tage | KI-Proxy (AI-001) |
| Maieutik-Modus | SK-002 | 3 Tage | SK-001, Editor-Integration |
| Reviewer 2 Mode | ADV-001 | 2 Tage | SK-001 |

**Deliverable**: Erste differenzierende KI-Erfahrung im Editor

### Phase 2: Argumentation (Woche 5-8)

| Feature | ID | Aufwand | Abhängigkeiten |
|---------|-----|---------|----------------|
| Implikations-Analyse | SK-003 | 5 Tage | SK-001 |
| Toulmin-Analyse | ADV-002 | 7 Tage | SK-001, JSON-Schema |
| Epistemische Lücken | SEM-001 | 7 Tage | SK-001 |

**Deliverable**: Vollständiges Argumentations-Toolkit

### Phase 3: Semantik (Woche 9-14)

| Feature | ID | Aufwand | Abhängigkeiten |
|---------|-----|---------|----------------|
| Begriffs-Disambiguierung | SEM-002 | 14 Tage | pgvector, Multi-Doc-RAG |
| Semantic Drift Detection | SEM-003 | 7 Tage | Embeddings im Editor |
| Confidence Scoring | RAG-002 | 7 Tage | RAG-Grundsystem |

**Deliverable**: Semantische Intelligenz über Dokumente hinweg

### Phase 4: Advanced (Woche 15+)

| Feature | ID | Aufwand | Abhängigkeiten |
|---------|-----|---------|----------------|
| Prämissen-Belastungstest | ADV-003 | 10 Tage | ADV-002 |
| Bibliometrischer Bias | SEM-004 | 14 Tage | Citation.js, Metadaten |
| Graph-RAG Hybrid | RAG-001 | 21 Tage | pgvector, Graph-DB |

**Deliverable**: Wissenschaftlich führende KI-Analyse

---

## Technische Anforderungen

### Backend-Anforderungen

```typescript
// Neue API-Endpunkte
/api/ai/
├── socratic/+server.ts      // Sokratischer Dialog
│   └── POST: { text, mode: 'maieutic' | 'reviewer' | 'implication' }
├── analyze/+server.ts       // Strukturierte Analyse
│   └── POST: { text, type: 'toulmin' | 'gaps' | 'premises' }
├── semantic/+server.ts      // Semantische Features
│   └── POST: { documents[], term, type: 'disambiguate' | 'drift' }
└── confidence/+server.ts    // Confidence Scoring
    └── POST: { query, sources[] }
```

### Datenbank-Erweiterungen

```sql
-- Epistemische Analyse-Ergebnisse cachen
CREATE TABLE epistemics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    note_id UUID REFERENCES notes(id),
    analysis_type TEXT NOT NULL, -- 'toulmin', 'gaps', 'drift', etc.
    input_hash TEXT NOT NULL, -- Hash des analysierten Texts
    result JSONB NOT NULL,
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Wiederverwendung
CREATE INDEX idx_epistemics_hash ON epistemics(input_hash);
```

### Frontend-Komponenten

```svelte
<!-- Neue UI-Komponenten -->
<SocraticPanel mode="maieutic" />
<ReviewerMode severity="reviewer2" />
<ToulminDiagram argument={analysisResult} />
<EpistemicGapsCard gaps={gapsAnalysis} />
<ConfidenceBadge score={0.73} breakdown={factors} />
<SemanticDriftWarning term="Nachhaltigkeit" drift={driftData} />
```

---

## Marketing-Positionierung

### Messaging

> **Artellitext**: Die KI, die Fragen stellt statt Antworten generiert.

**Taglines**:
- „Denken vertiefen, nicht ersetzen"
- „Dein kritischer Gesprächspartner, nicht dein Ghostwriter"
- „Wissen validieren statt halluzinieren"

### Zielgruppen-Ansprache

| Zielgruppe | Pain Point | Artellitext-Lösung |
|------------|------------|-------------------|
| **Doktoranden** | „Mein Gutachter zerreißt mich" | Reviewer 2 Mode zur Vorbereitung |
| **Wissenschaftler** | „Ich übersehe blinde Flecken" | Epistemische Lücken-Analyse |
| **Philosophen** | „Begriffe verschwimmen" | Begriffs-Disambiguierung |
| **Journalisten** | „Ich brauche kritisches Feedback" | Sokratischer Dialog |
| **Studenten** | „Meine Argumente sind schwach" | Toulmin-Analyse |

---

## Zusammenfassung: Top 10 Features nach ROI

| Rang | Feature | ID | ROI | Sprint |
|------|---------|-----|-----|--------|
| 1 | Sokratischer System-Prompt | SK-001 | ⭐⭐⭐⭐⭐ | 1 |
| 2 | Maieutik-Modus | SK-002 | ⭐⭐⭐⭐⭐ | 1 |
| 3 | Reviewer 2 Mode | ADV-001 | ⭐⭐⭐⭐⭐ | 1 |
| 4 | Implikations-Analyse | SK-003 | ⭐⭐⭐⭐ | 2 |
| 5 | Toulmin-Argumentationsanalyse | ADV-002 | ⭐⭐⭐⭐ | 2 |
| 6 | Epistemische Lücken-Analyse | SEM-001 | ⭐⭐⭐⭐ | 2 |
| 7 | Bayesian Confidence Scoring | RAG-002 | ⭐⭐⭐ | 3 |
| 8 | Semantic Drift Detection | SEM-003 | ⭐⭐⭐ | 3 |
| 9 | Prämissen-Belastungstest | ADV-003 | ⭐⭐⭐ | 3 |
| 10 | Begriffs-Disambiguierung | SEM-002 | ⭐⭐⭐ | 4 |

---

## Nächste Schritte

1. **GitHub Issues erstellen** für Phase 1 Features (SK-001, SK-002, ADV-001)
2. **System-Prompt Library** aufbauen mit Varianten
3. **A/B-Test-Framework** für Prompt-Optimierung
4. **User Research** mit Zielgruppe zu den Modi

---

*Dieses Dokument definiert die epistemische Seele von Artellitext. Es ist das, was die App einzigartig macht.*

*Letzte Aktualisierung: 28. Januar 2026*
