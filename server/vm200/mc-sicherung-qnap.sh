#!/usr/bin/env bash
# Läuft auf dem Proxmox-HOST (cron 03:47): Kopie der jeweils letzten AMP-Sicherung von SMP/Hub/Proxy und des geteilten Ordners auf die QNAP
# (NFS-Speicher qnap-backup, 192.168.178.79). Die QNAP ist nur 03:45–04:15 an (Energiezeitplan) → bis 04:07 auf das Einhängen warten.
# Je Instanz 14 Stände auf der QNAP, ältester zuerst. Kein Zugangsdatum nötig (Host → VM200 per SSH-Schlüssel, QNAP über Proxmox-NFS).
set -u
Z=/mnt/pve/qnap-backup/minecraft-amp
VM=root@192.168.178.78
I=/home/amp/.ampdata/instances
echo "== $(date '+%F %T')"
for n in $(seq 1 60); do
  pvesm status --storage qnap-backup 2>/dev/null | grep -q " active " && mountpoint -q /mnt/pve/qnap-backup && break
  sleep 20
done
mountpoint -q /mnt/pve/qnap-backup || { echo "QNAP nicht erreichbar"; exit 1; }
for inst in MinecraftSMP01 MinecraftHub01 MinecraftProxy01; do
  mkdir -p "$Z/$inst"
  neu=$(ssh -o BatchMode=yes $VM "ls -t $I/$inst/Backups/*.zip 2>/dev/null | head -1")
  [ -n "$neu" ] || { echo "$inst: keine Sicherung"; continue; }
  if rsync -t --partial "$VM:$neu" "$Z/$inst/"; then echo "$inst: $(basename "$neu") $(du -h "$Z/$inst/$(basename "$neu")" | cut -f1)"; else echo "$inst: FEHLER"; fi
  ls -t "$Z/$inst"/*.zip 2>/dev/null | tail -n +15 | xargs -r rm -f
done
mkdir -p "$Z/geteilt"
ssh -o BatchMode=yes $VM "tar -C /srv/ampdata -czf - mc-netzwerk-geteilt" > "$Z/geteilt/geteilt-$(date +%F).tgz" && echo "geteilt: ok"
ls -t "$Z/geteilt"/*.tgz 2>/dev/null | tail -n +15 | xargs -r rm -f
