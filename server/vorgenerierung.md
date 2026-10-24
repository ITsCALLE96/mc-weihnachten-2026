# Welt vorgenerieren mit Chunky (Pflicht vor dem Start)

Neue Chunks zu erzeugen ist das Teuerste, was ein Minecraft-Server tut. Fliegen 25 Spieler mit Elytra in verschiedene Richtungen, bremst das den Server. Deshalb wird die Welt
vorher innerhalb der Weltgrenze komplett erzeugt. Läuft ohne Spieler, über Nacht oder tagsüber, wenn niemand spielt.

Werkzeug: **Chunky 1.5.3** (Modrinth `chunky`, GPL-3.0, Prüfsumme in `plugins.md`).

## Wann

| Welt | Wann | Radius |
|---|---|---|
| **Testwelt** | vor dem Lasttest (Plan Task 2 Schritt 7), spätestens vor dem Testlauf 21.11. | mindestens **2.500** (Overworld), Nether 650. Dabei Dauer und Größe messen |
| **Endgültige Welt** | **direkt nach dem Erzeugen in Task 10 Schritt 4 (bis 28.11.)**, auf jeden Fall vor dem ersten Spielerbeitritt. Ob die Spawn-Insel vorher oder nachher eingefügt wird, ist egal | Overworld **5.000**, Nether **1.250**, End **2.000** |

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

## Dauer und Platz (Schätzung, wird an der Testwelt gemessen)

| Welt | Chunks | Dauer auf i7-9850H (geschätzt) | Platz (geschätzt) |
|---|---|---|---|
| Overworld r = 5.000 | (10.000/16)² ≈ 390.000 | **0,5–2 h** | **~4–5 GB** |
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

## Spawn nach dem Einfügen der Insel

Von der Spawn-&-Welt-Session (24.10.): Die Insel kommt als **v2** an ihre Originalposition (Kasten x 24…118, z −9…59, mit allem, was darunter hängt:
Kette bis y 64, Drachenklaue, zweiter Anhänger). Unter 26.3 liegt dort
offenes Meer, der natürliche Weltspawn wäre −48 / 102 / 64.

**Weltspawn 64 / 179 / 29** (Pascal entschieden, Spawn-&-Welt-Session Commit `b80e549`). Genau über 64/37 liegt die Amethyst-Kuppel, dort würde 26.3 Spieler
auf den obersten Block der Spalte setzen (Drachenflügel, y 217). **Der Mittelpunkt für Weltgrenze und Chunky bleibt 64 / 37.**

**Insel einfügen** (WorldEdit, als OP im Spiel; die Datei `ca12-spawn-v2.schem` liegt git-ignoriert in `spawn/quellen/` und kommt nach
`plugins/WorldEdit/schematics/`):

```text
/tp 24 64 -9
//schem load ca12-spawn-v2
//paste -e
```

Danach einspielen (Reihenfolge):
1. Datapack `spawn/datapack/insel/` nach `world/datapacks/`, Neustart oder `/reload`, dann in der Konsole einmal:

```text
function insel:aufbau
```

   Baut die Rückweg-Plattform (x 72–76, z 20–24, y 62, Teleport auf den Spawn, wirkt ohne OP) und 372 Lichtblöcke unter der Insel, setzt Weltspawn und
   `respawn_radius 0`. Nur falls das Datapack nicht läuft, von Hand (in 26.3 braucht `setworldspawn` zwei Winkelwerte):

```text
setworldspawn 64 179 29 0 0
gamerule respawn_radius 0
```

2. WorldGuard-Regionen: `spawn/worldguard/regions.yml` nach `plugins/WorldGuard/worlds/world/regions.yml`, dann `/rg reload` bzw. Neustart.
   `spawn` (x 14…128, z −19…69, volle Höhe: keine Mobs, Hunger aufgefüllt, kein PvP, keine Truhen, kein Feuer, keine Explosionen, Benutzen erlaubt) und
   `spawn_bauverbot` (Radius 150 um 64/37). Auf dem Testserver erkennt WorldGuard 7.0.20 beide samt Flags. Prüfen mit `/rg info` auf der Insel
3. Spawn Elytra: `spawnRadius: 65` in `plugins/SpawnElytra/config.yml` (`plugins.md`)

**Spawn-Streuung auf 0:** Sonst landen Neulinge zufällig neben der schwebenden Insel im Meer. Die Regel heißt in 26.3 **`respawn_radius`** (lokaler Testserver,
24.10.: `spawnRadius` und `spawn_radius` lehnt der Server ab). **Prüfen:** mit einem neuen Testspieler (oder nach Löschen seiner Spielerdaten) beitreten,
er muss auf der Insel bei 64/179/29 stehen. Dazu: Plattform unten teleportiert ohne OP auf den Spawn, Bauen im Radius 150 als Spieler ohne OP abgelehnt.
Details: `spawn/KANDIDATEN.md` → „Spawn-Technik für die echte Welt“.

**Prüfen:** `chunky progress` 100 %, `/spark tps` danach wieder 20 TPS, `du -sh` der Weltordner notieren (→ `kapazitaet.md` „Gemessen“).
