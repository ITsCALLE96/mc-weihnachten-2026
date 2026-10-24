# Statistikseite – Datendienst

Zweck: liest Paper-Logs, Spielerstatistiken und `usercache.json` eines Minecraft-Servers (nur lesend), wertet sie aus und liefert
`/api/daten`, `/api/live` (SSE), `/api/kopf/<uuid>.png` sowie die Seite aus `web/`. Node 24, keine npm-Abhängigkeiten.
Vertrag zwischen Dienst und Seite: [`DATENFORMAT.md`](DATENFORMAT.md). Ausgeblendete Spieler verlassen den Dienst nie.

## Befehle

```sh
# Sprachdatei (de/en) aus dem lokalen Minecraft-Client erzeugen -> daten/sprache.json
node statistik/sprache.mjs            # Optionen: --jar --index --objekte --aus

# Testwelt erzeugen (10 Spieler, 18 Tage, 1 ausgeblendet) -> statistik/testwelt/ (nicht im Git)
node statistik/testdaten.mjs          # Optionen: --ziel <ordner>, --live (hängt Zeilen an latest.log an)

# Dienst lokal starten (nur 127.0.0.1:8080)
node statistik/dienst.mjs --instanz statistik/testwelt --archiv statistik/testwelt/archiv --sichtbarkeit statistik/testwelt/sichtbarkeit.json --sprache statistik/daten/sprache.json --testmodus

# Tests (unter Node 24 ohne Verzeichnisargument: Glob verwenden)
node --test "statistik/**/*.test.mjs"
```

Weitere Optionen des Dienstes: `--archiv <archivwurzel>` (mit `SEASON` und einem Ordner je Season), `--season`, `--season-name`, `--allzeit-ohne` (Standard `testlauf`), `--name`, `--port`, `--cache` (Kopfbilder), `--web`. Seasons: siehe DATENFORMAT.md.
Ohne `--testmodus` werden Skins einmal pro Tag von Mojang geholt und im `--cache`-Ordner zwischengespeichert.
