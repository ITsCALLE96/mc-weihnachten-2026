#!/usr/bin/env bash
# Täglicher Neustart des Minecraft-Netzes (Pascal 30.10.), Cron auf VM200 04:00 MEZ (/etc/cron.d/mc-neustart), Log /var/log/mc-neustart.log.
# Davor läuft die stündliche SMP-Sicherung um 03:40 und die QNAP-Kopie um 03:47. Stoppen SMP → Hub → Proxy (AMP beendet die Server sauber),
# starten Proxy → Hub → SMP. Die Server selbst startet AMP nur, wenn in jeder Instanz der Startmodus „Anwendung starten“ gesetzt ist (AMP-Oberfläche).
# Prüft danach, dass alle drei Ports antworten. Bei Fehler bleibt es beim Log; den Alarm schickt mc-healthcheck.py vom Proxmox-Host.
set -uo pipefail
amp() { su - amp -c "ampinstmgr $*" </dev/null 2>&1 | tail -1; }
offen() { (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
echo "== $(date '+%F %T') Neustart"
for i in MinecraftSMP01 MinecraftHub01 MinecraftProxy01; do echo "stop $i: $(amp -q "$i")"; done
for i in MinecraftProxy01 MinecraftHub01 MinecraftSMP01; do echo "start $i: $(amp -s "$i")"; sleep 20; done
fehler=0
for port in 25577 25567 25568; do
  for n in $(seq 36); do offen "$port" && break; sleep 5; done
  if offen "$port"; then echo "Port $port ok"; else echo "FEHLER: Port $port antwortet nach 3 min nicht"; fehler=1; fi
done
echo "== $(date '+%F %T') fertig (Fehler: $fehler)"
exit $fehler
