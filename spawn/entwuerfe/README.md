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

## 2. Weltenbaum – gewählt (Pascal 24.10.), fünfte Fassung nach Pascals Test (`weltenbaum.mjs`)

Frühere Fassungen: `weltenbaum-klein.mjs` (erster Entwurf). Die zweite Fassung (runde Krone) steht in Commit `68169a6`, die dritte (Spawn oben auf der Krone, Abflug mit Elytra) in Commit `1aaad75`, die vierte (Turm, vier Wurzelgänge) in Commit `8ef225f`.

**Änderungen nach Pascals Test auf dem Testserver (24.10. abends):**
- **Nichts fällt mehr ab:** Der Generator prüft am Ende jeden Pflanzen-, Kerzen-, Laternen- und Kristallblock auf passenden Untergrund (Blumen auf Gras/Moos/Erde, Kerzen und stehende Laternen auf festem Block, hängende Laternen und Leuchtbeeren unter einem Block) und entfernt, was keinen Halt hätte. Ursachen waren Wurzelstränge, die nachträglich den Boden unter Blumen ersetzten, und Amethyst-Kristalle an der Wand ohne Block darunter. Die Eröffnung bricht die Rinde ohne `destroy` auf (sonst fallen Holzblöcke heraus), und `insel:aufbau_ende` entfernt 5 s nach dem Setzen alle herumliegenden Gegenstände (Blumen des Geländes, deren Boden der Bau ersetzt hat)
- **Turm entfernt**
- **Krone oben geschlossen und rund:** Alle Schirme wölben sich, der oberste als Kuppel (15 Blöcke) mit einem kleinen **Aussichtsdeck** (Radius 7) obenauf, keine flache Schnittkante und keine Aussichtswege mehr
- **Treppe durchgehend** bis aufs Deck (123 Stufen); vorher deckte der Kronenplatz den Schacht oben ab
- **Mehr Farbe und Material:** Rinde mit Verlauf von unten nach oben (Dunkeleiche, Mangrove, matschige Mangrovenwurzeln am Fuß → Fichte, entrindet → Eiche, Tropenholz → Blasse Eiche), senkrechte Furchen, Moos und Blassmoos. Laub in Flecken mit Verlauf (unten Dunkeleiche, Fichte, Mangrove, Tropen → Mitte Eiche, Azalee, Birke → oben blühende Azalee, Blasse Eiche, Kirsche), dazu Tupfer anderer Arten und vereinzelt gelbe und orange Pappel (neu in 26.3). Terrassen mit Gras, Moos und Podsol, Farne
- **Laternen gemischt:** Eisen, Seelen und gewachstes Kupfer in vier Oxidationsstufen (gewachst, damit sie sich nicht weiter verfärben), jeweils an passender Kette
- **Augenblüten oben ausgedünnt:** 1.166 statt 4.472
- **Ein großes Tor** nach Norden statt vier Gängen: innen ein Bogen aus heller Blasseiche mit Amethyst (7 breit, 8 hoch) und zwei Laternen davor, dahinter ein gerader Gang ins Freie. **Vor dem Start mit Rinde (Dunkeleichenholz, 2 dick) verschlossen**, dahinter Barriere. Die Eröffnung öffnet die Rinde Reihe für Reihe von unten (alle 4 Ticks) mit Bruch-Partikeln, Holzgeräusch, Kirschblättern und dem Tresor-Ton

**Von Pumis CA13-Baum inspiriert** (nur Prinzipien aus drei Screenshots, die Pascal gegeben hat; die liegen git-ignoriert in `spawn/quellen/pumi/`, nichts nachgebaut oder abgepaust):
1. **Breite Etagenkrone:** flache, wellige Laubschirme in gestaffelten Höhen, deutlich breiter als hoch, getragen von dicken, schräg auslaufenden Ästen; Unterseite zerfranst mit herabhängendem Laub
2. **Dunkles Laub auf dunklem, mächtigem Stamm**, der sich in mehrere Hauptäste teilt
3. ~~Heller, schlanker Turm am Stamm~~ (in der fünften Fassung entfernt, Pascal: „steht voll daneben“)
4. **Wurzeln als Terrassenhügel** mit Moos und Gras und **Reihen kleiner Lichter auf den Stufen**
5. **Nachts ein Teppich aus kleinen warmen Lichtpunkten auf der Kronenoberseite** als Wahrzeichen
6. Der Baum als **Mittelpunkt einer bebauten Fläche** (passt zu „später weiterbauen“)

Aus dem Video-Transkript (Recherche der Leitung) zusätzlich übernommen: **Augenblüten auf der Krone** als Nachteffekt, **Laternen an den Ästen**, **Kerzen** als Lichtpunkte, **Amethyst im Stamm** offen sichtbar. Pumis Problem mit Mobs auf der Krone lösen bei uns Pilzland und WorldGuard.

**Maße (Vorgabe Pascal: Krone 120–160, Gesamthöhe 100–140, mehrere Etagen)** – gegenüber der dritten Fassung auf 75 % verkleinert:
- **Krone 162 × 138 Blöcke** in sieben Schirmen (Ost-West knapp über 160 wegen eines ausladenden Schirms), **Aussichtsdeck auf der Kuppel 123, höchster Punkt 127 über dem Boden**
- **Begründung:** Vom Stamm aus reicht der Baum höchstens ~80 Blöcke weit, bei Sichtweite 8 (128 Blöcke) ist er vom Spawn aus also ganz geladen und von außen auf 2 Chunks Abstand noch ganz zu sehen. Bei Boden auf y 64 endet die Spitze bei y ~189, weit unter der Bauhöhe 320, Wolken (y 192) und Phantom-Flughöhe bleiben frei. Mehr Höhe brächte nur längere Wege und mehr Laub, weniger würde neben Bergen nicht mehr auffallen
- **Größenvergleich:** `bilder/groessenvergleich.png` (Spieler, Dorfhaus, Felsinsel, erster Weltenbaum, fünfte Fassung im selben Maßstab)

**Aufbau:**
- **Spawn-Raum im ausgehöhlten Stammfuß:** Kuppel mit Radius 11 und 15 Blöcken Höhe, Platz für ~25 Leute. Wände aus entrindetem Dunkeleichenholz mit Amethyst-Adern, Boden aus Kalzit, Holz und Moos mit Amethyst-Ring, Pilzlicht in der Wand, Laternen an Ketten, Amethyst-Kristalle, Augenblüten, Infotafeln (Texte füllt Pascal). Spawnpunkt 7 Blöcke südlich der Mitte mit Blick auf Treppe und Tor
- **Wendeltreppe aus Amethyst und Kalzit** im Stamm (123 Stufen, eine je 45°) vom Raumboden bis aufs Aussichtsdeck, Schacht mit Amethyst und Pilzlicht. **In der Mitte eine Blasensäule** (Seelensand, lila Glas, Dunkeleichentür unten) als schneller Aufzug
- **Terrassenwurzeln:** sieben Rücken in Stufen von 2 Blöcken, Moos und Gras, Kerzenreihen auf den Kanten, Augenblüten dazwischen
- **Tor** nach Norden (siehe oben), **Aussichtsdeck** auf der Kuppel mit Geländer und Laternen
- **Laub:** zehn Arten mit Verlauf (siehe oben), alles `persistent=true`. Kronenoberseite mit Moosflecken und offenen Augenblüten (in 26.3 gemessen: kein Blocklicht, nur Funkeln)
- **Weggefallen:** Rückweg-Plattform, Spawn Elytra, Sättigung (Pascal 24.10.)

**Leistung** (Zählung im Generator): **379.290 Blöcke**, davon **246.304 Laub** (mehr als vorher, weil die Kuppel geschlossen ist), 394 Kerzen, 117 Laternen, 1.166 Augenblüten.
- Laub ist dauerhaft (`persistent=true`) und zerfällt nicht. Laub-Zufallsticks prüfen nur, ob es zerfallen soll, das ist billig. Augenblüten reagieren nur im Zufallstick auf Tag und Nacht
- Leuchtbeeren sind ausgewachsen (`age=25`) und wachsen nicht weiter, keine Redstone-Technik, keine Wasser- oder Lavaströme (die Blasensäule ist ein ruhender Block)
- Fallende Blätter sind Partikel auf dem Client, ohne Last für den Server. Auf schwachen Rechnern hilft Grafik „Schnell“ (Laub ohne Transparenz) oder weniger Partikel
- Das Licht wird beim Setzen einmal berechnet, danach entsteht keine Last mehr. Die Datei passt als eine Struktur (`place template`)

**Pilzland um den Baum (Pascal 24.10.)** – geprüft an den Spieldaten von 26.3 (`worldgen/biome/mushroom_fields.json` und Biom-Tags im offiziellen Server-Jar):
- **Natürliche Spawns** sind nur Fledermaus (Höhlen), Pilzkuh (nur auf Myzel, auf Gras also keine) und Leuchttintenfisch (unter Wasser). **Keine Monster in keiner Höhe**, auch keine Schleime
- **Plünderer-Patrouillen:** aus (`can_pillager_patrol_spawn: false`). **Zombie-Belagerungen:** aus (Tag `without_zombie_sieges`). **Wanderhändler:** kommen weiter (nicht im Ausschluss-Tag), passt zum Händler-Datapack
- **Bleiben trotzdem:** **Phantome** spawnen unabhängig vom Biom (laut Minecraft-Wiki und Mojang-Bug MC-126778), **Entscheidung Pascal (24.10.): Phantome bleiben Vanilla** (keine Gamerule-Änderung). **Spawner** (Verliese, Trial Chambers) spawnen weiter, wenn welche im Bereich liegen, das prüfe ich nach der Seed-Wahl. **Überfälle** brauchen ein Dorf, im Pilzland gibt es keine Patrouillen, die das Böse Omen bringen
- **Höhlen darunter:** Biome sind in 26.3 dreidimensional. Die Spawn-Technik setzt `fillbiome` von y −64 bis 319, in 8 × 8-Säulen (24.576 Blöcke je Befehl, unter der Grenze 32.768). Damit sind auch Höhlen und die Luft bis zur Bauhöhe Pilzland
- **Farben:** Das Pilzland hat in 26.3 keine eigenen Gras- und Laubfarben mehr, sie kommen aus Temperatur 0,9 und Niederschlag 1,0. Das ist die sattgrüne Ecke der Farbtabelle (ähnlich Dschungel, heller und kräftiger als Wald). Gras bleibt Gras, kein Myzel nötig. Eichen- und Dunkeleichenlaub wird ebenfalls kräftig grün, Azaleenlaub bleibt unverändert
- **Größe:** Baum plus 30 Blöcke Rand, als Oval Mitte (131/122 im Entwurf), Halbachsen 125 × 102, etwa 40.000 Spalten, 670 `fillbiome`-Befehle. Wurzeln und Wurzelgänge liegen sicher drin (Oval im Generator: Pilzland-Rand +30)
- **Licht ist damit Stimmung:** Sichtbare Lichter bleiben (Laternen, Leuchtbeeren, Pilzlicht, Froschlicht). Die Pflicht-Ausleuchtung (jede begehbare Stelle ≥ 1) läuft nur noch mit `PFLICHTLICHT=1`, falls das Pilzland wegfällt. Die Nachtansicht bleibt Teil der Abnahme
- Technik: Feld `pilzland` in der Standort-Konfiguration, `insel:aufbau` ruft `insel:pilzland` auf

**Spawn im Stamm:** 26.3 setzt Spieler beim ersten Betreten auf den obersten Block der Spalte, hier also auf die Krone. Darum teleportiert die Spawn-Technik (`spawnTeleport` in der Standort-Konfiguration) beim ersten Betreten und nach dem Tod ohne Bett auf den Spawn. Die Idee stammt aus der Nitrado-Auswertung, der Code ist eigen.

**Prinzipien, die ich übernehme (Inspiration „größter Baum“):** Das Video selbst konnte ich nicht ansehen, die Seite liefert nur den Titel. Die Prinzipien stammen daher aus allgemeiner Praxis für Riesenbäume, nichts davon aus dem Video:
1. **Silhouette zuerst:** ausgestellter Fuß mit Brettwurzeln und eine breite, unregelmäßige Krone, die weiter ausladet als der Stamm hoch ist, damit der Baum von weitem lesbar ist
2. **Organisch statt geometrisch:** gedrehte Stränge, Furchen, Äste mit Krümmung und Verzweigung, Laub als zerfranste Wolken
3. **Materialmix und Alter:** dunkle Rinde, Moos, Ranken, Leuchtflechte, damit der Baum alt und lebendig wirkt
4. **Licht als Stimmung:** warme Lichtpunkte in der dunklen Krone (Pilzlicht, Leuchtbeeren, Laternen), Kontrast zum dunklen Stamm
5. **Nutzbarkeit eingebaut:** Spawn-Raum, Treppe und Aufzug im Stamm, mehrere Ausgänge, Kopffreiheit, alles nah genug für Sichtweite 8

## Was wir von SparkofPhoenix übernehmen (Prinzipien, nichts kopiert)

Quellen: Beschreibung und FAQ der Nitrado-Seite „SparkofPhoenix’s Craft Attack Experience“. Bilder oder Dateien des Pakets lagen nicht vor.
- **Spawn als gemeinsamer Startpunkt:** bei SparkofPhoenix erhöht mit Abflug per Einmal-Elytra. Bei uns seit 24.10. ohne Elytra: Start gemeinsam im verschlossenen Baum, Eröffnung öffnet die Ausgänge
- **Treffpunkt mit Funktionen statt nur Deko:** Infotafeln, kurze Wege, klarer Abflug
- **Gemeinschaftsflächen nah am Spawn:** Shopping District mit Netherportal, Projekt- bzw. Pilzinsel (monsterfrei) als späterer Ausbau. Unsere Spawn-Region lässt sich dafür freigeben (`spawn/AUFBAU.md`)
- **Vanilla-Gefühl mit Komfort-Datapacks** (Schlafquote, zusätzliche Rezepte). Das ist ein Thema der Server- und Modpack-Session, hier nur erwähnt

## Vorschaubilder (`bilder/`)

| Entwurf | oben | Seite | Spielersicht Spawn | Abflug | von unten | Extra |
|---|---|---|---|---|---|---|
| Felsinsel | `felsinsel-oben.png` | `felsinsel-seite.png` | `felsinsel-spawn.png` | `felsinsel-abflug.png` | `felsinsel-unten.png` | `felsinsel-wasserfall.png` |
| Weltenbaum (5. Fassung) | `weltenbaum-oben-schraeg.png`, `-krone-oben.png` | `weltenbaum-seite.png` | `weltenbaum-spawnraum.png`, `-treppe.png`, `-deck.png` | – | `weltenbaum-unten.png` | Tor innen zu/offen: `weltenbaum-tor-zu.png`, `-tor-offen.png`, außen `-tor-aussen.png`; Nacht: `weltenbaum-nacht-oben.png`, `-nacht-seite.png`, `-nacht-spawnraum.png`, `-nacht-tor.png`, `-nacht-terrassen.png`; Größe: `groessenvergleich.png` |

Gerendert mit einem einfachen Raycaster (Nachtansicht mit Lichtausbreitung wie im Spiel; das Karomuster der Bodenlichter ist ein Effekt des Renderers) (Blocktexturen, Wasser blau; kleine Dinge wie Zäune, Laternen, Schilder und Blumen werden weggelassen). Kulisse: Meer bzw. flache Wiese.
