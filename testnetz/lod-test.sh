#!/usr/bin/env bash
# Lade-Test für DH Support (Nightly), LSS und GrimAC auf dem Testnetz-SMP (server/lod-server.md, server/anticheat.md).
# Startet NUR das SMP (Hub und Proxy bleiben aus), zeigt die Lade-Meldungen, fragt die Befehle ab, stoppt per RCON
# und nimmt die drei Jars samt ihren Datenordnern wieder heraus. Aufruf: bash testnetz/lod-test.sh
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
dl="$hier/_downloads/lod"
smp="$hier/smp"
java="/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot/bin/java.exe"

echo "e9f2f0e3027079e747363968c80b400d494cf789  $dl/lss.jar
07bd6024186d8d1d600837350c3359d9960a04d0  $dl/grim.jar" | sha1sum -c -
[ -f "$dl/DistantHorizonsSupport-0.15.0-SNAPSHOT.jar" ] || { echo "DH-Support-Nightly fehlt in $dl" >&2; exit 1; }
if (echo > /dev/tcp/127.0.0.1/25568) 2>/dev/null; then echo "Testnetz-SMP läuft schon, erst stoppen" >&2; exit 1; fi

cp "$dl/lss.jar" "$smp/plugins/zz-test-lss.jar"
cp "$dl/grim.jar" "$smp/plugins/zz-test-grim.jar"
cp "$dl/DistantHorizonsSupport-0.15.0-SNAPSHOT.jar" "$smp/plugins/zz-test-dhs.jar"
aufraeumen() {
  rm -f "$smp"/plugins/zz-test-*.jar
  echo "Test-Jars entfernt. Datenordner bleiben zur Ansicht in $smp/plugins/ (bei Bedarf löschen)."
}
trap aufraeumen EXIT

(cd "$smp" && "$java" -Xms1G -Xmx2G -jar paper-26.3-207.jar nogui < /dev/null > .log 2>&1 &)
for _ in $(seq 120); do grep -q "Done (" "$smp/.log" && break; sleep 2; done
echo "--- Lade-Meldungen ---"
sed 's/\x1b\[[0-9;]*m//g' "$smp/.log" | grep -i -E "lss|lod|grim|distant|dhs|packetevents|error|exception" | grep -v oshi | head -40
echo "--- Befehle ---"
python -I "$hier/rcon.py" smp "plugins" "dhs" "lsslod stats" "grim" || true
python -I "$hier/rcon.py" smp stop
sleep 15
