#!/usr/bin/env bash
# Spielt die Plugin-Konfigs aus server/plugin-konfig/plugins/ und server/paper/permissions.yml in einen Paper-Server ein.
# Aufruf (Server gestoppt): einspielen.sh <server-ordner> [vm200|lokal]
#   vm200 (Standard): alles, Voice Chat hinter Velocity (Port 24455, nur 127.0.0.1)
#   lokal:            ohne voicechat/ (lokaler Testserver ohne Proxy, Voice Chat bleibt auf 24454)
# Überschreibt nur die hier geführten Dateien, alles andere in plugins/ bleibt unberührt.
set -euo pipefail

ziel="${1:?Aufruf: einspielen.sh <server-ordner> [vm200|lokal]}"
modus="${2:-vm200}"
quelle="$(cd "$(dirname "$0")" && pwd)"

[ -d "$ziel/plugins" ] || { echo "Kein plugins/-Ordner in $ziel" >&2; exit 1; }
case "$modus" in vm200|lokal) ;; *) echo "Modus muss vm200 oder lokal sein" >&2; exit 1 ;; esac

cd "$quelle/plugins"
find . -type f | sort | while read -r datei; do
  datei="${datei#./}"
  if [ "$modus" = lokal ] && [ "${datei%%/*}" = voicechat ]; then continue; fi
  mkdir -p "$ziel/plugins/$(dirname "$datei")"
  cp "$datei" "$ziel/plugins/$datei"
  echo "plugins/$datei"
done
cp "$quelle/../paper/permissions.yml" "$ziel/permissions.yml"
echo "permissions.yml"

for alt in "$ziel"/plugins/harvester-*.jar; do
  [ -e "$alt" ] && echo "WARNUNG: $alt liegt noch im Server, Right click harvester ist gestrichen (24.10.)" >&2
done
exit 0
