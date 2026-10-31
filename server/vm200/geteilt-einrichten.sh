#!/usr/bin/env bash
# Gemeinsamer Ordner für Proxy, Hub und SMP auf VM200 (Pascal/Leitung 30.10.): Die AMP-Container sehen nur ihren Instanzordner (/AMP),
# deshalb wird /srv/ampdata/mc-netzwerk-geteilt per Bind-Mount (fstab, nofail) in jede der drei Instanzen als <Instanz>/geteilt eingehängt.
# Im Container: /AMP/geteilt/{status,whitelist,luckperms}. Läuft als root auf VM200, stoppt und startet nur die AMP-Hüllen dieser drei Instanzen.
# Vom C96-PC aus: ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'" < server/vm200/geteilt-einrichten.sh
# Mehrfach ausführbar (fügt nichts doppelt ein). Rückweg: cp /etc/fstab.vor-mc-geteilt-20261030 /etc/fstab, umount der drei geteilt-Ordner.
set -euo pipefail
G=/srv/ampdata/mc-netzwerk-geteilt
INST=/home/amp/.ampdata/instances
L="MinecraftProxy01 MinecraftHub01 MinecraftSMP01"

[ -e /etc/fstab.vor-mc-geteilt-20261030 ] || cp -a /etc/fstab /etc/fstab.vor-mc-geteilt-20261030
mkdir -p "$G/status" "$G/whitelist" "$G/luckperms"
chown -R amp:amp "$G"
chmod 750 "$G"

for i in $L; do
  su - amp -c "ampinstmgr -q $i" 2>&1 | tail -1
  d="$INST/$i/geteilt"
  install -d -o amp -g amp "$d"
  grep -q " $d " /etc/fstab || echo "$G  $d  none  bind,nofail,x-systemd.requires-mounts-for=/home/amp/.ampdata  0  0  # Minecraft-Netzwerk (Proxy/Hub/SMP)" >> /etc/fstab
done
systemctl daemon-reload
mount -a
echo "--- eingehängt:"
{ findmnt -n -o TARGET,SOURCE | grep geteilt || true; }

# LuckPerms: yaml-storage beider Backends zeigt relativ auf den gemeinsamen Ordner (gilt im Container und auf dem Host)
for s in MinecraftHub01 MinecraftSMP01; do
  y="$INST/$s/Minecraft/plugins/LuckPerms/yaml-storage"
  [ -e "$y" ] || [ -L "$y" ] || ln -s ../../../geteilt/luckperms "$y"
  chown -h amp:amp "$y"
done

# Pfade in den schon eingespielten Serverwahl-Configs (Stand vor dem 30.10.: /opt/mc-weihnachten/…) auf den Container-Pfad umstellen
for s in MinecraftHub01 MinecraftSMP01; do
  sed -i 's#/opt/mc-weihnachten/status#/AMP/geteilt/status#g; s#/opt/mc-weihnachten/whitelist#/AMP/geteilt/whitelist#g' "$INST/$s/Minecraft/plugins/Serverwahl/config.yml"
  { grep -c "/AMP/geteilt/" "$INST/$s/Minecraft/plugins/Serverwahl/config.yml" | sed "s/^/$s: Pfade umgestellt: /" || true; }
done

for i in $L; do su - amp -c "ampinstmgr -s $i" 2>&1 | tail -1; done
sleep 15
echo "--- im Container sichtbar:"
for i in $L; do echo "$i: $(docker exec "AMP_$i" ls /AMP/geteilt | tr '\n' ' ')"; done
touch "$G/status/.probe"
docker exec AMP_MinecraftSMP01 test -e /AMP/geteilt/status/.probe && echo "Probe: SMP sieht den Ordner"
docker exec AMP_MinecraftHub01 test -d /AMP/Minecraft/plugins/LuckPerms/yaml-storage && echo "Probe: LuckPerms-Verknüpfung im Hub ok"
rm -f "$G/status/.probe"
echo "fertig"
exit 0
