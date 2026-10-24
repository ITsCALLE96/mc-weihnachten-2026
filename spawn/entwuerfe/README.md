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

## 2. Weltenbaum – gewählt (Pascal 24.10.: „finde ich geil, aber dann richtig groß“), jetzt groß und eigen gestaltet (`weltenbaum.mjs`)

Der erste, kleine Entwurf liegt als `weltenbaum-klein.mjs` daneben.

**Maße (Vorschlag):** Ausschnitt 240 × 262 × 240. Boden lokal y 14, **Spawnplattform 118 Blöcke über dem Boden** (Boden auf y 64 ergibt Plattform auf y 182). Kronenspitze 94 Blöcke darüber (bei Boden y 64 auf y 276, unter der Bauhöhe 320). **Krone ~190 × 145 Blöcke (nach Osten bis ~106 vom Stamm), Wurzeln bis ~75 Blöcke vom Stamm.** Alles liegt im Umkreis von ~106 Blöcken um den Stamm, bei Sichtweite 8 (128 Blöcke) ist der Baum vom Spawn aus also komplett geladen.

- **Stamm:** Kern mit Längsfurchen plus sieben gedrehte Stränge, unten breit ausgestellt (Durchmesser ~40), oben ~14. Rinde aus Dunkeleiche, Fichte und Eiche, mit Moosflecken
- **Wurzeln:** neun Brettwurzeln laufen als begehbare Bögen hinaus und tauchen in den Boden, dazu Seitenwurzeln. Auf den Bögen Laternen, darunter Leuchtbeeren, Moos und Augenblüten
- **Krone:** zwei Etagen Hauptäste (sieben breite, flache, fünf steilere) mit Unterästen und Zweigen, dazu ein Leittrieb. 123 Laubwolken mit Rauschen geformt, keine Kugeln. Eiche, Dunkeleiche und blühende Azalee gemischt, Pilzlicht im Laub
- **Spawnplattform:** unregelmäßiger Ring um den Stamm (Radius ~25, Fichte mit Balken, Geländer). Um den Stamm ein Kranz aus Froschlicht und Moos mit Augenblüten. Spawn auf der Südseite mit Blick nach außen, rundum 14 Blöcke Kopffreiheit ohne Laub
- **Abflug:** vier begehbare Äste (3 breit) in vier Richtungen, bis ~58 Blöcke vom Stamm, darüber frei
- **Hängendes:** Leuchtbeeren und Ranken unter dem Laub, Laternen an Ketten unter den Ästen, Leuchtflechte am Stamm
- **Infotafeln** auf der Plattform. **Erweiterung:** äußerer Plattformring, Abflugäste, Wurzelbögen, später weitere Plattformen in der Krone
- **Rückweg-Plattform:** gleiche Form wie freigegeben, im Stil „wurzel“ (Dunkeleiche, Moos, Pilzlicht), unten zwischen den Wurzeln. Bild: `weltenbaum-plattform-wurzel.png`

**Ausleuchtung:**
- Sichtbare Lichtquellen: Laternen (Geländer, Wurzelbögen, Ketten), Leuchtbeeren, Pilzlicht, Froschlicht, Leuchtflechte
- Dazu prüft der Generator die Lichtausbreitung selbst. **Jede begehbare Fläche am Baum mit Blocklicht 0 bekommt einen unsichtbaren Lichtblock**, bis keine dunkle Stelle mehr übrig ist (aktuell 438 Lichtblöcke). Der Baum ist damit monsterfrei
- Den Boden rundherum übernimmt nach der Seed-Wahl `spawn/standort.mjs lichter` (Oval, Raster 8)
- **Augenblüte:** gibt in Vanilla **kein echtes Licht** ab (Lichtstufe 0 laut Datenreferenz 1.21.4), sie öffnet sich nur nachts und sieht leuchtend aus. Wir setzen sie als Deko ein, das Licht kommt aus den anderen Quellen. In 26.3 beim Nacht-Rundgang gegenprüfen

**Spawn unter der Krone:** 26.3 setzt Spieler beim ersten Betreten auf den obersten Block der Spalte, hier also auf die Krone. Darum teleportiert die Spawn-Technik (`spawnTeleport` in der Standort-Konfiguration) beim ersten Betreten und nach dem Tod ohne Bett auf den Spawn. Die Idee stammt aus der Nitrado-Auswertung, der Code ist eigen.

**Prinzipien, die ich übernehme (Inspiration „größter Baum“):** Das Video selbst konnte ich nicht ansehen, die Seite liefert nur den Titel. Die Prinzipien stammen daher aus allgemeiner Praxis für Riesenbäume, nichts davon aus dem Video:
1. **Silhouette zuerst:** ausgestellter Fuß mit Brettwurzeln und eine breite, unregelmäßige Krone, die weiter ausladet als der Stamm hoch ist, damit der Baum von weitem lesbar ist
2. **Organisch statt geometrisch:** gedrehte Stränge, Furchen, Äste mit Krümmung und Verzweigung, Laub als zerfranste Wolken
3. **Materialmix und Alter:** dunkle Rinde, Moos, Ranken, Leuchtflechte, damit der Baum alt und lebendig wirkt
4. **Licht als Stimmung:** warme Lichtpunkte in der dunklen Krone (Pilzlicht, Leuchtbeeren, Laternen), Kontrast zum dunklen Stamm
5. **Nutzbarkeit eingebaut:** Plattform im Baum, klare Abflugwege, Kopffreiheit, alles nah genug für Sichtweite 8

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
| Weltenbaum (groß) | – | `weltenbaum-seite.png` | `weltenbaum-spawn.png`, `weltenbaum-stamm.png` | `weltenbaum-abflug.png` | `weltenbaum-unten.png` | Nacht: `weltenbaum-nacht-seite.png`, `-spawn`, `-abflug`, `-unten`; Plattform: `weltenbaum-plattform-wurzel.png` |

Gerendert mit einem einfachen Raycaster (Nachtansicht mit Lichtausbreitung wie im Spiel; das Karomuster der Bodenlichter ist ein Effekt des Renderers) (Blocktexturen, Wasser blau; kleine Dinge wie Zäune, Laternen, Schilder und Blumen werden weggelassen). Kulisse: Meer bzw. flache Wiese.
