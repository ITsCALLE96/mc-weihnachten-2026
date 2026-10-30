#!/bin/bash
# Schritt 4 (spawn/smp-neu/README.md), erst nach Pascals Abnahme der Renders: Weltgrenzen je Dimension, Chunky Overworld r 5000 um den Spawn,
# Nether r 1250 um Spawn ÷ 8, End r 2000 um 0/0 (server/vorgenerierung.md). Ohne Winter-Datapack (das kommt erst danach dazu).
# Aufruf (Server gestoppt): bash spawn/smp-neu/vorgenerieren.sh <serverordner> [java]
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING" && { echo "Port $port belegt – Server läuft noch"; exit 1; }
[ -d "$SRV/world/datapacks/winter-weihnachten" ] && { echo "winter-weihnachten liegt in der Welt – erst nach der Vorgenerierung einspielen"; exit 1; }
read SX SZ <<<"$(node -e "const l=require('$(w "$REPO/spawn/smp-neu/lage.json")');console.log(l.spawn[0],l.spawn[2])")"
NX=$(( SX / 8 )); NZ=$(( SZ / 8 ))
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until [ "$(grep -cE "$1" logs/latest.log 2>/dev/null)" -ge "${3:-1}" ] || [ $i -ge "${2:-600}" ]; do sleep 5; i=$((i+5)); done; }
(
  warte "Done \(" 900
  echo "worldborder center $SX $SZ"; echo "worldborder set 10000"
  echo "execute in minecraft:the_nether run worldborder center $NX $NZ"; echo "execute in minecraft:the_nether run worldborder set 2500"
  echo "execute in minecraft:the_end run worldborder center 0 0"; echo "execute in minecraft:the_end run worldborder set 10000"
  sleep 3; echo "worldborder get"
  echo "chunky world world"; echo "chunky center $SX $SZ"; echo "chunky shape square"; echo "chunky radius 5000"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 10800 1
  echo "chunky world world_nether"; echo "chunky center $NX $NZ"; echo "chunky shape square"; echo "chunky radius 1250"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 3600 2
  echo "chunky world world_the_end"; echo "chunky center 0 0"; echo "chunky shape square"; echo "chunky radius 2000"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 3600 3
  echo "save-all flush"; sleep 30; echo "stop"
) | "$JAVA" -Xms4G -Xmx10G -jar paper-26.3-207.jar nogui > logs/vorgenerieren-konsole.txt 2>&1
grep -E "Task (started|finished)|World border|Weltgrenze|ERROR|No world" logs/latest.log | cut -c1-200
