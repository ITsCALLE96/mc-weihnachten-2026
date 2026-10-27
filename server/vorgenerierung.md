# Welt vorgenerieren mit Chunky (Pflicht vor dem Start)

Neue Chunks zu erzeugen ist das Teuerste, was ein Minecraft-Server tut. Fliegen 25 Spieler mit Elytra in verschiedene Richtungen, bremst das den Server. Deshalb wird die Welt
vorher innerhalb der Weltgrenze komplett erzeugt. Läuft ohne Spieler, über Nacht oder tagsüber, wenn niemand spielt.

> **Kurswechsel 24.10. (Spawn-&-Welt-Session):** Die CA12-Insel mit Aufschüttung bleibt nur Platzhalter auf dem lokalen Testserver. Die echte Welt bekommt einen eigenen
> Spawn (Pascal wählt zwischen Felsinsel und Weltenbaum, `spawn/entwuerfe/README.md`). **Seed, Spawnpunkt und Mittelpunkt der Weltgrenze sind damit neu offen.** Die Werte
> unten (Seed `1560698989`, Spawn 64/179/29, Mittelpunkt 64/37, Aufschüttung + Insel v2) gelten bis dahin nur für den Testserver. Ablauf und Radien bleiben.

Werkzeug: **Chunky 1.5.3** (Modrinth `chunky`, GPL-3.0, Prüfsumme in `plugins.md`).

## Wann

| Welt | Wann | Radius |
|---|---|---|
| **Testwelt** | vor dem Lasttest (Plan Task 2 Schritt 7), spätestens vor dem Testlauf 21.11. | mindestens **2.500** (Overworld), Nether 650. Dabei Dauer und Größe messen |
| **Endgültige Welt** | **direkt nach dem Erzeugen in Task 10 Schritt 4 (bis 28.11.)**, auf jeden Fall vor dem ersten Spielerbeitritt. **Erst Spawn-Aufbau (Aufschüttung + Insel, unten), dann Chunky** | Overworld **5.000**, Nether **1.250**, End **2.000** |

## Weltgrenze

- Overworld: `worldborder set 10000` (Durchmesser = 2 × Radius), Mittelpunkt `worldborder center <x> <z>`
- Nether: eigener Wert `execute in minecraft:the_nether run worldborder set 2500` (Paper führt die Dimensionen als eigene Welten. Ob der Nether in 26.3 die Grenze der
  Overworld automatisch mit 1/8 übernimmt, prüfe ich auf dem Server. Der Befehl schadet in keinem Fall)
- End: `execute in minecraft:the_end run worldborder set 10000` (Elytra-Flüge nach außen bleiben möglich, nur nicht endlos)
- **Mittelpunkt = Spawn:** Liegt die Spawn-Insel nicht bei 0/0, kommen Weltgrenze und Chunky-Mittelpunkt auf die Spawn-Koordinaten.
  **Entschieden (Leitung 24.10.):** Seed ist der CA12-Seed `1560698989`, Weltgrenze 10.000 × 10.000 um den Spawn, vorgeneriert bis zur Grenze.
  **Mittelpunkt x 64 / z 37** (Spawn-&-Welt-Session, 24.10.: Spawn auf der CA12-Insel, `spawn/KANDIDATEN.md`). Nether entsprechend 8 / 5 (÷ 8, gerundet)
- Chunky übernimmt Form und Mittelpunkt: `chunky center <x> <z>` · `chunky shape square` · `chunky radius 5000`

## End: ja, im Radius 2.000

Meine Entscheidung (Leitung hat sie mir überlassen):
- Das End öffnet erst am 26.12. Dann fliegen viele Spieler auf einmal zu den äußeren Inseln (Elytra, Endstädte). Das ist genau die Last, die Vorgenerierung verhindern soll
- End-Chunks sind fast leer und schnell erzeugt. Radius 2.000 (ab ~1.000 beginnen die äußeren Inseln) kostet wenig Zeit und Platz
- Die Dimensionssperre hält Spieler fern. Chunky erzeugt trotzdem, weil es ohne Spieler arbeitet. Die Hauptinsel mit dem Drachen wird dabei nur als Gelände erzeugt.
  **Prüfen:** Nach der Vorgenerierung muss der Drachenkampf beim ersten Betreten am 26.12. normal starten (Testwelt: einmal mit OP ins End, Drache da, Welt danach verwerfen)

## Dauer und Platz

**Gemessen 27.10. im Testnetz (Pascals PC):** Overworld r = 5.000 = 393.129 Chunks in **19:37 min** (~330 Chunks/s), Welt **3,8 GB** (~9,7 KB pro Chunk), dazu der LSS-LOD-Store
unter `<welt>/lss-lod/` (gemessen 1,6 GB nach ~1 GB Auslieferung, Momentaufnahme, `kapazitaet.md`). Auf VM200 (i7-9850H, weniger Kerne für die VM, Laptop drosselt unter Dauerlast) rechne ich mit
**dem 2- bis 3-Fachen, also ~40–60 min** für die Overworld, plus ~10 min für Nether und End. Ein Abend reicht, ohne Spieler auf dem Server.

| Welt | Chunks | Dauer auf VM200 (geschätzt aus der Messung) | Platz |
|---|---|---|---|
| Overworld r = 5.000 | (10.000/16)² ≈ 390.000 | **~40–60 min** | **3,8 GB gemessen** + LOD-Store 1,6 GB |
| Nether r = 1.250 | ≈ 24.000 | < 10 min | ~0,3 GB |
| End r = 2.000 | ≈ 62.000 | < 15 min | ~0,2 GB |
| Testwelt r = 2.500 (+ Nether 650) | ≈ 100.000 | 10–30 min | ~1–1,5 GB |

Grundlage: 26er-Welten sind 384 Blöcke hoch, ~10–12 KB pro Chunk auf der Platte, Chunky schafft auf 6 Kernen grob 100–300 Chunks/s. Die Testwelt liefert die echten Werte.
Hochgerechnet wird dann mit: Dauer endgültige Welt ≈ Dauer Testwelt × 3,9.

**Chunky-Einstellungen:** im Standard lassen. Während des Laufs `/spark tps` beobachten. Es laufen keine Spieler, der Server darf voll ausgelastet sein.

### Platz inklusive Backups (Abgleich mit Task 2 Schritt 1, `df -h`)

Die vorgenerierte Welt macht **jedes Backup** größer. Region-Dateien sind schon komprimiert, ein Backup ist deshalb fast so groß wie die Welt.

| Posten | Platz |
|---|---|
| Welt nach Vorgenerierung, wächst im Spiel auf | ~5 GB → ~7 GB bis Januar |
| Testwelt-Sicherung (Task 10 Schritt 4: sichern, dann verwerfen) | ~1,5 GB |
| AMP-Backups, ursprünglich geplant (stündlich, 24 aufbewahren) | 24 × ~6 GB ≈ 145 GB |
| **AMP-Backups, entschieden (alle 3 h, 8 aufbewahren)** | **8 × ~6 GB ≈ 50 GB** |
| Statistik-Archiv | < 1 GB |

**Das stündliche Backup mit 24 Ständen passt mit vorgenerierter Welt vermutlich nicht.** VM200 hatte im Juni ~196 GB Datenplatte, darauf liegen auch die anderen Instanzen.
**Entschieden (Leitung 24.10.): alle 3 Stunden, 8 Stände, plus das nächtliche Proxmox-Backup auf die QNAP** (Task 9 Schritt 3). Zur Wahl standen:
- AMP-Backup **alle 3 Stunden, 8 Stände aufbewahren** (= 24 h zurück, ~50 GB) plus das nächtliche Proxmox-Backup von VM200 auf die QNAP (deckt ältere Stände ab)
- oder: stündlich, aber nur 6 aufbewahren (~36 GB)

Ist nach Task 2 Schritt 1 nicht genug frei, gehe ich in dieser Reihenfolge vor: erst Backups enger fassen, dann Overworld-Radius 4.000 (~250.000 Chunks, ~3 GB). Die Spielwelt zu verkleinern ist der letzte Schritt.

## Befehle (Konsole, endgültige Welt)

Nach dem Spawn-Aufbau (unten). `insel:aufbau` setzt die Overworld-Grenze schon, die ersten beiden Zeilen schaden aber nicht.

```text
worldborder center 64 37
worldborder set 10000
execute in minecraft:the_nether run worldborder center 8 5
execute in minecraft:the_nether run worldborder set 2500
execute in minecraft:the_end run worldborder set 10000
chunky world world
chunky center 64 37
chunky shape square
chunky radius 5000
chunky start
```

Nach „Task complete“ dasselbe für `world_nether` (Radius 1.250, Mittelpunkt 8 / 5) und `world_the_end` (Radius 2.000, Mittelpunkt 0/0, dort liegt immer die Hauptinsel).
Die Weltnamen kommen aus der 26.3-Instanz: Seit der neuen Weltstruktur liegen alle Dimensionen unter `world/dimensions/minecraft/`. Welche Namen Chunky
erwartet, zeigt `chunky world` mit Tab-Vervollständigung. `chunky pause`/`chunky continue` übersteht einen Neustart.

## Spawn-Aufbau vor der Vorgenerierung

Entschieden von Pascal (Spawn-&-Welt-Session, Commit `e788759`): **Kandidat A**. Insel v2 an der Originalposition (Kasten x 24…118, z −9…59, mit allem, was
darunter hängt) und nördlich davon die **Aufschüttung**, der Boden der CA12-Bauebene (x −8…423, z −512…71, Biom Pilzland, dort erscheinen keine Monster, also
auch keine Monsterfarmen). Ablauf und Dateien: `spawn/AUFBAU.md`, Prüfliste für einen frischen Join: `spawn/PRUEFLISTE.md`.

**Weltspawn 64 / 179 / 29** (Pascal). Genau über 64/37 liegt die Amethyst-Kuppel, dort würde 26.3 Spieler auf den obersten Block setzen.
**Der Mittelpunkt für Weltgrenze und Chunky bleibt 64 / 37.**

**Vor dem ersten Start** (Server gestoppt, `level-seed=1560698989`):
1. Datapacks nach `world/datapacks/`: `datapack/leitfaden`, `server/datapacks/wanderhaendler-rabatt`, `spawn/datapack/insel`, dazu lokal von der
   Spawn-&-Welt-Session `aufschuettung` und `spawn-insel` (CA12-Daten, nicht im Repo, kommen per Kopie auf VM200)
2. `spawn/worldguard/regions.yml` → `plugins/WorldGuard/worlds/world/regions.yml` (nur Region `spawn`, Oval um die Insel; kein Bauverbot-Radius mehr, Pascal 24.10.)
3. **Keine** Ordner unter `world/dimensions/minecraft/` vorab anlegen, sonst stürzt Paper 26.3 ab. Anti-Xray für Nether/End erst nach dem ersten Start
   eintragen (`paper/anti-xray.md`), wirkt ab dem nächsten Start, also vor der Vorgenerierung einmal neu starten

**Nach dem ersten Start** in der Konsole, nacheinander:

```text
function aufschuettung:start
```

Warten auf „Aufschüttung fertig“ (59 Kacheln, ~2–3 min).

```text
function insel:aufbau
```

Warten auf „Spawn-Insel eingerichtet“. Das setzt Insel v2 per `place template`, Rückweg-Plattform, 372 Lichtblöcke, `setworldspawn 64 179 29 0 0`,
`respawn_radius 0` und `worldborder center 64 37` / `set 10000`. WorldEdit braucht es dafür nicht mehr.

```text
nether close
end close
```

Plugin-Befehle von DimensionControl, gehen nicht aus einer Funktion. Danach Anti-Xray für Nether/End eintragen, Neustart, dann die Vorgenerierung (oben).

Nur falls das Datapack `insel` nicht läuft, Spawn von Hand (in 26.3 braucht `setworldspawn` zwei Winkelwerte):

```text
setworldspawn 64 179 29 0 0
gamerule respawn_radius 0
```

**Spawn-Streuung auf 0:** Sonst landen Neulinge zufällig neben der schwebenden Insel im Meer. Die Regel heißt in 26.3 **`respawn_radius`** (lokaler Testserver,
24.10.: `spawnRadius` und `spawn_radius` lehnt der Server ab). **Prüfen:** mit einem neuen Testspieler (oder nach Löschen seiner Spielerdaten) beitreten,
er muss auf der Insel bei 64/179/29 stehen. Vollständig: `spawn/PRUEFLISTE.md` (Vorlage für den Testlauf 21.11.).

**Prüfen:** `chunky progress` 100 %, `/spark tps` danach wieder 20 TPS, `du -sh` der Weltordner notieren (→ `kapazitaet.md` „Gemessen“).
