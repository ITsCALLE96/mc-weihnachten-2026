#!/usr/bin/env bash
# Spielt die Plugin-Konfigs und server/paper/permissions.yml in einen Paper-Server ein.
# Aufruf (Server gestoppt): einspielen.sh <server-ordner> <smp|hub|proxy> [vm200|lokal]
#   smp:   gemeinsam/ + smp/   (MinecraftSMP01)
#   hub:   gemeinsam/ + hub/   (MinecraftHub01)
#   proxy: nur proxy/          (MinecraftProxy01, Velocity: bStats, Geyser-Texte), ohne permissions.yml
#   vm200 (Standard): alles, Voice Chat hinter Velocity (nur 127.0.0.1)
#   lokal:            ohne voicechat/ (lokaler Testserver ohne Proxy, Voice Chat bleibt auf 24454)
# Alter Aufruf einspielen.sh <ordner> [vm200|lokal] gilt weiter als smp.
# Überschreibt nur die hier geführten Dateien, alles andere in plugins/ bleibt unberührt.
set -euo pipefail

ziel="${1:?Aufruf: einspielen.sh <server-ordner> <smp|hub> [vm200|lokal]}"
[ -d "$ziel" ] || { echo "Ordner $ziel fehlt" >&2; exit 1; }
ziel="$(cd "$ziel" && pwd)"   # absolut, das Skript wechselt unten in den Quellordner
case "${2:-}" in
  smp|hub|proxy) rolle="$2"; modus="${3:-vm200}" ;;
  *)       rolle=smp;  modus="${2:-vm200}" ;;
esac
quelle="$(cd "$(dirname "$0")" && pwd)"

[ -d "$ziel/plugins" ] || { echo "Kein plugins/-Ordner in $ziel" >&2; exit 1; }
case "$modus" in vm200|lokal) ;; *) echo "Modus muss vm200 oder lokal sein" >&2; exit 1 ;; esac

teile="gemeinsam $rolle"
[ "$rolle" = proxy ] && teile="proxy"
for teil in $teile; do
  cd "$quelle/$teil/plugins"
  find . -type f | sort | while read -r datei; do
    datei="${datei#./}"
    if [ "$modus" = lokal ] && [ "${datei%%/*}" = voicechat ]; then continue; fi
    mkdir -p "$ziel/plugins/$(dirname "$datei")"
    cp "$datei" "$ziel/plugins/$datei"
    echo "$teil: plugins/$datei"
  done
done
if [ "$rolle" != proxy ]; then
  cp "$quelle/../paper/permissions.yml" "$ziel/permissions.yml"
  echo "permissions.yml"
fi
# Weihnachtsinsel-Mission: Wunschlisten/Tränke von Spawn & Welt (spawn/mission.json) für serverwahl auf dem SMP
if [ "$rolle" = smp ] && [ -f "$quelle/../../spawn/mission.json" ]; then
  mkdir -p "$ziel/plugins/Serverwahl"
  cp "$quelle/../../spawn/mission.json" "$ziel/plugins/Serverwahl/mission.json"
  echo "smp: plugins/Serverwahl/mission.json (aus spawn/)"
fi
if [ "$rolle" = smp ] && [ -f "$quelle/../../spawn/weihnachtsmann.json" ]; then
  cp "$quelle/../../spawn/weihnachtsmann.json" "$ziel/plugins/Serverwahl/weihnachtsmann.json"
  echo "smp: plugins/Serverwahl/weihnachtsmann.json (aus spawn/)"
fi

for alt in "$ziel"/plugins/harvester-*.jar "$ziel"/plugins/SpawnElytra-*.jar; do
  [ -e "$alt" ] && echo "WARNUNG: $alt liegt noch im Server, das Plugin ist gestrichen (24.10.)" >&2
done
if [ "$rolle" = hub ]; then
  for fremd in "$ziel"/plugins/dimensioncontrol-*.jar "$ziel"/plugins/xaero-fair-play-*.jar "$ziel"/plugins/ArmorPoser-*.jar "$ziel"/plugins/Chunky-*.jar; do
    [ -e "$fremd" ] && echo "WARNUNG: $fremd gehört nur aufs SMP, nicht auf den Hub" >&2
  done
fi
exit 0
