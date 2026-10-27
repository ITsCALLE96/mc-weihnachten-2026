#!/bin/bash
# Setzt die Spawn-Insel in eine vorhandene SMP-Welt (ohne die Welt zu löschen, anders als neu-aufsetzen.sh): Datapack insel + Struktur in die Welt,
# Server ohne Fenster starten, function insel:aufbau, stoppen; danach Lichter aus dem fertigen Gelände berechnen und in einem zweiten kurzen Lauf setzen.
# Aufruf (SMP-Server gestoppt): [DEKO=1] [KALENDER=1] bash spawn/smp-insel-setzen.sh <serverordner> [standort.json] [java]
#   Standard: spawn/standort-smp-spark.json (Spark-Insel, Quelle lokal in spawn/quellen/nitrado/, nie ins Repo)
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRV="$(cd "$1" && pwd)"
STANDORT="$REPO/${2:-spawn/standort-smp-spark.json}"
JAVA="${3:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
belegt() { command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING"; }
belegt && { echo "Port $port belegt – Server läuft noch, erst stoppen"; exit 1; }
quelle=$(node -e "console.log(require('$(w "$STANDORT")').struktur.quelle)")
name=$(node -e "console.log(require('$(w "$STANDORT")').struktur.name.split(':')[1])")
[ -f "$REPO/$quelle" ] || { echo "Fehlt: $quelle (lokale Quelle)"; exit 1; }

echo "1/3 Datapack insel und Struktur"
node "$(w "$REPO/spawn/standort.mjs")" bauen "$(w "$STANDORT")"
D="$SRV/world/datapacks"; mkdir -p "$D/spawn-bau/data/spawn/structure"
rm -rf "$D/insel" "$D/insel-deko" "$D/insel-kalender"; cp -r "$REPO/spawn/datapack/insel" "$D/"
# Weihnachtsdeko (an/aus per Funktion), Positionen aus der lokalen Quelle
node "$(w "$REPO/spawn/insel-deko.mjs")" "$(w "$STANDORT")" && cp -r "$REPO/spawn/datapack/insel-deko" "$D/"
# Winterkalender (an/aus per Funktion)
node "$(w "$REPO/spawn/insel-kalender.mjs")" "$(w "$STANDORT")" && cp -r "$REPO/spawn/datapack/insel-kalender" "$D/"
printf '{\n  "pack": {\n    "description": "Spawn-Bau als Struktur",\n    "min_format": [121, 0],\n    "max_format": [121, 0]\n  }\n}\n' > "$D/spawn-bau/pack.mcmeta"
node "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$REPO/$quelle")" "$(w "$D/spawn-bau/data/spawn/structure/$name.nbt")"

lauf() { # $1 = Befehl, $2 = Meldung, auf die gewartet wird
  belegt && { echo "Port $port inzwischen belegt – abgebrochen"; exit 1; }
  cd "$SRV"; rm -f logs/latest.log || { echo "Log belegt – läuft der Server schon?"; exit 1; }
  warte() { local i=0; until grep -q "$1" logs/latest.log 2>/dev/null || grep -qE "Failed to load datapacks|Stopping server" logs/latest.log 2>/dev/null || [ $i -ge "${2:-600}" ]; do sleep 2; i=$((i+2)); done; }
  ( warte "Done (" 900; echo "$1"; warte "$2" 600; echo "save-all flush"; sleep 15; echo "stop" ) \
    | "$JAVA" -Xms1G -Xmx4G -jar paper-26.3-207.jar nogui > logs/insel-setzen-konsole.txt 2>&1 || true
  grep -E "$2|Failed to load|ERROR.*(function|template)" logs/latest.log | cut -c1-200
  cd "$REPO"
}

echo "2/3 Insel setzen"
lauf "function insel:aufbau" "Spawn eingerichtet"

echo "3/3 Lichter aus dem Gelände berechnen und setzen"
node --max-old-space-size=4000 "$(w "$REPO/spawn/standort.mjs")" lichter "$(w "$STANDORT")" "$(w "$SRV/world")"
cp "$REPO/spawn/datapack/insel/data/insel/function/lichter.mcfunction" "$D/insel/data/insel/function/"
lauf "function insel:lichter_fertig" "Lichter gesetzt"

# Mit DEKO=1 gleich die Weihnachtsdeko anschalten (sonst später: function insel:deko_an)
if [ "$KALENDER" = 1 ]; then echo "Kalender an"; lauf "function insel:kalender_an" "Winterkalender steht"; fi
if [ "$DEKO" = 1 ]; then echo "Deko an"; lauf "function insel:deko_an" "Weihnachtsdeko an"; fi
