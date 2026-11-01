#!/usr/bin/env bash
# Rückweg zu clans-einspielen.sh (Leitung 01.11.): altes serverwahl-Jar und alte Configs in Hub und SMP, LuckPerms-Ordner aus der Sicherung.
# Als root auf VM200. Aufruf: clans-zurueck.sh [sicherungsordner]   (ohne Angabe die jüngste /root/mcw-staging/vor-clans-*)
# Achtung: Der LuckPerms-Ordner wird auf den Stand der Sicherung gesetzt; was danach an Nicks/Rechten/Clans geändert wurde, ist weg.
# Danach Hub und SMP neu starten (angekündigt). Kein Neustart im Skript.
set -euo pipefail
I=/home/amp/.ampdata/instances
G=/srv/ampdata/mc-netzwerk-geteilt
B=${1:-$(ls -d /root/mcw-staging/vor-clans-* 2>/dev/null | sort | tail -1)}
[ -n "$B" ] && [ -f "$B/luckperms.tar.gz" ] || { echo "Abbruch: keine Sicherung gefunden ($B)"; exit 1; }
echo "Sicherung: $B"
for inst in MinecraftHub01 MinecraftSMP01; do
  P=$I/$inst/Minecraft/plugins
  install -o amp -g amp -m 644 "$B/serverwahl-$inst.jar" "$P/.serverwahl-alt.jar"
  mv -f "$P/.serverwahl-alt.jar" "$P/serverwahl-1.0.0.jar"
  install -o amp -g amp -m 644 "$B/config-$inst.yml" "$P/Serverwahl/config.yml"
  echo "$inst: Jar $(sha1sum "$P/serverwahl-1.0.0.jar" | cut -c1-12) zurück, Config zurück"
done
mv "$G/luckperms" "$G/luckperms.vor-rueckweg-$(date +%m%d-%H%M)"
tar -xzf "$B/luckperms.tar.gz" -C "$G"
chown -R amp:amp "$G/luckperms"
echo "LuckPerms-Ordner zurück (der bisherige liegt daneben als luckperms.vor-rueckweg-*)"
echo "Jetzt Hub und SMP neu starten (angekündigt)."
exit 0
