## 1. Globales Layout & Struktur

Die Anwendung folgt einem klassischen SaaS-Layout mit einer fixierten Navigation und einem dynamischen Inhaltsbereich.

*   **Header (Sticky Top):**
    *   Am oberen Bildschirmrand befindet sich eine fixierte Leiste ("Sticky oben"). Links steht das Logo bzw. der Titel "ARTELLITEXT".
    *   Daneben befindet sich eine Suchleiste, die ein Einstellungs-Icon integriert hat.
    *   **Responsive Verhalten:** Nur auf mobilen Geräten (Phone) wird rechts ein Hamburger-Menü ("Burger-Menü") angezeigt.
*   **Sidebar (Linke Seite):**
    *   Die Seitenleiste ist vertikal aufgebaut.
    *   **Oberer Bereich:** Enthält die Hauptnavigation mit den Menüpunkten "WISSEN", "LITERATUR", "ZULETZT" und "TAGS". Jeder dieser Punkte wird durch ein Icon und Text repräsentiert.
    *   **Unterer Bereich (Sticky Bottom):** Am unteren Ende der Leiste sind die Punkte "SETTINGS", "PROFIL" und "STATUS" fixiert ("sticky unten") angebracht.
*   **Status-Zeile (Footer):**
    *   Ganz unten verläuft über die volle Breite eine Status-Zeile.
    *   Links steht das Copyright: "©ARTELLITEXT {Jahr}".
    *   Rechts befindet sich ein **Sync-Symbol** (Ampelsystem):
        *   Grün = "geeignet" (synced/alles okay).
        *   Gelb = "synct gerade".
        *   Rot = "offline / lokal".

## 2. Dynamische Inhalte der Status-Zeile

Der mittlere Teil der Status-Zeile ist **kontextabhängig** und ändert sich je nachdem, welcher Bereich (Wissen oder Literatur) gerade aktiv ist oder wo der Fokus liegt.

*   **Kontext "WISSEN":**
    *   Standardmäßig wird die "Zahl der Items" angezeigt.
    *   Liegt der Fokus auf einem Text-Block, wechselt die Anzeige zu "Zahl der Worte" und der berechneten "Lesedauer in min".
*   **Kontext "LITERATUR":**
    *   Standardmäßig wird die Anzahl der Dokumente angezeigt (je Typ oder insgesamt).
    *   Liegt der Fokus auf einem Element, werden Details zu diesem Dokument angezeigt.

### 3. Ansichten (Views) für Hauptbereiche

Es gibt zwei primäre Ansichten für die Hauptinhalte, die sich im Design unterscheiden, aber das gleiche CSS-Framework nutzen sollen.

**A. Ansicht "WISSEN" (Knowledge Base):**
*   **Listen-Layout:** Die Inhalte werden als Liste von Block-Editoren dargestellt.
*   **Block-Element:** Jedes Element zeigt einen "Header H1" und den dazugehörigen Textinhalt in gekürzter "Content Länge".
*   **Interaktion & Menü:**
    *   Beim Überfahren mit der Maus (Hover/onMouseOver) erscheint rechts ein "Drei-Punkte-Menü".
    *   Optionen im Menü: "Cache", "Edit", "Delete".
*   **Sortierung:** Oben rechts gibt es Buttons für aufsteigende/absteigende Sortierung.

**B. Ansicht "LITERATUR" (Document Management):**
*   **Grid-Layout:** Die Dokumente werden standardmäßig in einem Raster (Grid) angezeigt.
*   **Karten-Design:** Jede Karte zeigt ein Thumbnail, ein Icon für den Dokumententyp (unten links) und einen Sync-Status (Punkt oben rechts).
*   **Menü-Optionen:**
    *   Auch hier erscheint ein Menü beim Hovern (unten rechts auf der Karte).
    *   Spezifische Optionen für Literatur: "Re-/Create Thumbnail", "Cache offline" (Standard ist nein), "Edit Metadaten", "Delete".
*   **Ansichts-Steuerung:** Oben rechts gibt es Umschalter für die Thumbnail-Größe ("große/keine Thumbs") sowie die Sortierung.

### 4. Detail-Design: Der "Block Editor"

Der Editor für das Schreiben von Inhalten hat spezifische typografische und funktionale Anforderungen.

*   **Typografie:**
    *   Der Haupttext (Header H1 und Main Text) verwendet die Schriftart **"EB Garamond"**.
    *   Marginalien (Randnotizen) verwenden die Schriftart **"Special Elite"** (Schreibmaschinen-Stil).
*   **Rechte Spalte (Tags):**
    *   Rechts neben dem Textbereich ist Platz reserviert für Tags pro Absatz. Diese werden entweder automatisch generiert oder durch KI erstellt.
*   **Feature "Marginalie" (Randnotiz):**
    *   **Erstellung:** Ein Befehl `/Marginalie` öffnet einen Mini-Editor an der Seite. Dieser erlaubt nur einfaches Styling (Fett/Kursiv/Unterstrichen) und nur Text.
    *   **Positionierung:** Die Marginalie erscheint immer auf Höhe des eingebetteten Links daneben.
    *   **Layout-Verschiebung:** Wichtig ist, dass der *darauffolgende* Absatz nach oben rutscht, um die Lücke zu schließen – so als gäbe es die Marginalie gar nicht (der Textfluss des Haupttextes wird optisch zusammengezogen).
    *   **Interaktion:**
        *   Beim *MouseOver* wird die Marginalie als Block hervorgehoben (z.B. durch einen Rahmen).
        *   Sie ist per Drag & Drop verschiebbar.

***

**Zusammenfassende Analogie zum Verständnis:**
Stell dir das Layout wie ein klassisches, elegantes Notizbuch vor. Links hast du deine festen Reiter (Navigation), unten den aktuellen Status (wie Seitenzahlen, aber smart). Der Editor selbst imitiert ein hochwertiges Buchlayout (Garamond Schriftart) mit der Möglichkeit, Notizen an den Rand zu kritzeln (Marginalien in Schreibmaschinenschrift), ohne dass der eigentliche Lesefluss des Haupttextes zerrissen wird.