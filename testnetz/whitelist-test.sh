#!/usr/bin/env bash
# Proben für den Discord-Whitelist-Endpunkt im Testnetz (Hub läuft). Spezifikation: server/discord-whitelist.md → Test.
# Aufruf: bash testnetz/whitelist-test.sh [java-name] [bedrock-gamertag]   (Standard: Notch, kein Bedrock)
# Der Schlüssel kommt aus testnetz/hub/plugins/Serverwahl/whitelist-api.key (git-ignoriert) und wird nicht ausgegeben.
set -euo pipefail
hier="$(cd "$(dirname "$0")" && pwd)"
key="$(tr -d '\r\n' < "$hier/hub/plugins/Serverwahl/whitelist-api.key")"
url="http://127.0.0.1:8765"
java="${1:-Notch}"
bedrock="${2:-}"
anfrage() {  # Methode Pfad [Rumpf] → Status + Antwort
  local m="$1" p="$2" d="${3:-}"
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
anfrage PUT /whitelist/111111111111111111 "{\"name\":\"$java\",\"edition\":\"java\"}"
anfrage PUT /whitelist/222222222222222222 "{\"name\":\"$java\",\"edition\":\"java\"}"
if [ -n "$bedrock" ]; then
  anfrage GET "/pruefen?name=$bedrock&edition=bedrock"
  anfrage PUT /whitelist/333333333333333333 "{\"name\":\"$bedrock\",\"edition\":\"bedrock\"}"
fi
anfrage GET /whitelist
anfrage PUT /whitelist '{"discord":["333333333333333333"]}'
anfrage DELETE /whitelist/333333333333333333
anfrage GET /whitelist
