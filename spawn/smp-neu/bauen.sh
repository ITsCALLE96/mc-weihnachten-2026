#!/bin/bash
# Schritt 2 (spawn/smp-neu/README.md): Spawn-Insel, Deko, Kalender und Weihnachtsinsel (Stufe 0) an den natürlichen World-Spawn der frischen Welt bauen,
# Gelände darunter und drumherum angleichen. Danach Renders zur Abnahme, erst dann vorgenerieren.sh.
# Aufruf (Server gestoppt, Welt aus erzeugen.sh, spawn/smp-neu/lage.json aus „plan“): bash spawn/smp-neu/bauen.sh <serverordner> [java]
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
STANDORT="$REPO/spawn/standort-smp-spark.json"; LAGE="$REPO/spawn/smp-neu/lage.json"; AUS="$REPO/spawn/smp-neu/ausgabe"
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
belegt() { command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING"; }
belegt && { echo "Port $port belegt – Server läuft noch, erst stoppen"; exit 1; }
[ -f "$LAGE" ] || { echo "Fehlt: $LAGE (erst erzeugen.sh)"; exit 1; }
quelle=$(node -e "console.log(require('$(w "$STANDORT")').struktur.quelle)")
[ -f "$REPO/$quelle" ] || { echo "Fehlt: $quelle (lokale Quelle)"; exit 1; }

echo "1/5 Datapacks erzeugen und an den World-Spawn verschieben"
rm -rf "$AUS"; mkdir -p "$AUS/roh"
node "$(w "$REPO/spawn/insel-deko.mjs")" "$(w "$STANDORT")" "$(w "$AUS/roh")" >/dev/null
node "$(w "$REPO/spawn/insel-kalender.mjs")" "$(w "$STANDORT")" "$(w "$AUS/roh")" >/dev/null
node "$(w "$REPO/spawn/weihnachtsinsel.mjs")" >/dev/null
node "$(w "$REPO/spawn/smp-neu/bauen.mjs")" vorbereiten "$(w "$LAGE")" "$(w "$AUS")"
node "$(w "$REPO/spawn/smp-neu/welt.mjs")" angleichen "$(w "$SRV/world")" "$(w "$LAGE")" "$(w "$AUS/datapacks/insel")"
D="$SRV/world/datapacks"; mkdir -p "$D"
rm -rf "$D/insel" "$D/insel-deko" "$D/insel-kalender" "$D/weihnachtsinsel" "$D/weihnachtsplatten" "$D/spawn-bau"
cp -r "$AUS/datapacks/"* "$D/"
cp -r "$REPO/datapack/leitfaden" "$REPO/server/datapacks/wanderhaendler-rabatt" "$D/"
name=$(node -e "console.log(require('$(w "$STANDORT")').struktur.name.split(':')[1])")
mkdir -p "$D/spawn-bau/data/spawn/structure"
printf '{\n  "pack": {\n    "description": "Spawn-Bau als Struktur",\n    "min_format": [121, 0],\n    "max_format": [121, 0]\n  }\n}\n' > "$D/spawn-bau/pack.mcmeta"
node "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$REPO/$quelle")" "$(w "$D/spawn-bau/data/spawn/structure/$name.nbt")"

lauf() { # $1 = Befehl, $2 = Meldung, auf die gewartet wird
  belegt && { echo "Port $port inzwischen belegt – abgebrochen"; exit 1; }
  cd "$SRV"; rm -f logs/latest.log
  warte() { local i=0; until grep -q "$1" logs/latest.log 2>/dev/null || grep -qE "Failed to load datapacks|Stopping server" logs/latest.log 2>/dev/null || [ $i -ge "${2:-900}" ]; do sleep 2; i=$((i+2)); done; }
  ( warte "Done (" 900; echo "$1"; warte "$2" 900; echo "save-all flush"; sleep 15; echo "stop" ) \
    | "$JAVA" -Xms2G -Xmx6G -jar paper-26.3-207.jar nogui > logs/smp-neu-konsole.txt 2>&1 || true
  grep -E "$2|Failed to load|ERROR.*(function|template)|Unknown or incomplete" logs/latest.log | cut -c1-200
  grep -q "$2" logs/latest.log || { echo "Meldung „$2“ fehlt – abgebrochen"; exit 1; }
  cd "$REPO"
}

echo "2/5 Gelände angleichen"
lauf "function insel:angleichen/start" "Gelaende angeglichen"
echo "3/5 Insel setzen"
lauf "function insel:aufbau" "Spawn eingerichtet"
echo "4/5 Lichter aus dem Gelände berechnen und setzen"
node --max-old-space-size=4000 "$(w "$REPO/spawn/smp-neu/bauen.mjs")" lichter "$(w "$LAGE")" "$(w "$SRV/world")" "$(w "$AUS")"
cp "$AUS/datapacks/insel/data/insel/function/lichter.mcfunction" "$D/insel/data/insel/function/"
lauf "function insel:lichter_fertig" "Lichter gesetzt"
echo "5/5 Kalender, Deko, Weihnachtsinsel (Stufe 0)"
lauf "function insel:kalender_an" "Winterkalender steht"
lauf "function insel:deko_an" "Weihnachtsdeko an"
lauf "function weihnachtsinsel:vorbereiten" "Running function weihnachtsinsel:vorbereiten"
echo "Fertig: Renders zur Abnahme, dann vorgenerieren.sh. Für VM200: $AUS/regions.yml, $AUS/weihnachtsmann.json"
