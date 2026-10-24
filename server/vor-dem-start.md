# Checkliste „vor dem Start“ – Server-Optimierung

Kurzfassung aller Leistungs- und Betriebsschritte vor dem Testlauf (21.11.) bzw. dem Start (05.12.). Details stehen in den verlinkten Dateien.
Die Go-Live-Checkliste im Vault (Task 9 Schritt 5) bleibt das offizielle Abnahmedokument. Diese Liste ist der technische Teil davon.

## Host und VM

- [ ] Alle anderen AMP-Instanzen auf VM200 gestoppt (Pascal, gilt schon ab Lasttest/Testlauf)
- [ ] CPU-Governor des Testlab-Hosts auf `performance` (nach Rückfrage), Laptop gut belüftet (`kapazitaet.md` → Host)
- [ ] VM200: Zeitzone `Europe/Berlin` (`statistik/README.md`), genug freier Platz für Welt + Backups (`vorgenerierung.md` → Platz)

## Java und Paper

- [ ] Paper 26.3 Build aus `VERSION.md`, Java 25
- [ ] Heap 12 GB (`-Xms` = `-Xmx`), **Aikar-Flags in der Variante für Heaps ab 12 GB** (`kapazitaet.md` → RAM)
- [ ] `server.properties` nach `server.properties.md`: Sichtweite 8, Simulationsweite 6, `max-players=30`, `network-compression-threshold=-1`, nur `127.0.0.1`
- [ ] `sync-chunk-writes=false` in `server.properties`: schreibt Chunks asynchron, das entlastet den Haupt-Thread beim Speichern. Unter Linux mit Journaling-Dateisystem
  üblich. Bei einem Stromausfall gehen höchstens die letzten Sekunden verloren, und dafür gibt es die Backups
- [ ] `paper-global.yml`: Velocity Modern Forwarding (`paper/paper-global.yml.auszug`)
- [ ] `paper-world-defaults.yml`: Anti-Xray Overworld (`paper/anti-xray.md`), Entity-Speicherlimits, `optimize-explosions` (`kapazitaet.md` → Paper-Einstellungen). Schlüssel gegen die von 26.3 erzeugte Datei geprüft
- [ ] `permissions.yml` (kommt mit `plugin-konfig/einspielen.sh`): alle Spieler dürfen `/spark tps` (`spark.md`)
- [ ] **Plugin-Konfigs per `plugin-konfig/einspielen.sh <paper-ordner> vm200` eingespielt** (Server gestoppt, nach dem ersten Start, damit die Plugin-Ordner existieren; danach Neustart).
  Enthält Fair Play (Höhlenansicht nur im Nether), DimensionControl-Texte deutsch,
  Armor Poser, bStats aus, Voice Chat Backend 24455 auf 127.0.0.1 und `permissions.yml`. Stichprobe: `grep CaveModeInNether plugins/XaeroFairPlay/xaero-fair-play.json`
- [ ] **Kein Right click harvester und kein Spawn Elytra** im `plugins/`-Ordner (beide gestrichen 24.10., das Skript warnt)
- [ ] Chat mit No Chat Reports: Paper `enforce-secure-profile=false` und Velocity `force-key-authentication = false` (`velocity/README.md` → Chat-Signaturen)
- [ ] Velocity: `velocity.toml` nach `velocity/velocity.toml.auszug` (`show-max-players = 30`, Modern Forwarding, Secret nur auf dem Server)

## Welt

> **Offen seit 24.10.:** Seed, Spawn und Mittelpunkt kommen neu von der Spawn-&-Welt-Session (eigener Spawn statt CA12-Insel, `vorgenerierung.md`). Die Punkte unten mit CA12-Werten bis dahin nicht abhaken.

- [ ] Seed `1560698989` (CA12), Weltgrenze 10.000 × 10.000, Mittelpunkt x 64 / z 37 (Nether 8 / 5)
- [ ] Spawn-Aufbau nach `spawn/AUFBAU.md` **vor** der Vorgenerierung: `function aufschuettung:start` (Pilzland-Ebene), dann `function insel:aufbau` (Insel v2, Weltspawn 64/179/29,
  `respawn_radius 0`, Plattform, Lichter, Weltgrenze), dann `nether close` / `end close`. WorldGuard `regions.yml` aus `spawn/worldguard/` (`vorgenerierung.md` → Spawn-Aufbau)
- [ ] Keine Dimensions-Ordner vor dem ersten Start anlegen (Absturz in 26.3). Anti-Xray für Nether/End erst danach eintragen und einmal neu starten (`paper/anti-xray.md`)
- [ ] Frischer Join nach `spawn/PRUEFLISTE.md` geprüft (neuer Testspieler auf der Insel, Plattform mit Portal-Übergang ohne OP, Inselschutz, Bauen auf der Ebene erlaubt, keine Monster auf der Pilzland-Ebene)
- [ ] **Vorgenerierung** Overworld 5.000 / Nether 1.250 / End 2.000 abgeschlossen (`vorgenerierung.md`), Drachenkampf startet weiterhin (in der Testwelt geprüft)
- [ ] Datapacks geladen, Reihenfolge per `/datapack list` (`plugins.md`). Wanderhändler-Rabatt `datapacks/wanderhaendler-rabatt` in der Testwelt geprüft, im Spiel erst ab 24.12. eingeschaltet (`datapacks/README.md`)
- [ ] Server-Bild und MOTD in Velocity (`icon/README.md`), Servername statt Platzhalter „Weihnachtsserver“, sobald er feststeht

## Messen und Nachweisen

- [ ] Lasttest mit Bots durchgeführt, Ergebnisse in `kapazitaet.md` „Gemessen“ (`lasttest.md`)
- [ ] Upload von VM200 aus gemessen, Sichtweite nach den Grenzwerten festgelegt (`kapazitaet.md` → Upload)
- [ ] **Xaero-Weltkarte zeigt nichts Unterirdisches** (Testlauf, Idee Pascal: im Einzelspieler waren 3 Trial Chambers auf der Karte). Als Spieler ohne OP mit dem Modpack:
  in der Overworld lässt sich die Höhlenansicht nicht einschalten (Minimap und Weltkarte), im Nether schon (so entschieden). Ein OP sucht vorher per
  `/locate structure minecraft:trial_chambers` eine Trial Chamber, der Spieler fliegt hin und prüft, dass sie auf keiner Karte auftaucht. Dazu stichprobenartig
  Anti-Xray: Höhlen und Erze unter der Oberfläche dürfen auch mit Freecam/Röntgen-Texturen nicht erkennbar sein (`paper/anti-xray.md`).
  Kommt doch etwas durch: Fair-Play-Konfiguration und Spielerrechte prüfen (OP umgeht die Sperre), sonst Leitung
- [ ] Grundlinie mit spark: `/spark health --upload` ohne Spieler nach der Vorgenerierung, Link in die Administration-Doku (`spark.md`)

## Betrieb

- [ ] Backups laufen: AMP alle 3 h mit 8 Ständen plus nächtliches Proxmox-Backup auf die QNAP (entschieden 24.10.), Wiederherstellung getestet (Task 9 Schritte 3/4)
- [ ] **Season-Wechsel nur mit Abschluss-Schnappschuss:** `save-all flush`, dann `SCHNAPPSCHUSS_ERSETZEN=1 schnappschuss.sh …` von Hand, erst danach `SEASON`
  umstellen. `testlauf` → `weihnachten-2026` direkt vor dem Weltwechsel (Task 10 Schritt 4), nicht erst am 05.12. (`statistik/README.md` → Seasons)
- [ ] AMP-Aufgaben: Phasen (Task 9 Schritt 1), `save-all flush` 03:58, Statistik-Cron 04:00 mit Season-Datei (`statistik/README.md`)
- [ ] **Täglicher Neustart** (bestätigt Leitung 24.10.) per AMP-Aufgabe um 05:00, nach Schnappschuss und Backup. Er räumt Speicher und Chunk-Reste auf, und um 05:00 spielt fast nie jemand.
  Vorher eine Chatwarnung 5 Minuten früher. Die Phasenstände überleben Neustarts (Scoreboard/Plugin, im Test geprüft)
- [ ] AMP-Log-Aufbewahrung so, dass das Statistik-Skript alle Logs abholt, bevor AMP sie löscht
- [ ] Keine `getamp update`/Docker-Updates zu Spielzeiten (Globale Vorgaben)
- [ ] Rückfall Nitrado bekannt (Plan Task 9 Schritt 8)

## Eröffnung (Weltenbaum öffnet sich)

Pascal, 24.10.: Vor dem Start warten alle im geschlossenen Weltenbaum, beim offiziellen Start öffnet er sich und die Weltgrenze springt von klein auf 10.000.
Funktionsnamen und kleine Grenze kommen von der Spawn-&-Welt-Session. Bis zu ihrer Bestätigung stehen hier Platzhalter: `spawn:aufbau`, `spawn:eroeffnen`.

**Vorher (Task 10 Schritt 4, bis 28.11.):** Season-Wechsel `testlauf` → `weihnachten-2026` mit Abschluss-Schnappschuss, neue Welt, Spawn-Aufbau, Chunky-Vorgenerierung
**mit der 10.000er-Grenze**. Erst danach die kleine Grenze um den Baum setzen (`spawn:aufbau` bzw. von Hand). Whitelist an, alle ~25 Namen eingetragen.
Nether/End geschlossen, `#phase` = 0.

**Am Starttag:**

| Wann | Was | Wer |
|---|---|---|
| vor 04:00 | normaler Tagesbetrieb: Schnappschuss 04:00, Neustart 05:00 | AMP |
| ab ~1 h vor Start | Spieler dürfen beitreten und warten im Baum (Whitelist bleibt an, sonst nichts zu tun) | – |
| Startzeit | `function spawn:eroeffnen` in der AMP-Konsole: Baum öffnet, `worldborder set 10000` | **Pascal** (bewusst von Hand, damit er auf Nachzügler warten kann) |
| direkt danach | `function leitfaden:phase/setzen_1` (falls nicht schon in `eroeffnen`) | Pascal bzw. dieselbe AMP-Aufgabe |
| direkt danach | Statistik-Nullpunkt: `save-all flush`, dann `SCHNAPPSCHUSS_ERSETZEN=1 /opt/mc-weihnachten/schnappschuss.sh …` (ersetzt den 04:00-Stand des Tages, der alte bleibt als `.vorher-…`). Spielzeit im Baum vor dem Start zählt dann nicht | Pascal (Befehl aus `statistik/README.md`) |
| Start + 10 min | **Rückfall-Aufgabe in AMP**: sendet dieselben Befehle noch einmal. `eroeffnen` muss bei zweitem Aufruf nichts tun | AMP |

Der Season-Wechsel hat mit der Eröffnung nichts zu tun: Er passiert schon beim Weltwechsel (bis 28.11.).

**Testlauf 21.11.:** dieselbe Eröffnung als Generalprobe in der Testwelt, mit den 2–3 Testern (Baum in der Testwelt nötig, Spawn-&-Welt-Session).
Prüfen: Grenze vorher klein (Spieler kommt nicht aus dem Baum), nach `eroeffnen` 10.000, zweiter Aufruf ändert nichts, Phase 1 aktiv, Chat-Ansage kommt.
Auf dem Testlauf-Server ist der Statistik-Nullpunkt egal (Season `testlauf`).

**Start 05.12.:** wie oben. Uhrzeit legt Pascal fest (Plan Task 9 Schritt 1).

- [ ] Eröffnung im Testlauf geprobt, Funde behoben
- [ ] Rückfall-Aufgabe für 05.12. Startzeit + 10 min in AMP angelegt
