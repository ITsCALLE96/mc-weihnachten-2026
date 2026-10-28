#!/usr/bin/env bash
# Gegenprobe Prism 4.5 statt CoreProtect auf dem Testnetz-SMP (Leitung 28.10., Entscheidung für die Forever-World: server/namen-clans-grief.md).
# Eigener Testlauf, nie zusammen mit CoreProtect. Startet und stoppt nichts (Start macht die Leitung).
#
#   bash testnetz/prism-test.sh einrichten   – Testnetz gestoppt: CoreProtect-Jar beiseite, Prism 4.5 + NBT-API 2.16.1 auf den SMP
#   (Leitung startet einmal und stoppt wieder → Prism legt plugins/prism/*.conf an; Server-Session setzt Chat/Befehle + Purge-Plan)
#   bash testnetz/prism-test.sh rechte       – SMP läuft: Prism-Rechte für moderator/admin per RCON (gemeinsamer LuckPerms-Speicher)
#   bash testnetz/prism-test.sh zurueck      – Testnetz gestoppt: Prism + NBT-API raus, CoreProtect wieder rein (Prism-Daten bleiben liegen)
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
dl="$hier/_downloads"
plugins="$hier/smp/plugins"
frei() { ! (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
alle_frei() { frei 25567 && frei 25568 && frei 25577; }

case "${1:-}" in
  einrichten)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    printf '%s\n' "133fc802d7a40f16e6a45020e1f298088d46f8b9  $dl/prism/prism.jar" \
      "716a6bdc7d4e47d1180c0c744f0b4d175a7ad44c  $dl/prism/nbtapi.jar" | sha1sum -c -
    mkdir -p "$dl/namen/beiseite"
    if [ -f "$plugins/CoreProtect-CE-26.3.jar" ]; then mv "$plugins/CoreProtect-CE-26.3.jar" "$dl/namen/beiseite/"; fi
    cp "$dl/prism/prism.jar" "$plugins/prism-paper-v4.5.jar"
    cp "$dl/prism/nbtapi.jar" "$plugins/item-nbt-api-plugin-2.16.1.jar"
    echo "SMP: CoreProtect beiseite, Prism 4.5 + NBT-API 2.16.1 drin. Jetzt einmal starten/stoppen (Leitung), dann Konfig (Server-Session)."
    ;;
  rechte)
    frei 25568 && { echo "SMP läuft nicht" >&2; exit 1; }
    # prism.lookup = lookup, near, teleport, Inspektor-Stab; prism.modify = rollback/restore + Stäbe; prism.purge
    python -I "$hier/rcon.py" smp "lp group moderator permission set prism.lookup true" \
      "lp group admin permission set prism.modify true" "lp group admin permission set prism.purge true" \
      "lp user ITsCALLE96 permission check prism.modify"
    ;;
  zurueck)
    alle_frei || { echo "Testnetz läuft noch, erst stoppen" >&2; exit 1; }
    rm -f "$plugins/prism-paper-v4.5.jar" "$plugins/item-nbt-api-plugin-2.16.1.jar"
    if [ -f "$dl/namen/beiseite/CoreProtect-CE-26.3.jar" ]; then mv "$dl/namen/beiseite/CoreProtect-CE-26.3.jar" "$plugins/"; fi
    echo "SMP: Prism raus, CoreProtect wieder drin"
    ;;
  *) sed -n 2,9p "$0"; exit 1 ;;
esac
