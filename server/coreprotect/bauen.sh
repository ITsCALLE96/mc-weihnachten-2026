#!/usr/bin/env bash
# Baut CoreProtect CE aus dem öffentlichen Quellcode (PlayPro/CoreProtect, Artistic License 2.0) bei festem Commit.
# Grund: das letzte Release 24.1 läuft nur bis 26.2, v25.0 mit 26.3 gibt es bisher nur für Patreon-Unterstützer; master kann 26.3 (Leitung 28.10.).
# Sobald v25 öffentlich ist: auf das offizielle Release wechseln (offener Punkt im Plan).
# In der Claude-Session blockiert (fremder Code), Pascal führt es aus:  bash server/coreprotect/bauen.sh
# Ergebnis: testnetz/_downloads/namen/coreprotect.jar, SHA-256 wird ausgegeben (bitte an die Server-Session melden)
set -euo pipefail
# Ohne gesetzten Branch startet CoreProtect nicht („branch has not been set“, Test 28.10.). „development“ nur fürs Testnetz (Leitung 28.10.);
# für die echte Welt entscheidet Pascal (Optionen in server/namen-clans-grief.md)
COMMIT=dffa04fc4cb6fe847b5df10db03cec230a505242   # 19.10.2026 „Recover DuckDB entity UUID conflicts …“, ConfigHandler.LATEST_VERSION = 26.3
repo="$(cd "$(dirname "$0")/../.." && pwd)"
dl="$repo/testnetz/_downloads"
quelle="$dl/coreprotect-src"
mvn="$dl/maven/apache-maven-3.9.9/bin/mvn"
[ -x "$mvn" ] || { echo "Maven fehlt in $dl/maven (Server-Session lädt es)" >&2; exit 1; }
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-25.0.4.101-hotspot"
[ -d "$quelle/.git" ] || git clone -q https://github.com/PlayPro/CoreProtect.git "$quelle"
git -C "$quelle" fetch -q --depth 50 origin master || true
git -C "$quelle" checkout -q "$COMMIT"
(cd "$quelle" && "$mvn" -q -B -DskipTests -Dproject.branch="${BRANCH:-development}" package)
jar="$(ls "$quelle"/target/CoreProtect-*.jar | grep -v -E 'original|sources' | head -1)"
mkdir -p "$dl/namen"
cp "$jar" "$dl/namen/coreprotect.jar"
echo "Gebaut aus $(git -C "$quelle" log -1 --format='%h %ci')"
sha256sum "$dl/namen/coreprotect.jar"
