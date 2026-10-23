#!/usr/bin/env bash
# Täglicher Statistik-Schnappschuss für die spätere Statistikseite (Plan Task 9 Schritt 7).
#
# - kopiert stats/*.json, advancements/*.json und usercache.json der Paper-Instanz
#   als datiertes Archiv <archiv>/schnappschuesse/<JJJJ-MM-TT>.tar.gz
# - verschiebt abgeschlossene Logs (logs/*.log.gz) von Paper und Velocity nach <archiv>/logs/<name>/
#   (latest.log bleibt liegen, gelöscht wird nie etwas)
#
# Aufruf: schnappschuss.sh <paper-instanzordner> <archivordner> [velocity-instanzordner]
#   Instanzordner = Ordner mit server.properties (Paper) bzw. velocity.toml (Velocity)
# Cron (root auf VM200, 04:00):
#   0 4 * * * /opt/mc-weihnachten/schnappschuss.sh <paper> <archiv> <velocity> >> <archiv>/schnappschuss.log 2>&1
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Aufruf: $0 <paper-instanzordner> <archivordner> [velocity-instanzordner]" >&2
  exit 2
fi

PAPER="$1"
ARCHIV="$2"
VELOCITY="${3:-}"
DATUM="${SCHNAPPSCHUSS_DATUM:-$(date +%F)}"

[ -f "$PAPER/server.properties" ] || { echo "Keine server.properties in $PAPER" >&2; exit 1; }

# Weltordner aus level-name (Standard: world)
LEVEL=$(sed -n 's/^level-name=//p' "$PAPER/server.properties" | tr -d '\r')
WELT="$PAPER/${LEVEL:-world}"
[ -d "$WELT" ] || { echo "Weltordner $WELT fehlt" >&2; exit 1; }

mkdir -p "$ARCHIV/schnappschuesse" "$ARCHIV/logs"
ZIEL="$ARCHIV/schnappschuesse/$DATUM.tar.gz"

if [ -e "$ZIEL" ]; then
  echo "$DATUM: Schnappschuss existiert schon, übersprungen"
else
  ARBEIT=$(mktemp -d)
  trap 'rm -rf "$ARBEIT"' EXIT
  mkdir -p "$ARBEIT/$DATUM"

  # Ablage der Spielerdaten hat sich zwischen Versionen geändert (z. B. world/stats oder world/players/stats),
  # deshalb suchen statt fest verdrahten. Datapack-Ordner ausnehmen (enthalten eigene advancement-Ordner).
  ANZAHL=0
  while IFS= read -r ordner; do
    rel="${ordner#"$WELT"/}"
    mkdir -p "$ARBEIT/$DATUM/$rel"
    for f in "$ordner"/*.json; do
      [ -e "$f" ] || continue
      cp -p "$f" "$ARBEIT/$DATUM/$rel/"
      ANZAHL=$((ANZAHL + 1))
    done
  done < <(find "$WELT" -maxdepth 3 -type d \( -name stats -o -name advancements \) -not -path "*/datapacks/*" | sort)

  [ -f "$PAPER/usercache.json" ] && cp -p "$PAPER/usercache.json" "$ARBEIT/$DATUM/"

  if [ "$ANZAHL" -eq 0 ]; then
    echo "$DATUM: Warnung – keine stats/advancements-Dateien in $WELT gefunden" >&2
  fi

  tar -czf "$ZIEL.tmp" -C "$ARBEIT" "$DATUM"
  mv "$ZIEL.tmp" "$ZIEL"
  echo "$DATUM: Schnappschuss $ZIEL ($ANZAHL Dateien)"
fi

# Abgeschlossene Logs ins Archiv verschieben, vorhandene Ziele nie überschreiben
logs_sichern() {
  local quelle="$1" name="$2" n=0
  [ -d "$quelle/logs" ] || return 0
  mkdir -p "$ARCHIV/logs/$name"
  for f in "$quelle"/logs/*.log.gz; do
    [ -e "$f" ] || continue
    local ziel="$ARCHIV/logs/$name/$(basename "$f")"
    if [ -e "$ziel" ]; then
      cmp -s "$f" "$ziel" || { echo "Konflikt: $ziel existiert mit anderem Inhalt, $f bleibt liegen" >&2; continue; }
      rm -f "$f"   # identische Kopie liegt schon im Archiv
    else
      mv "$f" "$ziel"
    fi
    n=$((n + 1))
  done
  echo "$DATUM: $n Log-Dateien von $name archiviert"
}

logs_sichern "$PAPER" paper
[ -n "$VELOCITY" ] && logs_sichern "$VELOCITY" velocity
exit 0
