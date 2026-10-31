#!/usr/bin/env bash
# Tests ohne laufenden Server: gegen build/klassen (vorher build.sh) und die Bibliotheken eines gestarteten Paper-Ordners.
# Aufruf: test/test.sh <paper-ordner> [javac]   (Windows/Git-Bash: CP_TRENNER=";")
set -euo pipefail
paper="${1:?Aufruf: test.sh <paper-ordner> [javac]}"
javac="${2:-javac}"
hier="$(cd "$(dirname "$0")/.." && { pwd -W 2>/dev/null || pwd; })"   # Git-Bash: Windows-Pfad für javac
t="${CP_TRENNER:-:}"
cp="$hier/build/klassen$t$(find "$paper/libraries" -name '*.jar' | tr '\n' "$t")"
rm -rf "$hier/build/test" && mkdir -p "$hier/build/test"
"$javac" --release 25 -encoding UTF-8 -cp "$cp" -d "$hier/build/test" "$hier"/test/*.java
"${javac%c}" -cp "$hier/build/test$t$cp" de.grahl.serverwahl.WhitelistFreigabeTest   # javac → java
"${javac%c}" -cp "$hier/build/test$t$cp" de.grahl.serverwahl.MissionNamenTest "$hier/../../spawn/mission.json"
"${javac%c}" -cp "$hier/build/test$t$cp" de.grahl.serverwahl.MissionSkalierungTest
"${javac%c}" -cp "$hier/build/test$t$cp" de.grahl.serverwahl.LetzterServerTest
"${javac%c}" -cp "$hier/build/test$t$cp" de.grahl.serverwahl.BestenlisteTest ${BESTENLISTE_JSON:-}
