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

## Bestenliste für Discord und Hub (seit 31.10., Generalprobe)

Entscheidung Pascal 31.10.: Die Statistik erscheint **im Discord** (eine Webhook-Nachricht in `#mc-bestenliste`, stündlich bearbeitet) und **im Hub** (8 Text-Displays). Die Webseite ist nur intern und ohne Eile, es gibt keine öffentliche Seite und keinen Funnel.

- `bestenliste.mjs` baut aus derselben Auswertung (Ansicht „Diese Season“, Ausgeblendete fehlen) die Listen aus `lib/anzeige.mjs`: Hub-Plätze 1–8 Dauerzocker, Weihnachtself, Abrissbirne, Monsterjäger, Weltenbummler, Pechvogel, Abenteurer, Diamantenjäger; der Discord zeigt dieselben 8 Listen. Weltenbummler zählt alle Fortbewegungsarten außer Fallen. Je Liste Top 5.
- `--ausgabe <datei>` schreibt die Hub-Datei (Format in `DATENFORMAT.md`), `--webhook-datei` + `--zustand` bearbeiten die Discord-Nachricht (gelöscht → neu angelegt), `--probe` zeigt die Nachricht nur an.
- Probe lokal: `node statistik/bestenliste.mjs --instanz statistik/testwelt --sichtbarkeit statistik/testwelt/sichtbarkeit.json --sprache statistik/daten/sprache.json --probe`

### Betrieb auf VM200

`betrieb/einrichten.sh` (nach dem Push, holt `statistik/` von GitHub):

```powershell
Get-Content -Raw statistik/betrieb/einrichten.sh | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
```

- Cron `/etc/cron.d/mc-bestenliste`: alle 15 Minuten die Hub-Datei `/srv/ampdata/mc-netzwerk-geteilt/bestenliste/bestenliste.json` (im Hub `/AMP/geteilt/bestenliste/bestenliste.json`), stündlich zur Minute 5 zusätzlich Discord. Läuft per `docker run node:24-alpine` (`/usr/local/sbin/mc-bestenliste.sh`), Log `/opt/mc-statistik/lauf.log`.
- **Webhook-URL ist ein Geheimnis:** nur in `/opt/mc-statistik/discord-webhook` (root, Rechte 600), nie ins Repo, nie in Logs. Ohne die Datei läuft nur die Hub-Datei. Die ID der bearbeiteten Nachricht steht in `/opt/mc-statistik/discord-zustand.json`.
- **Daten:** SMP-Instanz und `/home/amp/mc-archiv` werden nur gelesen. Season aus `/home/amp/mc-archiv/SEASON` (Generalprobe: `testlauf`, angezeigt als „Generalprobe“ aus `testlauf/NAME`). Werte aus den Spielerdateien (Minecraft speichert alle 5 Minuten und beim Verlassen).
- **Ausblenden:** UUID in `/opt/mc-statistik/sichtbarkeit.json` unter `"ausgeblendet"`, wirkt beim nächsten Lauf. Standard: alle sichtbar. Fehlt die Datei, ist niemand sichtbar.
- **Season-Wechsel zum 27.11.:** Schritte in `server/statistik/README.md` und `server/vor-dem-start.md`. Danach zeigen Discord und Hub nur „Weihnachten 2026“, die Generalprobe bleibt im Archiv.
- **Zusatzwerte:** `server:fortschritte` (Vanilla-Fortschritte ohne Rezepte, aus `players/advancements`) und `server:spenden` (Weihnachtsinsel, `plugins/Serverwahl/mission-stand.yml` → `gesamt-spender`). Für abgeschlossene Seasons zählen Spenden nur, wenn der Schnappschuss `<datum>/mission-stand.yml` enthält.
