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

## Entscheidung (2026-10-22)

**C + A:** Central Spawn Hub als Platz, Winter Train Station als Blickfang in einem Viertel; die übrigen Viertel bleiben für die Marktstände (Phase 3).

- Die Dateien liegen nur lokal in `spawn/quellen/` (git-ignoriert) – wegen der unklaren Lizenz nicht im öffentlichen Repo.
- A umgewandelt mit `node tools/schematic.mjs spawn/quellen/winter-train-station-build.litematic spawn/quellen/winter-train-station.schem` (Stichprobe: 13.599 Blöcke, 79 Block-Entities wie im Original).
- C ist Sponge v2 aus 1.17 (DataVersion 2730) – WorldEdit aktualisiert die Blöcke beim Laden; „Verwintern“ (Kupfer/Quarz → Fichte/Schnee) erst auf dem Server per `//replace`.
- Namensnennung am Spawn: IrishMonke (C), emgvacation bzw. JPCore laut Datei (A).
