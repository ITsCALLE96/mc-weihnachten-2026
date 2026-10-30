#!/usr/bin/env bash
# Datenschutz (Entwurf „Referenz - Datenschutz und Moderation“, freigegeben von Pascal 30.10., aktiv per Cron):
# IP-haltige Logs nach 30 Tagen löschen. Läuft als root auf VM200.
#   - Minecraft/logs/*.log.gz von Proxy (Velocity), Hub und SMP älter als TAGE
#   - AMP_Logs/*.log der drei Instanzen älter als TAGE (AMP löscht selbst nach 28 Tagen, Monitoring.LogRetentionDays; das hier ist die Absicherung)
# Das Statistik-Archiv /home/amp/mc-archiv bleibt unberührt: Dort kommen die Logs nur mit IP_MASKIEREN=1 an (schnappschuss.sh), also ohne IPs.
# Sicherungen (AMP 24 h/7 Tage, QNAP 14 Tage, Proxmox 3/7 Tage) enthalten Logs, liegen aber alle unter 30 Tagen.
# Ohne Schalter: nur auflisten. Mit --ausfuehren: löschen.
# Cron (seit 30.10.) /etc/cron.d/mc-logs-aufraeumen: „30 4 * * * root /usr/local/sbin/mc-logs-aufraeumen.sh --ausfuehren >> /var/log/mc-logs-aufraeumen.log 2>&1“
set -euo pipefail
TAGE=30
I=/home/amp/.ampdata/instances
n=0
for inst in MinecraftProxy01 MinecraftHub01 MinecraftSMP01; do
  while IFS= read -r -d '' f; do
    n=$((n + 1))
    if [ "${1:-}" = --ausfuehren ]; then rm -f -- "$f"; else echo "würde löschen: $f"; fi
  done < <(find "$I/$inst/Minecraft/logs" -maxdepth 1 -name '*.log.gz' -mtime +$TAGE -print0 2>/dev/null
           find "$I/$inst/AMP_Logs" -maxdepth 1 -name '*.log' -mtime +$TAGE -print0 2>/dev/null)
done
echo "$(date '+%F %T') $n Log-Dateien älter als $TAGE Tage $([ "${1:-}" = --ausfuehren ] && echo gelöscht || echo gefunden, nichts gelöscht)"
