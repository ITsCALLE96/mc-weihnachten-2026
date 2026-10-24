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

## 2. Weltenbaum – gewählt (Pascal 24.10.), dritte Fassung „Etagenkrone“ (`weltenbaum.mjs`)

Frühere Fassungen: `weltenbaum-klein.mjs` (erster Entwurf). Die zweite Fassung (runde Krone aus Laubwolken) steht in der Git-Historie (Commit `68169a6`).

**Von Pumis CA13-Baum inspiriert** (nur Prinzipien aus drei Screenshots, die Pascal gegeben hat; die liegen git-ignoriert in `spawn/quellen/pumi/`, nichts nachgebaut oder abgepaust):
1. **Breite Etagenkrone:** flache, wellige Laubschirme in gestaffelten Höhen, deutlich breiter als hoch, getragen von dicken, schräg auslaufenden Ästen; Unterseite zerfranst mit herabhängendem Laub
2. **Dunkles Laub auf dunklem, mächtigem Stamm**, der sich in mehrere Hauptäste teilt
3. **Heller, schlanker Turm am Stamm** als Blickfang, Aufstieg und Maßstab
4. **Wurzeln als Terrassenhügel** mit Moos und Gras und **Reihen kleiner Lichter auf den Stufen**
5. **Nachts ein Teppich aus kleinen warmen Lichtpunkten auf der Kronenoberseite** als Wahrzeichen
6. Der Baum als **Mittelpunkt einer bebauten Fläche** (passt zu „später weiterbauen“)

Aus dem Video-Transkript (Recherche der Leitung) zusätzlich belegt und übernommen: **Augenblüten auf der Krone** als Nachteffekt (öffnen sich nachts, der Baum „funkelt“), **Laternen an den Ästen** (bei Pumi geplant, nicht mehr gebaut), **Pflanzen-Laternen** („Blütenblätter“ mit Laterne vorne), **Kerzen** als Lichtpunkte, **Stamm innen aus Amethyst** offen sichtbar, **fallendes Laub** (Vanilla-Partikel bei dichtem Laub). Pumis Problem mit Mobs und einem Creeper auf der Krone lösen bei uns Pilzland und WorldGuard (keine Explosionen).

**Unser eigenes Design** (Formen, Maße, Materialien und Aufteilung sind eigene):
- **Maße:** Ausschnitt 270 × 200 × 270, Boden lokal y 14. Bei Boden auf y 64 liegt die **Spawnfläche auf y 174** (110 über dem Boden), der Turm endet mit Spitze bei y ~191. **Krone ~215 × 185 Blöcke** in sieben Schirmen; alles im Umkreis von ~110 Blöcken um den Stamm, bei Sichtweite 8 also geladen
- **Stamm:** gefurchter Kern plus acht gedrehte Stränge, unten ~46 breit ausgestellt, Teilung auf ~58 Blöcken Höhe. Rinde Dunkeleiche/Fichte mit Moosflecken
- **Krone:** sieben Laubschirme (der höchste 140 × 112 mit dem Spawnplatz), Dicke 8–14, Oberseite wellig, Unterseite gewölbt. An den Unterseiten herabhängende Laubstränge und Leuchtbeeren, viele Laternen an Ketten
- **Laub (Materialwahl):** in Flecken gemischt: 40 % Dunkeleiche, 30 % Fichte, 20 % Azalee, 5 % blühende Azalee, 5 % Blasse Eiche. Fichte, Azalee und Blasse Eiche haben feste Farben, Dunkeleiche wird im Pilzland kräftig grün. Zusammen wirkt das dunkel und abwechslungsreich. Das fast schwarze Laub bei Pumi kommt vermutlich vom Shader
- **Kronenoberseite:** Moosflecken mit **~8.000 offenen Augenblüten** (der Pumi-Nachteffekt), dazwischen wenige Kerzen als warme Akzente. **Augenblüten in 26.3 geprüft:** Sie wachsen auf Moos, Erde, Wurzelerde, Schlamm, Gras und Ackerboden (Tag `supports_vegetation`), nicht auf Laub, deshalb die Moosschicht. Die Blume auf Pumis Bild 2 (weiße Blütenblätter, orange Mitte) ist die offene Augenblüte, das Auge ist eine emissive Textur. **Gemessen auf dem 26.3-Server: kein Blocklicht** (geschlossener Hohlraum bleibt dunkel, mit Fackel hell). Sie funkelt nur, das Licht kommt aus Laternen, Kerzen und Leuchtbeeren
- **Blütenlaternen:** Holzstiel mit Azaleen-Blütenblatt und Laterne vorne, am Rand des Spawnplatzes und entlang der Abflugwege
- **Herzkammer im Stamm:** hohler Raum am Fuß (Radius 7, 25 hoch), offen mit Amethyst ausgekleidet, schwebende Balken, Amethyst-Kristalle, Laterne an einer Kette. Eingänge von den Terrassen im Norden und Osten
- **Spawn:** Holzdeck (Radius 17) **oben auf dem höchsten Schirm unter freiem Himmel**, Ring aus Froschlicht, Infotafeln, Geländer. **Drei Abflugwege** (Südwest, Nordwest, Ost) führen über die Schirmoberseite bis über die Kante
- **Turm** (Kalzit mit Bändern aus dunklem Prismarin, hellblaue Fenster, Leuchtkern aus Seelaternen, Amethyst-Dach mit Endstab) an der Südseite des Stamms, vom Boden bis über den Spawnplatz. Türen unten und oben
- **Terrassenwurzeln:** sieben Rücken in Stufen von 2 Blöcken, Moos und Gras, Wurzelstränge brechen heraus. **Kerzenreihen auf den Stufenkanten**, Augenblüten dazwischen
- **Nacht:** Augenblüten funkeln auf der ganzen Krone, ~630 Kerzen (Terrassenkanten und Akzente auf der Krone), Laternen, Leuchtbeeren, Seelaternen im Turm, Froschlicht am Platz
- Rückweg-Plattform im Stil „wurzel“ zwischen den Terrassen (Ort nach der Seed-Wahl)

**Pilzland um den Baum (Pascal 24.10.)** – geprüft an den Spieldaten von 26.3 (`worldgen/biome/mushroom_fields.json` und Biom-Tags im offiziellen Server-Jar):
- **Natürliche Spawns** sind nur Fledermaus (Höhlen), Pilzkuh (nur auf Myzel, auf Gras also keine) und Leuchttintenfisch (unter Wasser). **Keine Monster in keiner Höhe**, auch keine Schleime
- **Plünderer-Patrouillen:** aus (`can_pillager_patrol_spawn: false`). **Zombie-Belagerungen:** aus (Tag `without_zombie_sieges`). **Wanderhändler:** kommen weiter (nicht im Ausschluss-Tag), passt zum Händler-Datapack
- **Bleiben trotzdem:** **Phantome** spawnen unabhängig vom Biom (laut Minecraft-Wiki und Mojang-Bug MC-126778), **Entscheidung Pascal (24.10.): Phantome bleiben Vanilla** (keine Gamerule-Änderung). **Spawner** (Verliese, Trial Chambers) spawnen weiter, wenn welche im Bereich liegen, das prüfe ich nach der Seed-Wahl. **Überfälle** brauchen ein Dorf, im Pilzland gibt es keine Patrouillen, die das Böse Omen bringen
- **Höhlen darunter:** Biome sind in 26.3 dreidimensional. Die Spawn-Technik setzt `fillbiome` von y −64 bis 319, in 8 × 8-Säulen (24.576 Blöcke je Befehl, unter der Grenze 32.768). Damit sind auch Höhlen und die Luft bis zur Bauhöhe Pilzland
- **Farben:** Das Pilzland hat in 26.3 keine eigenen Gras- und Laubfarben mehr, sie kommen aus Temperatur 0,9 und Niederschlag 1,0. Das ist die sattgrüne Ecke der Farbtabelle (ähnlich Dschungel, heller und kräftiger als Wald). Gras bleibt Gras, kein Myzel nötig. Eichen- und Dunkeleichenlaub wird ebenfalls kräftig grün, Azaleenlaub bleibt unverändert
- **Größe:** Baum plus 30 Blöcke Rand, als Oval Mitte (131/122 im Entwurf), Halbachsen 125 × 102, etwa 40.000 Spalten, 670 `fillbiome`-Befehle. Wurzeln, Rückweg-Plattform und der Landeplatz unter der Krone liegen sicher drin
- **Licht ist damit Stimmung:** Sichtbare Lichter bleiben (Laternen, Leuchtbeeren, Pilzlicht, Froschlicht). Die Pflicht-Ausleuchtung (jede begehbare Stelle ≥ 1) läuft nur noch mit `PFLICHTLICHT=1`, falls das Pilzland wegfällt. Die Nachtansicht bleibt Teil der Abnahme
- Technik: Feld `pilzland` in der Standort-Konfiguration, `insel:aufbau` ruft `insel:pilzland` auf

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
| Weltenbaum (Etagenkrone) | `weltenbaum-oben-schraeg.png` | `weltenbaum-seite.png` | `weltenbaum-spawn.png`, `weltenbaum-platz.png` | – | `weltenbaum-unten.png` | Herzkammer: `weltenbaum-herzkammer.png`; Nacht: `weltenbaum-nacht-oben.png`, `-nacht-seite.png`, `-nacht-platz.png`, `-nacht-terrassen.png`; Plattform: `weltenbaum-plattform-wurzel.png` |

Gerendert mit einem einfachen Raycaster (Nachtansicht mit Lichtausbreitung wie im Spiel; das Karomuster der Bodenlichter ist ein Effekt des Renderers) (Blocktexturen, Wasser blau; kleine Dinge wie Zäune, Laternen, Schilder und Blumen werden weggelassen). Kulisse: Meer bzw. flache Wiese.
