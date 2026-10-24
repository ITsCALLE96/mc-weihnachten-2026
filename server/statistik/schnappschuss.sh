#!/usr/bin/env bash
# Täglicher Statistik-Schnappschuss für die spätere Statistikseite (Plan Task 9 Schritt 7).
#
# - kopiert stats/*.json, advancements/*.json und usercache.json der Paper-Instanz
#   als datiertes Archiv <archiv>/<season>/schnappschuesse/<JJJJ-MM-TT>.tar.gz
# - verschiebt abgeschlossene Logs (logs/*.log.gz) von Paper und Velocity nach <archiv>/<season>/logs/<name>/
#   (latest.log bleibt liegen, gelöscht wird nie etwas)
# - Season: eine Zeile in <archiv>/SEASON (z. B. testlauf, weihnachten-2026), wird von Hand umgestellt.
#   Fehlt die Datei oder ist die Kennung ungültig, bricht das Skript ab (nichts landet in der falschen Season).
# - Datum = Berliner Datum (Europe/Berlin) zum Zeitpunkt des Laufs (04:00), unabhängig von der Systemzeitzone.
#   Das Format JJJJ-MM-TT bleibt fest, die Statistikseite verlässt sich darauf.
# - Vorher sendet AMP um 03:58 "save-all flush" an die Paper-Instanz (siehe README.md), sonst fehlen Werte von
#   Spielern, die über Nacht online sind.
# - Von Hand vor einem Season-Wechsel: SCHNAPPSCHUSS_ERSETZEN=1 erstellt den Schnappschuss des Tages neu, auch wenn
#   der 04:00-Lauf ihn schon angelegt hat. Der alte bleibt als <datum>.tar.gz.vorher-<HHMMSS> liegen.
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

[ -f "$PAPER/server.properties" ] || { echo "Keine server.properties in $PAPER" >&2; exit 1; }

# Datum immer in Berliner Zeit. Ohne Zeitzonendaten würde date still auf UTC fallen, deshalb vorher prüfen.
if [ -n "${SCHNAPPSCHUSS_DATUM:-}" ]; then
  DATUM="$SCHNAPPSCHUSS_DATUM"
else
  [ -e /usr/share/zoneinfo/Europe/Berlin ] || { echo "Zeitzonendaten Europe/Berlin fehlen (Paket tzdata)" >&2; exit 1; }
  DATUM=$(TZ=Europe/Berlin date +%F)
fi

[[ "$DATUM" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "Ungültiges Datum \"$DATUM\"" >&2; exit 1; }

# Season aus <archiv>/SEASON
[ -f "$ARCHIV/SEASON" ] || { echo "Season fehlt: $ARCHIV/SEASON anlegen (z. B. echo testlauf > $ARCHIV/SEASON)" >&2; exit 1; }
SEASON=$(head -n1 "$ARCHIV/SEASON" | tr -d "[:space:]")   # [:space:] entfernt auch das CR von Windows-Zeilenenden
[[ "$SEASON" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "Ungültige Season-Kennung \"$SEASON\" (erlaubt: a-z, 0-9, -)" >&2; exit 1; }
ZIELORDNER="$ARCHIV/$SEASON"

# Weltordner aus level-name (Standard: world)
LEVEL=$(sed -n 's/^level-name=//p' "$PAPER/server.properties" | tr -d '\r')
WELT="$PAPER/${LEVEL:-world}"
[ -d "$WELT" ] || { echo "Weltordner $WELT fehlt" >&2; exit 1; }

mkdir -p "$ZIELORDNER/schnappschuesse" "$ZIELORDNER/logs"
ZIEL="$ZIELORDNER/schnappschuesse/$DATUM.tar.gz"

if [ -e "$ZIEL" ] && [ "${SCHNAPPSCHUSS_ERSETZEN:-}" = 1 ]; then
  ALT="$ZIEL.vorher-$(TZ=Europe/Berlin date +%H%M%S)"
  mv "$ZIEL" "$ALT"
  echo "$DATUM [$SEASON]: vorhandener Schnappschuss bleibt als $ALT, wird neu erstellt"
fi

if [ -e "$ZIEL" ]; then
  echo "$DATUM [$SEASON]: Schnappschuss existiert schon, übersprungen"
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
  echo "$DATUM [$SEASON]: Schnappschuss $ZIEL ($ANZAHL Dateien)"
fi

# Abgeschlossene Logs ins Archiv verschieben, vorhandene Ziele nie überschreiben
logs_sichern() {
  local quelle="$1" name="$2" n=0
  [ -d "$quelle/logs" ] || return 0
  mkdir -p "$ZIELORDNER/logs/$name"
  for f in "$quelle"/logs/*.log.gz; do
    [ -e "$f" ] || continue
    local ziel="$ZIELORDNER/logs/$name/$(basename "$f")"
    if [ -e "$ziel" ]; then
      cmp -s "$f" "$ziel" || { echo "Konflikt: $ziel existiert mit anderem Inhalt, $f bleibt liegen" >&2; continue; }
      rm -f "$f"   # identische Kopie liegt schon im Archiv
    else
      mv "$f" "$ziel"
    fi
    n=$((n + 1))
  done
  echo "$DATUM [$SEASON]: $n Log-Dateien von $name archiviert"
}

logs_sichern "$PAPER" paper
[ -n "$VELOCITY" ] && logs_sichern "$VELOCITY" velocity
exit 0
