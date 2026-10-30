# SMP-Welt neu aufsetzen (Zufalls-Seed, Spawn am natürlichen World-Spawn)

Pascal 30.10.: Die SMP-Welt bekommt einen neuen Zufalls-Seed, zum Start am 27.11. noch einmal. Deshalb läuft der Ablauf per Skript, nicht von Hand.
Die Spawn-Insel (Spark) kommt an den **normalen World-Spawn des Seeds**. Alle Bauten sind in der „Bau-Lage“ (Spawn 0/48, Plattform-Boden y 66) erzeugt
und werden per Versatz dorthin verschoben. Den Seed zeigt kein Skript an. Er steht nur in der Welt, in `spawn/quellen/smp-seed.txt` (git-ignoriert)
und in der Vault-Administration.

Gebaut wird lokal auf einem Testserver (Paper 26.3, Chunky im Plugin-Ordner, keine Spieler). Danach lädt die Server-Session den Weltordner auf VM200 hoch.

| Schritt | Aufruf | Dauer |
|---|---|---|
| 1. Welt erzeugen | `bash spawn/smp-neu/erzeugen.sh <server>`: leerer `level-seed`, Chunky r 192 um den World-Spawn, Seed sichern, `plan` → `spawn/smp-neu/lage.json` | ~2 min |
| 2. Aufbauen | `bash spawn/smp-neu/bauen.sh <server>`: Datapacks erzeugen und verschieben, Gelände angleichen, Insel, Lichter, Kalender (Tag 0), Deko, Weihnachtsinsel (Stufe 0) | ~10 min |
| 3. Abnahme | Renders vorher/nachher (Schrägansichten, Blick von Norden, Längsschnitt durch die Spawnmitte), Pascal gibt frei | – |
| 4. VM200 | Server-Session: `server/vm200/smp-neu-einspielen.sh` (alte Welt sichern, Ordner hochladen, Seed übernehmen, `spawn/smp-neu/ausgabe/` regions.yml, weihnachtsmann.json, mission.json, Anti-Xray, Spieler-Reset), noch ohne Winter-Datapack | ~15 min |
| 5. Vorgenerieren | seit 31.10. auf VM200: `bash spawn/smp-neu/vorgenerieren.sh --befehle` gibt die Konsolenbefehle (Grenzen je Dimension, Chunky Overworld r 5000 um den Spawn, Nether r 1250 (÷ 8), End r 2000) für die laufende SMP-Instanz; lokal weiter mit `<server>` | ~35 min |
| 6. Winter | danach `winter-weihnachten` in die Welt, Neustart, LSS | ~5 min |

## Was am Seed hängt und wie es gelöst ist

| Punkt | Lösung |
|---|---|
| Lage | `plan`: Versatz dx/dz = World-Spawn − 0/48; dy = Bodenhöhe an der Rückweg-Plattform (Median der Landspalten r 13) − 66. Dieselben Abstände wie im Testnetz: Plattform 23 Blöcke unter der Insel |
| Koordinaten | `verschieben.mjs` schreibt alle absoluten Koordinaten der Datapacks insel, insel-deko, insel-kalender und weihnachtsinsel um (setblock, fill, clone, summon, particle, playsound, place template, data block, tp, setworldspawn, worldborder center, forceload, `execute positioned/if block/if loaded`, Selektoren x/y/z). Dazu regions.yml und weihnachtsmann.json |
| Gelände | `welt.mjs angleichen` liest die Höhenkarte (ohne Bäume und Pflanzen) und erzeugt `insel:angleichen/*`: Lichtung r 9 um die Plattform eben auf den Boden, Senken und Wasser dort aufgefüllt; weicher Übergang über 10 Blöcke (Smoothstep). Unter Insel und Weihnachtsinsel bleibt mindestens 6 Blöcke Luft; höheres Gelände wird gekappt, die Kappung steigt außen mit 1,5 je Block an (kein senkrechter Schnitt). Bäume auf geänderten Spalten und Baumreste daneben werden geräumt |
| Lichter | aus dem fertigen Gelände (`bauen.mjs lichter`), schon in Weltkoordinaten |
| Ausschluss | nur wenn mehr als 60 % der Spalten um die Plattform Wasser sind (Spawn im Meer) → neu würfeln, Grund melden |
| Winter-Datapack | erst **nach** der Vorgenerierung: mit Temperatur 0 baut die Weltgenerierung sonst Schnee und Eis fest ein, auch auf Meer und Fluss |

Tests: `node --test spawn/smp-neu/`
