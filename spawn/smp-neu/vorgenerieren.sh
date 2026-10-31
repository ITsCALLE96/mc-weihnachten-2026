#!/bin/bash
# Schritt 5 (spawn/smp-neu/README.md), erst nach Pascals Abnahme der Renders: Chunky Overworld r 5000 um den Spawn, Nether r 1250 um Spawn ÷ 8,
# End r 2000 um 0/0 (server/vorgenerierung.md). Keine Weltgrenze (Forever-World, Pascal 31.10.): Chunky erzeugt nur den Startbereich vor,
# danach wächst die Welt beim Erkunden. Ohne Winter-Datapack, damit kein Schnee und Eis fest eingebaut wird.
# Aufruf (Server gestoppt): bash spawn/smp-neu/vorgenerieren.sh <serverordner> [java]
# Auf VM200 (AMP verwaltet den Server): bash spawn/smp-neu/vorgenerieren.sh --befehle → Konsolenbefehle für die laufende SMP-Instanz (ohne Spieler).
#   Chunky arbeitet die drei Welten nebeneinander ab; fertig, wenn „[Chunky] Task finished“ dreimal im Log steht. Danach save-all flush
set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
w() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }
befehle() {
  read SX SZ <<<"$(node -e "const l=require('$(w "$REPO/spawn/smp-neu/lage.json")');console.log(l.spawn[0],l.spawn[2])")"
  NX=$(( SX / 8 )); NZ=$(( SZ / 8 ))
  echo "chunky world world"; echo "chunky center $SX $SZ"; echo "chunky shape square"; echo "chunky radius 5000"; echo "chunky start"
  echo "chunky world world_nether"; echo "chunky center $NX $NZ"; echo "chunky shape square"; echo "chunky radius 1250"; echo "chunky start"
  echo "chunky world world_the_end"; echo "chunky center 0 0"; echo "chunky shape square"; echo "chunky radius 2000"; echo "chunky start"
}
[ "$1" = --befehle ] && { befehle; exit 0; }
SRV="$(cd "$1" && pwd)"
JAVA="${2:-$APPDATA/ModrinthApp/meta/java_versions/zulu25.36.205-ca-jre25.0.4.1-win_x64/bin/java.exe}"
port=$(grep '^server-port=' "$SRV/server.properties" | cut -d= -f2 | tr -d '\r')
command -v netstat >/dev/null && netstat -ano | grep -q ":$port .*LISTENING" && { echo "Port $port belegt – Server läuft noch"; exit 1; }
[ -d "$SRV/world/datapacks/winter-weihnachten" ] && { echo "winter-weihnachten liegt in der Welt – erst nach der Vorgenerierung einspielen"; exit 1; }
read SX SZ <<<"$(node -e "const l=require('$(w "$REPO/spawn/smp-neu/lage.json")');console.log(l.spawn[0],l.spawn[2])")"
NX=$(( SX / 8 )); NZ=$(( SZ / 8 ))
cd "$SRV"; rm -f logs/latest.log
warte() { local i=0; until [ "$(grep -cE "$1" logs/latest.log 2>/dev/null || true)" -ge "${3:-1}" ] || [ $i -ge "${2:-600}" ]; do sleep 5; i=$((i+5)); done; }
(
  warte "Done \(" 900
  echo "chunky world world"; echo "chunky center $SX $SZ"; echo "chunky shape square"; echo "chunky radius 5000"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 10800 1
  echo "chunky world world_nether"; echo "chunky center $NX $NZ"; echo "chunky shape square"; echo "chunky radius 1250"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 3600 2
  echo "chunky world world_the_end"; echo "chunky center 0 0"; echo "chunky shape square"; echo "chunky radius 2000"; echo "chunky start"; echo "chunky confirm"
  warte "\[Chunky\] Task finished" 3600 3
  echo "save-all flush"; sleep 30; echo "stop"
) | "$JAVA" -Xms4G -Xmx10G -jar paper-26.3-207.jar nogui > logs/vorgenerieren-konsole.txt 2>&1
grep -E "Task (started|finished)|ERROR|No world" logs/latest.log | cut -c1-200
