#!/usr/bin/env bash
# Proben für den Discord-Whitelist-Endpunkt im Testnetz (Hub läuft). Spezifikation: server/discord-whitelist.md → Test.
# Aufruf: bash testnetz/whitelist-test.sh [java-name] [bedrock-gamertag]   (Standard: Notch, kein Bedrock)
# Umgebung: WL_URL (Standard http://127.0.0.1:8765), WL_KEY_DATEI (Standard Hub-Schlüssel), WL_GILDE1/WL_GILDE2 = zwei Guild-IDs aus api.gilden
# (Standard 111111111111111111 / 222222222222222222). Der Schlüssel wird nicht ausgegeben.
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
key="$(tr -d '\r\n' < "${WL_KEY_DATEI:-$hier/hub/plugins/Serverwahl/whitelist-api.key}")"
url="${WL_URL:-http://127.0.0.1:8765}"
g1="${WL_GILDE1:-111111111111111111}"
g2="${WL_GILDE2:-222222222222222222}"
java="${1:-Notch}"
bedrock="${2:-}"
anfrage() {  # Methode Pfad [Rumpf] → Status + Antwort
  local m="$1" p="$2" d="${3:-}"
  sleep 0.2  # Endpunkt erlaubt höchstens 10 Anfragen/s
  echo "--- $m $p ${d}"
  if [ -n "$d" ]; then
    curl -s -w '  [%{http_code}]\n' -X "$m" -H "Authorization: Bearer $key" -H 'Content-Type: application/json' -d "$d" "$url$p"
  else
    curl -s -w '  [%{http_code}]\n' -X "$m" -H "Authorization: Bearer $key" "$url$p"
  fi
}
echo "--- falscher Schlüssel (erwartet 401)"; curl -s -w '  [%{http_code}]\n' -H "Authorization: Bearer falsch" "$url/whitelist"
anfrage GET "/pruefen?name=$java&edition=java"
anfrage GET "/pruefen?name=gibtsnichtxyzq12&edition=java"
anfrage GET "/pruefen?name=a-b&edition=java"
echo "=== Guilds: unbekannte Guild 403, fehlende 400"
anfrage PUT /whitelist/444444444444444444 "{\"name\":\"$java\",\"edition\":\"java\",\"guild\":\"999999999999999999\"}"
anfrage PUT /whitelist/444444444444444444 "{\"name\":\"$java\",\"edition\":\"java\"}"
echo "=== Spieler A über Guild 1 und Guild 2 (ein Eintrag, zwei Freigaben)"
anfrage PUT /whitelist/444444444444444444 "{\"name\":\"$java\",\"edition\":\"java\",\"guild\":\"$g1\"}"
anfrage PUT /whitelist/444444444444444444 "{\"name\":\"$java\",\"edition\":\"java\",\"guild\":\"$g2\"}"
anfrage GET "/pruefen?name=$java&edition=java&discord=444444444444444444"
echo "=== anderes Discord-Konto, gleicher MC-Name (erwartet 409)"
anfrage PUT /whitelist/555555555555555555 "{\"name\":\"$java\",\"edition\":\"java\",\"guild\":\"$g1\"}"
if [ -n "$bedrock" ]; then
  anfrage GET "/pruefen?name=$bedrock&edition=bedrock"
  anfrage PUT /whitelist/333333333333333333 "{\"name\":\"$bedrock\",\"edition\":\"bedrock\",\"guild\":\"$g2\"}"
fi
echo "=== Spieler B nur über Guild 1"
anfrage PUT /whitelist/666666666666666666 "{\"name\":\"jeb_\",\"edition\":\"java\",\"guild\":\"$g1\"}"
anfrage GET "/whitelist?guild=$g2"
echo "=== Abgleich Guild 1 ohne A und B: A bleibt (Guild 2), B fliegt"
anfrage PUT /whitelist "{\"guild\":\"$g1\",\"discord\":[]}"
anfrage GET /whitelist
echo "=== A wechselt das MC-Konto (letzter Stand gilt, Freigaben bleiben)"
anfrage PUT /whitelist/444444444444444444 "{\"name\":\"jeb_\",\"edition\":\"java\",\"guild\":\"$g2\"}"
echo "=== DELETE ohne guild 400, mit Guild 1 (schon weg) nichts, mit Guild 2 → A fliegt"
anfrage DELETE /whitelist/444444444444444444
anfrage DELETE "/whitelist/444444444444444444?guild=$g1"
anfrage DELETE "/whitelist/444444444444444444?guild=$g2"
[ -n "$bedrock" ] && anfrage DELETE "/whitelist/333333333333333333?guild=$g2"
anfrage GET /whitelist
