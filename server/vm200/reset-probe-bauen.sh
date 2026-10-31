#!/usr/bin/env bash
# Reset-Probe Teil 1 (Leitung/Pascal 31.10., Ablauf zum 27.11. auf VM200 proben): neue SMP-Welt wie Spawn & Welt erzeugen und bauen,
# auf VM200 statt auf Pascals PC. spawn/smp-neu/erzeugen.sh und bauen.sh laufen unverändert; node und Java gibt es auf VM200 nur über Docker,
# deshalb kleine Hüllen in $B/bin (node:24-alpine, Java 25 aus dem AMP-Abbild cubecoders/ampbase:java, Netz des Hosts, Port 127.0.0.1:25590).
# Live-Instanzen bleiben unberührt: Bau-Server in /srv/ampdata/mc-reset-probe/bau, eigene Paper-Kopie, nur Chunky als Plugin.
# Voraussetzung: Repo-Stand in $REPO (Standard /opt/mc-repo, holt das Deploy-Skript), private Insel-Quelle spawn/quellen/nitrado/spark-insel.schem
# dort abgelegt (bleibt außerhalb von git). Ergebnis: $B/bau/world, spawn/smp-neu/ausgabe/, spawn/smp-versatz.json, spawn/quellen/smp-seed.txt.
# Danach: reset-probe-einspielen.sh. Als root auf VM200, ~15–20 min, lastet die VM aus (tagsüber).
set -euo pipefail
REPO=${REPO:-/opt/mc-repo}
B=/srv/ampdata/mc-reset-probe
SMP=/home/amp/.ampdata/instances/MinecraftSMP01/Minecraft
JAVA_IM=/usr/lib/jvm/temurin-25-jdk-amd64/bin/java

[ -f "$REPO/spawn/quellen/nitrado/spark-insel.schem" ] || { echo "Abbruch: Insel-Quelle fehlt in $REPO/spawn/quellen/nitrado" >&2; exit 1; }
(exec 3<>/dev/tcp/127.0.0.1/25590) 2>/dev/null && { echo "Abbruch: Port 25590 belegt (läuft der Bau-Server noch?)" >&2; exit 1; }
mkdir -p "$B/bin"
if [ -d "$B/bau" ]; then mv "$B/bau" "$B/alt-$(date +%m%d-%H%M)"; echo "alter Bau-Ordner verschoben"; fi

echo "== Hüllen node/java (Docker)"
cat > "$B/bin/node" <<EOF
#!/bin/sh
exec docker run --rm -i -v $REPO:$REPO -v $B:$B -w "\$PWD" node:24-alpine node "\$@"
EOF
cat > "$B/bin/java" <<EOF
#!/bin/sh
exec docker run --rm -i --network host -v $B:$B -w "\$PWD" --entrypoint $JAVA_IM cubecoders/ampbase:java "\$@"
EOF
chmod 755 "$B/bin/node" "$B/bin/java"
export PATH="$B/bin:$PATH"
docker image inspect node:24-alpine >/dev/null 2>&1 || docker pull -q node:24-alpine
echo "node $(node --version)"

echo "== Bau-Server $B/bau (Paper-Kopie des SMP, nur Chunky)"
mkdir -p "$B/bau/plugins"
cp "$SMP/paperclip.jar" "$B/bau/paper-26.3-207.jar"
cp -r "$SMP/cache" "$SMP/libraries" "$SMP/versions" "$B/bau/"
cp "$SMP/plugins/Chunky-Bukkit-1.5.3.jar" "$B/bau/plugins/"
echo "eula=true" > "$B/bau/eula.txt"
printf '%s\n' "server-port=25590" "server-ip=127.0.0.1" "online-mode=false" "level-name=world" "level-seed=" "enable-rcon=false" \
  "view-distance=6" "simulation-distance=4" "spawn-protection=0" "max-players=1" > "$B/bau/server.properties"

cd "$REPO"
start=$(date +%s)
echo "== erzeugen.sh (neuer Zufalls-Seed, Chunky r 192 um den Spawn)"
bash spawn/smp-neu/erzeugen.sh "$B/bau" "$B/bin/java"
echo "== bauen.sh (Insel, Deko, Kalender, Weihnachtsinsel)"
bash spawn/smp-neu/bauen.sh "$B/bau" "$B/bin/java"
echo "== Ergebnis nach $(( ($(date +%s) - start) / 60 )) min"
echo "Welt: $(du -sh "$B/bau/world" | cut -f1), Datapacks: $(ls "$B/bau/world/datapacks" | tr '\n' ' ')"
python3 -c "import json; v=json.load(open('$REPO/spawn/smp-versatz.json')); print('Versatz:', {k: v[k] for k in v})"
ls "$REPO/spawn/smp-neu/ausgabe" | tr '\n' ' '; echo
[ -s "$REPO/spawn/quellen/smp-seed.txt" ] && echo "Seed gesichert (nicht angezeigt)" || echo "WARNUNG: kein Seed in spawn/quellen/smp-seed.txt"
echo "weiter mit reset-probe-einspielen.sh (MinecraftTestwelt01 vorher anlegen, gestoppt)"
exit 0
