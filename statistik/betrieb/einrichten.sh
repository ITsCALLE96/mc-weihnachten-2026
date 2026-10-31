#!/usr/bin/env bash
# Bestenliste (Discord + Hub) auf VM200 einrichten oder aktualisieren (als root, mehrfach ausführbar).
# Vom C96-PC (PowerShell):
#   Get-Content -Raw statistik/betrieb/einrichten.sh | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
# Holt statistik/ aus GitHub (nur dieser Ordner), legt Sichtbarkeit (alle sichtbar) und den Anzeigenamen der Generalprobe an,
# startet den Dienst (compose.yml, alle 15 s, Discord nur mit Webhook-Datei) und zeigt die Hub-Datei. Keine öffentliche Seite, kein offener Port.
set -euo pipefail
ZIEL=/opt/mc-statistik
REPO=https://github.com/ITsCALLE96/mc-weihnachten-2026.git
ARCHIV=/home/amp/mc-archiv
HUB=/srv/ampdata/mc-netzwerk-geteilt/bestenliste

mkdir -p "$ZIEL" "$HUB"
chmod 700 "$ZIEL"
chown amp:amp "$HUB"
if [ -d "$ZIEL/repo/.git" ]; then
  git -C "$ZIEL/repo" pull --ff-only --quiet
else
  git clone --quiet --depth 1 --filter=blob:none --sparse "$REPO" "$ZIEL/repo"
  git -C "$ZIEL/repo" sparse-checkout set statistik
fi
echo "Stand: $(git -C "$ZIEL/repo" log -1 --format='%h %s')"

# Standard: alle sichtbar. Ausblenden: UUID in "ausgeblendet" eintragen, wirkt beim nächsten Lauf.
[ -f "$ZIEL/sichtbarkeit.json" ] || echo '{ "ausgeblendet": [] }' > "$ZIEL/sichtbarkeit.json"
# Anzeigename der Generalprobe (Kennung bleibt testlauf)
if [ -d "$ARCHIV/testlauf" ] && [ ! -f "$ARCHIV/testlauf/NAME" ]; then echo Generalprobe > "$ARCHIV/testlauf/NAME"; fi

# Früherer Cron-Betrieb (bis 31.10.) entfällt: der Dienst läuft dauerhaft
rm -f /etc/cron.d/mc-bestenliste /usr/local/sbin/mc-bestenliste.sh

docker compose -f "$ZIEL/repo/statistik/betrieb/compose.yml" up -d --force-recreate --quiet-pull
for i in $(seq 1 30); do [ -s "$HUB/bestenliste.json" ] && [ "$HUB/bestenliste.json" -nt "$ZIEL/repo/statistik/bestenliste.mjs" ] && break; sleep 1; done
docker compose -f "$ZIEL/repo/statistik/betrieb/compose.yml" ps --format '{{.Name}}: {{.Status}}'
docker compose -f "$ZIEL/repo/statistik/betrieb/compose.yml" logs --no-log-prefix --tail 5
if [ -s "$HUB/bestenliste.json" ]; then echo "Hub-Datei: $(wc -c < "$HUB/bestenliste.json") Bytes, Stand $(date -r "$HUB/bestenliste.json" '+%H:%M:%S')"; else echo "Hub-Datei fehlt noch – Log oben prüfen."; fi
[ -f "$ZIEL/discord-webhook" ] && echo "Discord-Webhook ist hinterlegt." || echo "Discord-Webhook fehlt noch ($ZIEL/discord-webhook, Rechte 600) – bis dahin nur Hub-Datei."
# Muss die letzte Zeile bleiben: PowerShell hängt beim Pipen ein CRLF an, ohne exit liefe danach "$'\r'" als Befehl.
exit 0
