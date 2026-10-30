# Checkliste „vor dem Start“ – Server-Optimierung

Kurzfassung aller Leistungs- und Betriebsschritte vor dem Testlauf (21.11.) bzw. dem Start (Fr 27.11., vorher 05.12.; nur 6 Tage dazwischen). Details stehen in den verlinkten Dateien.
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
- [ ] **Plugin-Konfigs per `plugin-konfig/einspielen.sh <smp-ordner> smp vm200` eingespielt** (Server gestoppt, nach dem ersten Start, damit die Plugin-Ordner existieren; danach Neustart).
  Enthält Fair Play (Höhlenansicht nur im Nether), DimensionControl-Texte deutsch,
  Armor Poser, bStats aus, Voice Chat Backend 24455 auf 127.0.0.1 und `permissions.yml`. Stichprobe: `grep CaveModeInNether plugins/XaeroFairPlay/xaero-fair-play.json`
- [ ] **Kein Right click harvester und kein Spawn Elytra** im `plugins/`-Ordner (beide gestrichen 24.10., das Skript warnt)
- [ ] Chat mit No Chat Reports: Paper `enforce-secure-profile=false` und Velocity `force-key-authentication = false` (`velocity/README.md` → Chat-Signaturen)
- [ ] Velocity: `velocity.toml` nach `velocity/velocity.toml.auszug` (`show-max-players = 30`, Modern Forwarding, Secret nur auf dem Server, `[servers]` hub + smp, `try = ["hub"]`)
- [ ] Velocity: `plugins/bStats/config.txt` → `enabled=false`

## Hub `MinecraftHub01` (seit 24.10.)

- [ ] AMP-Instanz angelegt (Pascal), Paper wie SMP, Heap 2 GB (`kapazitaet.md`), Port 25567 nur `127.0.0.1`
- [ ] `server.properties` nach `server.properties.md` → Hub (Abenteuer, `force-gamemode`, friedlich, kein Nether, Whitelist, dasselbe Pack wie SMP), `paper-global.yml` mit **demselben** Secret
- [ ] Nur die Hub-Plugins (`plugins.md` → Hub): Serverwahl, WorldEdit, WorldGuard, Voice Chat. Konfigs per `plugin-konfig/einspielen.sh <hub-ordner> hub vm200` (warnt bei SMP-Plugins)
- [ ] Hub-Welt (Fantasy Village) von der Spawn-&-Welt-Session eingespielt, Spawnpunkt gesetzt, Spielregeln aus `server.properties.md` → Hub
- [ ] Kisten-Koordinaten in `plugin-konfig/hub/plugins/Serverwahl/config.yml` mit der fertigen Hub-Welt abgeglichen, Welt-Name in `WorldGuard/worlds/<welt>/` passt
- [ ] SMP hat ebenfalls `serverwahl-1.0.0.jar` (für `/hub` und die Eröffnungssperre)
- [ ] Merker-Ordner `/AMP/geteilt/status/` (Besitzer `amp`) angelegt, `serverwahl status` auf beiden zeigt „geschlossen“. Ohne Op wird der SMP-Beitritt abgewiesen, auch per `/server smp`
- [ ] Nach dem Testlauf 21.11.: `serverwahl schliessen`, damit das SMP bis 27.11. wieder zu ist
- [ ] Eröffnungsbefehle in `plugin-konfig/smp/plugins/Serverwahl/config.yml` (Phase 1, `time set 0`, `weather clear`) geprüft: im Testlauf einmal ausgeführt, nach Neustart nicht wiederholt
- [ ] Portal-Sperre ohne Op geprüft: Netherportal zündet nicht, kein Enderauge im Rahmen, solange `nether`/`end` zu sind
- [ ] Wechsel geprüft: Beitritt → Hub, linke Kiste → SMP (Pack lädt nicht neu), `/hub` zurück, `/server smp`, Voice Chat in beiden, SMP-Neustart schiebt Spieler in den Hub
- [ ] Whitelist auf beiden mit denselben ~25 Namen

## Welt

Ablauf seit 30.10. (Pascal): **neue SMP-Welt mit neuem Zufalls-Seed** über `spawn/smp-neu/` (Spawn & Welt), Insel am natürlichen World-Spawn per Versatz.
CA12 und die feste Insel-Lage sind überholt. Der Seed steht nur in der Welt, in `spawn/quellen/smp-seed.txt` (git-ignoriert) und in der Vault-Administration.

- [ ] Neue Welt erzeugen und aufbauen: `spawn/smp-neu/erzeugen.sh` → `bauen.sh` → Abnahme-Renders, Pascal gibt frei (Spawn & Welt, `spawn/smp-neu/README.md`)
- [ ] Einspielen: `server/vm200/smp-neu-einspielen.sh` (alte Welt sichern, Welt, Seed in AMP, `regions.yml`/`weihnachtsmann.json`/`mission.json` aus
  `spawn/smp-neu/ausgabe/`, Configs mit Versatz, `winter-weihnachten` noch **nicht**, Anti-Xray, Spieler-Reset Hub + SMP)
- [ ] **Vorgenerierung auf VM200** (Leitung 31.10.), nach dem Einspielen, SMP gestartet, Whitelist zu, keine Spieler: Befehle aus
  `bash spawn/smp-neu/vorgenerieren.sh --befehle` (Grenzen 10000/2500/10000, Chunky Overworld r 5000 um den Spawn, Nether r 1250 um Spawn ÷ 8, End r 2000 um 0/0)
  nacheinander in die AMP-Konsole. Chunky arbeitet die drei Welten nebeneinander ab; fertig bei dreimal „[Chunky] Task finished“ (lokal ~35 min, ~4 GB). Dann `save-all flush`
- [ ] **Erst danach** `winter-weihnachten` nach `world/datapacks` und Neustart (mit Temperatur 0 baut die Generierung sonst Schnee und Eis fest ein, auch auf Meer und Fluss)
- [ ] Keine Dimensions-Ordner vor dem ersten Start anlegen (Absturz in 26.3); Anti-Xray Nether/End erst danach (`anti-xray-setzen.py` macht das)
- [ ] Frischer Join nach `spawn/PRUEFLISTE.md` (Testspieler auf der Insel, Ender-Kiste, Elytra-Zonen, Inselschutz, Kalender Tag 0, Weihnachtsinsel Stufe 0)
- [ ] Datapacks per `/datapack list` (`plugins.md`), Wanderhändler-Rabatt dauerhaft an
- [ ] Velocity-MOTD und Server-Bild (`icon/README.md`, `velocity/velocity.toml.auszug`)

## Messen und Nachweisen

- [ ] Realer Lasttest am Testlauf 21.11. mit spark (Profiler, health) und docker stats, Ergebnisse in `kapazitaet.md` „Gemessen“ (`lasttest.md`; Bot-Test nur auf getrennter Kopie ohne Portfreigabe)
- [ ] Upload von VM200 aus abends gemessen (3 Tage, 19–22 Uhr), Sichtweite nach den Grenzwerten festgelegt (`kapazitaet.md` → Upload)
- [ ] **Xaero-Weltkarte zeigt nichts Unterirdisches** (Testlauf, Idee Pascal: im Einzelspieler waren 3 Trial Chambers auf der Karte). Als Spieler ohne OP mit dem Modpack:
  in der Overworld lässt sich die Höhlenansicht nicht einschalten (Minimap und Weltkarte), im Nether schon (so entschieden). Ein OP sucht vorher per
  `/locate structure minecraft:trial_chambers` eine Trial Chamber, der Spieler fliegt hin und prüft, dass sie auf keiner Karte auftaucht. Dazu stichprobenartig
  Anti-Xray: Höhlen und Erze unter der Oberfläche dürfen auch mit Freecam/Röntgen-Texturen nicht erkennbar sein (`paper/anti-xray.md`).
  Kommt doch etwas durch: Fair-Play-Konfiguration und Spielerrechte prüfen (OP umgeht die Sperre), sonst Leitung
- [ ] Grundlinie mit spark: `/spark health --upload` ohne Spieler nach der Vorgenerierung, Link in die Administration-Doku (`spark.md`)

## Betrieb

- [ ] Backups laufen (Pascal 30.10.): AMP-Sicherung SMP **stündlich** zur Minute 40 (24 Stände, max. 80 GB), Hub 03:20, Proxy 03:25, QNAP-Kopie 03:47
  (`vm200/amp-sicherung.py`, `vm200/mc-sicherung-qnap.sh`; AMP-Zeitpläne laufen in UTC), Proxmox 02:00 und 04:00. Wiederherstellung geprobt (`vm200/restore-test.sh`)
- [ ] **Season-Wechsel nur mit Abschluss-Schnappschuss:** `save-all flush`, dann `SCHNAPPSCHUSS_ERSETZEN=1 schnappschuss.sh …` von Hand, erst danach `SEASON`
  umstellen. `testlauf` → `weihnachten-2026` direkt vor dem Weltwechsel (Task 10 Schritt 4), nicht erst am 27.11. (`statistik/README.md` → Seasons)
- [ ] **Generalprobe November zurückstellen** (Pascal 30.10., Liste Leitung 30.10.) – Reihenfolge:
  1. Konsole SMP (Server läuft): `function weihnachtsinsel:zuruecksetzen`, dann `function weihnachtsinsel:vorbereiten` (Insel, Brücke, Tafel auf Stufe 0),
     `nether close`, `end close`, Leitfaden-Phase auf 0 (Questbuch-Session nennt den Befehl)
  2. Proxy, Hub, SMP in AMP stoppen, dann `python3 vm200/generalprobe-zurueck.py` (zeigt die Diffs) und mit `--ausfuehren` schreiben. Es stellt zurück:
     Kalender `erster-tag "12-01"`, `termine.aktive-liste: liste` (Hub + SMP), Sperrtexte und Hub-Beschreibung „27.11.“, SMP `mission.start` raus,
     Hub `api.gilden` nur noch Final-Server `899675876298469457`, Test-Guilds aus `discord.json`, Velocity-MOTD „Start am 27.11.“;
     löscht `eroeffnet.txt`, `termine.txt` (Hub + SMP), `mission-stand.yml`, `geteilt/status/smp-offen`. Sicherung `/root/mcw-staging/vor-zurueck-*`
  3. Repo genauso zurückstellen (Configs `plugin-konfig/*/Serverwahl/config.yml`, `velocity/velocity.toml.auszug`), damit ein späteres Einspielen nichts zurückholt
  4. Hub-Termine-Stand: `spawn/hub.json` `text` ↔ `text_zum_testlauf` (Spawn & Welt), Hub-Datapack neu, `function hub:staende`
  5. Statistik (Statistik-Session 30.10.): Whitelist zu, `save-all flush`, SMP stoppen; `SCHNAPPSCHUSS_ERSETZEN=1 /opt/mc-weihnachten/schnappschuss.sh …` von Hand
     (Pfade wie im Cron), N > 0 prüfen; restliche `logs/*.log.gz` und `latest.log` des SMP nach `/home/amp/mc-archiv/testlauf/logs/paper/` verschieben
     (`latest.log` gzippen als `<JJJJ-MM-TT>-99.log.gz`); erst dann `echo weihnachten-2026 > /home/amp/mc-archiv/SEASON`, Weltwechsel,
     Statistikdienst neu starten, Seite zeigt „Weihnachten 2026“ leer
  6. Neue SMP-Welt (Abschnitt „Welt“), Whitelist bzw. Discord-Einträge prüfen
- [ ] **Phasen ohne AMP:** serverwahl `termine:` (SMP: Nether Fr 11.12., Phase 3 Vorschlag 15.12., End Fr 18.12., je 18:00 vorläufig; Hub: Start-Ankündigung 27.11. 18:00,
  Rückfall-Eröffnung 18:10). `/serverwahl termin liste` auf beiden zeigt alle Termine, keiner „erledigt“ (Testwelt-Merker `plugins/Serverwahl/termine.txt` vor dem Start löschen)
- [ ] Statistik auf VM200 läuft (seit 30.10. Season `testlauf`): `/opt/mc-weihnachten/schnappschuss.sh`, Archiv `/home/amp/mc-archiv`, Cron 03:50 `/etc/cron.d/mc-statistik`
- [ ] **Datenschutz (Freigabe Pascal 30.10., aktiv):** Statistik-Cron mit `IP_MASKIEREN=1`, Cron 04:30 `vm200/mc-logs-aufraeumen.sh --ausfuehren` (IP-haltige Logs nach 30 Tagen weg); Log `/var/log/mc-logs-aufraeumen.log` stichprobenartig prüfen
- [ ] Dorf-Rabatt 24.–26.12. (`dorf-rabatt:`) und Neujahrsfeuerwerk (`neujahr:`) in der Config, `neujahr.txt`/`termine.txt` aus der Testwelt gelöscht
- [ ] **Täglicher Neustart 04:00** (Pascal 30.10.) per Cron auf VM200 (`vm200/mc-neustart.sh`, Log `/var/log/mc-neustart.log`), nach SMP-Sicherung 03:40 und
  QNAP-Kopie 03:47; Prism-Purge 04:30. Startmodus „Anwendung starten“ in allen drei AMP-Instanzen, „Start beim Booten“ an. Ohne Chatwarnung (keine Konsole per Cron)
- [ ] Ausfall-Alarm auf dem Proxmox-Host (`vm200/mc-healthcheck.py`, alle 2 min, Discord-Webhook), Testnachricht angekommen
- [ ] **Update-Stopp 27.11.–18.12.:** keine Updates von Paper, Velocity, Plugins und AMP, nur Sicherheitsfixes; Wartung sonst im Fenster 04:00 nach Sicherung
- [ ] AMP-Log-Aufbewahrung so, dass das Statistik-Skript alle Logs abholt, bevor AMP sie löscht
- [ ] Keine `getamp update`/Docker-Updates zu Spielzeiten (Globale Vorgaben), vorher Proxmox-Snapshot bzw. AMP-Sicherung
- [ ] Rückfall Nitrado bekannt (Plan Task 9 Schritt 8)

## Eröffnung (Weltenbaum öffnet sich)

> **Überholt seit 24.10. spät (Hub-Kurswechsel):** Weltenbaum verworfen, die Eröffnung läuft jetzt im Hub (Datapack `hub` der Spawn-&-Welt-Session setzt `#offen` in `insel_zustand`,
> der Hub legt den Merker an, das SMP öffnet, `serverwahl/README.md` → Eröffnungssperre). Die Tabelle unten (Funktionen `insel:…`, Weltgrenze) wird mit den `hub:`-Funktionsnamen neu geschrieben.
> Gültig bleiben: Pascal löst von Hand aus, danach Phase 1, Statistik-Nullpunkt, Rückfall-Aufgabe in AMP, Generalprobe am 21.11.

Pascal, 24.10.: Vor dem Start warten alle im geschlossenen Weltenbaum, beim offiziellen Start öffnet er sich und die Weltgrenze springt von klein auf 10.000.
Funktionen aus dem Datapack `insel` der Spawn-&-Welt-Session (abgestimmt 24.10.):

| Funktion | Wirkung |
|---|---|
| `insel:aufbau` | einmalig alles einrichten, endet geschlossen (kleine Grenze, Merker `#offen` = 0) |
| `insel:schliessen` | Ausgänge zu, kleine Grenze (128 breit um den Stamm-Mittelpunkt, Koordinaten nach der Seed-Wahl), `#offen` = 0 |
| `insel:eroeffnung` | 10 s Countdown mit Bossbar/Titel, öffnet die vier Ausgänge mit Partikeln und Sound, „Willkommen!“, `worldborder set 10000`. Läuft nur bei `#offen` = 0, ein zweiter Aufruf tut nichts |

Der Spawnpunkt bleibt vor und nach dem Öffnen derselbe (Spawn-Raum im Stammfuß). Die Phase setzt `insel:eroeffnung` bewusst nicht, das bleibt getrennt.

**Vorher (Task 10 Schritt 4, zwischen 21.11. und 27.11., Ziel Mi 25.11.):** Season-Wechsel `testlauf` → `weihnachten-2026` mit Abschluss-Schnappschuss, neue Welt, `function insel:aufbau`,
Chunky-Vorgenerierung (hängt nicht an der Weltgrenze, geht also auch bei kleiner Grenze). Whitelist an, alle ~25 Namen eingetragen. Nether/End geschlossen, `#phase` = 0.

**Am Starttag:**

| Wann | Was | Wer |
|---|---|---|
| vor 04:00 | normaler Tagesbetrieb: Schnappschuss 04:00, Neustart 05:00 | AMP |
| ab ~1 h vor Start | Spieler dürfen beitreten und warten im Baum (Whitelist bleibt an, sonst nichts zu tun) | – |
| Startzeit | `function insel:eroeffnung` in der AMP-Konsole | **Pascal** (bewusst von Hand, damit er auf Nachzügler warten kann) |
| nach „Willkommen!“ (~15 s) | `function leitfaden:phase/setzen_1` | Pascal |
| direkt danach | Statistik-Nullpunkt: `save-all flush`, dann `SCHNAPPSCHUSS_ERSETZEN=1 /opt/mc-weihnachten/schnappschuss.sh …` (ersetzt den 04:00-Stand des Tages, der alte bleibt als `.vorher-…`). Spielzeit im Baum vor dem Start zählt dann nicht | Pascal (Befehl aus `statistik/README.md`) |
| Start + 10 min | **Rückfall in serverwahl (Hub, Termin `start-rueckfall`)**, falls Pascal ausfällt: `function hub:eroeffnung`, nur solange noch zu. Phase 1 setzt das SMP selbst, sobald der Merker da ist (`eroeffnung.befehle`) | serverwahl |

Der Season-Wechsel hat mit der Eröffnung nichts zu tun: Er passiert schon beim Weltwechsel (vor dem 27.11.). Fällt Pascal aus, fehlt nur der Statistik-Nullpunkt
(dann zählt die Wartezeit im Baum mit, das ist verschmerzbar).

**Testlauf 21.11.:** dieselbe Eröffnung als Generalprobe in der Testwelt mit den 2–3 Testern (Baum in der Testwelt, Spawn-&-Welt-Session).
Prüfen: Spieler kommt vorher nicht aus dem Baum, nach `insel:eroeffnung` Grenze 10.000, zweiter Aufruf ändert nichts, Rückfall-Befehl für die Phase wirkt nur bei Phase 0,
Ansage kommt einmal. Für weitere Proben `function insel:schliessen`, danach geht `insel:eroeffnung` wieder (kein Neustart nötig).
Auf dem Testlauf-Server ist der Statistik-Nullpunkt egal (Season `testlauf`).

**Start Fr 27.11.:** wie oben. Uhrzeit vorläufig 18:00, legt Pascal fest (dann in den `termine:` beider Configs anpassen).

- [ ] Eröffnung im Testlauf geprobt, Funde behoben
- [ ] Hub-Termin `start-rueckfall` steht auf Startzeit + 10 min (keine AMP-Aufgabe mehr nötig)

## Nach der Saison (Datum offen, Pascal entscheidet)

Vorschlag Spawn & Welt (30.10.), je Punkt mit Empfehlung:

| Punkt | Vorschlag | Wie |
|---|---|---|
| Winter-Datapack | raus | `winter-weihnachten` aus `world/datapacks`, Neustart, danach das Aufräum-Kommando aus `winter.md` (Schnee/Eis in warmen Biomen), LSS-Store invalidieren |
| Deko an der Spawn-Insel | aus | `function insel:deko_aus` (Schnee, Lichterketten, Anzeigen weg), Datapack `insel-deko` danach entfernen |
| Winterkalender | abbauen, Belohnungen bleiben bei den Spielern | `function insel:kalender_aus`, Datapack `insel-kalender` raus. Eingelöste Items bleiben im Inventar |
| Weihnachtsinsel | **bleibt** als Bauwerk (Erinnerung), Mission beendet | serverwahl-Mission aus (keine Spenden mehr), Tafel auf „Danke“-Text oder entfernen; Weihnachtsmann-Händler: Rabatt endet ohnehin mit Dezember |
| Hub-Texte | auf „Saison vorbei“ | `spawn/hub.json`: Termine und Winterkalender-Stand neu texten, Hub-Paket bauen und tauschen, `function hub:staende` |
| Dorf-Kopfschmuck (Mützen) | darf bleiben | nur Optik, kein Aufwand |

Reihenfolge: zuerst Hub-Texte (Spieler sehen es zuerst), dann Mission aus, dann Deko/Kalender, zuletzt Winter-Datapack + Aufräumen (Neustart, Ankündigung vorher).
