# Statistik-Schnappschuss (Task 9 Schritt 7)

`schnappschuss.sh` sichert jeden Tag die Spielerstatistiken (`stats`, `advancements`, `usercache.json`) und verschiebt
abgeschlossene Logs von Paper und Velocity ins Archiv. Gelöscht wird nie etwas. Läuft das Skript am selben Tag zweimal,
bleibt der erste Schnappschuss stehen.
Daraus baut die Statistikseite (`statistik/` im Repo) Verläufe (Spielzeit über die Zeit) und Sitzungen (aus den Logs).

Die Ablage der Spielerdaten hat sich in den 26er-Versionen geändert (`players/stats/` statt `stats/`). Das Skript sucht die Ordner
`stats`/`advancements` deshalb im Weltordner (bis Tiefe 3, ohne `datapacks/`), statt einen festen Pfad zu nutzen.

## Archiv-Aufbau

```text
<archiv>/
  SEASON                              eine Zeile: aktuelle Season-Kennung, z. B. weihnachten-2026
  schnappschuss.log                   Ausgabe der Cron-Läufe
  <season>/
    schnappschuesse/JJJJ-MM-TT.tar.gz enthält JJJJ-MM-TT/<pfad im Weltordner>/*.json und JJJJ-MM-TT/usercache.json
    logs/paper/*.log.gz
    logs/velocity/*.log.gz
```

Für die Statistikseite heißt das: `--archiv <archiv>/<season>` übergeben (dort liegen `logs/paper/` wie bisher).

## Seasons (manuell)

Eine Season = eine Welt. Jede neue Welt bekommt eine neue Kennung, damit die Zähler bei null anfangen und keine Minus-Differenzen entstehen.
Kennungen bestehen nur aus `a-z`, `0-9` und `-`. Fehlt `SEASON` oder ist die Kennung ungültig, bricht das Skript ab, damit nichts in der
falschen Season landet.

| Season | ab | Welt |
|---|---|---|
| `testlauf` | Sa 21.11.2026 (Testlauf, Task 10 Schritt 2) | Testwelt |
| `weihnachten-2026` | Sa 05.12.2026 (Start) | echte Welt |

**Umstellen** (zusammen mit dem Weltwechsel in Task 10 Schritt 4, vor dem ersten Beitritt in der neuen Welt):

```bash
echo weihnachten-2026 > /home/amp/mc-archiv/SEASON
```

Der Ordner der alten Season bleibt unverändert liegen.

## Datum und Zeitzone

Der Dateiname `JJJJ-MM-TT` ist das **Berliner Datum (Europe/Berlin) zum Zeitpunkt des Laufs um 04:00**. Ein Schnappschuss vom
`2026-12-06` enthält also den Stand am 06.12. um 04:00, mit allem, was am Abend des 05.12. gespielt wurde.
Das Skript rechnet selbst mit `TZ=Europe/Berlin` (bricht ab, wenn die Zeitzonendaten fehlen). Damit der Cron-Job auch um 04:00 Berliner Zeit
läuft, steht VM200 auf `Europe/Berlin`. Das Format bleibt fest, die Statistikseite verlässt sich darauf.

```bash
timedatectl set-timezone Europe/Berlin
```

## Speichern vor dem Schnappschuss

Minecraft schreibt die Statistik nur beim automatischen Speichern und beim Verlassen. Damit Spieler, die über Nacht online sind, nicht mit
veraltetem Stand drin sind, sendet eine **AMP-Aufgabe um 03:58** den Konsolenbefehl an `MinecraftWeihnachten01` (Pascal im AMP-Web-UI,
Zeitplan → täglich 03:58 → Konsolenbefehl senden):

```text
save-all flush
```

Das Skript löst `save-all` nicht selbst aus (keine Konsole/RCON von außen). Fällt die AMP-Aufgabe einmal aus, ist der Schnappschuss
höchstens um den Abstand bis zum letzten Autosave älter.

## Einrichten auf VM200 (nach Task 2, spätestens vor dem Testlauf am 21.11.)

Geplante Pfade, werden beim Einrichten bestätigt:

- Skript: `/opt/mc-weihnachten/schnappschuss.sh` (Besitzer root, `chmod 755`)
- Archiv: `/home/amp/mc-archiv/` → in die Backups aufnehmen (Task 9 Schritt 3)

```bash
mkdir -p /home/amp/mc-archiv
```

```bash
echo testlauf > /home/amp/mc-archiv/SEASON
```

Crontab von root (`crontab -e`):

```bash
0 4 * * * /opt/mc-weihnachten/schnappschuss.sh /home/amp/.ampdata/instances/MinecraftWeihnachten01/Minecraft /home/amp/mc-archiv /home/amp/.ampdata/instances/MinecraftProxy01/velocity >> /home/amp/mc-archiv/schnappschuss.log 2>&1
```

AMP-eigene Log-Aufräumung prüfen: Falls AMP alte Logs löscht, die Aufbewahrung dort hochsetzen. Das Skript holt sie nur einmal täglich ab.

## Test

```bash
bash server/statistik/test_schnappschuss.sh
```

Baut eine Instanz nach (neue Ablage, Datapack-Advancements, Logs) und prüft: Abbruch ohne Season, bei ungültiger Season und bei ungültigem
Datum, Schnappschuss-Inhalt, Logs verschoben, `latest.log` bleibt, zweiter Lauf überschreibt nichts, Namenskonflikt bei Logs überschreibt nichts,
Season-Wechsel legt einen neuen Ordner an und lässt den alten unverändert.
