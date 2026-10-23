# Statistik-Schnappschuss (Task 9 Schritt 7)

`schnappschuss.sh` sichert jeden Tag die Spielerstatistiken (`stats`, `advancements`, `usercache.json`) als
`<archiv>/schnappschuesse/JJJJ-MM-TT.tar.gz` und verschiebt abgeschlossene Logs von Paper und Velocity nach `<archiv>/logs/`.
Gelöscht wird nie etwas. Läuft das Skript am selben Tag zweimal, bleibt der erste Schnappschuss stehen.
Daraus baut die Statistikseite später Verläufe (Spielzeit über die Zeit) und Sitzungen (aus den Logs).

Die Ablage der Spielerdaten hat sich in den 26er-Versionen geändert. Das Skript sucht die Ordner `stats`/`advancements` deshalb
im Weltordner (bis Tiefe 3, ohne `datapacks/`), statt einen festen Pfad zu nutzen.

## Einrichten auf VM200 (nach Task 2)

Geplante Pfade, werden beim Einrichten bestätigt:

- Skript: `/opt/mc-weihnachten/schnappschuss.sh` (Besitzer root, `chmod 755`)
- Archiv: `/home/amp/mc-archiv/` → in die Backups aufnehmen (Task 9 Schritt 3)

```bash
0 4 * * * /opt/mc-weihnachten/schnappschuss.sh /home/amp/.ampdata/instances/MinecraftWeihnachten01/Minecraft /home/amp/mc-archiv /home/amp/.ampdata/instances/MinecraftProxy01/velocity >> /home/amp/mc-archiv/schnappschuss.log 2>&1
```

AMP-eigene Log-Aufräumung prüfen: Falls AMP alte Logs löscht, die Aufbewahrung dort hochsetzen. Das Skript holt sie nur einmal täglich ab.

## Test

```bash
bash server/statistik/test_schnappschuss.sh
```

Baut eine Instanz nach (neue und alte Ablage, Datapack-Advancements, Logs) und prüft: Schnappschuss-Inhalt, Logs verschoben,
`latest.log` bleibt, zweiter Lauf überschreibt nichts, bei einem Namenskonflikt wird kein Log überschrieben.
