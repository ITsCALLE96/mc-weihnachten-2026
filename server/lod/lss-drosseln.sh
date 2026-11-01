#!/usr/bin/env bash
# LSS-Bandbreite und LOD-Radius im SMP setzen (Leitung/Pascal 01.11., Lag-Analyse: der LOD-Strom teilt sich die Leitung mit dem Spiel).
# Live liefen noch die Plugin-Standards 25 / 75 MiB/s und Radius 512 – die Werte aus lss-werte.txt (0,5 / 2, 320) waren auf VM200 nie gesetzt.
# Werte unten anpassen. LSS zählt UNKOMPRIMIERT (MiB/s vor Kompression), auf der Leitung ist es weniger; grob 1 MiB/s ≈ 8 Mbit/s roh.
# Der Gesamtwert sollte unter Pascals Upload bleiben (mit Luft fürs Spiel), pro Spieler ≤ gesamt.
# KEIN Neustart: die Datei wird geändert, wirksam nach „lsslod reload“ in der SMP-Konsole (Bandbreite und Radius sind nicht als [restart]
# markiert) oder spätestens mit dem nächsten Neustart. Als root auf VM200. Zweiter Lauf mit denselben Werten ändert nichts.
set -euo pipefail
SPIELER_MIB=0.5      # network.bandwidth.per_player_mib_per_second
GESAMT_MIB=2         # network.bandwidth.global_mib_per_second
RADIUS_OBERWELT=256  # lod.distance Overworld in Chunks (256 = 4.096 Blöcke)
RADIUS_NETHER=64
RADIUS_END=128

C=/home/amp/.ampdata/instances/MinecraftSMP01/Minecraft/plugins/LodServerSupport/lss-server-config.yaml
for v in "$SPIELER_MIB" "$GESAMT_MIB" "$RADIUS_OBERWELT" "$RADIUS_NETHER" "$RADIUS_END"; do
  [[ "$v" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "Abbruch: Wert „$v“ ist keine Zahl"; exit 1; }
done
awk -v s="$SPIELER_MIB" -v g="$GESAMT_MIB" 'BEGIN{exit !(s>0 && s<=g)}' || { echo "Abbruch: pro Spieler muss > 0 und ≤ gesamt sein"; exit 1; }
B=/root/mcw-staging/vor-lss-drosseln-$(date +%m%d-%H%M); mkdir -p "$B"; cp -p "$C" "$B/"
setze() {  # setze <Muster vor dem Wert> <Wert>: genau eine Zeile, Kommentar dahinter bleibt
  [ "$(grep -cE "^\s*$1 " "$C")" = 1 ] || { echo "Abbruch: „$1“ nicht genau einmal in der Datei (Schema geändert?)"; exit 1; }
  sed -i -E "s/^(\s*$1 )[0-9.]+/\1$2/" "$C"
}
setze 'per_player_mib_per_second:' "$SPIELER_MIB"
setze 'global_mib_per_second:' "$GESAMT_MIB"
setze 'default_chunks:' "$RADIUS_OBERWELT"
setze '"minecraft:overworld":' "$RADIUS_OBERWELT"
setze '"minecraft:the_nether":' "$RADIUS_NETHER"
setze '"minecraft:the_end":' "$RADIUS_END"
chown amp:amp "$C"
{ grep -E '^\s*(per_player_mib_per_second|global_mib_per_second|default_chunks|"minecraft:(overworld|the_nether|the_end)"):' "$C" | sed 's/ #.*//' || true; }
echo "Sicherung: $B"
echo "Jetzt in der SMP-Konsole (AMP): lsslod reload   – danach prüfen mit: lsslod stats"
exit 0
