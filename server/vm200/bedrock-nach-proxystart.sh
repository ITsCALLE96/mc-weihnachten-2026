#!/usr/bin/env bash
# Nach dem ERSTEN Start (und Stopp) des Proxys auf VM200: Geyser/Floodgate einstellen und den Floodgate-Schlüssel des Proxys auf Hub und SMP
# verteilen (server/bedrock.md). Läuft als root auf VM200, Proxy gestoppt, Hub und SMP am besten noch nie gestartet. Gibt den Schlüssel nie aus.
# Vom C96-PC (PowerShell): Get-Content -Raw <dieses Skript> | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
# Erwartet das Staging /root/mcw-staging (konfig-setzen.py und bedrock/*-werte.txt liegen dort).
set -euo pipefail
INST=/home/amp/.ampdata/instances
ST=/root/mcw-staging
P="$INST/MinecraftProxy01/Minecraft/plugins"
setzen() { python3 -I "$ST/konfig-setzen.py" "$@"; }

[ -f "$P/floodgate/key.pem" ] || { echo "Kein $P/floodgate/key.pem – Proxy einmal starten und stoppen, dann erneut" >&2; exit 1; }
[ -f "$P/Geyser-Velocity/config.yml" ] || { echo "Keine Geyser-Konfig – Proxy einmal starten und stoppen, dann erneut" >&2; exit 1; }

setzen "$P/floodgate/config.yml" "$ST/bedrock/floodgate-proxy-werte.txt"
setzen --weich "$P/Geyser-Velocity/config.yml" "$ST/bedrock/geyser-werte.txt"

for s in MinecraftHub01 MinecraftSMP01; do
  d="$INST/$s/Minecraft/plugins/floodgate"
  install -d -o amp -g amp "$d"
  install -o amp -g amp -m 600 "$P/floodgate/key.pem" "$d/key.pem"
  [ -f "$d/config.yml" ] && setzen "$d/config.yml" "$ST/bedrock/floodgate-backend-werte.txt"
  echo "$s: key.pem verteilt"
done
chmod 600 "$P/floodgate/key.pem"
cmp -s "$P/floodgate/key.pem" "$INST/MinecraftSMP01/Minecraft/plugins/floodgate/key.pem" && echo "Probe: Schlüssel gleich"
echo "fertig – jetzt Proxy, Hub und SMP starten"
