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
- [ ] `paper-world-defaults.yml`: Anti-Xray (`paper/anti-xray.md`), Entity-Speicherlimits, `optimize-explosions` (`kapazitaet.md` → Paper-Einstellungen). Schlüssel gegen die von 26.3 erzeugte Datei geprüft
- [ ] Velocity: `velocity.toml` nach `velocity/velocity.toml.auszug` (`show-max-players = 30`, Modern Forwarding, Secret nur auf dem Server)

## Welt

- [ ] Weltgrenze gesetzt, Mittelpunkt = Spawn (mit der Spawn-&-Welt-Session abgestimmt)
- [ ] **Vorgenerierung** Overworld 5.000 / Nether 1.250 / End 2.000 abgeschlossen (`vorgenerierung.md`), Drachenkampf startet weiterhin (in der Testwelt geprüft)
- [ ] Datapacks geladen, Reihenfolge per `/datapack list` (`plugins.md`)

## Messen und Nachweisen

- [ ] Lasttest mit Bots durchgeführt, Ergebnisse in `kapazitaet.md` „Gemessen“ (`lasttest.md`)
- [ ] Upload von VM200 aus gemessen, Sichtweite nach den Grenzwerten festgelegt (`kapazitaet.md` → Upload)
- [ ] Grundlinie mit spark: `/spark health --upload` ohne Spieler nach der Vorgenerierung, Link in die Administration-Doku (`spark.md`)

## Betrieb

- [ ] Backups nach dem angepassten Zeitplan laufen, Wiederherstellung getestet (Task 9 Schritte 3/4)
- [ ] AMP-Aufgaben: Phasen (Task 9 Schritt 1), `save-all flush` 03:58, Statistik-Cron 04:00 mit Season-Datei (`statistik/README.md`)
- [ ] **Täglicher Neustart** per AMP-Aufgabe um 05:00, nach Schnappschuss und Backup. Er räumt Speicher und Chunk-Reste auf, und um 05:00 spielt fast nie jemand.
  Vorher eine Chatwarnung 5 Minuten früher. Die Phasenstände überleben Neustarts (Scoreboard/Plugin, im Test geprüft)
- [ ] AMP-Log-Aufbewahrung so, dass das Statistik-Skript alle Logs abholt, bevor AMP sie löscht
- [ ] Keine `getamp update`/Docker-Updates zu Spielzeiten (Globale Vorgaben)
- [ ] Rückfall Nitrado bekannt (Plan Task 9 Schritt 8)
