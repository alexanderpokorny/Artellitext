# ArtelliText – Fachliche Requirements

> **Zweck**: Dieses Dokument beschreibt die inhaltlichen, nicht-technischen Anforderungen an ArtelliText.  
> **Stand**: Januar 2026  
> **Verwendung**: Basis für Neuimplementierungen oder Migrationen

## 1. Produktvision

**ArtelliText** ist eine professionelle kognitive Denkplattform mit Notiz- und Dokumentenfunktion mit folgenden Kernzielen:

- **Offline-First**: Alle Kernfunktionen müssen ohne Internetverbindung nutzbar sein
- **Datensouveränität**: Vollständige Kontrolle über eigene Daten (EU-Hosting, Verschlüsselung)
- **Mehrsprachigkeit**: Benutzeroberfläche in DE, EN, FR, IT, ES, beim Dynamischen USer-Content muss es in der DB eine Sprachenspalte geben, wo die jeweilge Sprache oder "MU" (multilingual) gespeichert werden kann. Damit kann sowohl der Content gefiltert, aber auch die semantische Suche optimiert werden.
- **KI-Unterstützung**: Intelligente Textverarbeitung und semantische Suche mit eigenem KI-Modell (BYOK) über Openrouter etc.
- **Subscriptions**: Es gibt verschiedene Subscriptionsmodelle und features müssen an diese geknüpft sein, d.h. in der Session muss immer geprüft werden können, ob das entsprechende Feature vorhanden ist.

## 2. Zielgruppen

| Zielgruppe | Bedürfnisse |
|------------|-------------|
| **Forscher/Akademiker** | Wissenschaftliche Notizen, Zitationen, Dokument-Organisation |
| **Autoren/Journalisten** | Textverarbeitung, Offline-Schreiben, Strukturierung |
| **Privatnutzer** | Persönliche Notizen, Tagebuch, Geolokalisierung |
| **Teams (später)** | Gemeinsame Workspaces, Teilen von Dokumenten |

## 3. Kernfunktionen

- Linkes Sidepanel, recht main Content. Diese Basisstruktur ist für die gesamte app gleich, responsive! In engen Darstellungen (wenigstens im Phone mode) ist das Side panel mit menüs automatisch ausgeblendet. So wie auf der Artellico Website wird dann rechts oben das Hamburger Menü eingeblendet und beim Drücken erscheint das Sidepanel links! Im Hauptbereich gibt es oben immer einen Kopfbereich, der mit dem Kopfbereich im Sidepanel in der Höhe übereinstimmt, aber im phone mode eben darunter angezeigt werden muss.

Das theme ist einfach und elegant und folgt dem Design der Artellico Website. Schriften sind für den Haupttext (dort wo der User Content einfügt) immer in EB Garamond, Menüeinträge sind im SpecialElite Font. Die Eleganz orientiert sich an der Website und der postbox.getfreewrite.com App.

Im Sidemenü sind oben die Menüeinträge und Bereiche definiert, unten (bündig mit dem Seitenfuß) sind Einstellungen, Profil, und - wenn ein Superadmin angemeldet ist (erster Defaultuser: xaipe, Alexander Pokorny, alexander@pokorny.me) gibt es auch den Admin Bereich. Dort können Tiers, Subscriptionen, API Keys für Lemonsquaazu usw. verwlatet werden, alles, was für den SaaS Betrieb notwendig ist. Wir werden dort in Zukunft weitere Themen dazufügen.

Im Hauptteil sind standardmäßig die letzten Einträge der User mit Absteigendem Datum gelistet. Das ganze mit dynamischem lazy load. Eine gewisse Anzahl an Notizen ist im localen Browsercache, die Zahl kann in den User Settings eingestellt werden.

Der Settingsbereich erlaubt diverse Einstellungen (siehe vorherige Version). Darunter die Defnition der Tags, die vorgegeben werden können, damit KI konsistente Tags vergibt. Auch das Theme und die Sprache kann dort definiert werden, immer auch mit der Option "Auto" (damit dark/light und die Sprache den Brwoser Settings folgt). Auch die API Keys für Openrouter, OpenAI und Cloude können vom User dort verwaltet werden.

Im Hauptbereich können Einträge entweder in voller Breite, als Karten mit Preview und als schmale Zeilen dargestellt werden. Jeder Block ist ein Texteintrag mit vollen Blockeditor etc. Alle features sind in jedem Block enthalten, ohne Längenlimit (so wie eine Seite in Notion). Aber ohne gesonderte Organisationsstruktur in Ordnern. Nur mit Tagsystem und Volltextsuche (wenn KI im Abo verfügbar und Key hinterlegt, dann mit semantischer KI Suche).

In einem weiteren Bereich (auch links im Sidepanel als Menü) gibt es die Sektion für Dokuemente. Dort können PDFs, EPubs, Word, Excel, Powerpoint (upgeloadet und in einem Storage gespeichert) Google Docs, Slides, Sheets (verlinkt).

Das Storage wird später ein S3 Bucket, für die Anfangsversion können wir lokale Folder verwenden oder auch ein S3 Bucket lokal einrichten. Die Dokumente sollen mit einem Preview default als Thumbnails im dargestellt werden. Im Header sind sowohl die Auswahl der Darstellung (Full, Grid preview und Liste (alle in der gleichen Größe)) über logos auswählbar, als auch die Sortierung: Aufsteigend / Absteigend, aber auch welches Datum (Erstellung, Geändert).

Wenn der Content-Bereich angezeigt wird, ist oben stets eine Suchbar implementiert. Diese hat wie die Suche in Gmail rechts einen Settings Button, wo die Sucheinstellung verfeinert werden können. Default ist volltextsuche und die letzten x Einträge (genug für die gewählte Anzeige auf der Bildschirmgröße, wieder mit Lazy load beim Scrollen). Der Such-Setting Button passt sich inhaltlich und funktionell an die Sektion an: Bei "Wissen" die Dokumente, optionale Tagfilter, Datumsranges usw. Bei "Literatur" (die Dokumente): Dokumenttyp, Uploaddatum usw.

Wenn man auf die Dokumente doppelklickt dann öffnet sich immer eine Voll-Browseransicht des Content (wie in der alten Version), mit allen Reader Features für PDFs und Epubs. Wenn es Office-Dokumente sind (Google), werden sie im externen Link ge öffnet. MS-Dokumente, die lokal geladen sind, werden zur Ansicht geöffnet (readonly). Wenn es technisch möglich ist, kann der User seinen MS-Account angeben (Credentials werden gespeichert) und dann öffnet sich das Dokument im MS-Web-Edtitor. Es muss möglich sein, dass beim Speichern, das update wieder lokal in der app (und in der App storage aktualisiert wird), sonst bleiben wir bei Readonly.

In den Notes (Wissen) können alle Dokumenttypen verlinkt werden und erscheinen dort als Literaturverzeichnis. Dazu müssen wir Zitierformate implementieren (APA ... die wichtigsten, wie Wissenswchaftler ben«ötigen, ein generisch sinnvolles für allgemeins Business user). Standardmäßig werden Literaturreferenzen in wissenschaftlicher Notation mit [1] und Zahlen dargestellt, wobei die Auflistung der Quellen beim BNearbeiten rechts in einem Optionalen Fature Panel erfolgt, das eingeklappt werden kann. Dort sind die Quellen im gegebene Zitierformat alphabetisch geordnet und daher müssen die Referenzzahlen beim Hinzufygen neu berechnet werden.

Im Content bereich soll es nebne inebettungsn von Bildern, Video-Links (youtube, Vimeo), Zitat und Code Blöcken, LateX Formeln, Mermaid, Diagrams.net (draw.io), Excalidraw, Descript, Miro, Tldraw, PLantUML auch custom HTML blocks geben, aber mit check wegen javascript, das nicht erlaubt wird. Sollte das entdeckt werden, wird ein Security-Popup ausgegeben und der Block nicht gespeichert. Alternativ kann man JS auch erlaube, wenn es eine Option gibt, einen  Übergriff auf die Seite und den Code der App zu verhindern, d.h. JS mit Scope nur in dem eingebetteten Contenbereich / Frame. Jeder Block kann expanded und collapsed sein (wobei collapsed - sofern KI verfügbar) eine Beschreibung des Contens liefert (genau so lang wie in einer Zeile maximaler Breit verfügbar - am besten wird diese bei jedem Save / Update neu erstellt / upgedatet).

In jedem Contentblock gibt es 3 Bereiche links (Marginalie), Main Content, recht schmale Spalte ausreichend breit für tags (untereinander). Diese werden im collapsed mode untereinander dargestellt, soviel PLatz ist (bei hover ein Popup mit allen Details, allen Metadaten - Wordcound, Charactercount, Lesezeit, Schwierigkeitsmetriken des gesamten Textes [bezogen auf den schwierigsten Teil]) und dazu auch alle Tage in einer Zeilenform (von links nach rechts so breit das Popup ist und dann nächste Zeile), created date, last update und Geolocation (letzter ist by default off und kann in den Usersettings aktiviert werden - dann wird zu jedem Eintrag die Location der Erstellung - mit Creationdate, und des Last update - gemeinsam mit Datum- hinterlegt). Tags haben keine Farben, sie werden je nach Theme invers zum Hintergrund dargestellt für besten Kontrast.

Ich glaube auch, dass wir keinen Highkontrast mode brauchen, weil die dominant schwarzweise Form schon alle Kontrastvorgaben für Accessibility erfüllt (Barrierefrei-Verordnung!). Auch für E-ink devices wollte das kein Problem sein. Im Unterschied zum Theme der Artellico Website müssen wir allerdings dem USer Farbbilder erlauben. Allerdings mti einem kleinen drei-ounktemenü, wo man auf SW stellen kann - für jedes Bild separat! Auch bei den Covern der Dokumente kann man in der Menüleiste mit einem toggle zwischen Farben uns SW wählen um das Design zu wahren.

Die Designvorgaben lahnen sich an https://dev.artellico.com an (siehe dort CSS ...) Screenshots sind im Folder Design ideas dargestellt - Screenshot*.png. Dazu sind die PXL*.jpg files design Skizzen von mir, wie die App strukturiert sein soll. Der Screenshot Postbox*.png liefert ein ebenfalls brauchbares minimalistisches Design aber der Font soll in unserem Fall serifen sein: EB Garamond.
 
### 3.1 Notizen-Management

**Erstellen und Bearbeiten**
- Block-based Editor mit Formatierungsoptionen (Überschriften, Listen, Links, Bilder ...)
- Automatisches Speichern (lokal und remote)
- Entwurfsstatus (Draft → Veröffentlicht → Archiviert)
- Versionierung (je nach Abo mit bestimmten Limits - einstellbar im Adminbereich)
- Weitere Funktionen (/-Befehl):
    - Einbettung von LaTeX Formeln ($..$ inline, $$..$$ für disply (letztere immer nummeriert))
    - Source Code blöcke mit Spracherkennung / Auswahl
    - Mermaid Grafiken
    - Native einbettung von draw.io / excalidraw (?) -- Lizenz prüfen
    - Wenn nicht alternative Canvas Elemente mit potenzieller manual Draw Funktion für Tablets / Touchscreens
    - Native Fußnotenfunktion in jedem Block, übergreifend wenn mehrere Blöcke kombiniert werden

**Organisation**
- Workspaces zur Strukturierung (Projekträume)
- Tags zur Kategorisierung (farblich kodiert)
- Volltextsuche über alle Notizen
- Filterung nach Datum, Status, Tags, Workspace

**Geolokalisierung**
- Optionale Erfassung des Standorts beim Erstellen
- Suche nach Notizen in der Nähe eines Ortes
- Privacy-Kontrolle: Nutzer entscheidet über Tracking
- Reverse-Geocoding (Adresse zum Standort)

**Teilen**
- Teilen einzelner Notizen über Link
- Zugriffsrechte (Nur Lesen / Bearbeiten)
- Ablaufdatum für geteilte Links

### 3.2 Dokumenten-Management

**Upload und Speicherung**
- Unterstützte Formate: PDF, EPUB, DOCX, XLSX, Bilder
- Cover-Extraktion und Thumbnail-Generierung
- Metadaten-Extraktion (Titel, Autor, Datum)
- Cloud-Storage mit Presigned URLs

**Verarbeitung**
- Volltext-Extraktion für Suche
- OCR für gescannte Dokumente (optional)
- Automatische Kategorisierung (optional KI)

**Organisation**
- Dokumenten-Bibliothek mit Rasteransicht
- Sortierung nach Datum, Name, Typ
- Filterung nach Dateityp, Workspace

### 3.3 KI-Funktionen

**Textverarbeitung**
- Zusammenfassungen generieren
- Textverbesserung (Stil, Grammatik)
- Übersetzungen
- Schlagwort-Extraktion

**Semantische Suche (RAG)**
- Kontextbezogene Suche über Dokumenten-Inhalt
- Fragen an eigene Dokumente stellen
- Verknüpfung verwandter Notizen

**API-Key-Verwaltung**
- Nutzer bringt eigene API-Keys mit (OpenAI, etc.)
- Verschlüsselte Speicherung der Keys
- Transparente Kosten (Nutzer zahlt direkt bei KI-Anbieter)

### 3.4 Offline-Funktionalität

**Cache-First-Prinzip**
- Notizen werden lokal gecacht (IndexedDB)
- Einstellbar: Anzahl/Zeitraum der gecachten Einträge
- Dokumenten-Thumbnails offline verfügbar

**Synchronisation**
- Automatische Sync bei Internetverbindung
- Konfliktbehandlung: Neuerer Zeitstempel gewinnt (Last Write Wins)
- Sync-Status-Anzeige in der UI
- Manuelle Sync-Option

**PWA-Funktionen**
- Installation als App (Mobile und Desktop)
- Offline-Fallback-Seite
- Push-Benachrichtigungen (optional)

### 3.5 Benutzerkonten und Profile

**Authentifizierung**
- Registrierung mit E-Mail/Passwort
- E-Mail-Verifizierung
- Passwort-Zurücksetzen
- Session-Management

**Profil**
- Name, Avatar, Username
- Spracheinstellung
- Theme-Einstellung
- Privacy-Einstellungen (Geolokalisierung)

**Statistiken**
- Anzahl Notizen, Dokumente, Workspaces
- Speicherplatzverbrauch
- Aktivitätsübersicht

---

## 4. Abonnement-Modell

### 4.1 Pläne

| Plan | Speicher | Features | Preis |
|------|----------|----------|-------|
| **Free** | 5 GB | Basis-Funktionen | Kostenlos |
| **Pro** | 50 GB | + KI-Funktionen, + Priority Sync | TBD |
| **Team** | 500 GB | + Workspaces teilen, + Admin-Funktionen | TBD |

### 4.2 Storage-Tracking

- Echtzeit-Anzeige des Speicherverbrauchs
- Warnung bei Erreichen des Limits (80%, 95%)
- Automatische Blockierung bei Überschreitung (nur Lesen)
- Upgrade-Möglichkeit direkt in der App

---

## 5. Datenschutz und Compliance

### 5.1 DSGVO-Konformität (Art. 17)

**Recht auf Löschung**
- Vollständige Löschung aller Nutzerdaten auf Anfrage
- Automatische Löschung aller verknüpften Daten (Cascading)
- Audit-Log zur Dokumentation der Löschung
- Löschung durch Nutzer selbst oder Admin

**Zu löschende Daten**
- Notizen, Dokumente, Workspaces
- Tags, Vorlagen
- Sessions, API-Keys
- Profildaten, Abonnement-Daten

### 5.2 Verschlüsselung

**Datenspeicherung**
- AES-256 für sensible Daten (API-Keys)
- Ende-zu-Ende-Verschlüsselung für Notizen (optional)
- Verschlüsselte Backups

**Transport**
- TLS 1.3 für alle Verbindungen
- HTTPS-Only

### 5.3 Datenlokalisierung

- Alle Daten in EU-Rechenzentren
- Keine Weitergabe an Drittländer ohne Einwilligung
- Transparenz über Datenverarbeitung

---

## 6. Benutzeroberfläche

### 6.1 Design-Prinzipien

**Responsives Design**
- Mobile: Single Column, Touch-optimiert (min. 44px Touch-Targets)
- Tablet: 2-3 Spalten, optionale Sidebar
- Desktop: Volle Sidebar, Multi-Column-Grid
- Clean minimalistisches, elegantes Design mit Fokus auf Kreativität.
- Font: EB Garamond, Menüs, Zwischentitel, Kommentare etc. SpecialElite (immer lokal gehostet)

**Barrierefreiheit**
- Kontrastreiche Themes verfügbar
- Tastaturnavigation
- Screen-Reader-kompatibel
- Mindestgrößen für interaktive Elemente

**Theming**
- Hell (Standard)
- Dunkel
- E-Ink (hoher Kontrast, reduzierte Animationen)
- Barrierefrei (WCAG AA-konform)

### 6.2 Sprachen

| Sprache | Code | Flagge | Status |
|---------|------|--------|--------|
| Englisch | en | 🇬🇧 | Basis/Fallback |
| Deutsch | de | 🇦🇹 | Primär |
| Französisch | fr | 🇫🇷 | Vollständig |
| Italienisch | it | 🇮🇹 | Vollständig |
| Spanisch | es | 🇪🇸 | Vollständig |

**Anforderungen**
- Alle UI-Texte müssen in allen Sprachen verfügbar sein
- Übersetzungen sind im Admin-Bereich pflegbar
- Automatische Spracherkennung beim ersten Besuch
- Manuelle Sprachumschaltung in den Einstellungen

### 6.3 Navigation

**Dashboard**
- Übersicht: Letzte Notizen, Dokumente
- Quick Actions: Neue Notiz, Upload
- Sync-Status
- Speicherplatz-Anzeige

**Sidebar**
- Workspaces
- Tags
- Suche
- Einstellungen

**Header**
- Logo/Home
- Globale Suche
- Benutzermenü

### 6.4 Modale und Bestätigungen

- Keine Browser-Dialoge (`window.confirm`, `window.alert`)
- Benutzerdefinierte Modals mit Backdrop
- Konsistente Button-Benennung („Abbrechen", „Bestätigen", „Löschen")
- Destruktive Aktionen erfordern explizite Bestätigung

---

## 7. Admin-Funktionen

### 7.1 Übersetzungs-Management

- Alle Übersetzungsschlüssel einsehen
- Werte pro Sprache bearbeiten
- Fehlende Übersetzungen markieren
- Import/Export von Übersetzungsdateien

### 7.2 Benutzer-Management

- Benutzerliste mit Suchfunktion
- Benutzer deaktivieren/aktivieren
- Abonnement-Status ändern
- DSGVO-Löschung auf Admin-Anfrage

### 7.3 System-Einstellungen

- Globale Benachrichtigungen
- Wartungsmodus
- Feature-Flags

---

## 8. Export-Funktionen

### 8.1 Einzelexport

- Notiz als PDF exportieren
- Notiz als Markdown exportieren
- Notiz als DOCX exportieren
- Dokument herunterladen (Original)

### 8.2 Massenexport

- Alle Notizen als ZIP (Markdown + Anhänge)
- Gesamter Workspace als Archiv
- DSGVO-Datenexport (alle eigenen Daten)

---

## 9. Nicht-funktionale Anforderungen

### 9.1 Performance

- Erste Seitenladung < 3 Sekunden
- Interaktiv < 5 Sekunden
- Editor-Latenz < 50ms
- Sync-Latenz < 2 Sekunden (bei guter Verbindung)

### 9.2 Verfügbarkeit

- 99,5% Uptime für Backend
- Offline-Verfügbarkeit für Kernfunktionen
- Graceful Degradation bei Teilausfällen

### 9.3 Skalierbarkeit

- Unterstützung für 10.000+ aktive Nutzer
- 1.000+ Notizen pro Nutzer
- 100+ Dokumente pro Nutzer

### 9.4 Sicherheit

- Regelmäßige Security-Audits
- Penetration-Testing
- Automatische Sicherheitsupdates
- Schutz vor OWASP Top 10

---

## 10. Zukünftige Features (Roadmap)

### Phase 2
- [ ] Kollaboratives Bearbeiten (Real-Time)
- [ ] Kommentare an Notizen
- [ ] Versionsverlauf

### Phase 3
- [ ] Mobile Apps (iOS, Android)
- [ ] Desktop-Apps (Electron)
- [ ] Browser-Extension

### Phase 4
- [ ] API für Drittanbieter
- [ ] Webhooks
- [ ] Zapier/IFTTT-Integration

---

## Anhang: Glossar

| Begriff | Definition |
|---------|------------|
| **Notiz** | Textinhalt mit Metadaten (Titel, Tags, Standort) |
| **Dokument** | Hochgeladene Datei (PDF, EPUB, etc.) |
| **Workspace** | Logischer Container zur Organisation |
| **Tag** | Farbiges Schlagwort zur Kategorisierung |
| **Sync** | Abgleich zwischen lokalen und Remote-Daten |
| **RLS** | Row Level Security (Datenbankebene) |
| **RAG** | Retrieval Augmented Generation (KI-Suche) |
