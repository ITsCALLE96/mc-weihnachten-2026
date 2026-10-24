# Spawn-Aufbau (Testserver und echte Welt)

> **Kurswechsel 24.10. (Decision Log):** Die CA12-Insel kommt **nicht** auf die echte Welt (Forever-World, neuer Seed). Sie bleibt nur als Platzhalter
> auf dem Testserver. Die Spawn-Technik ist davon unabhängig und wird über eine **Standort-Konfiguration** auf jeden Spawn angepasst (siehe unten).

## Spawn-Technik für jeden Standort

Alle Ortsangaben stehen in `spawn/standort-<name>.json` (Vorlage: `standort-testserver.json`):

| Feld | Bedeutung |
|---|---|
| `spawn` | Weltspawn x/y/z und Blickrichtung (yaw/pitch); dorthin führt auch der Rückweg-Teleport |
| `oval` | Mitte x/z und Halbachsen a (x) / b (z): Spawnschutz-Region (WorldGuard poly2d) und Bereich der Lichter, ≈ Umriss des Spawns am Boden plus Rand |
| `plattform` | Mitte x/y/z der Rückweg-Plattform (y = Höhe der Plattform-Oberkante, meist Wasserspiegel 62), Radius des Auslösers |
| `obenBereich` | Kasten (von/bis), in dem man „oben am Spawn“ ist: dort gibt es beim Betreten einmal Sättigung |
| `struktur` | optional: Struktur, die `insel:aufbau` per `place template` setzt (Name, untere Nordwest-Ecke); `null` bei eigenem Bau oder fertiger Welt |
| `weltgrenze` | Mitte x/z und Breite |
| `teleportTicks`, `saettigung`, `lichter` | Dauer des Portal-Übergangs, Sättigung (Sekunden, Abklingzeit), Licht-Raster und Unterkante des Baus |

Ablauf für einen neuen Standort:
1. `spawn/standort-<name>.json` anlegen
2. `node spawn/standort.mjs bauen spawn/standort-<name>.json` → Datapack `spawn/datapack/insel/` und `spawn/worldguard/regions.yml`
3. Welt mit Spawn-Bau aufsetzen und `function insel:aufbau` ausführen (Plattform, Spawn, Weltgrenze; Lichter beim ersten Mal noch die alten)
4. `node spawn/standort.mjs lichter spawn/standort-<name>.json <welt>` → `lichter.mcfunction` aus dem fertigen Gelände, dann `minecraft:reload` und `function insel:lichter`
5. Mit `spawn/PRUEFLISTE.md` prüfen

Die Plattform (runde Scheibe, Radius 4, von Pascal freigegeben) ist im Generator festgelegt (`plattformTeile()`); bei einem anderen Spawn-Stil dort anpassen.

### Spawn später zum Weiterbauen freigeben (Pascal)

Am Anfang ist der Spawn geschützt (Nicht-Mitglieder bauen in der Region `spawn` nicht). Freigabe ohne Neustart in der Konsole:
- einzelne Spawn-Bauer: `rg addmember -w world spawn <Name>` (zurück: `rg removemember -w world spawn <Name>`)
- für alle: `rg flag -w world spawn build allow`, bei Bedarf `rg flag -w world spawn chest-access allow`
- wieder schützen: `rg flag -w world spawn build` (Flag löschen)

Bewusst kein `build deny` in der Datei: das würde auch Mitglieder sperren.

## Testserver (CA12-Platzhalter)

Stand 2026-10-24, entschieden von Pascal: **CA12-Seed `1560698989`**, **Kandidat A**: Aufschüttung wie in CA12 (Biom Pilzland), **Insel v2** an der Originalposition,
**Weltspawn 64/179/29**, Rückweg-Plattform mittig darunter, **Weltgrenze 10.000 um 64/37**.

## Was wo liegt

| Teil | Im Repo | Lokal, git-ignoriert (CA12-Daten, nicht veröffentlichen) |
|---|---|---|
| Insel v2 | – | `spawn/quellen/ca12-spawn-v2.schem` (95×175×69, Ursprung 24/64/−9) |
| Aufschüttung (schlichte Ebene nach CA12-Umriss) | Werkzeug `tools/schem-aufschuettung.mjs` | `spawn/quellen/datapacks/aufschuettung/` (51 Kacheln, ~10 MB) |
| Plattform, Lichter, Spawn, Weltgrenze | Datapack `spawn/datapack/insel/` | – |
| Spawnschutz, Sättigung, keine Monster (Oval um die Insel) | `spawn/worldguard/regions.yml` | – |
| Ablauf in einem Rutsch | `spawn/neu-aufsetzen.sh` (Testserver) | – |
| Prüfliste frischer Join | `spawn/PRUEFLISTE.md` | – |

Lokale Quellen neu erzeugen (aus der CA12-Welt in `spawn/quellen/ca12/`):
- Insel v2: `spawn/quellen/insel-v2.mjs` (siehe `KANDIDATEN.md` → „Insel v2“)
- Aufschüttung: `node tools/schem-aufschuettung.mjs spawn/quellen/ca12/CraftAttack12-Map <26.3-welt> spawn/quellen/datapacks/aufschuettung` (~15 min). `<26.3-welt>` ist eine unveränderte, lokal erzeugte Welt mit demselben Seed (z.B. Paper + Chunky, Radius ≥ 700 um 0/0). Aus CA12 kommt nur die Umrissform, gefüllt wird gleichmäßig: Gras auf y 68, 3 Erde, Stein, Strand bis y 64, Rampen 1 Block auf 2 zum Wasser und zu tieferem Gelände

## Ablauf

Voraussetzungen: Paper 26.3 mit den Plugins aus `server/plugins.md`, `server.properties` mit `level-seed=1560698989`, Server **gestoppt**.

1. Welt löschen bzw. neu anlegen (beim echten Server nur vor dem Start, nie danach)
2. Nach `world/datapacks/` kopieren: `datapack/leitfaden`, `server/datapacks/wanderhaendler-rabatt`, `spawn/datapack/insel`, lokal `spawn/quellen/datapacks/aufschuettung`
   und das Datapack `spawn-insel` mit der Struktur: `node tools/schem-struktur.mjs spawn/quellen/ca12-spawn-v2.schem world/datapacks/spawn-insel/data/spawn/structure/ca12v2.nbt` (+ `pack.mcmeta`)
3. `spawn/worldguard/regions.yml` → `plugins/WorldGuard/worlds/world/regions.yml`
3b. Plugin-Konfigs: `bash server/plugin-konfig/einspielen.sh <server> lokal|vm200` (Server-Session), Right click harvester ist raus
4. Anti-Xray für Nether/End: **erst nach dem ersten Start** in die von Paper angelegten `world/dimensions/minecraft/the_nether/paper-world.yml` bzw. `the_end/` eintragen (Inhalt `server/paper/anti-xray.md`), wirkt ab dem nächsten Start. Vorab angelegte Dimensions-Ordner lassen Paper beim Start abstürzen
5. Server starten, in der Konsole nacheinander:
   - `function aufschuettung:start` → warten auf „Aufschüttung fertig“ (51 Kacheln, ~1 min; jede Kachel wartet, bis ihre 16 Chunks geladen sind)
   - `function insel:aufbau` → warten auf „Spawn-Insel eingerichtet“ (Insel, Plattform, Lichter, `setworldspawn 64 179 29 0 0`, `respawn_radius 0`, Weltgrenze 64/37 × 10.000)
   - `nether close`, `end close` (Plugin-Befehle, gehen nicht aus einer Funktion)
6. Danach: Chunky-Vorgenerierung um 64/37 (Server-Session, `server/vorgenerierung.md`), Spawn Elytra `spawnRadius: 65`
7. Prüfen mit `spawn/PRUEFLISTE.md`

Lokal macht `bash spawn/neu-aufsetzen.sh testserver/server` die Schritte 1–5 auf einmal (löscht auch OP-Liste, Spielerdaten, Elytra- und Sperrzustand).

## Hinweise

- **Sättigung** (Pascal 24.10.): nur oben auf der Insel, einmal beim Betreten Sättigung I für 2 s, danach 5 min Abklingzeit (`insel:betreten`). Nicht mehr über WorldGuard-`feed`.
- **Strukturen mit `place template`** brauchen in 26.x die alte DataVersion (3955), wenn die Palette im Format `{Name, Properties}` vorliegt, sonst werden alle Blöcke Luft. Und `place template` scheitert in Funktionen still, wenn Chunks noch nicht geladen sind – deshalb prüfen die Ketten mit `execute if loaded`.

- **Rückweg-Teleport** wie ein Netherportal (`insel:tick`): 70 Ticks (3,5 s) auf der Plattform stehen, dabei Übelkeit (Bildschirm wabert), Portal-Partikel und `block.portal.trigger`; dann Teleport, `block.portal.travel`, umgekehrte Portal-Partikel, 1 s Blindheit als Einblendung. Plattform vorher verlassen bricht ab.

- **Oval um die Insel** (Pascal 24.10.): Mitte 71/25, Halbachsen 62 (x) und 46 (z) = Insel-Umriss plus Rand. Gilt für die Region `spawn` (poly2d, 32 Punkte, kein großes Bauverbot mehr) und die Lichter.
- **Lichter** (`insel:lichter`, 138 Stück, nur Boden/Wasser im Oval, Raster 8) sind aus der aufgebauten Testwelt berechnet (`node tools/schem-licht.mjs <welt> 9 -21 133 71 115 8 71,25,62,46 nurBoden`). Gleicher Seed und gleicher Aufbau ergeben dasselbe Gelände, sie gelten also auch für die echte Welt. Bei Änderungen an Insel oder Aufschüttung neu berechnen.
- **Pilzland:** Auf der ganzen Ebene erscheinen keine Monster (wie in CA12), Monsterfarmen gehen dort nicht.
- Kein OP vorab. OP vergibt die Leitung bei Bedarf.
