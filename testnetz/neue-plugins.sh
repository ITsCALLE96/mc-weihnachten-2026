#!/usr/bin/env bash
# Alle neuen Plugins vom 27.10. einmal ins Testnetz (Entscheidungen Pascal: LOD, Bedrock/PlayStation, Anti-Cheat).
# Fremde Jars startet Pascal selbst (in der Claude-Session blockiert). Hub, SMP und Proxy dürfen vorher nicht laufen.
#
#   bash testnetz/neue-plugins.sh einrichten   – Prüfsummen, Jars verteilen, Konfigs erzeugen und unsere Werte einspielen,
#                                               2.000 × 2.000 auf dem SMP vorgenerieren, alles wieder stoppen
#   MCXBOX=1 bash testnetz/neue-plugins.sh einrichten   – zusätzlich MCXboxBroadcast (PlayStation), Anmeldung danach siehe server/bedrock.md
#   bash testnetz/neue-plugins.sh entfernen    – alle neuen Jars wieder heraus (Datenordner bleiben, key.pem bleibt git-ignoriert liegen)
#
# Verteilung:  Proxy  Geyser-Velocity 2.12.1, Floodgate 2.2.5 (+ MCXboxBroadcast)
#              Hub    Floodgate 2.2.5
#              SMP    Floodgate 2.2.5, LSS 0.20.0, GrimAC 2.3.75, Chunky 1.5.3
# Danach: start.cmd; Java-Client mit Testprofil „weihnachten-voxy-test“ auf localhost:25577, Bedrock-Client auf localhost:19132
# (Prüflisten: server/lod-server.md → Test, server/bedrock.md → Test, server/anticheat.md → Prüfen)
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads"
java="/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot/bin/java.exe"
setzen() { python -I "$repo/server/konfig-setzen.py" "$@"; }
frei() { ! (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
alle_frei() { frei 25567 && frei 25568 && frei 25577; }

paper_start() {  # $1 = hub|smp
  (cd "$hier/$1" && "$java" -Xms1G -Xmx2G -jar paper-26.3-207.jar nogui < /dev/null > .log 2>&1 &)
  for _ in $(seq 150); do grep -q "Done (" "$hier/$1/.log" && return 0; sleep 2; done
  echo "$1 startet nicht, siehe $hier/$1/.log" >&2; exit 1
}
paper_stopp() {  # $1 = hub|smp, $2 = Port
  python -I "$hier/rcon.py" "$1" stop || true
  for _ in $(seq 60); do frei "$2" && return 0; sleep 2; done
  echo "$1 hört nicht auf, bitte von Hand prüfen" >&2; exit 1
}
proxy_einmal() {  # Velocity einmal starten (erzeugt Floodgate-Schlüssel und Geyser-Konfig) und per Konsole beenden
  : > "$hier/proxy/.konsole"
  (cd "$hier/proxy" && tail -f .konsole | "$java" -Xmx768M -jar velocity-4.3.0-44.jar > .log 2>&1 &)
  for _ in $(seq 90); do grep -q "Done (" "$hier/proxy/.log" && break; sleep 2; done
  sleep 5
  echo end >> "$hier/proxy/.konsole"
  for _ in $(seq 30); do frei 25577 && break; sleep 2; done
  sleep 3
  # tail-Prozess der Konsole beenden
  ps -ef 2>/dev/null | awk '/tail -f .konsole/ && !/awk/ {print $2}' | xargs -r kill 2>/dev/null || true
  rm -f "$hier/proxy/.konsole"
}
log_auszug() { sed 's/\x1b\[[0-9;]*m//g' "$1" | grep -i -E "$2|error|exception" | grep -v oshi | head -30; }

case "${1:-}" in
  einrichten)
    alle_frei || { echo "Testnetz läuft noch (25567/25568/25577), erst stoppen" >&2; exit 1; }
    echo "--- Prüfsummen ---"
    printf '%s\n' "e9f2f0e3027079e747363968c80b400d494cf789  $dl/lod/lss.jar" \
      "07bd6024186d8d1d600837350c3359d9960a04d0  $dl/lod/grim.jar" \
      "7ff47ee3afec89a1725e6eef393f373c549eff3b  $dl/lod/chunky.jar" | sha1sum -c -
    printf '%s\n' "96b7fb0778d608e528780d5a67a74e3ae977a6e5672ad250aaff40b8e1784a50  $dl/bedrock/Geyser-Velocity.jar" \
      "649835022de37ff09255fc626d4bfe7bc2a3b926d07b0dfaf1f51e12bf37001d  $dl/bedrock/floodgate-velocity.jar" \
      "21570aff9ce17d6983928e8552777760e1ede5050026b04c686b0ae112e6fd7e  $dl/bedrock/floodgate-spigot.jar" \
      "5220fca22eae06a922077274c1221c0a20dad67e2d8db5dfb4dca524a5f663c8  $dl/bedrock/MCXboxBroadcastExtension.jar" | sha256sum -c -

    echo "--- Jars verteilen ---"
    cp "$dl/bedrock/Geyser-Velocity.jar" "$hier/proxy/plugins/Geyser-Velocity-2.12.1.jar"
    cp "$dl/bedrock/floodgate-velocity.jar" "$hier/proxy/plugins/floodgate-velocity-2.2.5.jar"
    for r in hub smp; do cp "$dl/bedrock/floodgate-spigot.jar" "$hier/$r/plugins/floodgate-spigot-2.2.5.jar"; done
    cp "$dl/lod/lss.jar" "$hier/smp/plugins/lod-server-support-paper-0.20.0+26.3.jar"
    cp "$dl/lod/grim.jar" "$hier/smp/plugins/grimac-bukkit-2.3.75.jar"
    cp "$dl/lod/chunky.jar" "$hier/smp/plugins/Chunky-Bukkit-1.5.3.jar"
    if [ "${MCXBOX:-0}" = 1 ]; then
      mkdir -p "$hier/proxy/plugins/Geyser-Velocity/extensions"
      cp "$dl/bedrock/MCXboxBroadcastExtension.jar" "$hier/proxy/plugins/Geyser-Velocity/extensions/"
    fi

    echo "--- Proxy: Floodgate-Schlüssel und Geyser-Konfig erzeugen ---"
    proxy_einmal
    log_auszug "$hier/proxy/.log" "geyser|floodgate|xbox|broadcast"
    [ -f "$hier/proxy/plugins/floodgate/key.pem" ] || { echo "Floodgate hat keinen key.pem erzeugt, siehe proxy/.log" >&2; exit 1; }
    setzen "$hier/proxy/plugins/floodgate/config.yml" "$repo/server/bedrock/floodgate-proxy-werte.txt"
    setzen --weich "$hier/proxy/plugins/Geyser-Velocity/config.yml" "$repo/server/bedrock/geyser-werte.txt"
    bash "$repo/server/plugin-konfig/einspielen.sh" "$hier/proxy" proxy vm200 || true
    # gleicher Schlüssel auf beiden Backends, vor deren erstem Start mit Floodgate (geheim, Ordner sind git-ignoriert)
    for r in hub smp; do
      mkdir -p "$hier/$r/plugins/floodgate"
      cp "$hier/proxy/plugins/floodgate/key.pem" "$hier/$r/plugins/floodgate/key.pem"
    done

    echo "--- Hub und SMP: Konfigs erzeugen ---"
    paper_start hub; paper_stopp hub 25567
    paper_start smp; paper_stopp smp 25568
    for r in hub smp; do setzen "$hier/$r/plugins/floodgate/config.yml" "$repo/server/bedrock/floodgate-backend-werte.txt"; done
    setzen "$hier/smp/plugins/LodServerSupport/lss-server-config.yaml" "$repo/server/lod/lss-werte.txt"
    log_auszug "$hier/hub/.log" "floodgate"
    log_auszug "$hier/smp/.log" "floodgate|lodserver|lss|grim|chunky"

    echo "--- SMP: Vorgenerierung 2.000 × 2.000 um 0/0 ---"
    paper_start smp
    python -I "$hier/rcon.py" smp "plugins" "lsslod stats" "chunky world world" "chunky center 0 0" "chunky radius 1000" "chunky start"
    # Chunky meldet das Ende im Log („Task finished …“); höchstens 60 min warten
    for _ in $(seq 180); do
      sed 's/\x1b\[[0-9;]*m//g' "$hier/smp/.log" | grep -q -i "task finished" && break
      sed 's/\x1b\[[0-9;]*m//g' "$hier/smp/.log" | grep -i "\[Chunky\]" | tail -1
      sleep 20
    done
    python -I "$hier/rcon.py" smp "lsslod stats" "save-all flush"
    paper_stopp smp 25568
    echo "Fertig. Jetzt testnetz/start.cmd. Java: localhost:25577 (Testprofil weihnachten-voxy-test). Bedrock: localhost, Port 19132."
    ;;
  entfernen)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    rm -f "$hier"/proxy/plugins/Geyser-Velocity-*.jar "$hier"/proxy/plugins/floodgate-velocity-*.jar \
          "$hier"/proxy/plugins/Geyser-Velocity/extensions/MCXboxBroadcastExtension.jar \
          "$hier"/hub/plugins/floodgate-spigot-*.jar "$hier"/smp/plugins/floodgate-spigot-*.jar \
          "$hier"/smp/plugins/lod-server-support-paper-*.jar "$hier"/smp/plugins/grimac-bukkit-*.jar "$hier"/smp/plugins/Chunky-Bukkit-*.jar
    echo "Jars entfernt. Datenordner (floodgate/ mit key.pem, Geyser-Velocity/, LodServerSupport/, GrimAC/, Chunky/) bleiben, alles git-ignoriert."
    ;;
  *)
    sed -n '2,15p' "$0"; exit 1 ;;
esac
