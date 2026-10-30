#!/usr/bin/env bash
# Neue SMP-Welt auf VM200 einspielen (Pascal 30.10., Führung Spawn & Welt). Läuft als root, Hub und SMP GESTOPPT. Reihenfolge laut Spawn & Welt:
#  1. alte Welt + SMP-Merker sichern (smp-welt-neu.sh, nur verschieben)   2. vorbereitete Welt (neuwelt-upload) → Minecraft/world
#  3. Seed aus der Welt in die AMP-Einstellung (seed-uebernehmen.py, ohne Ausgabe)
#  4. regions.yml, weihnachtsmann.json, mission.json aus spawn/smp-neu/ausgabe (verschoben)   5. Plugin-Konfigs (einspielen.sh smp vm200 + Versatz)
#  6. winter-weihnachten nach world/datapacks   7. Anti-Xray (anti-xray-setzen.py)   8. Spieler-Spuren Hub + SMP (spieler-reset.py)
# Vorbereitet in /root/mcw-staging/smpneu (Konfig, Dateien, Datapack) und /srv/ampdata/mc-netzwerk-sicherung/neuwelt-upload (Welt).
# Vom C96-PC (PowerShell): Get-Content -Raw <dieses Skript> | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
set -euo pipefail
I=/home/amp/.ampdata/instances
M=$I/MinecraftSMP01/Minecraft
R=/root/mcw-staging/reset
P=/root/mcw-staging/smpneu
NEU=/srv/ampdata/mc-netzwerk-sicherung/neuwelt-upload

for port in 25567 25568; do
  if (exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null; then echo "Abbruch: Port $port läuft noch – Hub und SMP in AMP stoppen" >&2; exit 1; fi
done
[ -d "$NEU/dimensions" ] || { echo "Abbruch: keine vorbereitete Welt in $NEU" >&2; exit 1; }
[ -d "$P/konfig/plugins" ] || { echo "Abbruch: kein Paket in $P" >&2; exit 1; }

echo "== 1. alte Welt sichern"; bash "$R/smp-welt-neu.sh"
echo "== 2. neue Welt"; mv "$NEU" "$M/world"; echo "Welt: $(du -sh "$M/world" | cut -f1)"
echo "== 3. Seed"
su - amp -c "ampinstmgr -q MinecraftSMP01" | tail -1
python3 "$R/seed-uebernehmen.py"
echo "== 4. verschobene Spawn-Dateien"
install -d -o amp -g amp "$M/plugins/WorldGuard" "$M/plugins/WorldGuard/worlds" "$M/plugins/WorldGuard/worlds/world"
install -o amp -g amp -m 644 "$P/ausgabe/regions.yml" "$M/plugins/WorldGuard/worlds/world/regions.yml"
install -o amp -g amp -m 644 "$P/ausgabe/weihnachtsmann.json" "$P/ausgabe/mission.json" "$M/plugins/Serverwahl/"
echo "== 5. Plugin-Konfigs (mit Versatz)"; cp -r "$P/konfig/." "$M/"
install -o amp -g amp -m 644 "$P/ausgabe/weihnachtsmann.json" "$P/ausgabe/mission.json" "$M/plugins/Serverwahl/"   # nach 5., damit die verschobenen gelten
grep -E "mitte:|x: " "$M/plugins/Serverwahl/config.yml" | grep -v "#" | head -4
echo "== 6. winter-weihnachten"; cp -r "$P/winter-weihnachten" "$M/world/datapacks/"
echo "== 7. Anti-Xray"; python3 "$R/anti-xray-setzen.py" "$M" "$P/anti-xray.md"
chown -R amp:amp "$M"
su - amp -c "ampinstmgr -s MinecraftSMP01" | tail -1
echo "== 8. Spieler-Spuren Hub + SMP"; python3 "$R/spieler-reset.py" --ausfuehren
echo "== Belege"
grep -q "^Minecraft.WorldSeed=CubeCodersPowered" "$I/MinecraftSMP01/MinecraftModule.kvp" && echo "Seed: NEIN (noch CubeCodersPowered)" || echo "Seed ≠ CubeCodersPowered: ja"
ls "$M/world/datapacks" | tr '\n' ' '; echo
find "$M" ! -user amp | head -3
echo "fertig – jetzt Hub und SMP starten (Pascal)"
