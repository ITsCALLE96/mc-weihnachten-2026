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

- **Spawnpunkt (erst 60/179/22, seit 24.10. nachmittags 64/179/29, siehe Insel v2) statt 64/179/37.** Der CA12-Spawn liegt unter der Amethyst-Kuppel. In 26.3 setzt das Spiel Spieler auf den obersten Block der Spalte, wenn darüber etwas ist (dort wäre das der Drachenflügel auf 217). Bei 60/22 steht man auf Gras auf der Hauptebene 178 mit freiem Himmel, Blick nach Süden zur Kuppel. Der Großteil der offenen Ebene ist ein unsichtbarer Barrier-Boden über dem Inselloch, sichtbarer Boden mit freiem Himmel gibt es nur am Nord- und Südrand.
- **Datapack `spawn/datapack/insel/`** (nach `world/datapacks/`, danach einmal `function insel:aufbau` in der Konsole):
  - Rückweg-Plattform 5×5 im Flachwasser am Strand unter der Insel (x 72–76, z 20–24, y 62, schlicht: polierter Andesit, Seelaterne in der Mitte; Aussehen entscheidet Pascal). Wer darauf steht, wird auf den Spawn teleportiert. Das wirkt ohne OP.
  - Elytra: Spawn Elytra gibt keine echte Elytra. Im Bereich um den Weltspawn startet ein Doppelsprung den Flug, nach dem Teleport also sofort wieder. Bereich `spawnRadius: 65` (Kreis um den Weltspawn 64/179/29, Höhe zählt mit; deckt den Platz (weitester Punkt ~34) und die Bauminseln). So reicht er bis zur Ostspitze, die Plattform unten liegt außerhalb.
  - 370 unsichtbare Lichtblöcke (für Insel v2 neu berechnet) (Level 15) im Raster von 6 Blöcken: auf Boden bzw. Wasser unter der Insel und direkt unter ihrer Unterseite (`lichter.mcfunction`, erzeugt mit `node tools/schem-licht.mjs <welt> 14 -19 128 69 115 6` aus der Testwelt mit gleichem Seed, gilt also auch für die echte Welt)
  - setzt Weltspawn (`setworldspawn 64 179 29 0 0`, in 26.3 mit zwei Winkelwerten) und `respawn_radius 0`
- **WorldGuard `spawn/worldguard/regions.yml`** (nach `plugins/WorldGuard/worlds/world/regions.yml`):
  - `spawn`: x 14…128, z −19…69, volle Höhe. Keine Monster (`mob-spawning deny`), dauerhaft satt (`feed-amount 20`, `feed-delay 1`), kein PvP, Truhen zu, kein Feuer und keine Explosionen, Türen und Knöpfe benutzbar
  - `spawn_bauverbot`: 150 um 64/37, nur Bauen verboten

Reihenfolge in der echten Welt: Insel v2 einfügen (`/tp 24 64 -9`, `//schem load ca12-spawn-v2`, `//paste -e`), Datapack `insel` rein, `function insel:aufbau`, `regions.yml` rein, `/rg load -w world`.

### Insel v2: hängendes Design vollständig (2026-10-24)

Pascal sah unter der Insel „komische Sachen“ schweben. Ursache: Der erste Ausschnitt endete bei y 115 und hat alles abgeschnitten, was unter dem Drachen hängt. Übrig blieben Stummel an der Unterkante (z.B. die Drachenklaue bei 54–57/115–117/17–20). Unter der Insel hängen in CA12:
- die Kette aus poliertem Andesit mit dem Schriftzug „CRAFT ATTACK“, bis y 64 (knapp über dem Meer)
- die Drachenklaue (grüne/hellgrüne Terrakotta, Quarzkrallen) und ein kleiner Drache an der Kette
- ein zweiter lila Kristall-Anhänger (58–70/73–87/22–34), der erste schwebt bei 34–46/118–132/1–13
- Ranken bis zum Wasser

In CA12 ist das mit einem Spielerbau verwachsen (dunkles Prismarin/Fichte, x 20–46, y 63–92). Deshalb kein einfacher Kasten, sondern eine Auswahl (`spawn/quellen/insel-v2.mjs`, git-ignoriert wie die Quellen): alles aus dem alten Kasten, dazu nach unten alle verbundenen Design-Blöcke ab x 44 sowie der freie Anhänger. Die Endstäbe bei x 34–38 sind Licht des Spielerbaus und nicht dabei.
→ `spawn/quellen/ca12-spawn-v2.schem`: 95×175×69, Ursprung **24/64/−9**, 30.843 Blöcke (1.616 davon unter y 115), Vorschau `ca12-spawn-v2.png`. Einfügen: `/tp 24 64 -9`, `//schem load ca12-spawn-v2`, `//paste -e`.

`tools/schem-welt.mjs ausschneiden` warnt jetzt, wenn Blöcke an einer Seite des Kastens anstoßen (beim alten Ausschnitt: „unten 18“).

**Spawnpunkt (Analyse für Pascal):** Die obere Spawnfläche ist ein ovaler Platz auf y 178 (x ~52–86, z ~19–55). Fast die ganze Mitte ist ein **unsichtbarer Barrier-Boden** über einer 6 Blöcke tiefen Senke, in der Mitte stehen die Kuppel mit Glasboden und das Drachenei bei 64/37. Draufsicht: `spawn/quellen/spawnflaeche-oben.png`. Eine Streuung über die Fläche (`respawn_radius` > 0) geht nicht sicher, weil das Spiel gestreute Spieler auf den obersten Block ihrer Spalte setzt, also auf Drache, Bäume oder Kuppel. Deshalb ein fester Punkt mit `respawn_radius 0`.

**Entschieden (Pascal, 24.10.): Spawn 64/179/29 und Insel v2.** Mitten auf dem Platz, 8 Blöcke vor der Kuppel, Blick zu ihr, auf dem unsichtbaren Boden (freier Himmel, sonst setzt 26.3 Spieler auf den Drachen). Auf dem Testserver umgesetzt: alte Lichter entfernt, v2 per `place template spawn:ca12v2 24 64 -9` (deckt die alte Insel exakt ab, die Stummel hängen jetzt an der Kette), Lichter neu (370), Region `spawn` und Elytra-Radius 65 decken v2 ganz ab.

**Rückweg-Plattform neu (Pascal, 24.10.: „ja gefällt mir“):** mittig unter der Insel, Mitte 64/62/29, direkt unter dem zweiten Kristall-Anhänger, Spawn senkrecht darüber. Rund, Radius 4, 125 Blöcke im Stil der Insel: Froschlicht-Mitte, Amethyst-Kreuz, lila Ring mit schwarzen Diagonalen, poliertes Andesit, Steinziegel-Rand mit Moos und Treppenkante, vier Amethyst-Säulen auf weinendem Obsidian mit Endstab, vier Laternen auf Mauern. Auslöser: Umkreis 4 um die Mitte. Datei `spawn/datapack/insel/data/insel/function/plattform.mcfunction` (erzeugt mit `spawn/plattform.mjs`), `aufbau` ruft sie auf. Vorschau `spawn/quellen/plattform-oben.png`, `plattform-seite.png`. Liegt in Region `spawn`; die alte Plattform bei 72–76/20–24 ist auf dem Testserver wieder Wasser.

### Warum die Insel in 26.3 nicht wie in CA12 aussieht (2026-10-24)

Höhenkarten von CA12 (1.21.1) und frisch erzeugtem 26.3-Gelände (gleicher Seed, Chunky-Lauf Radius 1.600 im Scratchpad) verglichen: Das natürliche Gelände ist gleich, die Weltgenerierung hat sich nicht geändert. Der Unterschied ist **Terraforming durch das CA-Team**: Nördlich der Insel ist in CA12 das Meer auf rund 430 × 580 Blöcken (x −8…423, z −512…71, ~163.000 Spalten) zu einer flachen Bauebene auf y 67–75 aufgeschüttet, 16 Blöcke Erde über dem Meeressand, Biom Pilzland (dort erscheinen keine Monster). Unter der Insel blieb ein Kanal zwischen dieser Ebene und dem natürlichen Hügel im Süden. In 26.3 fehlt die Aufschüttung, die Insel steht über offenem Meer an der Küste des Hügels („hängt seitlich an Land“).

- **Kandidat A (Empfehlung):** Boden der Aufschüttung aus CA12 übernehmen (nur Erde/Gras/Sand/Stein/Wasser, ohne Gebäude, Gebäudereste unter der Oberfläche als Erde, Oberfläche Gras), Insel v2 an der Originalposition. Ergibt das CA12-Bild ohne Spielerbauten. Optional Biom Pilzland per `/fillbiome` wie in CA12.
- **Plan B (natürliches Gelände):** B1 1096/160 (Bucht zwischen Strand und Ebene), B2 144/1040 (Bucht mit etwas Schnee). Bewertet mit Höhenkarten: Insel samt Kette und 20 Blöcken Rand nur über Wasser, kein Gelände über y 105 im Umkreis 160. Am CA12-Seed gibt es kaum Schnee in der Nähe.
- Vorschauen (git-ignoriert): `spawn/quellen/vergleich-{ca12,263,a}-{seite,spawn,unten}.png`, `kandidat-b{1,2}-{seite,spawn}.png`, Differenzbild `vergleich-ca12-263.png`.

**Entschieden (Pascal, 24.10.): Kandidat A mit Pilzland-Biom.** Umgesetzt mit `tools/schem-aufschuettung.mjs` (164.248 Spalten, 59 Kacheln, Daten lokal in `spawn/quellen/datapacks/`), Ablauf und Werkzeuge in `spawn/AUFBAU.md`, Neuaufbau lokal mit `spawn/neu-aufsetzen.sh`, Prüfliste `spawn/PRUEFLISTE.md`. Plattform bleibt bei 64/62/29 (7 Blöcke Wasser am Südufer, nach Norden öffnet sich der Kanal), Lichter für das neue Gelände neu berechnet (369/370, 33 Positionen anders).

**Nach Pascals Test der frischen Welt (24.10.):** Lichter nur noch im Oval um den Insel-Umriss (138 statt 369, nur Boden/Wasser), Spawnschutz-Region `spawn` als Oval-Polygon, `spawn_bauverbot` entfällt, Rückweg mit Portal-Übergang (3,5 s). Live per RCON auf dem Testserver eingespielt.
