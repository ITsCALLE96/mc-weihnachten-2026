# Spawn-Aufbau (Testserver und echte Welt)

> **Kurswechsel 24.10. (Decision Log):** Die CA12-Insel kommt **nicht** auf die echte Welt (Forever-World, neuer Seed). Sie bleibt nur als Platzhalter
> auf dem Testserver. Die Spawn-Technik ist davon unabhängig und wird über eine **Standort-Konfiguration** auf jeden Spawn angepasst (siehe unten).

## Spawn-Technik für jeden Standort

Alle Ortsangaben stehen in `spawn/standort-<name>.json` (Vorlage: `standort-testserver.json`):

| Feld | Bedeutung |
|---|---|
| `spawn` | Weltspawn x/y/z und Blickrichtung (yaw/pitch); dorthin führt auch der Rückweg-Teleport |
| `oval` | Mitte x/z und Halbachsen a (x) / b (z): Spawnschutz-Region (WorldGuard poly2d) und Bereich der Lichter, ≈ Umriss des Spawns am Boden plus Rand |
| `plattform` | optional (nur Testserver): Mitte x/y/z der Rückweg-Plattform (y = Höhe der Plattform-Oberkante, meist Wasserspiegel 62), Radius des Auslösers. Weglassen = keine Plattform |
| `obenBereich` | optional, nur mit `saettigung`: Kasten (von/bis), in dem man „oben am Spawn“ ist: dort gibt es beim Betreten einmal Sättigung |
| `struktur` | optional: Struktur, die `insel:aufbau` per `place template` setzt (Name, untere Nordwest-Ecke, `groesse`); `quelle` = Schematic außerhalb der Entwürfe (z. B. gekauft, lokal), `kachel` = in Kacheln k × k einfügen (große Bauten); `null` bei eigenem Bau oder fertiger Welt |
| `pilzland` | optional: Oval, in dem das Biom über die ganze Höhe gesetzt wird; Standard Pilzland, mit `biom` ein anderes (z. B. `minecraft:cherry_grove` für die Original-Farben) |
| `tafeln` | optional: gewachste Schilder (`x`/`y`/`z`, `block`, bis 4 `zeilen`), z. B. Namensnennung des Erbauers |
| `weltgrenze` | Mitte x/z und Breite |
| `teleportTicks`, `saettigung`, `lichter` | Dauer des Portal-Übergangs, Sättigung (Sekunden, Abklingzeit; weglassen = keine), Licht-Raster und Unterkante des Baus (`null` = keine Lichter, z. B. im Pilzland) |
| `spawnTeleport` | beim ersten Betreten und nach dem Tod ohne Bett auf den Spawn setzen (nötig, wenn der Spawn unter einem Dach liegt) |
| `eroeffnung` | optional: Eröffnungs-Event mit `sekunden` (Countdown), `grenzeZu` (Mitte, Breite der kleinen Weltgrenze) und `abstand` (Ticks zwischen den Ausgängen, Standard 15) und `ausgaenge` (je Ausgang Kasten `wurzeln` mit Verschluss-Block `block`, Standard Mangrovenwurzeln, und Kasten `barriere`; beim Weltenbaum eine Reihe des Tors je Eintrag; leer = nur Weltgrenze), `text`/`untertitel` (Bossbar, Begrüßung) und `grenzeAufSekunden` (große Grenze fährt sichtbar auf) |

## Testserver: Fantasy Village (gekauft, ab 24.10. spät)

Pascal hat **Hub/Spawn – Fantasy Village (LavaBuilds, BuiltByBit)** gekauft. Lizenz (README im Paket): nicht weiterverkaufen, nicht weitergeben,
nicht als eigenen Bau ausgeben; dazu die Standard-EULA von BuiltByBit (Betrieb, Änderungen erlaubt). **Kaufdateien und alles daraus bleiben lokal
in `spawn/quellen/fantasy-village/` (git-ignoriert), nie ins Repo, nicht in einen öffentlichen Welt-Download.**

- Umwandeln: `node --max-old-space-size=8000 spawn/fantasy-village.mjs "spawn/quellen/fantasy-village/Hub-Spawn - Fantasy Village/File for 1.21+/World/Fantasy Villages" spawn/quellen/fantasy-village/fantasy-village.schem`
  (aus der Welt, weil nur sie Dorfbewohner, Rahmen, Rüstungsständer und Anzeigen enthält; Laub persistent, Barriere gegen auslaufendes Wasser und fallende Blöcke)
- Testserver: `SEED=777 bash spawn/neu-aufsetzen.sh testserver/server` (Fantasy Village ist der Standard, `standort-fantasy-village-test.json`)
- Schwebende Insel, Unterseite ab y 80, Platz auf y 235 (Boden 234), Brunnen bei 0/0, **Spawn 0/235/16** (Blick nach Norden), 16 Kacheln à 64
- Biom Kirschhain wie im Original (Farben), keine Monster über die Region; Schild mit Namensnennung LavaBuilds neben dem Spawn
- Eröffnung: Weltgrenze 80 um den Brunnen, `insel:eroeffnung` zählt 10 s herunter, dann fährt die Grenze in 20 s auf 10.000
- Noch offen (nach Pascals Rundgang): Weg von der Insel nach unten, Höhe, Stil (Kirschblüte/Blasser Garten)

Für einen Entwurf aus `spawn/entwuerfe/` erzeugt `node spawn/standort.mjs aus-entwurf <entwurf.json> <ursprung x,y,z> [struktur]` die Standort-Konfiguration (ohne Plattform und Sättigung, mit Eröffnung).

Ablauf für einen neuen Standort:
1. `spawn/standort-<name>.json` anlegen
2. `node spawn/standort.mjs bauen spawn/standort-<name>.json` → Datapack `spawn/datapack/insel/` und `spawn/worldguard/regions.yml`
3. Welt mit Spawn-Bau aufsetzen und `function insel:aufbau` ausführen (Bau, Pilzland, Plattform falls vorhanden, Spawn, Weltgrenze; mit Eröffnung am Ende `insel:schliessen`; Lichter beim ersten Mal noch die alten)
4. `node spawn/standort.mjs lichter spawn/standort-<name>.json <welt>` → `lichter.mcfunction` aus dem fertigen Gelände, dann `minecraft:reload` und `function insel:lichter`
5. Mit `spawn/PRUEFLISTE.md` prüfen

Die Plattform (runde Scheibe, Radius 4, von Pascal freigegeben) ist im Generator festgelegt (`plattformTeile()`); bei einem anderen Spawn-Stil dort anpassen.

### Spawn später zum Weiterbauen freigeben (Pascal)

Am Anfang ist der Spawn geschützt (Nicht-Mitglieder bauen in der Region `spawn` nicht). Freigabe ohne Neustart in der Konsole:
- einzelne Spawn-Bauer: `rg addmember -w world spawn <Name>` (zurück: `rg removemember -w world spawn <Name>`)
- für alle: `rg flag -w world spawn build allow`, bei Bedarf `rg flag -w world spawn chest-access allow`
- wieder schützen: `rg flag -w world spawn build` (Flag löschen)

Bewusst kein `build deny` in der Datei: das würde auch Mitglieder sperren.

### Eröffnungs-Event (Weltenbaum, Pascal 24.10.)

Vor dem Start sind alle im verschlossenen Spawn-Raum: Das große Tor im Norden ist innen als Bogen zu erkennen, aber mit **Rinde (Dunkeleichenholz, 2 dick)** verschlossen, dahinter Barriere; **Weltgrenze 128 um die Raummitte**. In der Konsole oder als AMP-Aufgabe:
- `function insel:eroeffnung`: Bossbar „Der Baum öffnet sich …“, 10 s Countdown (letzte 3 Sekunden als Titel mit Glocke), dann bricht die Rinde Reihe für Reihe von unten auf (8 Reihen, alle 4 Ticks: Bruch-Partikel, Holzgeräusch, Kirschblätter, Tresor-Ton bei der ersten und letzten Reihe; ohne `destroy`, damit nichts als Gegenstand herausfällt), danach **Weltgrenze 10.000** und Titel „Willkommen!“
- Doppelt auslösen schadet nicht: „Eröffnung läuft schon“ bzw. „Spawn ist schon offen“ (Merker `#offen` und `#countdown` in `insel_zustand`)
- `function insel:schliessen`: Rinde und Barriere wieder zu, kleine Weltgrenze, Merker zurück. Damit lässt sich das Event beliebig oft proben (Testlauf 21.11., Start 05.12.)
- Der Aufbau endet mit `insel:aufbau_ende` (5 s nach dem Setzen): entfernt herumliegende Gegenstände im Ladebereich, gibt die Chunks frei, meldet „Spawn eingerichtet“
- Auf Vanilla 26.3 geprüft: alle Funktionen laden ohne Fehler (Block-Partikel in 26.3: `block{block_state:"minecraft:…"}` als Text), Schließen, Öffnen, Aufräumen

## Testserver: Weltenbaum (24.10. abends, verworfen)

> Pascal hat den Weltenbaum am 24.10. abends verworfen. Seit dem späten Abend steht auf dem Testserver Fantasy Village (siehe oben). Neu bauen: `STANDORT=spawn/standort-weltenbaum-test.json SEED=777 bash spawn/neu-aufsetzen.sh testserver/server`. Die Spawn-Technik oben gilt unverändert für jeden neuen Bau.

Pascal will den Baum im Spiel sehen, deshalb steht auf dem Testserver jetzt der Weltenbaum statt der CA12-Insel. **Vorläufiger Seed `777`**
(schnell gewählt: Gras, wenig Wasser, mittlere Höhe 71; die gründliche Seed-Suche für die echte Welt kommt später). Stamm bei −16/−40, Boden y 75,
Struktur-Ursprung −126/63/−150, **Spawn −16/76/−33** im Spawn-Raum. Pilzland, Ausgänge geschlossen, Weltgrenze 128 bis zur Eröffnung. Konfiguration
`spawn/standort-weltenbaum-test.json`, Reset: `SEED=777 bash spawn/neu-aufsetzen.sh testserver/server` (Weltenbaum ist der Standard).

Die Hohlräume (Spawn-Raum, Treppenschacht, Turm, Gänge und 4 Blöcke vor jedem Ausgang) stehen in der Struktur als Höhlenluft. `place template` lässt
normale Luft weg, Höhlenluft räumt dort natürliches Gelände frei.

## Testserver (CA12-Platzhalter, bis 24.10.)

Neu bauen mit `STANDORT=spawn/standort-testserver.json SEED=1560698989 bash spawn/neu-aufsetzen.sh testserver/server` (braucht die lokalen Quellen).

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
3. `spawn/worldguard/regions.yml` → `plugins/WorldGuard/worlds/world/regions.yml` **erst nach `insel:aufbau`** (Server gestoppt bzw. danach `rg load -w world`):
   `mob-spawning deny` verhindert sonst die Dorfbewohner und Fische der Struktur beim Einfügen (Test 24.10.: 13 Dorfbewohner fehlten)
3b. Plugin-Konfigs: `bash server/plugin-konfig/einspielen.sh <server> lokal|vm200` (Server-Session), Right click harvester ist raus
4. Anti-Xray für Nether/End: **erst nach dem ersten Start** in die von Paper angelegten `world/dimensions/minecraft/the_nether/paper-world.yml` bzw. `the_end/` eintragen (Inhalt `server/paper/anti-xray.md`), wirkt ab dem nächsten Start. Vorab angelegte Dimensions-Ordner lassen Paper beim Start abstürzen
5. Server starten, in der Konsole nacheinander:
   - `function aufschuettung:start` → warten auf „Aufschüttung fertig“ (51 Kacheln, ~1 min; jede Kachel wartet, bis ihre 16 Chunks geladen sind)
   - `function insel:aufbau` → warten auf „Spawn-Insel eingerichtet“ (Insel, Plattform, Lichter, `setworldspawn 64 179 29 0 0`, `respawn_radius 0`, Weltgrenze 64/37 × 10.000)
   - `nether close`, `end close` (Plugin-Befehle, gehen nicht aus einer Funktion)
6. Danach: Chunky-Vorgenerierung um 64/37 (Server-Session, `server/vorgenerierung.md`). Spawn Elytra ist gestrichen (Server-Session, 24.10.)
7. Prüfen mit `spawn/PRUEFLISTE.md`

Lokal macht `bash spawn/neu-aufsetzen.sh testserver/server` die Schritte 1–5 auf einmal (löscht auch OP-Liste, Spielerdaten, Elytra- und Sperrzustand).

## Hinweise

- **Sättigung** (nur noch Testserver-Platzhalter; beim Weltenbaum gestrichen, Pascal 24.10.): nur oben auf der Insel, einmal beim Betreten Sättigung I für 2 s, danach 5 min Abklingzeit (`insel:betreten`). Nicht mehr über WorldGuard-`feed`.
- **Strukturen mit `place template`** brauchen in 26.x die alte DataVersion (3955), wenn die Palette im Format `{Name, Properties}` vorliegt, sonst werden alle Blöcke Luft. Und `place template` scheitert in Funktionen still, wenn Chunks noch nicht geladen sind – deshalb prüfen die Ketten mit `execute if loaded`.

- **Rückweg-Teleport** (nur Testserver-Platzhalter, beim Weltenbaum gestrichen) wie ein Netherportal (`insel:tick`): 70 Ticks (3,5 s) auf der Plattform stehen, dabei Übelkeit (Bildschirm wabert), Portal-Partikel und `block.portal.trigger`; dann Teleport, `block.portal.travel`, umgekehrte Portal-Partikel, 1 s Blindheit als Einblendung. Plattform vorher verlassen bricht ab.

- **Oval um die Insel** (Pascal 24.10.): Mitte 71/25, Halbachsen 62 (x) und 46 (z) = Insel-Umriss plus Rand. Gilt für die Region `spawn` (poly2d, 32 Punkte, kein großes Bauverbot mehr) und die Lichter.
- **Lichter** (`insel:lichter`, 138 Stück, nur Boden/Wasser im Oval, Raster 8) sind aus der aufgebauten Testwelt berechnet (`node tools/schem-licht.mjs <welt> 9 -21 133 71 115 8 71,25,62,46 nurBoden`). Gleicher Seed und gleicher Aufbau ergeben dasselbe Gelände, sie gelten also auch für die echte Welt. Bei Änderungen an Insel oder Aufschüttung neu berechnen.
- **Pilzland:** Auf der ganzen Ebene erscheinen keine Monster (wie in CA12), Monsterfarmen gehen dort nicht.
- Kein OP vorab. OP vergibt die Leitung bei Bedarf.
