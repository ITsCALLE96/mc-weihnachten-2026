#!/bin/bash
# Schritt 1 (spawn/smp-neu/README.md): frische SMP-Welt mit Zufalls-Seed lokal erzeugen, nur die Umgebung des natürlichen World-Spawns (Chunky r 192).
# Der Seed wird nie ausgegeben; er steht danach nur in der Welt und (für die Vault-Administration) in spawn/quellen/smp-seed.txt (git-ignoriert).
# Aufruf (Server gestoppt): bash spawn/smp-neu/erzeugen.sh <serverordner> [java]
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING" && { echo "Port $port belegt – Server läuft noch"; exit 1; }
[ -d "$SRV/world" ] && { echo "$SRV/world existiert – erst wegsichern (nichts wird gelöscht)"; exit 1; }
[ -f "$SRV/plugins/Chunky.jar" ] || ls "$SRV"/plugins/Chunky*.jar >/dev/null 2>&1 || { echo "Chunky fehlt in $SRV/plugins"; exit 1; }
# WIEDERHOLEN=1: denselben Seed aus spawn/quellen/smp-seed.txt noch einmal erzeugen (z. B. nach einer Korrektur am Aufbau), sonst neuer Zufalls-Seed
if [ "$WIEDERHOLEN" = 1 ]; then sed -i "s/^level-seed=.*/level-seed=$(tr -d '\r\n' < "$REPO/spawn/quellen/smp-seed.txt")/" "$SRV/server.properties"; else sed -i 's/^level-seed=.*/level-seed=/' "$SRV/server.properties"; fi
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until grep -qE "$1" logs/latest.log 2>/dev/null || [ $i -ge "${2:-600}" ]; do sleep 2; i=$((i+2)); done; }
( warte "Done \(" 900; echo "chunky world world"; echo "chunky spawn"; echo "chunky shape square"; echo "chunky radius 192"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 900; sleep 3; echo "save-all flush"; sleep 10; echo "stop" ) \
  | "$JAVA" -Xms2G -Xmx6G -jar paper-26.3-207.jar nogui > logs/erzeugen-konsole.txt 2>&1
[ "$WIEDERHOLEN" = 1 ] || node "$(w "$REPO/spawn/smp-neu/welt.mjs")" seed-sichern "$(w "$SRV/world")" "$(w "$REPO/spawn/quellen/smp-seed.txt")"
node "$(w "$REPO/spawn/smp-neu/welt.mjs")" plan "$(w "$SRV/world")" "$(w "$REPO/spawn/smp-neu/lage.json")"
