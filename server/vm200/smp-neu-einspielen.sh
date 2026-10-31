#!/usr/bin/env bash
# Neue SMP-Welt auf VM200 einspielen (Pascal 30.10., Führung Spawn & Welt). Läuft als root, Hub und SMP GESTOPPT. Reihenfolge laut Spawn & Welt:
#  1. alte Welt + SMP-Merker sichern (smp-welt-neu.sh, nur verschieben)   2. vorbereitete Welt (neuwelt-upload) → Minecraft/world
#  3. Seed aus der Welt in die AMP-Einstellung (seed-uebernehmen.py, ohne Ausgabe)
#  4. regions.yml, weihnachtsmann.json, mission.json aus spawn/smp-neu/ausgabe (verschoben)   5. Plugin-Konfigs (einspielen.sh smp vm200 + Versatz)
#  6. winter-weihnachten nur mit MIT_WINTER=1 (sonst nach der Vorgenerierung)   7. Anti-Xray (anti-xray-setzen.py)   8. Spieler-Spuren Hub + SMP (spieler-reset.py)
# Vorbereitet in /root/mcw-staging/smpneu (Konfig, Dateien, Datapack) und /srv/ampdata/mc-netzwerk-sicherung/neuwelt-upload (Welt).
# Vom C96-PC (PowerShell): Get-Content -Raw <dieses Skript> | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
# Reset-Probe (31.10.): INSTANZ=MinecraftTestwelt01 PORT=25569, dazu R/P/NEU als Umgebung; dann nur diese Instanz, Hub und geteilter Ordner bleiben.
set -euo pipefail
INSTANZ=${INSTANZ:-MinecraftSMP01}; PORT=${PORT:-25568}
I=/home/amp/.ampdata/instances
M=$I/$INSTANZ/Minecraft
R=${R:-/root/mcw-staging/reset}
P=${P:-/root/mcw-staging/smpneu}
NEU=${NEU:-/srv/ampdata/mc-netzwerk-sicherung/neuwelt-upload}
export INSTANZ PORT
PORTS="25567 25568"; [ "$INSTANZ" = MinecraftSMP01 ] || PORTS=$PORT

for port in $PORTS; do
  if (exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null; then echo "Abbruch: Port $port läuft noch – erst in AMP stoppen" >&2; exit 1; fi
done
[ -d "$NEU/dimensions" ] || { echo "Abbruch: keine vorbereitete Welt in $NEU" >&2; exit 1; }
[ -d "$P/konfig/plugins" ] || { echo "Abbruch: kein Paket in $P" >&2; exit 1; }

echo "== 1. alte Welt sichern"; bash "$R/smp-welt-neu.sh"
echo "== 2. neue Welt"; mv "$NEU" "$M/world"; echo "Welt: $(du -sh "$M/world" | cut -f1)"
echo "== 3. Seed"
su - amp -c "ampinstmgr -q $INSTANZ" | tail -1
python3 "$R/seed-uebernehmen.py"
echo "== 4. verschobene Spawn-Dateien"
install -d -o amp -g amp "$M/plugins/WorldGuard" "$M/plugins/WorldGuard/worlds" "$M/plugins/WorldGuard/worlds/world"
install -o amp -g amp -m 644 "$P/ausgabe/regions.yml" "$M/plugins/WorldGuard/worlds/world/regions.yml"
install -o amp -g amp -m 644 "$P/ausgabe/weihnachtsmann.json" "$P/ausgabe/mission.json" "$M/plugins/Serverwahl/"
echo "== 5. Plugin-Konfigs (mit Versatz)"; cp -r "$P/konfig/." "$M/"
install -o amp -g amp -m 644 "$P/ausgabe/weihnachtsmann.json" "$P/ausgabe/mission.json" "$M/plugins/Serverwahl/"   # nach 5., damit die verschobenen gelten
{ grep -E "mitte:|x: " "$M/plugins/Serverwahl/config.yml" | grep -v "#" | head -4 || true; }
# Spawn & Welt 30.10.: Winter erst NACH der Vorgenerierung auf VM200 (sonst bäckt Schnee/Eis fest ein). Standard: auslassen; MIT_WINTER=1 nur bei vorgenerierter Welt
if [ "${MIT_WINTER:-0}" = 1 ]; then echo "== 6. winter-weihnachten"; cp -r "$P/winter-weihnachten" "$M/world/datapacks/"; else echo "== 6. winter-weihnachten AUSGELASSEN (nach der Vorgenerierung nachlegen, vor-dem-start.md)"; fi
echo "== 7. Anti-Xray"; python3 "$R/anti-xray-setzen.py" "$M" "$P/anti-xray.md"
chown -R amp:amp "$M"
# Spieler-Reset VOR dem Start (31.10.): seit Startmodus „Anwendung starten“ läuft der Server nach ampinstmgr -s sofort, spieler-reset.py bricht dann ab
echo "== 8. Spieler-Spuren ($INSTANZ, beim SMP auch Hub)"; python3 "$R/spieler-reset.py" --ausfuehren
su - amp -c "ampinstmgr -s $INSTANZ" | tail -1
echo "== Belege"
grep -q "^Minecraft.WorldSeed=CubeCodersPowered" "$I/$INSTANZ/MinecraftModule.kvp" && echo "Seed: NEIN (noch CubeCodersPowered)" || echo "Seed ≠ CubeCodersPowered: ja"
ls "$M/world/datapacks" | tr '\n' ' '; echo
find "$M" ! -user amp | head -3
echo "fertig – jetzt Hub und SMP starten (Pascal)"
exit 0
