#!/usr/bin/env bash
# Neustart bei Bedarf (Pascal 01.11., ersetzt den täglichen Neustart 04:00): Cron auf VM200 jede Minute (/etc/cron.d/mc-neustart-bedarf),
# Log /var/log/mc-neustart.log. „/serverwahl neustart in <minuten>“ in Hub oder SMP schreibt den Zeitpunkt (Unix-Sekunden, volle Minute) als
# Merker in den geteilten Ordner (Container /AMP/geteilt/neustart/<instanz>); das Plugin kündigt an (60/30/10/5/1 min, Countdown, #mc-chat).
# Ist der Zeitpunkt erreicht: Merker löschen, die eine Instanz stoppen und starten (AMP beendet den Server sauber, liest dabei auch seine
# .kvp neu), danach prüfen, dass ihr Port antwortet. Nur SMP und Hub; der Proxy bleibt. Bei Fehler bleibt es beim Log, den Alarm schickt
# mc-healthcheck.py vom Proxmox-Host.
set -uo pipefail
ORDNER=/srv/ampdata/mc-netzwerk-geteilt/neustart
declare -A PORT=([MinecraftSMP01]=25568 [MinecraftHub01]=25567)
amp() { su - amp -c "ampinstmgr $*" </dev/null 2>&1 | tail -1; }
offen() { (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
[ -d "$ORDNER" ] || exit 0
exec 9>/run/mc-neustart-bedarf.lock
flock -n 9 || exit 0
jetzt=$(date +%s)
for m in "$ORDNER"/*; do
  [ -f "$m" ] || continue
  inst=$(basename "$m")
  if [ -z "${PORT[$inst]:-}" ]; then echo "$(date '+%F %T') unbekannter Merker $inst, gelöscht"; rm -f "$m"; continue; fi
  ziel=$(tr -dc '0-9' < "$m")
  [ -n "$ziel" ] && [ "$jetzt" -ge "$ziel" ] || continue
  rm -f "$m"
  echo "== $(date '+%F %T') Neustart bei Bedarf $inst (geplant $(date -d "@$ziel" '+%H:%M'))"
  echo "stop $inst: $(amp -q "$inst")"
  echo "start $inst: $(amp -s "$inst")"
  for n in $(seq 36); do offen "${PORT[$inst]}" && break; sleep 5; done
  if offen "${PORT[$inst]}"; then echo "Port ${PORT[$inst]} ok"; else echo "FEHLER: Port ${PORT[$inst]} antwortet nach 3 min nicht"; fi
done
exit 0
