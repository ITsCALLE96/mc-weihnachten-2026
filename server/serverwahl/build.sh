#!/usr/bin/env bash
# Baut serverwahl.jar ohne Gradle: javac gegen die Bibliotheken eines Paper-Ordners, der schon einmal gestartet ist
# (dort liegen paper-api und adventure unter libraries/). Aufruf: [LUCKPERMS_JAR=<pfad>] [PRISM_JAR=<pfad>] build.sh <paper-ordner> [javac]
set -euo pipefail
paper="${1:?Aufruf: build.sh <paper-ordner> [javac]}"
javac="${2:-javac}"
hier="$(cd "$(dirname "$0")" && pwd)"
cp_datei="$(mktemp)"
find "$paper/libraries" -name '*.jar' | tr '\n' "${CP_TRENNER:-:}" > "$cp_datei"
# LuckPerms-API (für /nick, Clan-Tags): Pfad zum LuckPerms-Bukkit-Jar, nur zum Übersetzen, kommt nicht ins Jar
if [ -n "${LUCKPERMS_JAR:-}" ]; then printf '%s' "$LUCKPERMS_JAR" >> "$cp_datei"; fi
# Prism-API (Prüfwerkzeug): Pfad zum prism-paper-Jar, ebenfalls nur zum Übersetzen
if [ -n "${PRISM_JAR:-}" ]; then printf '%s%s' "${CP_TRENNER:-:}" "$PRISM_JAR" >> "$cp_datei"; fi
rm -rf "$hier/build" && mkdir -p "$hier/build/klassen"
"$javac" --release 25 -encoding UTF-8 -cp "$(cat "$cp_datei")" -d "$hier/build/klassen" $(find "$hier/src" -name '*.java')
cp "$hier"/res/* "$hier/build/klassen/"
(cd "$hier/build/klassen" && "$(dirname "$javac")/jar" --create --file ../serverwahl-1.0.0.jar . 2>/dev/null || jar --create --file ../serverwahl-1.0.0.jar .)
rm -f "$cp_datei"
echo "$hier/build/serverwahl-1.0.0.jar"
