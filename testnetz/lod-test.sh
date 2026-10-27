#!/usr/bin/env bash
# Test LOD Server Support (LSS 0.20.0) + GrimAC 2.3.75 auf dem Testnetz-SMP (server/lod-server.md, server/anticheat.md).
# Fremde Plugin-Jars startet Pascal selbst (in der Claude-Session blockiert).
#   bash testnetz/lod-test.sh einrichten  – Jars (LSS, GrimAC, Chunky) ins SMP, erster Start erzeugt die LSS-Konfig,
#                                          unsere Werte (server/lod/lss-werte.txt) einspielen, 2.000 × 2.000 um 0/0 vorgenerieren,
#                                          Lade-Meldungen zeigen, per RCON stoppen. Danach: start.cmd, Client mit Testprofil
#                                          „weihnachten-voxy-test“ auf localhost:25577 (Prüfliste: server/lod-server.md → Test)
#   bash testnetz/lod-test.sh entfernen   – die drei Jars wieder raus (Datenordner bleiben zur Ansicht)
# Hub und Proxy bleiben aus. Das SMP darf vorher nicht laufen.
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads/lod"
smp="$hier/smp"
java="/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot/bin/java.exe"
rcon() { python -I "$hier/rcon.py" smp "$@"; }

laeuft() { (echo > /dev/tcp/127.0.0.1/25568) 2>/dev/null; }
starten() {
  (cd "$smp" && "$java" -Xms1G -Xmx2G -jar paper-26.3-207.jar nogui < /dev/null > .log 2>&1 &)
  for _ in $(seq 150); do grep -q "Done (" "$smp/.log" && return 0; sleep 2; done
  echo "SMP startet nicht, siehe $smp/.log" >&2; exit 1
}
stoppen() {
  rcon stop || true
  for _ in $(seq 60); do laeuft || return 0; sleep 2; done
  echo "SMP hört nicht auf, bitte von Hand prüfen" >&2; exit 1
}

case "${1:-}" in
  einrichten)
    laeuft && { echo "Testnetz-SMP läuft schon, erst stoppen" >&2; exit 1; }
    printf '%s\n' "e9f2f0e3027079e747363968c80b400d494cf789  $dl/lss.jar" \
      "07bd6024186d8d1d600837350c3359d9960a04d0  $dl/grim.jar" \
      "7ff47ee3afec89a1725e6eef393f373c549eff3b  $dl/chunky.jar" | sha1sum -c -
    cp "$dl/lss.jar" "$smp/plugins/lod-server-support-paper-0.20.0+26.3.jar"
    cp "$dl/grim.jar" "$smp/plugins/grimac-bukkit-2.3.75.jar"
    cp "$dl/chunky.jar" "$smp/plugins/Chunky-Bukkit-1.5.3.jar"

    echo "--- 1. Start: Konfig erzeugen ---"
    starten
    stoppen
    konfig="$smp/plugins/LodServerSupport/lss-server-config.yaml"
    [ -f "$konfig" ] || konfig="$(grep -l "far_players:" "$smp"/plugins/LodServerSupport/*.yaml | head -1)"
    echo "LSS-Konfig: $konfig"
    python -I "$repo/server/lod/konfig-setzen.py" "$konfig" "$repo/server/lod/lss-werte.txt"

    echo "--- 2. Start: Vorgenerierung 2.000 × 2.000 ---"
    starten
    sed 's/\x1b\[[0-9;]*m//g' "$smp/.log" | grep -i -E "lodserver|lss|grim|chunky|error|exception" | grep -v oshi | head -40
    rcon "plugins" "lsslod stats" "chunky world world" "chunky center 0 0" "chunky radius 1000" "chunky start"
    echo "Vorgenerierung läuft (einige Minuten) …"
    # Chunky meldet das Ende im Log („Task finished …“); höchstens 60 min warten
    for _ in $(seq 180); do
      sed 's/\x1b\[[0-9;]*m//g' "$smp/.log" | grep -q -i "task finished" && break
      sed 's/\x1b\[[0-9;]*m//g' "$smp/.log" | grep -i "\[Chunky\]" | tail -1
      sleep 20
    done
    rcon "lsslod stats" "save-all flush"
    stoppen
    echo "Fertig. Jetzt testnetz/start.cmd und Client mit „weihnachten-voxy-test“."
    ;;
  entfernen)
    laeuft && { echo "Testnetz-SMP läuft, erst stoppen" >&2; exit 1; }
    rm -f "$smp"/plugins/lod-server-support-paper-*.jar "$smp"/plugins/grimac-bukkit-*.jar "$smp"/plugins/Chunky-Bukkit-*.jar
    echo "Jars entfernt (Datenordner LodServerSupport/, GrimAC/, Chunky/ bleiben)."
    ;;
  *)
    sed -n '2,9p' "$0"; exit 1 ;;
esac
