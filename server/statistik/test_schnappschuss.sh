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

SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" "$V" > "$T/out1"
pruefe "Schnappschuss angelegt" '[ -f "$A/schnappschuesse/2026-12-06.tar.gz" ]'
inhalt=$(tar -tzf "$A/schnappschuesse/2026-12-06.tar.gz")
pruefe "stats im neuen Pfad enthalten" 'grep -q "2026-12-06/players/stats/uuid1.json" <<<"$inhalt"'
pruefe "advancements enthalten" 'grep -q "2026-12-06/advancements/uuid1.json" <<<"$inhalt"'
pruefe "usercache enthalten" 'grep -q "2026-12-06/usercache.json" <<<"$inhalt"'
pruefe "Datapack-Advancements nicht enthalten" '! grep -q datapacks <<<"$inhalt"'
pruefe "Paper-Log verschoben" '[ -f "$A/logs/paper/2026-12-05-1.log.gz" ] && [ ! -e "$P/logs/2026-12-05-1.log.gz" ]'
pruefe "latest.log bleibt" '[ -f "$P/logs/latest.log" ]'
pruefe "Velocity-Log verschoben" '[ -f "$A/logs/velocity/2026-12-05-1.log.gz" ]'

# zweiter Lauf am selben Tag: nichts überschreiben
echo '{"stats":{"minecraft:custom":{"minecraft:play_time":999}}}' > "$P/welt/players/stats/uuid1.json"
SCHNAPPSCHUSS_DATUM=2026-12-06 bash "$HIER/schnappschuss.sh" "$P" "$A" "$V" > "$T/out2"
pruefe "zweiter Lauf überspringt" 'grep -q übersprungen "$T/out2"'
pruefe "alter Inhalt bleibt" 'tar -xzOf "$A/schnappschuesse/2026-12-06.tar.gz" 2026-12-06/players/stats/uuid1.json | grep -q ":100"'

# Log-Konflikt: gleicher Name, anderer Inhalt → Quelle bleibt liegen
echo anders > "$P/logs/2026-12-05-1.log.gz"
SCHNAPPSCHUSS_DATUM=2026-12-07 bash "$HIER/schnappschuss.sh" "$P" "$A" 2> "$T/err3" > "$T/out3"
pruefe "Konflikt gemeldet, nichts überschrieben" 'grep -q Konflikt "$T/err3" && grep -q alt "$A/logs/paper/2026-12-05-1.log.gz" && [ -f "$P/logs/2026-12-05-1.log.gz" ]'
pruefe "neuer Tag neuer Schnappschuss" '[ -f "$A/schnappschuesse/2026-12-07.tar.gz" ]'

exit $fehler
