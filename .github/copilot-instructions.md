# Copilot-Prinzipien – Allgemeine Entwicklungsrichtlinien

Dieses Dokument enthält allgemeine Entwicklungsprinzipien, die bei der KI-gestützten Entwicklung zu beachten sind.  

## 0. Git-Workflow (PFLICHT)

### Nach jedem Prompt committen und pushen
> **KRITISCH**: Nach **jedem abgeschlossenen Prompt** einen Commit und Push durchführen.

```bash
git add -A
git commit -m "Kurze Beschreibung der Änderungen"
git push
```

### Datenbank-Sync
> **WICHTIG**: Die Entwicklungsdatenbank wird automatisch via Git synchronisiert.

**Einmalige Einrichtung (neuer Computer):**
```bash
./scripts/db-sync.sh install-hooks
```

**Automatischer Ablauf:**
- **Pre-Push Hook**: Erstellt automatisch ein DB-Backup vor jedem Push
- **Post-Merge Hook**: Zeigt Hinweis nach Pull, wenn neues Backup vorhanden

**Bei Problemen oder nach Pull mit DB-Änderungen:**
```bash
./scripts/db-sync.sh restore
```

### Commit-Message-Konvention
- **Milestone-Commits**: `v0.x.0: Feature-Beschreibung` (bei größeren Features)
- **Minor-Commits**: `fix: ...` / `feat: ...` / `style: ...` / `docs: ...`
- Sprache: Deutsch oder Englisch, konsistent bleiben

### Warum?
- Vollständige Historie aller Änderungen
- Einfaches Rollback bei Problemen
- Nachvollziehbarkeit für den Nutzer
- **Datenbank-Konsistenz** zwischen Entwicklern

## 1. Grundprinzip: Keine eigenmächtigen Änderungen

### Was verboten ist
- **Keine autonomen „Optimierungen"**: Keine Refactors oder Umbauten ohne explizite Anweisung
- **Keine parallelen Implementierungen**: Nicht zwei Systeme für die gleiche Aufgabe einführen
- **Keine „kreativen" Lösungen**: Keine eigenmächtigen Designentscheidungen
- **Keine Strukturänderungen**: Keine Datei-Umbenennungen oder Ordner-Reorganisation ohne Auftrag
- **Keine Löschung von Schutzhinweisen**: Kommentare des Nutzers nicht entfernen

### Was erlaubt ist
- Änderungen, die **explizit im Prompt** angefordert wurden
- Behebung offensichtlicher Fehler (Syntax, Typos)
- Ergänzungen, die **direkt** zur Aufgabe gehören

### Schutzregel für funktionierende Features
> **KRITISCH**: Funktionierende Features **NIEMALS** anfassen, auch wenn sie „optimierbar" erscheinen.

Vor jeder Änderung prüfen:
1. „Könnte diese Änderung ein anderes Feature brechen?"
2. „Wurde diese Änderung explizit angefordert?"
3. Falls Zweifel: **Rückfrage stellen, nicht handeln**

## 2. Ausführungsprinzip: Vollständigkeit

### Alle Anweisungen in einem Prompt ausführen
- Bei mehreren Anweisungen: **Alle** nacheinander abarbeiten
- Keine Zwischenfragen, wenn die Informationen ausreichen
- Keine Teillieferungen ohne Notwendigkeit

### Kontext sammeln vor Handeln
- Erst die Situation verstehen, dann handeln
- Relevante Dateien lesen, bevor Änderungen vorgenommen werden
- Annahmen vermeiden – stattdessen nachfragen oder recherchieren

## 3. UI/UX-Prinzipien

### Schriftarten
- **Serifenlose Fonts** für alle GUI-Elemente (Buttons, Chips, Tooltips, Modals)
- Fonts über Theme-Variablen definieren, nicht hardcoded

### Dialoge und Bestätigungen
- **Keine Browser-Dialoge**: `window.confirm()`, `window.alert()` vermeiden
- Benutzerdefinierte Modals mit Backdrop und `role="dialog"` verwenden
- Standardisierte Button-Klassen nutzen

### Tooltips und Hilfe
- Tooltips zentral pflegen und konsistent wiederverwenden
- Nicht in jeder Komponente neu implementieren

### Farben und Theming
- **Niemals hardcoded Farben** verwenden
- Immer Theme-Variablen nutzen (z. B. `var(--color-bg)`, `var(--color-text)`)
- Bei neuen Farben: Theme erweitern in `src/app.css`, nicht inline definieren
- Multiple Themes bedenken (Hell, Dunkel, E-Ink, Barrierefrei)

### CSS-Architektur (STRIKT)

> **KRITISCH**: Alle CSS-Definitionen müssen zentral in `src/app.css` erfolgen.

#### Was VERBOTEN ist:
- **Kein Inline-CSS** in HTML-Dateien (`<style>` Tags in app.html)
- **Keine `<style>` Tags** in Svelte-Komponenten - alle Styles nach app.css verschieben
- **Keine hardcoded Farbwerte** – immer CSS-Variablen verwenden
- **Keine CSS in JavaScript** – Styles gehören in CSS-Dateien
- **Keine style="" Attribute** in HTML (außer `display: contents`)

#### Was ERLAUBT ist:
- Alle Styles in `src/app.css` definieren
- CSS-Variablen für alle Farben, Abstände, Schriftgrößen
- Theme-basierte Selektoren (`html.dark`) in app.css
- Svelte-Komponenten verwenden NUR CSS-Klassen aus app.css

#### Ladeverhalten (KRITISCH - Reihenfolge):
```
1. Browser lädt HTML
2. Blocking Inline-Script in <head> setzt 'dark' Klasse auf <html> 
   basierend auf localStorage BEVOR CSS lädt
3. CSS lädt (app.css via SvelteKit)
4. First Paint mit korrektem Theme
5. Svelte hydratisiert
```

#### Theme-Mechanismus:
- Theme wird in `localStorage` unter Key `artellico_theme` gespeichert
- Blocking Script in `app.html` liest localStorage und setzt `html.dark` Klasse
- CSS verwendet `html.dark` Selektor für Dark Mode Styles
- JavaScript/Svelte Store synct nur mit der Klasse, setzt keine neuen Styles

#### Warum dieser Ansatz:
- **KEIN Theme-Flackern** (FOUC) weil Klasse VOR CSS-Load gesetzt wird
- **Eine einzige Quelle** für alle Styles (app.css)
- **CDN-cachebar** weil keine Inline-Styles
- **Wartbar** weil zentrale Definition

### Rahmen und Abstände
- Rahmendicken und Abstände über Theme-Variablen
- Konsistentes Spacing-System (4px, 8px, 16px, 24px, 32px)

## 4. Mehrsprachigkeit (i18n)

### Neue Texte
- **Niemals hardcoded Strings** in der UI
- Alle Texte über das i18n-System laden
- Neue Labels **immer in allen Sprachen** anlegen (mindestens: DE, EN, FR, ES)
- Dynamischen Content, dort wo 2-Sprachigkeit nötig ist - über Datenbankeinträge managen.

### Sprachauswahlprinzip
- Automatische Erkennung der Browser-Sprache
- Manuelle Umschaltung ermöglichen
- Sprache persistent speichern

## 5. Offline-First-Architektur

### Grundprinzip

Alle Kernfunktionen müssen **ohne Internetverbindung** funktionieren. Die App ist eine PWA und soll auch mit entsprechendem Icon aus dem Browser heraus "installierbar"sein, sowohl auf dem Desktop als auch mobil (iOS, Android)

### Datenstrategie
1. **Lokaler Cache zuerst**: Daten immer zuerst lokal speichern/lesen
2. **Asynchroner Sync**: Mit Server synchronisieren, wenn Verbindung besteht
3. **Konfliktbehandlung**: Definierte Strategie (z. B. Last Write Wins)

### Caching-Limits
- Nutzer sollte einstellen können, wie viele Einträge gecacht werden
- Caching nach Zeitraum oder Anzahl begrenzen
- Speicherverbrauch transparent anzeigen

### Sync-Status
- Dem Nutzer immer den Sync-Status anzeigen
- Pending-Änderungen visualisieren
- Fehler bei Sync deutlich kommunizieren

## 6. Datenbank-Prinzipien

### PostgreSQL-Zugriff via Docker
Die Datenbank läuft in einem Docker-Container. Für direkten Zugriff:
```bash
# Tabellen anzeigen
sudo docker exec pgvector-db psql -U postgres -d Artellitext -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Daten abfragen
sudo docker exec pgvector-db psql -U postgres -d Artellitext -c "SELECT * FROM users LIMIT 10;"

# Daten einfügen/ändern
sudo docker exec pgvector-db psql -U postgres -d Artellitext -c "INSERT INTO ... / UPDATE ... / DELETE ..."

# Schema einer Tabelle anzeigen
sudo docker exec pgvector-db psql -U postgres -d Artellitext -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TABLENAME' ORDER BY ordinal_position;"
```

**Wichtig**: Immer `sudo` verwenden, da Docker root-Rechte benötigt.

### Tabellen im System
- `users` - Benutzerkonten
- `sessions` - Login-Sessions
- `notes` - Notizen/Texte
- `documents` - Hochgeladene Dokumente

### Delta-Ansatz für Migrationen
- **Niemals Tabellen löschen** (`DROP TABLE`)
- Immer `ALTER TABLE` oder Backup + Re-Insert
- Vor Änderungen: Backup erstellen

### Row Level Security (RLS)
- RLS als Sicherheitsfeature verstehen und respektieren
- Leere Resultate können RLS-bedingt sein, nicht Schema-Fehler
- RLS-Policies dokumentieren

### Queries
- Queries immer mit Limits ausführen
- Timeouts für lange Operationen setzen
- Outputs begrenzen, um Überlastung zu vermeiden

## 7. Bibliotheken und Abhängigkeiten

### Vor dem Hinzufügen neuer Bibliotheken
1. Lizenz prüfen (MIT, Apache, BSD bevorzugt)
2. Aktive Wartung prüfen (letzte Updates, Issues)
3. Bundle-Größe berücksichtigen
4. Bestehende Alternativen im Projekt prüfen

### Nach dem Hinzufügen
- Eintrag in README unter „Danksagungen und Lizenzen"
- Lizenztyp in Klammern dokumentieren
- Update-Strategie festlegen

### Verbotene/problematische Lizenzen
- GPL ohne vorherige Prüfung
- Proprietäre Lizenzen
- Lizenzen mit Werbeauflagen (BSD-4-Clause)

## 8. Seitenstruktur und Routing

### Konsistenz wahren
- Seitenstruktur nicht ohne Grund ändern
- Keine doppelten Routen erzeugen
- Keine redundanten Entry-Points

### Neue Seiten
- In die bestehende Struktur einfügen
- Navigation aktualisieren
- Breadcrumbs berücksichtigen

## 9. Sicherheitsprinzipien

### Keine Secrets im Frontend
- Keine API-Keys in Browser-Bundles
- Keine Private Keys loggen
- Keine Demo-Fallback-Keys ohne Warnung

### Eingabevalidierung
- Alle Nutzereingaben validieren
- XSS-Prevention beachten
- SQL-Injection vermeiden (auch bei ORMs prüfen)

### Logging
- Keine sensiblen Daten loggen
- Keine Passwörter, Tokens, Keys in Logs
- Logs regelmäßig rotieren

## 10. Dokumentationsprinzipien

### Code-Kommentare
- Komplexe Logik kommentieren
- „Warum", nicht „Was" erklären
- TODOs mit Kontext versehen

### README und Docs
- Änderungen an der Architektur dokumentieren
- Setup-Anleitungen aktuell halten
- Troubleshooting-Hinweise ergänzen

### Keine redundante Dokumentation
- Nicht jede Änderung als eigenes Markdown-File dokumentieren
- Bestehende Docs erweitern statt neue anlegen
- Veraltete Docs entfernen oder aktualisieren

## 11. Interpunktion und Schreibstil

### Allgemein
- Keine Rufzeichen verwenden (außer bei Warnungen)
- Punkte nur bei vollständigen Sätzen
- Labels und Überschriften ohne Punkt am Ende

### Anführungszeichen
- Typografische Anführungszeichen: „Zitat" (DE), "Quote" (EN)
- Typografische Apostrophe: l'avatar, it's

### Konsistenz
- Gleiche Begriffe für gleiche Konzepte
- Glossar bei Bedarf pflegen

## 12. Sprache der Antworten

> **WICHTIG**: Antworten auf Deutsch, sofern nicht anders angefordert.

- Technische Begriffe dürfen englisch bleiben
- Code-Kommentare nach Projektkonvention (meist Englisch)
- Commit-Messages nach Projektkonvention

## Zusammenfassung: Die 5 goldenen Regeln

1. **Nicht eigenmächtig ändern** – Nur tun, was angefordert ist
2. **Funktionierende Features nicht anfassen** – Bei Zweifeln: Rückfrage
3. **Theming und i18n immer bedenken** – Keine Hardcodings
4. **Offline-First denken** – Lokaler Cache vor Remote
5. **Dokumentieren, was relevant ist** – Aber nicht überdokumentieren
