# Spawn-Aufbau (Testserver und echte Welt)

Stand 2026-10-24, entschieden von Pascal: **CA12-Seed `1560698989`**, **Kandidat A**: Aufschüttung wie in CA12 (Biom Pilzland), **Insel v2** an der Originalposition,
**Weltspawn 64/179/29**, Rückweg-Plattform mittig darunter, **Weltgrenze 10.000 um 64/37**.

## Was wo liegt

| Teil | Im Repo | Lokal, git-ignoriert (CA12-Daten, nicht veröffentlichen) |
|---|---|---|
| Insel v2 | – | `spawn/quellen/ca12-spawn-v2.schem` (95×175×69, Ursprung 24/64/−9) |
| Aufschüttung | Werkzeug `tools/schem-aufschuettung.mjs` | `spawn/quellen/datapacks/aufschuettung/` (59 Kacheln, ~22 MB) |
| Plattform, Lichter, Spawn, Weltgrenze | Datapack `spawn/datapack/insel/` | – |
| Spawnschutz, Sättigung, keine Monster | `spawn/worldguard/regions.yml` | – |
| Ablauf in einem Rutsch | `spawn/neu-aufsetzen.sh` (Testserver) | – |
| Prüfliste frischer Join | `spawn/PRUEFLISTE.md` | – |

Lokale Quellen neu erzeugen (aus der CA12-Welt in `spawn/quellen/ca12/`):
- Insel v2: `spawn/quellen/insel-v2.mjs` (siehe `KANDIDATEN.md` → „Insel v2“)
- Aufschüttung: `node tools/schem-aufschuettung.mjs spawn/quellen/ca12/CraftAttack12-Map spawn/quellen/datapacks/aufschuettung` (~10 min)

## Ablauf

Voraussetzungen: Paper 26.3 mit den Plugins aus `server/plugins.md`, `server.properties` mit `level-seed=1560698989`, Server **gestoppt**.

1. Welt löschen bzw. neu anlegen (beim echten Server nur vor dem Start, nie danach)
2. Nach `world/datapacks/` kopieren: `datapack/leitfaden`, `server/datapacks/wanderhaendler-rabatt`, `spawn/datapack/insel`, lokal `spawn/quellen/datapacks/aufschuettung`
   und das Datapack `spawn-insel` mit der Struktur: `node tools/schem-struktur.mjs spawn/quellen/ca12-spawn-v2.schem world/datapacks/spawn-insel/data/spawn/structure/ca12v2.nbt` (+ `pack.mcmeta`)
3. `spawn/worldguard/regions.yml` → `plugins/WorldGuard/worlds/world/regions.yml`
4. Anti-Xray für Nether/End: **erst nach dem ersten Start** in die von Paper angelegten `world/dimensions/minecraft/the_nether/paper-world.yml` bzw. `the_end/` eintragen (Inhalt `server/paper/anti-xray.md`), wirkt ab dem nächsten Start. Vorab angelegte Dimensions-Ordner lassen Paper beim Start abstürzen
5. Server starten, in der Konsole nacheinander:
   - `function aufschuettung:start` → warten auf „Aufschüttung fertig“ (59 Kacheln, ~2–3 min)
   - `function insel:aufbau` → warten auf „Spawn-Insel eingerichtet“ (Insel, Plattform, Lichter, `setworldspawn 64 179 29 0 0`, `respawn_radius 0`, Weltgrenze 64/37 × 10.000)
   - `nether close`, `end close` (Plugin-Befehle, gehen nicht aus einer Funktion)
6. Danach: Chunky-Vorgenerierung um 64/37 (Server-Session, `server/vorgenerierung.md`), Spawn Elytra `spawnRadius: 65`
7. Prüfen mit `spawn/PRUEFLISTE.md`

Lokal macht `bash spawn/neu-aufsetzen.sh testserver/server` die Schritte 1–5 auf einmal (löscht auch OP-Liste, Spielerdaten, Elytra- und Sperrzustand).

## Hinweise

- **Lichter** (`insel:lichter`) sind aus der aufgebauten Testwelt berechnet (`node tools/schem-licht.mjs <welt> 14 -19 128 69 115 6`). Gleicher Seed und gleicher Aufbau ergeben dasselbe Gelände, sie gelten also auch für die echte Welt. Bei Änderungen an Insel oder Aufschüttung neu berechnen.
- **Pilzland:** Auf der ganzen Ebene erscheinen keine Monster (wie in CA12), Monsterfarmen gehen dort nicht.
- Kein OP vorab. OP vergibt die Leitung bei Bedarf.
