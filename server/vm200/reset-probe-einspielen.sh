#!/usr/bin/env bash
# Reset-Probe Teil 2 (Leitung/Pascal 31.10.): die in reset-probe-bauen.sh gebaute Welt mit dem ECHTEN Einspielweg in die Testinstanz bringen,
# genau wie zum 27.11. ins SMP, nur mit INSTANZ=MinecraftTestwelt01 (127.0.0.1:25569). SMP, Hub, Proxy-Instanz und der geteilte Ordner bleiben unberührt.
#  0. Testinstanz als Kopie des SMP-Ordners (Plugins, Configs, Ops, Whitelist, Velocity-Anbindung), ohne Welt, Logs, Merker, Prism-Datenbank;
#     LuckPerms als Kopie statt Verknüpfung auf den geteilten Ordner, ohne Voice Chat (UDP 24455 gehört dem SMP)
#  1. Paket wie für VM200: Plugin-Konfigs (einspielen.sh smp vm200 + Versatz mit Inselhöhe), ausgabe/, winter-weihnachten (vom SMP), Anti-Xray
#  2. smp-neu-einspielen.sh mit INSTANZ/PORT (alle 8 Schritte, Winter gleich mit: winter-generierung räumt den Generierungsschnee)
#  3. generalprobe-zurueck.py mit denselben Regeln aufs Paket (Kalender 12-01, Termine, Mission ohne Override, Sperrtext 27.11.)
#  4. velocity.toml: Eintrag testwelt aktivieren (danach „velocity reload“ in der Proxy-Konsole)
# Voraussetzung: reset-probe-bauen.sh gelaufen, Instanz MinecraftTestwelt01 in AMP angelegt und GESTOPPT. Als root auf VM200, ~5 min.
set -euo pipefail
REPO=${REPO:-/opt/mc-repo}
B=/srv/ampdata/mc-reset-probe
I=/home/amp/.ampdata/instances
SMP=$I/MinecraftSMP01/Minecraft
export INSTANZ=MinecraftTestwelt01 PORT=25569
T=$I/$INSTANZ/Minecraft
P=$B/paket

[ -d "$I/$INSTANZ" ] || { echo "Abbruch: Instanz $INSTANZ fehlt – erst in AMP anlegen" >&2; exit 1; }
(exec 3<>/dev/tcp/127.0.0.1/$PORT) 2>/dev/null && { echo "Abbruch: $INSTANZ läuft – in AMP stoppen" >&2; exit 1; }
[ -d "$B/bau/world/dimensions" ] || { echo "Abbruch: keine gebaute Welt in $B/bau/world (reset-probe-bauen.sh)" >&2; exit 1; }

echo "== 0. Testinstanz aus dem SMP-Ordner"
mkdir -p "$T"
tar -C "$SMP" --exclude=./world --exclude=./logs --exclude=./crash-reports --exclude='./plugins/prism/*.db' \
  --exclude=./plugins/Serverwahl/live --exclude=./plugins/Serverwahl/mission-stand.yml --exclude=./plugins/Serverwahl/eroeffnet.txt \
  --exclude=./plugins/Serverwahl/taeglich.txt --exclude=./plugins/Serverwahl/neujahr.txt --exclude=./plugins/Serverwahl/termine.txt \
  --exclude=./plugins/LuckPerms/yaml-storage --exclude='./plugins/voicechat*' -cf - . | tar -C "$T" -xf -
cp -r "$I/MinecraftSMP01/geteilt/luckperms" "$T/plugins/LuckPerms/yaml-storage"
sed -i 's/^server-port=.*/server-port=25569/; s/^server-ip=.*/server-ip=127.0.0.1/' "$T/server.properties"
chown -R amp:amp "$T"
echo "Plugins: $(ls "$T/plugins"/*.jar | xargs -n1 basename | tr '\n' ' ')"

echo "== 1. Paket $P"
rm -rf "$P"; mkdir -p "$P/konfig/plugins" "$P/ausgabe"
bash "$REPO/server/plugin-konfig/einspielen.sh" "$P/konfig" smp vm200 | tail -2
rm -rf "$P/konfig/plugins/voicechat"
cp "$REPO/spawn/smp-neu/ausgabe/regions.yml" "$REPO/spawn/smp-neu/ausgabe/weihnachtsmann.json" "$REPO/spawn/smp-neu/ausgabe/mission.json" "$P/ausgabe/"
cp -r "$SMP/world/datapacks/winter-weihnachten" "$P/"
cp "$REPO/server/paper/anti-xray.md" "$P/"
{ grep -E "y-ab:|x: " "$P/konfig/plugins/Serverwahl/config.yml" | grep -v "#" | head -3 || true; }
# Rückstellung wie zum 27.11. mit denselben Regeln, aufs Paket statt auf die laufende Instanz (smp-neu-einspielen.sh startet sie am Ende)
NUR_SMP="$P/konfig" python3 "$REPO/server/vm200/generalprobe-zurueck.py" --ausfuehren | tail -6
{ grep -E "erster-tag|aktive-liste|^  start:|winter-generierung|live-werte" "$P/konfig/plugins/Serverwahl/config.yml" || true; }

echo "== 2. smp-neu-einspielen.sh (INSTANZ=$INSTANZ)"
mkdir -p "$B/upload"; rm -rf "$B/upload/world"; mv "$B/bau/world" "$B/upload/world"
R="$REPO/server/vm200" P="$P" NEU="$B/upload/world" MIT_WINTER=1 bash "$REPO/server/vm200/smp-neu-einspielen.sh"

echo "== 4. Velocity-Eintrag testwelt"
V=$I/MinecraftProxy01/Minecraft/velocity.toml
cp -p "$V" "$B/velocity.toml.vor-probe"
sed -i 's|^# testwelt = "127.0.0.1:25569".*|testwelt = "127.0.0.1:25569"|' "$V"
{ grep -n '^testwelt' "$V" || echo "WARNUNG: testwelt-Zeile nicht aktiviert"; }
chown amp:amp "$V"

echo "== Belege"
find "$T" ! -user amp | head -3
echo "Welt: $(du -sh "$T/world" | cut -f1), Datapacks: $(ls "$T/world/datapacks" | tr '\n' ' ')"
cat <<'TXT'
Weiter (Leitung/Pascal):
 1. Proxy-Konsole: velocity reload   (reicht das nicht: Proxy in AMP neu starten)
 2. Läuft MinecraftTestwelt01 nicht von selbst: in AMP starten
 3. Testwelt-Konsole, Vorgenerierung für die Probe:
      chunky world world
      chunky spawn
      chunky shape square
      chunky radius 1000
      chunky start
 4. Rundgang per /server testwelt
 Danach: Testwelt stoppen; velocity.toml zurück: /srv/ampdata/mc-reset-probe/velocity.toml.vor-probe
TXT
exit 0
