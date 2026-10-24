# Spawn-Entwürfe für die echte Welt (Forever-World)

Stand 2026-10-24, Auftrag Leitung nach grill-me mit Pascal: **eigenes Design**, nicht weihnachtlich, nichts kopiert (weder CA12 noch das Nitrado-Paket).
Pascal wählt eine Richtung, danach Verfeinerung und Aufbau auf dem Testserver.

Beide Entwürfe sind prozedural erzeugt (`node spawn/entwuerfe/<entwurf>.mjs <ausgabe.schem>`). Größe, Form und Materialien lassen sich daher leicht ändern.
Zu jeder Schematic gehört eine `.json` mit Spawnpunkt, Oval (Spawnschutz und Lichter), Bereich „oben“ und mehr, relativ zur Ecke. Daraus wird später
die Standort-Konfiguration (`spawn/standort-*.json`, siehe `spawn/AUFBAU.md`).

## 1. Felsinsel (`felsinsel.mjs`)

Schwebende Felsinsel, ca. 60 × 60 Blöcke Oberfläche, unten ein unregelmäßiger, hängender Fels-Kegel mit Moos, Ranken und Wurzeln.
- **Wahrzeichen:** Kristallturm in der Mitte (Kalzit-Sockel, 30 Blöcke Amethyst mit Leuchtkern, Endstab an der Spitze)
- **Platz:** gepflasterter Rundplatz (Radius 13) für ~25 Spieler, Spawn 10 Blöcke vor dem Turm mit Blick darauf
- **Wasserfall:** Teich und Bach nach Osten, fällt über die Kante ins Leere bis ins Meer
- **Abflugkante:** Steinsteg nach Süden, 7 Blöcke über die Kante, mit Geländer bis kurz vor die Spitze
- **Infotafeln** neben dem Spawn (Regeln, Discord, Statistik), Texte füllt Pascal
- **Erweiterung:** Nordwest-Viertel bleibt freie Grasfläche
- Rückweg-Plattform unten: die freigegebene runde Plattform (Stein und Amethyst passt zum Kristallturm)

## 2. Weltenbaum (`weltenbaum.mjs`)

Riesiger Baum, ca. 100 Blöcke hoch, Wurzeln greifen 30–40 Blöcke weit in den Boden.
- **Spawnplatz:** runde Plattform in der Krone (Radius 19, Fichtenholz, Geländer), Spawn mit Blick auf den Kern
- **Wahrzeichen:** leuchtender Kern auf dem Stammende (Pilzlicht, Azaleen), Blätterdach im Ring mit hängenden Laternen (der Himmel über der Mitte bleibt frei)
- **Abflug:** fünf begehbare Äste in alle Richtungen, Geländer mit Lücken zu den Ästen
- **Infotafeln** neben dem Spawn
- **Erweiterung:** äußerer Ring der Plattform, Äste ausbaubar
- Braucht passendes Gelände am Boden (flache Lichtung oder Tal). Die Seed-Suche kommt nach der Wahl
- Rückweg-Plattform unten zwischen den Wurzeln, als Holz-Variante noch zu entwerfen

## Was wir von SparkofPhoenix übernehmen (Prinzipien, nichts kopiert)

Quellen: Beschreibung und FAQ der Nitrado-Seite „SparkofPhoenix’s Craft Attack Experience“. Bilder oder Dateien des Pakets lagen nicht vor.
- **Spawn als Startpunkt mit Abflug:** erhöhter Spawn, von dem man mit der Einmal-Elytra (bei uns Plugin „Spawn Elytra“) in die Welt gleitet
- **Treffpunkt mit Funktionen statt nur Deko:** Infotafeln, kurze Wege, klarer Abflug
- **Gemeinschaftsflächen nah am Spawn:** Shopping District mit Netherportal, Projekt- bzw. Pilzinsel (monsterfrei) als späterer Ausbau. Unsere Spawn-Region lässt sich dafür freigeben (`spawn/AUFBAU.md`)
- **Vanilla-Gefühl mit Komfort-Datapacks** (Schlafquote, zusätzliche Rezepte). Das ist ein Thema der Server- und Modpack-Session, hier nur erwähnt

## Vorschaubilder (`bilder/`)

| Entwurf | oben | Seite | Spielersicht Spawn | Abflug | von unten | Extra |
|---|---|---|---|---|---|---|
| Felsinsel | `felsinsel-oben.png` | `felsinsel-seite.png` | `felsinsel-spawn.png` | `felsinsel-abflug.png` | `felsinsel-unten.png` | `felsinsel-wasserfall.png` |
| Weltenbaum | `weltenbaum-oben.png` | `weltenbaum-seite.png` | `weltenbaum-spawn.png` | `weltenbaum-abflug.png` | `weltenbaum-unten.png` | |

Gerendert mit einem einfachen Raycaster (Blocktexturen, Wasser blau; kleine Dinge wie Zäune, Laternen, Schilder und Blumen werden weggelassen). Kulisse: Meer bzw. flache Wiese.
