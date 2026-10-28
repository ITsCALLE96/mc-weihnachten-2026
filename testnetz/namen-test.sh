#!/usr/bin/env bash
# Nicknames, Clan-Tags und CoreProtect ins Testnetz (Plan: server/namen-clans-grief.md). Startet und stoppt nichts.
#
#   bash testnetz/namen-test.sh einrichten   – Testnetz gestoppt: LuckPerms auf Hub + SMP, CoreProtect auf dem SMP, gemeinsamer
#                                             LuckPerms-Ordner testnetz/luckperms-daten (Verzeichnis-Verknüpfung), serverwahl + Konfigs
#   bash testnetz/namen-test.sh gruppen      – SMP läuft: Gruppen (server/luckperms/gruppen.txt) + Test-Clan per RCON anlegen
#   bash testnetz/namen-test.sh entfernen    – Testnetz gestoppt: LuckPerms/CoreProtect-Jars wieder heraus (Daten bleiben liegen)
#
# Vorher: CoreProtect bauen (Pascal): bash server/coreprotect/bauen.sh
# Danach Test: server/namen-clans-grief.md → Test
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$hier/.." && pwd)"
dl="$hier/_downloads/namen"
frei() { ! (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
alle_frei() { frei 25567 && frei 25568 && frei 25577; }
LP_SHA1=fc8bb9919fa77c670b7ed5c284bcb66770ea71fc   # LuckPerms-Bukkit-5.5.71.jar (Modrinth)
CP_SHA256="${CP_SHA256:-488fddf4ec5ec011b5d6433d4a43d41f7bbc878263f54c4a0b1362575a5a4533}"   # CoreProtect CE aus dffa04fc, gebaut von Pascal 28.10.

befehle() {  # Datei → Befehle ohne Kommentare/Leerzeilen, an rcon.py
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
    echo "$LP_SHA1  $dl/luckperms.jar" | sha1sum -c -
    [ -f "$dl/coreprotect.jar" ] || { echo "Fehlt: $dl/coreprotect.jar – erst bash server/coreprotect/bauen.sh" >&2; exit 1; }
    if [ -n "$CP_SHA256" ]; then echo "$CP_SHA256  $dl/coreprotect.jar" | sha256sum -c -; fi
    mkdir -p "$hier/luckperms-daten"
    for r in hub smp; do
      cp "$dl/luckperms.jar" "$hier/$r/plugins/LuckPerms-Bukkit-5.5.71.jar"
      cp "$repo/server/serverwahl/build/serverwahl-1.0.0.jar" "$hier/$r/plugins/"
      bash "$repo/server/plugin-konfig/einspielen.sh" "$hier/$r" "$r" lokal > /dev/null
      sed -i "s#/opt/mc-weihnachten/status/smp-offen#$(cygpath -m "$hier")/status/smp-offen#" "$hier/$r/plugins/Serverwahl/config.yml"
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
    cp "$dl/coreprotect.jar" "$hier/smp/plugins/CoreProtect-CE-26.3.jar"
    echo "smp: CoreProtect"
    # Testnetz-Werte, die nicht ins Repo gehören
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
    rm -f "$hier/smp/plugins/CoreProtect-CE-26.3.jar"
    echo "Jars entfernt (luckperms-daten und CoreProtect-Datenbank bleiben)"
    ;;
  *) sed -n 2,10p "$0"; exit 1 ;;
esac
