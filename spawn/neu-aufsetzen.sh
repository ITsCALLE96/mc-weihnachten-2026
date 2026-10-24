#!/bin/bash
# Setzt eine Welt komplett neu auf: frische Welt (Seed aus server.properties), CA12-Aufschüttung, Insel v2, Plattform, Lichter,
# WorldGuard-Regionen, Spawn, Weltgrenze, Nether/End zu. Kein OP. Für den lokalen Testserver; für den echten Server gilt derselbe
# Ablauf (spawn/AUFBAU.md), dort per AMP-Konsole statt Pipe.
# Aufruf (Server muss gestoppt sein): bash spawn/neu-aufsetzen.sh <serverordner> [java]
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
Q="$REPO/spawn/quellen"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
for f in "$Q/ca12-spawn-v2.schem" "$Q/datapacks/aufschuettung/pack.mcmeta"; do
  [ -f "$f" ] || { echo "Fehlt: $f (lokale Quellen, siehe spawn/AUFBAU.md)"; exit 1; }
done
if command -v powershell >/dev/null; then
  laeuft=$(powershell -NoProfile -Command "@(Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object { \$_.CommandLine -match 'paper-26.3' }).Count" | tr -d '\r')
  [ "$laeuft" = "0" ] || { echo "Ein Paper-Server läuft noch – erst stoppen"; exit 1; }
fi

echo "1/4 Welt und Spielerdaten löschen"
rm -rf "$SRV/world"
echo "[]" > "$SRV/ops.json"
rm -f "$SRV/plugins/SpawnElytra/flying_players.json" "$SRV/plugins/DimensionControl/data.yml"

echo "2/4 Datapacks, Insel-Struktur, Regionen"
D="$SRV/world/datapacks"; mkdir -p "$D"
cp -r "$REPO/datapack/leitfaden" "$REPO/server/datapacks/wanderhaendler-rabatt" "$REPO/spawn/datapack/insel" "$Q/datapacks/aufschuettung" "$D/"
mkdir -p "$D/spawn-insel/data/spawn/structure"
printf '{\n  "pack": {\n    "description": "Spawn-Insel (CA12) als Struktur, nur lokal",\n    "min_format": [121, 0],\n    "max_format": [121, 0]\n  }\n}\n' > "$D/spawn-insel/pack.mcmeta"
node "$(w "$REPO/tools/schem-struktur.mjs")" "$(w "$Q/ca12-spawn-v2.schem")" "$(w "$D/spawn-insel/data/spawn/structure/ca12v2.nbt")"
mkdir -p "$SRV/plugins/WorldGuard/worlds/world" && cp "$REPO/spawn/worldguard/regions.yml" "$SRV/plugins/WorldGuard/worlds/world/regions.yml"
# Plugin-Konfigs der Server-Session (Spawn Elytra, DimensionControl, Fair Play, ArmorPoser, bStats aus, permissions.yml);
# Modus „lokal“ = ohne Proxy, für VM200 „vm200“. Right click harvester ist raus (Pascal 24.10.)
rm -rf "$SRV"/plugins/harvester-*.jar "$SRV/plugins/Harvester"
bash "$REPO/server/plugin-konfig/einspielen.sh" "$SRV" "${MODUS:-lokal}"
# Anti-Xray für Nether/End erst nach dem Start (Schritt 4): vorab angelegte Dimensions-Ordner lassen Paper abstürzen

echo "3/4 Server ohne Fenster starten und aufbauen (dauert ein paar Minuten)"
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until grep -q "$1" logs/latest.log 2>/dev/null || [ $i -ge "${2:-600}" ]; do sleep 2; i=$((i+2)); done; }
(
  warte "Done (" 900
  echo "function aufschuettung:start"
  warte "Aufschüttung fertig" 1800
  echo "function insel:aufbau"
  warte "Spawn-Insel eingerichtet" 300
  echo "nether close"; echo "end close"
  echo "save-all flush"; sleep 20; echo "stop"
) | "$JAVA" -Xms2G -Xmx6G -jar paper-26.3-207.jar nogui > ../neu-aufsetzen-konsole.txt 2>&1

echo "4/4 Anti-Xray Nether/End (wirkt ab dem nächsten Start), Ergebnis"
N="$SRV/world/dimensions/minecraft"
[ -f "$N/the_nether/paper-world.yml" ] && awk '/^```yaml/{n++; if(n==2){f=1; next}} /^```/{f=0} f' "$REPO/server/paper/anti-xray.md" >> "$N/the_nether/paper-world.yml"
[ -f "$N/the_end/paper-world.yml" ] && printf 'anticheat:\n  anti-xray:\n    enabled: false\n' >> "$N/the_end/paper-world.yml"
grep -E "Aufschüttung|Spawn-Insel|Failed to load|Nether has|End has|Loaded template|ERROR.*(function|template)" logs/latest.log | cut -c1-200
