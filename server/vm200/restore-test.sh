#!/usr/bin/env bash
# Wiederherstellungs-Probe (Leitung 30.10.): neueste AMP-Sicherung des SMP und neuester Stand des geteilten Ordners in einen Wegwerf-Ordner entpacken,
# prüfen und den SMP daraus einmal starten – im AMP-Container-Abbild ohne veröffentlichten Port (docker bridge ohne -p; „--network none“ scheiterte am 30.10. an der Mojang-Dienstabfrage), ohne Zugriff auf
# die echten Daten. Läuft als root auf VM200, die echten Server laufen weiter. Danach wird der Ordner gelöscht (nur er).
# Aufruf: restore-test.sh [geteilt.tgz]  (Standard: frischer tar des Live-Ordners; die QNAP-Kopie liegt nur auf dem Proxmox-Host)
set -euo pipefail
I=/home/amp/.ampdata/instances
Z=$(ls -t $I/MinecraftSMP01/Backups/*.zip | head -1)
W=/srv/ampdata/mc-restore-test
[ -e "$W" ] && { echo "Abbruch: $W existiert schon"; exit 1; }
mkdir -p "$W/smp" "$W/geteilt"
trap 'docker rm -f mc-restore-test >/dev/null 2>&1; rm -rf "${W:?}"' EXIT
echo "== Sicherung: $(basename "$Z"), $(du -h "$Z" | cut -f1)"
start=$(date +%s)
unzip -tq "$Z" | tail -1
unzip -q "$Z" -d "$W/smp"
echo "entpackt in $(( $(date +%s) - start )) s: $(du -sh "$W/smp" | cut -f1), $(find "$W/smp/world" -name '*.mca' | wc -l) Regionsdateien"
ls -la "$W/smp/world/level.dat" | awk '{print "level.dat", $5, "Bytes"}'
echo "== geteilter Ordner"
if [ -n "${1:-}" ]; then tar -xzf "$1" -C "$W/geteilt"; else tar -C /srv/ampdata/mc-netzwerk-geteilt -cf - . | tar -xf - -C "$W/geteilt"; fi
echo "luckperms-Gruppen: $(ls "$W/geteilt/luckperms/groups" | tr '\n' ' ')"
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print('discord.json:', len(d.get('eintraege', [])), 'Einträge')" "$W/geteilt/whitelist/discord.json"
echo "== Probestart ohne Port nach außen (Abbild cubecoders/ampbase:java, Java 25, 4 GB)"
chown -R amp:amp "$W"
# LuckPerms zeigt sonst ins Leere: auf die entpackte Kopie umbiegen
rm -rf "$W/smp/plugins/LuckPerms/yaml-storage"; ln -s "$W/geteilt/luckperms" "$W/smp/plugins/LuckPerms/yaml-storage"
docker run -d --name mc-restore-test --network bridge --user "$(id -u amp):$(id -g amp)" -v "$W/smp:/srv/smp" -v "$W/geteilt:/AMP/geteilt:ro" \
  -v "$W/geteilt/luckperms:$W/geteilt/luckperms" -w /srv/smp --entrypoint /usr/lib/jvm/temurin-25-jdk-amd64/bin/java cubecoders/ampbase:java \
  -Xms2G -Xmx4G -jar paperclip.jar --nogui >/dev/null
for n in $(seq 60); do docker logs mc-restore-test 2>&1 | grep -q 'Done (' && break; sleep 5; done
docker logs mc-restore-test 2>&1 | grep -E 'Done \(|Preparing level|ERROR|Exception' | head -8
docker logs mc-restore-test 2>&1 | grep -q 'Done (' && echo "PROBESTART OK" || echo "PROBESTART FEHLGESCHLAGEN"
docker stop -t 90 mc-restore-test >/dev/null
docker logs mc-restore-test 2>&1 | grep -E 'Saving worlds|All dimensions are saved|Closing Server' | head -3
echo "== Dauer gesamt $(( $(date +%s) - start )) s, Wegwerf-Ordner wird gelöscht"
