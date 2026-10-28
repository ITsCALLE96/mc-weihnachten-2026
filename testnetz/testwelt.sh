#!/usr/bin/env bash
# Admin-Testwelt als dritter Backend-Server hinter Velocity (Pascal 28.10.): Superflat, Kreativ, keine natürlichen Mob-Spawns, darin der Mob-Zoo.
# Erreichbar über die zweite Hub-Kiste „Testwelt“ (nur mit serverwahl.testwelt, im Testnetz für admin). NUR Testnetz, nicht auf VM200.
# Startet nichts selbst (Start macht die Leitung bzw. Pascal: start.cmd startet sie mit).
#
#   bash testnetz/testwelt.sh einrichten   – Testnetz gestoppt: testnetz/testwelt anlegen (Paper, serverwahl, LuckPerms, Zoo-Datapack),
#                                           Velocity um „testwelt“ ergänzen
#   bash testnetz/testwelt.sh archiv       – Bauarchiv- und Zoo-Datapack sowie das Säle-Menü neu erzeugen (danach /reload oder Neustart)
#   bash testnetz/testwelt.sh rechte       – SMP läuft: serverwahl.testwelt für die Gruppe admin (gemeinsamer LuckPerms-Speicher)
#   bash testnetz/testwelt.sh entfernen    – Testnetz gestoppt: Ordner testnetz/testwelt weg, Velocity-Eintrag raus
#
# Danach (Server läuft): python -I testnetz/rcon.py testwelt "function archiv:aufbau" (Platz, Säle, Zoo); Säle-Menü: Ender-Kiste am Spawn
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads"
tw="$hier/testwelt"
frei() { ! (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
alle_frei() { frei 25567 && frei 25568 && frei 25569 && frei 25577; }

# Bauarchiv (server/testwelt/archiv.py) + Mob-Zoo im Saal „zoo“ (Zoo-Ecke 1984/−140, Arena südlich davon bei z −200)
bauarchiv() {
  python -I "$repo/server/zoo/zoo.py" "$hier/smp/versions/26.3/paper-26.3.jar" "$tw/world/datapacks" 1984 -60 -140 | head -1
  python -I "$repo/server/testwelt/archiv.py" "$tw"
  printf '{
  "values": ["zoo:aufbau"]
}
' > "$tw/world/datapacks/archiv/data/archiv/tags/function/saal/zoo.json"
}

case "${1:-}" in
  archiv)
    # nur Datapacks und Menü neu erzeugen (Testwelt gestoppt oder danach /reload)
    bauarchiv
    ;;
  einrichten)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    [ -f "$hier/proxy/forwarding.secret" ] || { echo "proxy/forwarding.secret fehlt (erst einrichten.sh)" >&2; exit 1; }
    [ -e "$tw" ] && { echo "$tw gibt es schon (neu: erst entfernen)" >&2; exit 1; }
    echo "fc8bb9919fa77c670b7ed5c284bcb66770ea71fc  $dl/namen/luckperms.jar" | sha1sum -c -
    mkdir -p "$tw/plugins/Serverwahl" "$tw/config" "$tw/world/datapacks"
    cp "$dl/paper-26.3-207.jar" "$tw/"
    cp "$repo/server/serverwahl/build/serverwahl-1.0.0.jar" "$tw/plugins/"
    cp "$dl/namen/luckperms.jar" "$tw/plugins/LuckPerms-Bukkit-5.5.71.jar"
    echo "eula=true" > "$tw/eula.txt"
    printf 'proxies:\n  velocity:\n    enabled: true\n    online-mode: true\n    secret: "%s"\n' "$(cat "$hier/proxy/forwarding.secret")" > "$tw/config/paper-global.yml"
    # gleiches Resourcepack wie der Hub
    rp="$(grep -E '^(require-resource-pack|resource-pack|resource-pack-id|resource-pack-prompt|resource-pack-sha1)=' "$hier/hub/server.properties")"
    cat > "$tw/server.properties" <<PROP
server-ip=127.0.0.1
server-port=25569
online-mode=false
enforce-secure-profile=false
gamemode=creative
force-gamemode=true
difficulty=easy
spawn-monsters=false
level-type=minecraft\:flat
generate-structures=false
view-distance=8
simulation-distance=6
max-players=10
spawn-protection=0
white-list=false
motd=Testnetz Testwelt
enable-rcon=true
rcon.port=25587
rcon.password=$(openssl rand -hex 16)
$rp
PROP
    # LuckPerms: gemeinsamer Ordner wie Hub/SMP (Rechte, Nicks)
    mkdir -p "$tw/plugins/LuckPerms"
    cp "$repo/server/plugin-konfig/gemeinsam/plugins/LuckPerms/config.yml" "$tw/plugins/LuckPerms/"
    MSYS2_ARG_CONV_EXCL='*' cmd /c mklink /J "$(cygpath -w "$tw/plugins/LuckPerms/yaml-storage")" "$(cygpath -w "$hier/luckperms-daten")" > /dev/null
    # serverwahl: nur /hub, Nicks, Spielregeln (keine natürlichen Mob-Spawns; Zeit schaltet zoo:nacht/zoo:tag)
    cat > "$tw/plugins/Serverwahl/config.yml" <<'YML'
# Testwelt (nur Testnetz, Pascal 28.10.): /hub zurück, Nicks, keine natürlichen Mob-Spawns. Mob-Zoo: Datapack zoo (server/zoo/README.md)
ist-hub: false
hub-server: hub
portale-sperren: false
kisten: []
kategorien: {}
namen:
  aktiv: true
spielregeln:
  spawn_mobs: false
  spawn_patrols: false
  spawn_phantoms: false
  spawn_wandering_traders: false
  spawn_wardens: false
  mob_griefing: true
xaero-welt-id: 26120901
YML
    bauarchiv

    # Velocity: Server „testwelt“ ergänzen
    python -I - "$hier/proxy/velocity.toml" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
if 'testwelt = ' not in s:
    s, n = re.subn(r'(?m)^(smp = "127\.0\.0\.1:25568"\n)', r'\1testwelt = "127.0.0.1:25569"\n', s, count=1)
    assert n == 1, "smp-Eintrag in velocity.toml nicht gefunden"
open(p, "w", encoding="utf-8", newline="\n").write(s)
PY
    echo "Testwelt eingerichtet: $tw (Port 25569, RCON 25587). start.cmd startet sie mit. Danach: bash testnetz/testwelt.sh rechte, dann function archiv:aufbau"
    ;;
  rechte)
    frei 25568 && { echo "SMP läuft nicht" >&2; exit 1; }
    python -I "$hier/rcon.py" smp "lp group admin permission set serverwahl.testwelt true"
    ;;
  entfernen)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    if [ -L "$tw/plugins/LuckPerms/yaml-storage" ]; then rm "$tw/plugins/LuckPerms/yaml-storage"; fi   # nur die Verknüpfung, nicht die Daten
    rm -rf "$tw"
    sed -i '/^testwelt = "127.0.0.1:25569"$/d' "$hier/proxy/velocity.toml"
    echo "Testwelt entfernt"
    ;;
  *) sed -n 2,13p "$0"; exit 1 ;;
esac
