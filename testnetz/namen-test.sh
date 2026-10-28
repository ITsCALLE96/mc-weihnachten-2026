#!/usr/bin/env bash
# Nicknames, Clan-Tags und Grief-Tool Prism ins Testnetz (Plan: server/namen-clans-grief.md). Startet und stoppt nichts (Start macht die Leitung).
#
#   bash testnetz/namen-test.sh einrichten   – Testnetz gestoppt: LuckPerms auf Hub + SMP, Prism 4.5 + NBT-API auf dem SMP, gemeinsamer
#                                             LuckPerms-Ordner testnetz/luckperms-daten (Verzeichnis-Verknüpfung), serverwahl + Konfigs,
#                                             prism.conf (Chat/Befehle, Purge 05:00/90 Tage, Deutsch), sobald Prism sie einmal angelegt hat
#   bash testnetz/namen-test.sh gruppen      – SMP läuft: Gruppen (server/luckperms/gruppen.txt) + Test-Clan per RCON anlegen
#   bash testnetz/namen-test.sh entfernen    – Testnetz gestoppt: LuckPerms/Prism/NBT-API-Jars wieder heraus (Daten bleiben liegen)
#
# Prism legt plugins/prism/prism.conf erst beim ersten Start an: neues Testnetz → einrichten, einmal starten/stoppen, einrichten nochmal.
# Danach Test: server/namen-clans-grief.md → Test
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads"
frei() { ! (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
alle_frei() { frei 25567 && frei 25568 && frei 25577; }

befehle() {  # Datei → Befehle ohne Kommentare/Leerzeilen, an rcon.py (wartet selbst, wenn LuckPerms noch beschäftigt ist)
  local zeilen=()
  while IFS= read -r z; do
    z="${z%$'\r'}"
    [ -z "$z" ] || [ "${z#\#}" != "$z" ] || zeilen+=("$z")
  done < "$1"
  python -I "$hier/rcon.py" smp "${zeilen[@]}"
}

case "${1:-}" in
  einrichten)
    alle_frei || { echo "Testnetz läuft noch (25567/25568/25577), erst stoppen" >&2; exit 1; }
    printf '%s\n' "fc8bb9919fa77c670b7ed5c284bcb66770ea71fc  $dl/namen/luckperms.jar" \
      "133fc802d7a40f16e6a45020e1f298088d46f8b9  $dl/prism/prism.jar" \
      "716a6bdc7d4e47d1180c0c744f0b4d175a7ad44c  $dl/prism/nbtapi.jar" | sha1sum -c -
    mkdir -p "$hier/luckperms-daten"
    for r in hub smp; do
      cp "$dl/namen/luckperms.jar" "$hier/$r/plugins/LuckPerms-Bukkit-5.5.71.jar"
      cp "$repo/server/serverwahl/build/serverwahl-1.0.0.jar" "$hier/$r/plugins/"
      bash "$repo/server/plugin-konfig/einspielen.sh" "$hier/$r" "$r" lokal > /dev/null
      sed -i "s#/opt/mc-weihnachten/status/smp-offen#$(cygpath -m "$hier")/status/smp-offen#" "$hier/$r/plugins/Serverwahl/config.yml"
      # Discord-Whitelist im Testnetz: Datei unter testnetz/status, Endpunkt nur 127.0.0.1
      sed -i -e "s#/opt/mc-weihnachten/whitelist/discord.json#$(cygpath -m "$hier")/status/whitelist-discord.json#"         -e "s#adresse: 192.168.178.78#adresse: 127.0.0.1#" -e "s#erlaubt: \[\]#erlaubt: [127.0.0.1]#" "$hier/$r/plugins/Serverwahl/config.yml"
      # gemeinsamer Speicher: yaml-storage beider Server → testnetz/luckperms-daten (Verknüpfung, keine Admin-Rechte nötig)
      ordner="$hier/$r/plugins/LuckPerms/yaml-storage"
      if [ -d "$ordner" ] && [ ! -L "$ordner" ]; then   # Git-Bash zeigt Verknüpfungen als -L
        [ -z "$(ls -A "$ordner")" ] || { echo "$ordner hat schon eigene Daten, bitte von Hand prüfen" >&2; exit 1; }
        rmdir "$ordner"
      fi
      if [ ! -e "$ordner" ]; then
        mkdir -p "$(dirname "$ordner")"
        # ohne MSYS2_ARG_CONV_EXCL macht Git-Bash aus /J einen Pfad
        MSYS2_ARG_CONV_EXCL='*' cmd /c mklink /J "$(cygpath -w "$ordner")" "$(cygpath -w "$hier/luckperms-daten")" > /dev/null
      fi
      echo "$r: LuckPerms, serverwahl, Konfigs, yaml-storage → luckperms-daten"
    done
    cp "$dl/prism/prism.jar" "$hier/smp/plugins/prism-paper-v4.5.jar"
    cp "$dl/prism/nbtapi.jar" "$hier/smp/plugins/item-nbt-api-plugin-2.16.1.jar"
    if [ -f "$hier/smp/plugins/prism/prism.conf" ]; then
      python -I "$repo/server/prism/konfig-setzen.py" "$hier/smp/plugins/prism/prism.conf"
    else
      echo "smp: prism.conf fehlt noch – einmal starten/stoppen, dann einrichten wiederholen"
    fi
    echo "smp: Prism 4.5 + NBT-API 2.16.1"
    # Testnetz-Werte, die nicht ins Repo gehören (Kalender-Tests, Leitung 28.10.)
    sed -i 's/^  fester-tag: 0$/  fester-tag: 24/' "$hier/smp/plugins/Serverwahl/config.yml"
    echo "Fertig. Start macht die Leitung, danach: bash testnetz/namen-test.sh gruppen"
    ;;
  gruppen)
    frei 25568 && { echo "SMP läuft nicht" >&2; exit 1; }
    befehle "$repo/server/luckperms/gruppen.txt"
    befehle "$repo/server/luckperms/clan-test.txt"
    python -I "$hier/rcon.py" smp "lp user ITsCALLE96 info"
    ;;
  entfernen)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    for r in hub smp; do rm -f "$hier/$r/plugins/LuckPerms-Bukkit-5.5.71.jar"; done
    rm -f "$hier/smp/plugins/prism-paper-v4.5.jar" "$hier/smp/plugins/item-nbt-api-plugin-2.16.1.jar"
    echo "Jars entfernt (luckperms-daten und Prism-Datenbank bleiben)"
    ;;
  *) sed -n 2,11p "$0"; exit 1 ;;
esac
