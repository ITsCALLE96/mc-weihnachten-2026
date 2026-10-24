# spark: TPS, MSPT und Profiler

**spark ist in Paper eingebaut** (seit Paper 1.21). Es braucht kein eigenes Plugin. Beim Einrichten mit `/spark` prüfen, dass es antwortet.

## Braucht Pascal das spark-Plugin zusätzlich?

**Nein.** Die eingebaute Version kommt mit jedem Paper-Build und wird mit ihm aktualisiert. Auf Modrinth gibt es für 26.3 nur die Mod-Fassungen
(Fabric/Forge/NeoForge, 1.10.187 vom 19.09.), keine eigene Paper-Fassung. Wer das Plugin trotzdem installiert, ersetzt damit die eingebaute Version.
Das lohnt sich nur, wenn eine neue spark-Funktion dringend gebraucht wird, bevor Paper sie übernimmt. Bei einer eingefrorenen Version (`VERSION.md`) ist das unwahrscheinlich.

Auf dem **Velocity-Proxy** ist kein spark eingebaut. Ein spark-Plugin für Velocity gibt es, nötig ist es nur, wenn der Proxy selbst auffällig wird. Das ist bei 25 Spielern nicht zu erwarten.

## Befehle (Konsole oder Chat mit OP)

| Befehl | Zeigt | Hinweis |
|---|---|---|
| `/spark tps` | TPS (5 s, 10 s, 1 min, 5 min, 15 min), MSPT (Mittel, Median, 95 %, Max), CPU-Last | der wichtigste Schnellblick |
| `/spark health` | TPS, MSPT, CPU (Prozess und System), RAM, Speicherbereinigung, Plattenplatz | gut für Lasttest und Testlauf |
| `/spark health --upload` | dasselbe als Web-Bericht | Link wird ausgegeben |
| `/spark profiler start --timeout 300` | zeichnet 5 min auf, danach Web-Ansicht unter spark.lucko.me | zeigt, was die Zeit frisst (Plugins, Entities, Chunks) |
| `/spark profiler start --only-ticks-over 60` | nur langsame Ticks (über 60 ms) | für gelegentliche Ruckler |
| `/spark profiler stop` | beendet die Aufzeichnung vorzeitig und lädt sie hoch | |
| `/spark tickmonitor --threshold-tick 50` | meldet im Chat jeden Tick über 50 ms | live beobachten |
| `/spark gc` | Speicherbereinigungen seit dem Start | |
| `/spark heapsummary` | was im RAM liegt, als Web-Ansicht | nur bei Verdacht auf Speicherleck |
| `/tps`, `/mspt` | Paper-Kurzanzeige | ohne spark-Ausgabe |

**Web-Ansicht:** Profile und Berichte landen bei spark.lucko.me unter einem zufälligen, schwer zu ratenden Link. Jeder mit dem Link kann sie ansehen. Sie enthalten
Server-Interna (Plugins, Konfiguration, Threads), aber keine Passwörter. Links deshalb nur in die Doku, nicht öffentlich posten.

## Rechte

Standardmäßig dürfen **nur OPs** und die Konsole alle spark-Befehle sowie `/tps` und `/mspt` nutzen. Spark-Rechte heißen `spark` (alles) bzw. `spark.<befehl>`, z. B. `spark.tps`.
Das prüfe ich beim Einrichten mit `/spark` gegen die Version in Paper 26.3.

**Entschieden (Leitung 24.10.): alle Spieler sehen `/spark tps`**, über Weg 1 mit der Datei `paper/permissions.yml`. Zur Wahl standen:
1. **Ohne Zusatz-Plugin:** Bukkits eigene `permissions.yml` im Serverordner, `spark.tps` mit `default: true`. Klein, ohne neues Plugin, gilt dann aber für alle
2. **LuckPerms** (Rechte-Plugin): fein steuerbar (Gruppen, einzelne Spieler), aber ein Plugin mehr, das gepflegt werden will

Umgesetzt ist nur `spark.tps`, keine Profiler-Rechte. Mit den Profiler-Rechten könnten Spieler Interna hochladen.

**Einrichten:** `paper/permissions.yml` in den Serverordner (neben `server.properties`) kopieren, Server neu starten. Die Datei vergibt `spark.tps` über eine
eigene Sammel-Berechtigung `weihnachten.spieler` (Begründung in der Datei). **Bestätigt (lokaler Testserver, Pascal ohne OP, 24.10.):** `/spark tps` geht, `/spark profiler` ist gesperrt, im Serverlog keine Warnung zu
`permissions.yml`. Auf VM200 nur noch kurz gegenprüfen
