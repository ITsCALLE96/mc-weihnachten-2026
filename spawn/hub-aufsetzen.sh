#!/bin/bash
# Baut den Hub in einen vorhandenen Hub-Server (Leerwelt, angelegt von der Server-Session, z.B. testnetz/hub): Struktur-Kacheln + Datapack hub
# in die Welt, Server ohne Fenster starten, function hub:aufbau, speichern, stoppen. Mehrfach ausführbar (setzt Bau und Hub-Inhalte neu).
# Aufruf (Hub-Server muss gestoppt sein): bash spawn/hub-aufsetzen.sh <hubordner> [java]
# Die WorldGuard-Datei des Hubs gehört der Server-Session: sie wird während des Aufbaus beiseitegelegt (mob-spawning deny würde sonst die
# Dorfbewohner und Fische der Struktur verhindern) und danach unverändert zurückgelegt.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
KONFIG="$REPO/spawn/hub.json"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
if command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING"; then echo "Port $port belegt – Hub-Server läuft noch, erst stoppen"; exit 1; fi
quelle=$(node -e "console.log(require('$(w "$KONFIG")').struktur.quelle)")
[ -f "$REPO/$quelle" ] || { echo "Fehlt: $quelle (lokale Quelle, siehe spawn/AUFBAU.md)"; exit 1; }

echo "1/4 Datapack hub und Struktur-Kacheln"
node "$(w "$REPO/spawn/hub.mjs")" bauen "$(w "$KONFIG")"
D="$SRV/world/datapacks"; mkdir -p "$D/spawn-bau/data/spawn/structure"
rm -rf "$D/hub"; cp -r "$REPO/spawn/datapack/hub" "$D/"
printf '{\n  "pack": {\n    "description": "Spawn-Bau als Struktur",\n    "min_format": [121, 0],\n    "max_format": [121, 0]\n  }\n}\n' > "$D/spawn-bau/pack.mcmeta"
name=$(node -e "console.log(require('$(w "$KONFIG")').struktur.name.split(':')[1])")
kachel=$(node -e "console.log(require('$(w "$KONFIG")').struktur.kachel ?? '')")
node --max-old-space-size=8000 "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$REPO/$quelle")" "$(w "$D/spawn-bau/data/spawn/structure/$name.nbt")" $kachel

echo "2/4 WorldGuard-Regionen beiseite"
R="$SRV/plugins/WorldGuard/worlds/world/regions.yml"
[ -f "$R" ] && mv "$R" "$R.aufbau"

echo "3/4 Hub-Server ohne Fenster starten und aufbauen"
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until grep -q "$1" logs/latest.log 2>/dev/null || grep -qE "Failed to load datapacks|Stopping server" logs/latest.log 2>/dev/null || [ $i -ge "${2:-600}" ]; do sleep 2; i=$((i+2)); done; }
(
  warte "Done (" 900
  echo "function hub:aufbau"
  warte "Hub eingerichtet" 600
  echo "save-all flush"; sleep 20; echo "stop"
) | "$JAVA" -Xms1G -Xmx4G -jar paper-26.3-207.jar nogui > hub-aufsetzen-konsole.txt 2>&1 || true

echo "4/4 Regionen zurück, Ergebnis"
[ -f "$R.aufbau" ] && mv "$R.aufbau" "$R"
grep -E "Hub eingerichtet|SMP-Kiste gesperrt|Failed to load|ERROR.*(function|template|advancement)|Couldn't" logs/latest.log | cut -c1-220
