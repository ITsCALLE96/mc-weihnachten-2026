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

1. **CraftAttack-12-Welt** (Community-Download nach Staffelende) – Pascal lädt am 23.10. (nicht vorher, blockiert die Leitung). Claude: `level.dat` auslesen (Version, Seed, Spawn), Vorschau rendern, Spawn als `.schem` ausschneiden, Plugin-Abhängigkeiten prüfen. Idee: CA12-Seed + Spawn an Originalkoordinaten = passt ins Gelände.
2. **Nitrado „Craft Attack Pack“** (Werbung bei SparkofPhoenix, Code `SPARKOFPHOENIX` −40 %): enthält laut Pascal den schwebenden CA-Spawn, die Trading-Insel und eine Map. Einen Monat mieten, per FTP Welt + Plugins holen, lokal auf Paper einrichten. Vorher Nitrado-Bedingungen zur Weiternutzung prüfen.
3. **Rückfall:** Bahnhof A (fertig umgewandelt) als schlichter Start.

### Seed-Kandidaten (eigene Suche, Vanilla 26.3)

| Nr. | Seed | Lage |
|---|---|---|
| 17 (Pascal) | `2452457394367175690` | bei -978 -550 Cherry Grove, Snowy Slopes 156 / Frozen Peaks 172 Blöcke entfernt; Schneeebene erst 3 km → Bahnhofsbereich per `/fillbiome` verschneien |
| 25 (Pascal) | `100000755979678208` | Weltspawn: Jagged Peaks 45, Grove 32, Snowy Plains 316, Ice Spikes 472; Cherry Grove 968 |
| 20 (Pascal) | `-3361685360695458093` | Jagged Peaks + Cherry Grove ~600 vom Spawn, ~200 auseinander |
| Suche | `5501184897758720731` | Jagged Peaks -528 -896, Ebene 160, Cherry Grove 183 |

Bei einer CA-Welt entfällt die Seed-Wahl ggf. (CA-Seed).

### Werkzeuge

- `node tools/schematic.mjs <eingabe.litematic> <ausgabe.schem>` – Litematica → WorldEdit (Sponge v2); Bahnhof A geprüft: 13.599 Blöcke, 79 Block-Entities wie im Original
- `node tools/vorschau.mjs <datei.schem> <ausgabe.png> <textures/block>` – Schrägansicht mit Vanilla-Texturen (aus dem 26.3-Client-Jar)
- `tools/schem.mjs` – Schematics lesen/bearbeiten/schreiben (einfügen, Blöcke ersetzen)
- Fremde Schematics liegen nur lokal in `spawn/quellen/` (git-ignoriert) – Lizenz unklar, Repo öffentlich. Namensnennung Bahnhof: emgvacation bzw. JPCore.
