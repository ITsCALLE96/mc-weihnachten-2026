#!/usr/bin/env bash
# Einmaliger Neustart von Hub und SMP von Hand (Pascal 01.11.), z. B. damit ein neues Jar und die AMP-.kvp greifen. Proxy bleibt. Als root auf VM200.
# Aufruf: neustart-jetzt.sh [minuten]   (Standard 5, mindestens 2)
# Ist niemand online (keine Verbindung am Proxy-Port 25577), startet es sofort neu. Sonst kündigt es über das serverwahl-Termine-Modul an,
# das schon im laufenden Jar steckt: Termin „neustart-<MMTT-HHMM>“ ohne Befehle in die aktive Termin-Liste von SMP und Hub (Chat 5/1 min vorher,
# Countdown 10 s). Damit die laufenden Server ihn sehen, in BEIDEN AMP-Konsolen einmal „serverwahl reload“ eingeben; das Skript wartet darauf.
# Zum Zeitpunkt wie der frühere Cron: SMP und Hub stoppen (AMP beendet sauber), Termin wieder aus den Configs, Hub und SMP starten, Ports prüfen.
set -uo pipefail
I=/home/amp/.ampdata/instances
min=${1:-5}
[[ "$min" =~ ^[0-9]+$ ]] && [ "$min" -ge 2 ] || { echo "Minuten als Zahl ab 2"; exit 1; }
amp() { su - amp -c "ampinstmgr $*" </dev/null 2>&1 | tail -1; }
offen() { (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
online=$(ss -Htn state established '( sport = :25577 )' | grep -vc ' 127\.0\.0\.1:' || true)
echo "== $(date '+%F %T') Neustart Hub + SMP von Hand, Verbindungen am Proxy: $online"
name=""
if [ "$online" -gt 0 ]; then
  ziel=$(( ( $(date +%s) + min * 60 + 59 ) / 60 * 60 ))
  name="neustart-$(date -d "@$ziel" +%m%d-%H%M)"
  for inst in MinecraftSMP01 MinecraftHub01; do
    C=$I/$inst/Minecraft/plugins/Serverwahl/config.yml
    cp -p "$C" "/root/mcw-staging/config-$inst-vor-$name.yml"
    python3 - "$C" "$name" "$(date -d "@$ziel" +%Y-%m-%dT%H:%M)" "$min" <<'PY' || { echo "Abbruch: Termin nicht eintragbar in $C"; exit 1; }
import re, sys
p, name, zeit, m = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
z = open(p, encoding="utf-8").read().split("\n")
t = z.index("termine:")
liste = next(re.match(r"  aktive-liste: *(\S+)", l).group(1) for l in z[t:] if re.match(r"  aktive-liste:", l))
i = z.index("  " + liste + ":", t)
ank = ", ".join(str(x) for x in (5, 1) if x <= m)
z[i + 1:i + 1] = [f"    - name: {name}", f'      zeitpunkt: "{zeit}"', f"      ankuendigen: [{ank}]", "      countdown: 10",
                  '      text: "<gold>Neustart von Hub und SMP – in 2 Minuten seid ihr wieder drin"', "      befehle: []", "      nachholen: false"]
open(p, "w", encoding="utf-8").write("\n".join(z))
PY
    chown amp:amp "$C"
  done
  echo "Termin $name um $(date -d "@$ziel" +%H:%M) eingetragen. JETZT in der AMP-Konsole von SMP UND Hub eingeben:  serverwahl reload"
  for inst in MinecraftSMP01 MinecraftHub01; do
    L=$I/$inst/Minecraft/logs/latest.log; n0=$(grep -c 'Termine (' "$L")
    until [ "$(grep -c 'Termine (' "$L")" -gt "$n0" ] || [ "$(date +%s)" -ge $(( ziel - 70 )) ]; do sleep 5; done
    if [ "$(grep -c 'Termine (' "$L")" -gt "$n0" ]; then echo "$inst: neu geladen – $(grep 'Termine (' "$L" | tail -1 | sed 's/.*\]: //')"
    else echo "$inst: kein reload gesehen, Neustart kommt trotzdem (ohne Ansage)"; fi
  done
  while [ "$(date +%s)" -lt $(( ziel + 2 )) ]; do sleep 2; done
fi
echo "stop MinecraftSMP01: $(amp -q MinecraftSMP01)"
echo "stop MinecraftHub01: $(amp -q MinecraftHub01)"
if [ -n "$name" ]; then
  for inst in MinecraftSMP01 MinecraftHub01; do
    C=$I/$inst/Minecraft/plugins/Serverwahl/config.yml
    python3 - "$C" "$name" <<'PY'
import sys
p, name = sys.argv[1], sys.argv[2]
z = open(p, encoding="utf-8").read().split("\n")
i = z.index(f"    - name: {name}")
del z[i:i + 7]
open(p, "w", encoding="utf-8").write("\n".join(z))
PY
    chown amp:amp "$C"
  done
  echo "Termin $name wieder aus den Configs"
fi
echo "start MinecraftHub01: $(amp -s MinecraftHub01)"; sleep 20
echo "start MinecraftSMP01: $(amp -s MinecraftSMP01)"
for port in 25567 25568; do
  for n in $(seq 36); do offen "$port" && break; sleep 5; done
  if offen "$port"; then echo "Port $port ok"; else echo "FEHLER: Port $port antwortet nach 3 min nicht"; fi
done
echo "== $(date '+%F %T') fertig"
exit 0
