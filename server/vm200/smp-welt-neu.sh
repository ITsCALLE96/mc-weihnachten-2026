#!/usr/bin/env bash
# SMP-Welt für einen Neuaufbau freimachen (Pascal 30.10.: komplett neuer Zufalls-Seed, Führung Spawn & Welt). Läuft als root auf VM200, SMP GESTOPPT.
#  1. alte Welt sichern statt löschen: Minecraft/world → /srv/ampdata/mc-netzwerk-sicherung/smp-welt-<zeit> (gleiche Platte, nur verschoben)
#  2. nur mit --seed: Zufalls-Seed setzen, falls Paper die neue Welt AUF VM200 erzeugen soll. AMP schreibt level-seed aus Minecraft.WorldSeed
#     (Standard „CubeCodersPowered“ = fester, bekannter Seed!). Wird die Welt fertig geliefert, stattdessen seed-uebernehmen.py nach dem Upload.
#     Der Seed wird nie ausgegeben (nicht ins Repo/Vault)
#  3. Spieler-Merker des SMP wie spieler-reset.py (mission-stand.yml, eroeffnet.txt, taeglich.txt, neujahr.txt, geteilt/status/smp-offen) mit sichern
# Beim nächsten Start erzeugt Paper die neue Welt (Spawn, Grenze, Chunky, LODs: Spawn & Welt). Datapacks danach wieder nach world/datapacks.
# Vom C96-PC (PowerShell): Get-Content -Raw <dieses Skript> | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"   (ohne Seed)
set -euo pipefail
I=/home/amp/.ampdata/instances/MinecraftSMP01
M=$I/Minecraft
S=/srv/ampdata/mc-netzwerk-sicherung
Z=$(date +%Y%m%d-%H%M%S)

if (exec 3<>/dev/tcp/127.0.0.1/25568) 2>/dev/null; then echo "Abbruch: SMP läuft noch – erst in AMP stoppen" >&2; exit 1; fi
[ -d "$M/world" ] || { echo "Keine Welt in $M/world – nichts zu sichern"; }

mkdir -p "$S"
if [ -d "$M/world" ]; then
  mv "$M/world" "$S/smp-welt-$Z"
  echo "alte Welt gesichert: $S/smp-welt-$Z ($(du -sh "$S/smp-welt-$Z" | cut -f1))"
fi
mkdir -p "$S/smp-merker-$Z"
for f in mission-stand.yml eroeffnet.txt taeglich.txt neujahr.txt; do
  [ -f "$M/plugins/Serverwahl/$f" ] && mv "$M/plugins/Serverwahl/$f" "$S/smp-merker-$Z/" && echo "Merker gesichert: $f"
done
[ -f /srv/ampdata/mc-netzwerk-geteilt/status/smp-offen ] && mv /srv/ampdata/mc-netzwerk-geteilt/status/smp-offen "$S/smp-merker-$Z/" && echo "Eröffnungs-Merker gesichert"

[ "${1:-}" = "--seed" ] || { echo "Fertig (ohne Seed) – Welt wird geliefert, Seed danach mit seed-uebernehmen.py"; exit 0; }
# Zufalls-Seed (64 Bit, vorzeichenbehaftet wie Minecraft), nur in AMP-Einstellung und server.properties – keine Ausgabe
seed=$(python3 -c 'import secrets; print(secrets.randbits(64) - 2**63)')
su - amp -c "ampinstmgr -q MinecraftSMP01" | tail -1
sed -i "s/^Minecraft.WorldSeed=.*/Minecraft.WorldSeed=$seed/" "$I/MinecraftModule.kvp"
sed -i "s/^level-seed=.*/level-seed=$seed/" "$M/server.properties"
unset seed
chown amp:amp "$I/MinecraftModule.kvp" "$M/server.properties"
su - amp -c "ampinstmgr -s MinecraftSMP01" | tail -1
grep -q "^Minecraft.WorldSeed=CubeCodersPowered" "$I/MinecraftModule.kvp" && { echo "FEHLER: Seed nicht gesetzt" >&2; exit 1; }
echo "Zufalls-Seed gesetzt (nicht angezeigt). Fertig – Spawn & Welt übernimmt den Neuaufbau."
exit 0
