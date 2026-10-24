# Spawn-Kandidaten (kostenlos)

Alle von mc-schematics.com, Download ohne Anmeldung. **Lizenz:** Die Seite nennt keine ausdrückliche Lizenz, nur „kostenlos herunterladen“ (+ Takedown-Hinweis). Für einen privaten, nicht kommerziellen Server mit Namensnennung des Erbauers am Spawn vertretbar, aber keine saubere Freigabe — siehe Option E.

| | Name | Größe | Format | Passt weil | Haken |
|---|---|---|---|---|---|
| **A** | [Winter Train Station](https://mc-schematics.com/s/winter-train-station-build-e319b55259) (emgvacation) | 65×48×77 | .litematic | Verschneiter Bahnhof mit Girlanden – Story „alle kommen mit dem Zug an“ | Nur .litematic → muss in .schem umgewandelt werden; eher Gebäude als Platz |
| **B** | [Christmas Fantasy House Pack](https://mc-schematics.com/s/christmas-fantasy-house-pack-148a5d5e5b) (glitchscraps) | ~60×60 | .schem | Sehr weihnachtlich (rot/grün/Schnee), Blickfang | Wirkt wie ein großes Schloss, wenig freie Platzfläche für Stände |
| **C** | [Central Spawn Hub](https://mc-schematics.com/s/central-spawn-hub-b2fc4eecd9) (IrishMonke) | 101×37×101 | .schem | Großer Platz mit 4 Vierteln – ideal für Marktstände | Moderner Kupfer/Quarz-Stil, muss stark „verwintert“ werden |
| **D** | [Villager Market Hub](https://mc-schematics.com/s/villager-market-hub-769874688b) (77Helly) | klein (1.346 Blöcke) | .schem | Markthalle | Zu klein als alleiniger Spawn |
| **E** | Eigenbau per WorldEdit-Skript | ~70×70 | – | Saubere Lizenz; Dorfplatz mit Tannenbaum, Ständen, Schnee nach unserem Plan | Schlichter als A/B |

**Empfehlung:** **C als Grundfläche + B oder A als Blickfang** in einem Viertel. Die anderen Viertel bleiben frei für die Marktstände in Phase 3. Wenn die unklare Lizenz stört: **E**.

Vorschaubilder: siehe Links.

## Stand (2026-10-22 abends)

**Kein Eigenbau-Spawn vor dem Start.** Gestaltung macht Pascal, Claude die Technik. Der selbst generierte Polarexpress (Wagen per Skript) sah nicht gut aus und ist verworfen; fertige Polarexpress-Baupläne gibt es nur für die Create-Mod (nicht Vanilla). Planet-Minecraft-Spawns sind zu alt. Polarexpress, Marktplatz (leer, nur Boden + riesiger Weihnachtsbaum) und Villager-Handel können später **ingame** gebaut werden.

Spawn-Quelle, in dieser Reihenfolge:

1. **Favorit: Nitrado „Craft Attack Pack“** (Werbung bei SparkofPhoenix, Code `SPARKOFPHOENIX` −40 %): enthält laut Pascal den schwebenden CA-Spawn, die **One-Way-Elytra**, die Trading-Insel und eine Map. Einen Monat mieten, per FTP Welt + Plugins holen, lokal auf Paper einrichten. Die Insel schwebt → lässt sich auf jeden eigenen Seed setzen. Vorher Nitrado-Bedingungen zur Weiternutzung prüfen.
2. **Vergleich: CraftAttack-12-Welt** (Community-Download nach Staffelende) – Pascal lädt am 23.10. (nicht vorher, blockiert die Leitung). Claude: `level.dat` auslesen (Version, Seed, Spawn), Vorschau rendern, Spawn als `.schem` ausschneiden, Plugin-Abhängigkeiten prüfen.
3. **Rückfall:** Bahnhof A (fertig umgewandelt) als schlichter Start.

### Seed-Kandidaten (eigene Suche, Vanilla 26.3)

| Nr. | Seed | Lage |
|---|---|---|
| 17 (Pascal) | `2452457394367175690` | bei -978 -550 Cherry Grove, Snowy Slopes 156 / Frozen Peaks 172 Blöcke entfernt; Schneeebene erst 3 km → Bahnhofsbereich per `/fillbiome` verschneien |
| 25 (Pascal) | `100000755979678208` | Weltspawn: Jagged Peaks 45, Grove 32, Snowy Plains 316, Ice Spikes 472; Cherry Grove 968 |
| 20 (Pascal) | `-3361685360695458093` | Jagged Peaks + Cherry Grove ~600 vom Spawn, ~200 auseinander |
| Suche | `5501184897758720731` | Jagged Peaks -528 -896, Ebene 160, Cherry Grove 183 |

**Entschieden (Pascal, 24.10.): CA12-Seed `1560698989`** – die Kandidaten oben sind damit raus.

### Werkzeuge

- `node tools/schematic.mjs <eingabe.litematic> <ausgabe.schem>` – Litematica → WorldEdit (Sponge v2); Bahnhof A geprüft: 13.599 Blöcke, 79 Block-Entities wie im Original
- `node tools/vorschau.mjs <datei.schem> <ausgabe.png> <textures/block>` – Schrägansicht mit Vanilla-Texturen (aus dem 26.3-Client-Jar)
- `tools/schem.mjs` – Schematics lesen/bearbeiten/schreiben (einfügen, Blöcke ersetzen)
- Fremde Schematics liegen nur lokal in `spawn/quellen/` (git-ignoriert) – Lizenz unklar, Repo öffentlich. Namensnennung Bahnhof: emgvacation bzw. JPCore.
- `tools/schem-welt.mjs` – fertige Welt (Nitrado-Pack, CA12) auswerten und ausschneiden, nur lesend:
  - `info <welt>` – Version, Seed, Spawn, Datapacks aus `level.dat`
  - `umriss <welt> <x> <z> <radius> <minY>` – Kasten aller Blöcke ab `minY` (findet schwebende Inseln)
  - `ausschneiden <welt> <x1> <y1> <z1> <x2> <y2> <z2> <aus.schem>` – Blöcke + Block-Entities + Entities (Villager, Rüstungsständer, Rahmen) → `//paste -e`
  - kann Welten ab 1.18 und das neue 26.x-Layout (`dimensions/minecraft/overworld/`); an einer echten 26.3-Testwelt geprüft

## Analyse CraftAttack-12-Welt (2026-10-24)

Quelle: `CraftAttack-12-Map.zip` (2,5 GB, über Pascals Nitrado-Miete), nur lokal in `spawn/quellen/` (git-ignoriert). Enthält **nur die Welt** (Paper-Weltordner mit `paper-world.yml`), **keinen** `plugins/`-Ordner. Spielerdaten der echten CA-Spieler (`playerdata/`, `stats/`) wurden nicht entpackt.

| | Wert |
|---|---|
| Version | 1.21.1 (DataVersion 3955), Paper |
| Seed | `1560698989` |
| Weltspawn | 64 / 179 / 37 – auf der schwebenden Insel |
| Datapacks | Vanilla Tweaks (armor statues, mini blocks, more mob heads, player head drops, unlock all recipes), `CALightblocks`, `SIT DOWN`, `enderdragon_12` (inaktiv) |

**Spawn-Insel** (Drache mit „CRAFT ATTACK“-Schriftzug an einer Kette, Baum, Unterschriften-Schilder der CA-Teilnehmer): Kasten x 24…118, y 115…238, z −9…59 → `spawn/quellen/ca12-spawn.schem` (95×124×69, 29.227 Blöcke, 92 Block-Entities: 77 Schilder, Truhen, Fässer; 487 Barrier-Blöcke = unsichtbare Wände). Vorschau: `spawn/quellen/ca12-spawn.png`. Schwebt frei → passt auf jeden Seed.

**Trading-Insel:** in dieser Welt **nicht vorhanden**. Die zweite schwebende Insel (x 220…254, z 145…181, Heißluftballon) ist ein Spielerbau (`ca12-insel2.schem`). Handel lief in CA12 über Spielershops am Boden.

**One-Way-Elytra:** kommt aus einem Plugin, nicht aus der Welt. Original: CloudCraft „CraftAttack“ (nur Paper 1.21.1, braucht CommandAPI + CloudCore). **Ersatz für 26.3:** [Spawn Elytra – like in Craft Attack](https://modrinth.com/plugin/spawnelytra) (MIT, Paper/Purpur, 26.3 unterstützt, Doppelsprung = Gleiten, F = Boost, Bedrock/Geyser-tauglich).

**Einfügen in 26.3:** WorldEdit wandelt die 1.21.1-Schematic beim Einfügen um (DataVersion steht in der Datei). Namensnennung am Spawn: „Spawn: CraftAttack 12“.

### CA12-Seed unter 26.3 und Lage der Insel (2026-10-24)

Testwelt mit Vanilla-Server 26.3 und Seed `1560698989` lokal erzeugt (nur Scratchpad, Bereich x −48…192, z −112…176):

- **Gelände wie in CA12:** Die Weltgenerierung von 1.21.1 und 26.3 ist hier gleich. Unter der Inselposition liegt offenes Meer auf Höhe 62. Westlich (x < 0) steigt Land bis 102 an, südlich (z > 40) liegen Hügel mit 70–110. Die Erhebungen in CA12 bei x 16…56, z 8…32 (bis 114) sind Spielerbauten, im frischen 26.3-Gelände ist dort Wasser.
- **Natürlicher Weltspawn unter 26.3:** −48 / 102 / 64, auf dem Hügel westlich, etwa 120 Blöcke vom Inselmittelpunkt. Der CA12-Spawn 64/179/37 war von Hand gesetzt (auf der Insel), nicht der natürliche Spawn.
- **Lage der Insel: Originalposition übernehmen.** Kasten x 24…118, y 115…238, z −9…59. Die Unterseite liegt 53 Blöcke über dem Meer, gut 35 über den Hügeln im Süden, die Spitze bei 238 bleibt unter der Bauhöhe 320. So sieht sie aus wie in CA12. Vorschau: `spawn/quellen/lage-26.3.png` (Wasser wird nicht gezeichnet).
- **Einfügen:** `/tp 24 115 -9`, `//schem load ca12-spawn`, `//paste -e` (die Schematic hat Offset 0, die untere Nordwest-Ecke landet auf der Spielerposition). Danach `/setworldspawn 64 179 37`, Spawn-Streuung (Gamerule `spawnRadius`, ab 1.21.11 `respawn_radius`, Namen auf dem Server prüfen) auf 0, sonst landen Neulinge neben der Insel im Meer.
- **Mittelpunkt für Weltgrenze und Chunky:** x 64, z 37 (Spawnpunkt auf der Insel). `worldborder center 64 37`, `worldborder set 10000`, `chunky center 64 37`, `chunky radius 5000` (Quadrat).

`tools/schem-welt.mjs` liest jetzt auch die echte 26.3-Palette (Einträge als Text, `{"": Text}` oder `{id, properties}`), Test ergänzt.

### Spawn-Technik für die echte Welt (2026-10-24, auf dem lokalen Testserver geprüft)

Erster Test von Pascal: Spawnpunkt falsch, kein Rückweg, Monster unter der Insel. Gelöst mit Dateien im Repo:

- **Spawnpunkt 60/179/22 statt 64/179/37.** Der CA12-Spawn liegt unter der Amethyst-Kuppel. In 26.3 setzt das Spiel Spieler auf den obersten Block der Spalte, wenn darüber etwas ist (dort wäre das der Drachenflügel auf 217). Bei 60/22 steht man auf Gras auf der Hauptebene 178 mit freiem Himmel, Blick nach Süden zur Kuppel. Der Großteil der offenen Ebene ist ein unsichtbarer Barrier-Boden über dem Inselloch, sichtbarer Boden mit freiem Himmel gibt es nur am Nord- und Südrand.
- **Datapack `spawn/datapack/insel/`** (nach `world/datapacks/`, danach einmal `function insel:aufbau` in der Konsole):
  - Rückweg-Plattform 5×5 im Flachwasser am Strand unter der Insel (x 72–76, z 20–24, y 62, schlicht: polierter Andesit, Seelaterne in der Mitte; Aussehen entscheidet Pascal). Wer darauf steht, wird auf den Spawn teleportiert. Das wirkt ohne OP.
  - Elytra: Spawn Elytra gibt keine echte Elytra. Im Bereich um den Weltspawn startet ein Doppelsprung den Flug, nach dem Teleport also sofort wieder. Bereich `spawnRadius: 65` (Kreis um 60/179/22, Höhe zählt mit). So reicht er bis zur Ostspitze, die Plattform unten liegt außerhalb.
  - 372 unsichtbare Lichtblöcke (Level 15) im Raster von 6 Blöcken: auf Boden bzw. Wasser unter der Insel und direkt unter ihrer Unterseite (`lichter.mcfunction`, erzeugt mit `node tools/schem-licht.mjs <welt> 14 -19 128 69 115 6` aus der Testwelt mit gleichem Seed, gilt also auch für die echte Welt)
  - setzt Weltspawn (`setworldspawn 60 179 22 0 0`, in 26.3 mit zwei Winkelwerten) und `respawn_radius 0`
- **WorldGuard `spawn/worldguard/regions.yml`** (nach `plugins/WorldGuard/worlds/world/regions.yml`):
  - `spawn`: x 14…128, z −19…69, volle Höhe. Keine Monster (`mob-spawning deny`), dauerhaft satt (`feed-amount 20`, `feed-delay 1`), kein PvP, Truhen zu, kein Feuer und keine Explosionen, Türen und Knöpfe benutzbar
  - `spawn_bauverbot`: 150 um 64/37, nur Bauen verboten

Reihenfolge in der echten Welt: Insel einfügen (`/tp 24 115 -9`, `//schem load ca12-spawn`, `//paste -e`), Datapack `insel` rein, `function insel:aufbau`, `regions.yml` rein, `/rg load -w world`.
