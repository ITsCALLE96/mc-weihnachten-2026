#!/usr/bin/env bash
# Test für schnappschuss.sh mit einer nachgebauten Instanz. Aufruf: bash server/statistik/test_schnappschuss.sh
set -euo pipefail
HIER=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
fehler=0
pruefe() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fehler=1; fi; }

P="$T/paper"; V="$T/velocity"; A="$T/archiv"
mkdir -p "$P/welt/players/stats" "$P/welt/advancements" "$P/welt/datapacks/lf/data/lf/advancements" "$P/logs" "$V/logs"
printf 'level-name=welt\r\n' > "$P/server.properties"
echo '{"stats":{"minecraft:custom":{"minecraft:play_time":100}}}' > "$P/welt/players/stats/uuid1.json"
echo '{}' > "$P/welt/advancements/uuid1.json"
echo '{}' > "$P/welt/datapacks/lf/data/lf/advancements/x.json"
echo '[]' > "$P/usercache.json"
echo alt > "$P/logs/2026-12-05-1.log.gz"; echo neu > "$P/logs/latest.log"
echo v > "$V/logs/2026-12-05-1.log.gz"

# ohne SEASON-Datei: Abbruch, nichts angelegt
if SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" 2> "$T/err0" > /dev/null; then rc=0; else rc=$?; fi
pruefe "ohne Season Abbruch" "[ $rc -ne 0 ] && grep -q \"Season fehlt\" \"$T/err0\" && [ ! -e \"$A/schnappschuesse\" ]"
mkdir -p "$A"; echo "Test Lauf" > "$A/SEASON"
if SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" 2> "$T/err0" > /dev/null; then rc=0; else rc=$?; fi
pruefe "ungültige Season Abbruch" "[ $rc -ne 0 ] && grep -q Ungültige \"$T/err0\""
if SCHNAPPSCHUSS_DATUM=6.12.2026 bash "$HIER/schnappschuss.sh" "$P" "$A" 2> /dev/null > /dev/null; then rc=0; else rc=$?; fi
pruefe "ungültiges Datum Abbruch" "[ $rc -ne 0 ]"
printf 'testlauf\r\n' > "$A/SEASON"   # Windows-Zeilenende muss toleriert werden

SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" "$V" > "$T/out1"
pruefe "Schnappschuss angelegt" '[ -f "$A/testlauf/schnappschuesse/2026-12-06.tar.gz" ]'
inhalt=$(tar -tzf "$A/testlauf/schnappschuesse/2026-12-06.tar.gz")
pruefe "stats im neuen Pfad enthalten" 'grep -q "2026-12-06/players/stats/uuid1.json" <<<"$inhalt"'
pruefe "advancements enthalten" 'grep -q "2026-12-06/advancements/uuid1.json" <<<"$inhalt"'
pruefe "usercache enthalten" 'grep -q "2026-12-06/usercache.json" <<<"$inhalt"'
pruefe "Datapack-Advancements nicht enthalten" '! grep -q datapacks <<<"$inhalt"'
pruefe "Paper-Log verschoben" '[ -f "$A/testlauf/logs/paper/2026-12-05-1.log.gz" ] && [ ! -e "$P/logs/2026-12-05-1.log.gz" ]'
pruefe "latest.log bleibt" '[ -f "$P/logs/latest.log" ]'
pruefe "Velocity-Log verschoben" '[ -f "$A/testlauf/logs/velocity/2026-12-05-1.log.gz" ]'

# zweiter Lauf am selben Tag: nichts überschreiben
echo '{"stats":{"minecraft:custom":{"minecraft:play_time":999}}}' > "$P/welt/players/stats/uuid1.json"
SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" "$V" > "$T/out2"
pruefe "zweiter Lauf überspringt" 'grep -q übersprungen "$T/out2"'
pruefe "alter Inhalt bleibt" 'tar -xzOf "$A/testlauf/schnappschuesse/2026-12-06.tar.gz" 2026-12-06/players/stats/uuid1.json | grep -q ":100"'

# Log-Konflikt: gleicher Name, anderer Inhalt → Quelle bleibt liegen
echo anders > "$P/logs/2026-12-05-1.log.gz"
SCHNAPPSCHUSS_DATUM=2026-12-07 bash "$HIER/schnappschuss.sh" "$P" "$A" 2> "$T/err3" > "$T/out3"
pruefe "Konflikt gemeldet, nichts überschrieben" 'grep -q Konflikt "$T/err3" && grep -q alt "$A/testlauf/logs/paper/2026-12-05-1.log.gz" && [ -f "$P/logs/2026-12-05-1.log.gz" ]'
pruefe "neuer Tag neuer Schnappschuss" '[ -f "$A/testlauf/schnappschuesse/2026-12-07.tar.gz" ]'

# Season umgestellt: neuer Unterordner, alte Season bleibt unberührt
echo weihnachten-2026 > "$A/SEASON"
echo w > "$P/logs/2026-12-07-1.log.gz"
SCHNAPPSCHUSS_DATUM=2026-12-07 bash "$HIER/schnappschuss.sh" "$P" "$A" 2>/dev/null > "$T/out4"
pruefe "neue Season eigener Ordner" "[ -f \"$A/weihnachten-2026/schnappschuesse/2026-12-07.tar.gz\" ] && [ -f \"$A/weihnachten-2026/logs/paper/2026-12-07-1.log.gz\" ]"
pruefe "alte Season unverändert" '[ "$(ls "$A/testlauf/schnappschuesse" | wc -l)" -eq 2 ]'

# Von Hand vor dem Season-Wechsel: ersetzen, alten Stand behalten
echo '{"stats":{"minecraft:custom":{"minecraft:play_time":555}}}' > "$P/welt/players/stats/uuid1.json"
SCHNAPPSCHUSS_ERSETZEN=1 SCHNAPPSCHUSS_DATUM=2026-12-07 bash "$HIER/schnappschuss.sh" "$P" "$A" 2>/dev/null > "$T/out5"
pruefe "Ersetzen: neuer Stand drin" 'tar -xzOf "$A/weihnachten-2026/schnappschuesse/2026-12-07.tar.gz" 2026-12-07/players/stats/uuid1.json | grep -q ":555"'
pruefe "Ersetzen: alter Stand behalten" 'ls "$A/weihnachten-2026/schnappschuesse/" | grep -q "^2026-12-07.tar.gz.vorher-" && tar -xzOf "$A"/weihnachten-2026/schnappschuesse/2026-12-07.tar.gz.vorher-* 2026-12-07/players/stats/uuid1.json | grep -q ":999"'

exit $fehler
