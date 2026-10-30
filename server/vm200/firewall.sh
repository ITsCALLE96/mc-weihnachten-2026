#!/usr/bin/env bash
# ufw auf VM200 für das Minecraft-Netzwerk (Stand 30.10.): ufw ist aktiv mit „deny incoming“. AMP hatte beim Anlegen die automatisch
# vergebenen Ports (Proxy 25567, Hub 25568, SMP 25569) freigegeben; die Ports wurden danach per Instanz-Datei geändert, die Regeln nicht.
# Freigeben: Velocity 25577/tcp, Geyser (Bedrock) 19132/udp+tcp, Voice Chat 24454/udp. Entfernen: die drei veralteten Auto-Regeln (nur unsere Instanzen).
# Hub (25567) und SMP (25568) lauschen nur auf 127.0.0.1 und brauchen keine Freigabe. Regeln anderer Instanzen bleiben unberührt.
# Vom C96-PC (PowerShell): Get-Content -Raw <dieses Skript> | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
set -euo pipefail
ufw allow 25577/tcp comment 'MC-Netzwerk: Velocity (MinecraftProxy01)'
ufw allow 19132/udp comment 'MC-Netzwerk: Geyser Bedrock (MinecraftProxy01)'
ufw allow 19132/tcp comment 'MC-Netzwerk: Geyser Bedrock (MinecraftProxy01)'
ufw allow 24454/udp comment 'MC-Netzwerk: Simple Voice Chat (MinecraftProxy01)'
for r in 25567/tcp 25567/udp 25568/tcp 25568/udp 25569/tcp 25569/udp; do
  ufw --force delete allow "$r" >/dev/null 2>&1 && echo "veraltet entfernt: $r" || true
done
echo "--- Minecraft-Regeln jetzt:"
ufw status | grep -E "2556[5-9]|25577|19132|24454" || true
