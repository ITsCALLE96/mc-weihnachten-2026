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

Entscheidung Pascal 31.10.: Die Statistik erscheint **im Discord** (eine Webhook-Nachricht in `#mc-bestenliste`, laufend bearbeitet) und **im Hub** (8 Text-Displays). Die Webseite ist nur intern und ohne Eile, es gibt keine öffentliche Seite und keinen Funnel.

- `bestenliste.mjs` baut aus derselben Auswertung (Ansicht „Diese Season“, Ausgeblendete fehlen) die Listen aus `lib/anzeige.mjs`: Hub-Plätze 1–8 Dauerzocker, Weihnachtself, Abrissbirne, Monsterjäger, Weltenbummler, Pechvogel, Abenteurer, Diamantenjäger; der Discord zeigt dieselben 8 Listen. Weltenbummler zählt alle Fortbewegungsarten außer Fallen. Je Liste Top 5.
- **Live (Pascal 31.10.):** Eine Änderung im Spiel steht nach höchstens etwa 1 Minute im Hub: serverwahl schreibt alle ~20 s Live-Werte der Online-Spieler (`plugins/Serverwahl/live/<uuid>.json`, `lib/livewerte.mjs`, Format in `DATENFORMAT.md`), der Dienst wertet alle 15 s aus, der Hub prüft alle ~15 s. Discord bei Änderung, höchstens jede Minute.
- **Discord als Grafik (Pascal 31.10.):** eine Nachricht mit kurzem Text (Season, Stand, Hinweis zum Ausblenden) und darunter **8 Embeds mit je einem Bild** (eine Kachel je Liste, 4:3, 600 × 450, doppelt so groß gerendert, `lib/grafik.mjs`); bei Änderung werden die Bilder ersetzt. Warum so: Ein einzelnes hohes Bild zeigt Discord am PC nur in einer Box von etwa 550 × 350 px, damit unlesbar; Embed-Bilder erscheinen am PC etwa 400 × 300 px und am Handy fast bildschirmbreit (Namen dann ~18–21 px). Ein Querformat (4 × 2) wäre am Handy zu klein, mehrere Anhänge ohne Embed zeigt Discord als kleines Mosaik. Je Liste Top 5 mit Minecraft-Kopf (Gesicht + Hut-Ebene als Pixel), Platz 1 hervorgehoben, Werte rechtsbündig und kurz (`4:04 h`, `385,2 km`, `186.621`). Köpfe holt der Dienst selbst bei Mojang (Session-API → textures.minecraft.net, keine Drittdienste) und speichert sie einen Tag in `/opt/mc-statistik/koepfe/`; ohne Skin (Bedrock, Mojang nicht erreichbar) ein Steve-Gesicht. SVG → PNG mit `@resvg/resvg-wasm` 2.6.2 (MPL-2.0, exakt im `package-lock.json`). Schrift **Poppins** (SIL Open Font License 1.1, `daten/schrift/OFL.txt`). Vorschau aus der Testwelt samt nachgebauter Discord-Ansicht (PC und Handy): `node statistik/vorschau-grafik.mjs <ordner>`, Bilder aus echten Daten: `--probe --bilder <ordner>`.
- `--ausgabe <datei>` schreibt die Hub-Datei (Format in `DATENFORMAT.md`), `--webhook-datei` + `--zustand` bearbeiten die Discord-Nachricht (gelöscht → neu angelegt), `--probe` zeigt die Nachricht nur an.
- Probe lokal: `node statistik/bestenliste.mjs --instanz statistik/testwelt --sichtbarkeit statistik/testwelt/sichtbarkeit.json --sprache statistik/daten/sprache.json --probe`

### Betrieb auf VM200

`betrieb/einrichten.sh` (nach dem Push, holt `statistik/` von GitHub):

```powershell
Get-Content -Raw statistik/betrieb/einrichten.sh | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
```

- Dauerhafter Dienst `mc-bestenliste` (`betrieb/compose.yml`, `node:24-alpine`, `restart: unless-stopped`, kein Port, Dateisystem nur lesend außer Hub-Ordner und `/opt/mc-statistik`): alle 15 s auswerten, Hub-Datei `/srv/ampdata/mc-netzwerk-geteilt/bestenliste/bestenliste.json` (im Hub `/AMP/geteilt/bestenliste/bestenliste.json`) nur bei Änderung neu, Discord bei Änderung und höchstens jede Minute. Log: `docker compose -p mc-bestenliste logs` (meldet nur Wechsel, z. B. Fehler/wieder ok). Der frühere Cron (`/etc/cron.d/mc-bestenliste`) wird von `einrichten.sh` entfernt. Neuer Code: `einrichten.sh` erneut ausführen (git pull, `npm ci` im Repo-Ordner, Neustart).
- **Webhook-URL ist ein Geheimnis:** nur in `/opt/mc-statistik/discord-webhook` (root, Rechte 600), nie ins Repo, nie in Logs. Links aus Discord PTB/Canary gehen auch (gesendet wird an discord.com). Ohne die Datei läuft nur die Hub-Datei; wird sie angelegt, sendet der Dienst ohne Neustart. Die ID der bearbeiteten Nachricht steht in `/opt/mc-statistik/discord-zustand.json`.
- **Daten:** SMP-Instanz und `/home/amp/mc-archiv` werden nur gelesen. Season aus `/home/amp/mc-archiv/SEASON` (Generalprobe: `testlauf`, angezeigt als „Generalprobe“ aus `testlauf/NAME`). Werte aus den Spielerdateien (Minecraft speichert alle 5 Minuten und beim Verlassen), für Online-Spieler zusätzlich die Live-Werte (je Wert der größere; Dateien älter als 90 s zählen nicht).
- **Ausblenden:** UUID in `/opt/mc-statistik/sichtbarkeit.json` unter `"ausgeblendet"`, wirkt nach spätestens 15 s. Standard: alle sichtbar. Fehlt die Datei, ist niemand sichtbar.
- **Season-Wechsel zum 27.11.:** Schritte in `server/statistik/README.md` und `server/vor-dem-start.md`. Danach zeigen Discord und Hub nur „Weihnachten 2026“, die Generalprobe bleibt im Archiv.
- **Zusatzwerte:** `server:fortschritte` (Vanilla-Fortschritte ohne Rezepte, aus `players/advancements`) und `server:spenden` (Weihnachtsinsel, `plugins/Serverwahl/mission-stand.yml` → `gesamt-spender`). Für abgeschlossene Seasons zählen Spenden nur, wenn der Schnappschuss `<datum>/mission-stand.yml` enthält.
