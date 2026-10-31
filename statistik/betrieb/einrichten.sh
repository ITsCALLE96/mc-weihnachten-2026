#!/usr/bin/env bash
# Bestenliste (Discord + Hub) auf VM200 einrichten oder aktualisieren (als root, mehrfach ausführbar).
# Vom C96-PC (PowerShell):
#   Get-Content -Raw statistik/betrieb/einrichten.sh | ssh root@192.168.178.200 "ssh root@192.168.178.78 'bash -s'"
# Holt statistik/ aus GitHub (nur dieser Ordner), legt Sichtbarkeit (alle sichtbar) und den Anzeigenamen der Generalprobe an,
# richtet den Cron ein und macht einen Probelauf ohne Discord. Keine öffentliche Seite, kein offener Port.
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

install -m 755 "$ZIEL/repo/statistik/betrieb/lauf.sh" /usr/local/sbin/mc-bestenliste.sh
cat > /etc/cron.d/mc-bestenliste <<'CRON'
# Bestenliste (statistik/README.md): Hub-Datei alle 15 Minuten, Discord-Nachricht stündlich zur Minute 5
*/15 * * * * root /usr/local/sbin/mc-bestenliste.sh >> /opt/mc-statistik/lauf.log 2>&1
5 * * * * root /usr/local/sbin/mc-bestenliste.sh discord >> /opt/mc-statistik/lauf.log 2>&1
CRON

/usr/local/sbin/mc-bestenliste.sh
echo "Hub-Datei: $(wc -c < "$HUB/bestenliste.json") Bytes"
[ -f "$ZIEL/discord-webhook" ] && echo "Discord-Webhook ist hinterlegt." || echo "Discord-Webhook fehlt noch ($ZIEL/discord-webhook, Rechte 600) – bis dahin nur Hub-Datei."
