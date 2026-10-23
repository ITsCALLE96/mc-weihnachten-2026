# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Statische Seite ohne Build (HTML, CSS, ein ES-Modul) in `web/`, ausgeliefert vom eigenen Node-Dienst `dienst.mjs` (ohne npm-Abhängigkeiten) auf VM200, öffentlich über Tailscale Funnel. Gewählt von Claude (Pascal: „Empfehlung nehmen“), passend zum Repo (Node-Werkzeuge, `node --test`).

## Users

Pascals Freundesgruppe (8–12 Leute, Minecraft-Java-Spieler, teils Anfänger) auf dem Weihnachtsserver, der danach als „Forever-Server“ weiterläuft. Sie schauen abends am Handy oder PC nach: wer ist online, wer führt, was sagt die Seite über mich. Öffentlich erreichbar, Fremde sind Nebenpublikum.

## Product Purpose

Spaß und Gesprächsstoff in der Gruppe: Bestenlisten mit witzigen Titeln, Spielerprofile mit allen Vanilla-Werten und Platzierung, Sprüche nach Schwellen, „Wusstest du?“-Fakten, Spielzeit pro Tag und Sitzungen, live „Gerade online“ und Ereignisse. Verlauf über Saisons.

## Capabilities and Constraints

- Daten nur aus Vanilla-Dateien und Server-Logs, kein Plugin; Vertrag: `DATENFORMAT.md`
- Standardmäßig alle sichtbar, Widerspruch per Klick im Discord (Community-Bot), Discord verlassen ⇒ ausgeblendet; Ausgeblendete fehlen überall
- Keine Drittanbieter-Ressourcen im Browser (Schrift, Köpfe, alles selbst ausgeliefert)
- Servername ist noch Platzhalter („Weihnachtsserver“), an einer Stelle änderbar
- Fertig zum Start Sa 05.12.2026

## Brand Commitments

- Pascal: Machart wie craftattack.one/stats (kräftige Farbflächen, große Pixelschrift, bunte Kennzahl-Kacheln, Bestenlisten-Karten), aber eigenes Gesicht – keine Kopie der fremden Seite
- Ton: frech, aber lieb; Spott nur über Rekorde
- Pixelschrift Silkscreen (OFL), selbst gehostet

## Evidence on Hand

Keine echten Spielerdaten vor dem Testlauf 21.11.; bis dahin erfundene Testdaten aus `testdaten.mjs` (als Testdaten kennzeichnen, wo man sie für echt halten könnte).

## Product Principles

1. Wer nicht gezeigt werden will, existiert auf der Seite nicht.
2. Jede Zahl bekommt einen Kontext oder einen Spruch – rohe Tabellen nur im Profil unter „Alle Werte“.
3. Am Handy genauso gut wie am PC.
4. Spott nach oben, nie nach unten.

## Direction contract

THESIS: Die Anzeigetafel einer Saison als Winternacht über dem Server – jede Bestenliste ist ein eigener Erzblock in seiner Farbe; verweigert wird das graue Admin-Dashboard mit Diagrammkacheln.
OWN-WORLD: Grund Nachthimmel-Blau (#0f1330), Schnee-Weiß als helle Bänder, Erzfarben als volle Flächen (Redstone, Gold, Diamant, Smaragd, Amethyst, Kupfer, Lapis); Silkscreen für Zahlen und Titel, Systemschrift für Fließtext; kantige Blöcke ohne Rundungen, Pixelkanten statt Schatten-Glow.
STORY: Besucher sieht sofort, ob jemand online ist und was gerade passiert, findet sich in den Bestenlisten, klickt auf einen Namen und liest, was die Seite über ihn sagt.
FIRST VIEWPORT: Links groß „STATS“ in Pixelschrift über dem Servernamen, Live-Zeile mit grünem Punkt und Online-Köpfen; darunter vier Kennzahl-Blöcke in Erzfarben; leise fallender Pixelschnee im Himmel.
FORM: von Pascal gepinnt (CraftAttack-Machart), kein Würfelwurf; Signatur: „Server-Tagebuch“ – Tag wählen, Sitzungen aller Spieler als Balken über den Abend.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
