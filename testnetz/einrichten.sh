#!/usr/bin/env bash
# Lokales Testnetz wie auf VM200: Velocity (Port 25577) → Hub (25567) + SMP (25568, leere Flachwelt).
# Läuft neben testserver/ (25565), ohne ihn anzufassen. Kein Voice Chat (würde mit dem Testserver um UDP 24454 streiten).
# Aufruf: bash testnetz/einrichten.sh   – legt proxy/, hub/, smp/ neu an (vorhandene Ordner werden gelöscht)
# Danach: start.cmd (drei Fenster), im Client Mehrspieler → localhost:25577
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads"
for jar in paper-26.3-207.jar velocity-4.3.0-44.jar worldedit-bukkit-7.4.6.jar worldguard-bukkit-7.0.20.jar; do
  [ -f "$dl/$jar" ] || { echo "Fehlt: $dl/$jar (siehe README.md)" >&2; exit 1; }
done
jarpfad="$repo/server/serverwahl/build/serverwahl-1.0.0.jar"
[ -f "$jarpfad" ] || { echo "Erst server/serverwahl/build.sh ausführen" >&2; exit 1; }

rm -rf "$hier/proxy" "$hier/hub" "$hier/smp"
mkdir -p "$hier/proxy/plugins" "$hier/hub/plugins" "$hier/smp/plugins" "$hier/hub/config" "$hier/smp/config"
secret="$(openssl rand -hex 32)"

# Proxy: Standard-velocity.toml aus dem Jar, dann unsere Werte (wie server/velocity/velocity.toml.auszug, nur Ports lokal)
cp "$dl/velocity-4.3.0-44.jar" "$hier/proxy/"
printf '%s' "$secret" > "$hier/proxy/forwarding.secret"
unzip -p "$dl/velocity-4.3.0-44.jar" default-velocity.toml > "$hier/proxy/velocity.toml"
python - "$hier/proxy/velocity.toml" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
def setze(schluessel, wert):
    global s
    s, n = re.subn(rf'(?m)^{re.escape(schluessel)} = .*$', f'{schluessel} = {wert}', s, count=1)
    assert n == 1, schluessel
setze("bind", '"0.0.0.0:25577"')
setze("motd", '"<aqua>Testnetz</aqua> <gray>(Hub + SMP, lokal)"')
setze("show-max-players", "30")
setze("force-key-authentication", "false")
setze("player-info-forwarding-mode", '"modern"')
# Server-Liste ersetzen
s = re.sub(r'(?s)\[servers\].*?\n\[forced-hosts\].*?\n(?=\[advanced\])',
           '[servers]\nhub = "127.0.0.1:25567"\nsmp = "127.0.0.1:25568"\ntry = [\n    "hub"\n]\n\n[forced-hosts]\n\n', s)
open(p, "w", encoding="utf-8", newline="\n").write(s)
PY

for rolle in hub smp; do
  ordner="$hier/$rolle"
  cp "$dl/paper-26.3-207.jar" "$jarpfad" "$ordner/" 2>/dev/null
  mv "$ordner/serverwahl-1.0.0.jar" "$ordner/plugins/"
  echo "eula=true" > "$ordner/eula.txt"
  cat > "$ordner/config/paper-global.yml" <<YML
proxies:
  velocity:
    enabled: true
    online-mode: true
    secret: "$secret"
YML
done
cp "$dl/worldedit-bukkit-7.4.6.jar" "$dl/worldguard-bukkit-7.0.20.jar" "$hier/hub/plugins/"

rp='resource-pack=https://github.com/ITsCALLE96/mc-weihnachten-2026/releases/download/rp-v3/weihnachten-rp.zip
resource-pack-sha1=34a0d1971ccd9b960e5107a5510191bbb122a0cb
resource-pack-id=73014a80-9072-4aee-961a-5ed01a359e3f
require-resource-pack=true
resource-pack-prompt={"text":"Pflicht: Weihnachts-Texturen und das deutsche Questbuch. Ohne Annehmen kein Beitritt.","color":"aqua"}'

# Hub wie server/server.properties.md → Hub, nur Port lokal und ohne Whitelist
cat > "$hier/hub/server.properties" <<PROP
server-ip=127.0.0.1
server-port=25567
online-mode=false
enforce-secure-profile=false
gamemode=adventure
force-gamemode=true
difficulty=peaceful
spawn-monsters=false
allow-nether=false
pvp=false
level-type=minecraft\:flat
generate-structures=false
view-distance=6
simulation-distance=4
max-players=30
spawn-protection=0
white-list=false
motd=Testnetz Hub
$rp
PROP

# SMP: leere Flachwelt, nur Ziel für den Wechsel
cat > "$hier/smp/server.properties" <<PROP
server-ip=127.0.0.1
server-port=25568
online-mode=false
enforce-secure-profile=false
gamemode=survival
level-type=minecraft\:flat
generate-structures=false
view-distance=6
simulation-distance=4
max-players=30
spawn-protection=0
white-list=false
motd=Testnetz SMP
$rp
PROP

bash "$repo/server/plugin-konfig/einspielen.sh" "$hier/hub" hub lokal
bash "$repo/server/plugin-konfig/einspielen.sh" "$hier/smp" smp lokal
echo "Testnetz bereit: $hier (start.cmd, dann localhost:25577)"
