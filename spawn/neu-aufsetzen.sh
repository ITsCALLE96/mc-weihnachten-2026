#!/bin/bash
# Setzt eine Welt komplett neu auf: frische Welt, Spawn-Bau, Datapacks, WorldGuard-Regionen, Spawn, Weltgrenze, Nether/End zu. Kein OP.
# Für den lokalen Testserver; für den echten Server gilt derselbe Ablauf (spawn/AUFBAU.md), dort per AMP-Konsole statt Pipe.
# Aufruf (Server muss gestoppt sein): [SEED=<seed>] [STANDORT=spawn/standort-<name>.json] bash spawn/neu-aufsetzen.sh <serverordner> [java]
#   Standard ist der Weltenbaum (standort-weltenbaum-test.json, Struktur aus spawn/entwuerfe/ausgabe/weltenbaum.schem).
#   STANDORT=spawn/standort-testserver.json baut den alten CA12-Platzhalter (braucht die lokalen Quellen in spawn/quellen/).
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
STANDORT="$REPO/${STANDORT:-spawn/standort-weltenbaum-test.json}"
Q="$REPO/spawn/quellen"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
CA12=0; grep -q '"spawn:ca12v2"' "$STANDORT" && CA12=1
if [ $CA12 = 1 ]; then
  for f in "$Q/ca12-spawn-v2.schem" "$Q/datapacks/aufschuettung/pack.mcmeta"; do
    [ -f "$f" ] || { echo "Fehlt: $f (lokale Quellen, siehe spawn/AUFBAU.md)"; exit 1; }
  done
fi
if command -v powershell >/dev/null; then
  laeuft=$(powershell -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { \$_.CommandLine -match 'paper-26.3' }).Count" | tr -d '\r')
  [ "$laeuft" = "0" ] || { echo "Ein Paper-Server läuft noch – erst stoppen"; exit 1; }
fi

echo "1/4 Welt und Spielerdaten löschen"
rm -rf "$SRV/world"
echo "[]" > "$SRV/ops.json"
rm -rf "$SRV/plugins/SpawnElytra" "$SRV/plugins/DimensionControl/data.yml"
[ -n "$SEED" ] && sed -i "s/^level-seed=.*/level-seed=$SEED/" "$SRV/server.properties"

echo "2/4 Datapacks, Spawn-Struktur, Regionen"
node "$(w "$REPO/spawn/standort.mjs")" bauen "$(w "$STANDORT")"
D="$SRV/world/datapacks"; mkdir -p "$D"
cp -r "$REPO/datapack/leitfaden" "$REPO/server/datapacks/wanderhaendler-rabatt" "$REPO/spawn/datapack/insel" "$D/"
mkdir -p "$D/spawn-bau/data/spawn/structure"
printf '{\n  "pack": {\n    "description": "Spawn-Bau als Struktur",\n    "min_format": [121, 0],\n    "max_format": [121, 0]\n  }\n}\n' > "$D/spawn-bau/pack.mcmeta"
if [ $CA12 = 1 ]; then
  cp -r "$Q/datapacks/aufschuettung" "$D/"
  node "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$Q/ca12-spawn-v2.schem")" "$(w "$D/spawn-bau/data/spawn/structure/ca12v2.nbt")"
else
  name=$(node -e "console.log(require('$(w "$STANDORT")').struktur.name.split(':')[1])")
  node "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$REPO/spawn/entwuerfe/ausgabe/$name.schem")" "$(w "$D/spawn-bau/data/spawn/structure/$name.nbt")"
fi
mkdir -p "$SRV/plugins/WorldGuard/worlds/world" && cp "$REPO/spawn/worldguard/regions.yml" "$SRV/plugins/WorldGuard/worlds/world/regions.yml"
# Plugin-Konfigs der Server-Session (DimensionControl, Fair Play, ArmorPoser, bStats aus, permissions.yml; löscht Harvester und Spawn Elytra);
# Modus „lokal“ = ohne Proxy, für VM200 „vm200“
bash "$REPO/server/plugin-konfig/einspielen.sh" "$SRV" "${MODUS:-lokal}"
# Anti-Xray für Nether/End erst nach dem Start (Schritt 4): vorab angelegte Dimensions-Ordner lassen Paper abstürzen

echo "3/4 Server ohne Fenster starten und aufbauen (dauert ein paar Minuten)"
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until grep -q "$1" logs/latest.log 2>/dev/null || [ $i -ge "${2:-600}" ]; do sleep 2; i=$((i+2)); done; }
(
  warte "Done (" 900
  if [ $CA12 = 1 ]; then echo "function aufschuettung:start"; warte "Aufschüttung fertig" 1800; fi
  echo "function insel:aufbau"
  warte "Spawn eingerichtet" 600
  echo "nether close"; echo "end close"
  echo "save-all flush"; sleep 20; echo "stop"
) | "$JAVA" -Xms2G -Xmx6G -jar paper-26.3-207.jar nogui > ../neu-aufsetzen-konsole.txt 2>&1

echo "4/4 Anti-Xray Nether/End (wirkt ab dem nächsten Start), Ergebnis"
N="$SRV/world/dimensions/minecraft"
[ -f "$N/the_nether/paper-world.yml" ] && awk '/^```yaml/{n++; if(n==2){f=1; next}} /^```/{f=0} f' "$REPO/server/paper/anti-xray.md" >> "$N/the_nether/paper-world.yml"
[ -f "$N/the_end/paper-world.yml" ] && printf 'anticheat:\n  anti-xray:\n    enabled: false\n' >> "$N/the_end/paper-world.yml"
grep -E "Aufschüttung|Spawn eingerichtet|Spawn geschlossen|Failed to load|Nether has|End has|Loaded template|ERROR.*(function|template)" logs/latest.log | cut -c1-200
