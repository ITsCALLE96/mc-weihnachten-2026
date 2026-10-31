#!/usr/bin/env bash
# Ein Lauf der Bestenliste auf VM200 (Cron, siehe einrichten.sh). Node gibt es auf dem Host nicht, deshalb node:24-alpine per Docker.
# Liest SMP-Instanz und Archiv nur lesend, schreibt die Hub-Datei in den gemeinsamen Ordner (im Hub: /AMP/geteilt/bestenliste/bestenliste.json).
# Mit „discord“ als erstem Argument wird zusätzlich die Discord-Nachricht bearbeitet, sofern die Webhook-Datei existiert.
set -euo pipefail
ZIEL=/opt/mc-statistik
SMP=/home/amp/.ampdata/instances/MinecraftSMP01/Minecraft
ARCHIV=/home/amp/mc-archiv
HUB=/srv/ampdata/mc-netzwerk-geteilt/bestenliste
WEBHOOK=$ZIEL/discord-webhook

ARGS=(--instanz /daten/smp --archiv /daten/archiv --sichtbarkeit /zustand/sichtbarkeit.json --sprache daten/sprache.json --ausgabe /hub/bestenliste.json)
MOUNTS=(-v "$ZIEL/repo:/app:ro" -v "$SMP:/daten/smp:ro" -v "$ARCHIV:/daten/archiv:ro" -v "$ZIEL:/zustand" -v "$HUB:/hub")
if [ "${1:-}" = discord ] && [ -f "$WEBHOOK" ]; then
  ARGS+=(--webhook-datei /geheim/discord-webhook --zustand /zustand/discord-zustand.json)
  MOUNTS+=(-v "$WEBHOOK:/geheim/discord-webhook:ro")
fi
docker run --rm --network bridge -w /app/statistik "${MOUNTS[@]}" node:24-alpine node bestenliste.mjs "${ARGS[@]}"
