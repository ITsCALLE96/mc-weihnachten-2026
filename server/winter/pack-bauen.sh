#!/usr/bin/env bash
# Baut aus „Kinda Winter Mode“ 26.3 (asapacey2, CC-BY-4.0, https://modrinth.com/datapack/kinda-winter-mode) unser Winter-Datapack:
# alle Biome kalt, auch Ozeane und Fluss (Pascal 28.10.: nirgends Regen). Das Zufrieren dort verhindert serverwahl (eis-sperre).
# OHNE_MEER=1 baut die frühere Fassung ohne Ozeane/Fluss (dort regnet es dann).
# Aufruf: bash server/winter/pack-bauen.sh <original.zip> <ziel-ordner>   → <ziel-ordner>/winter-weihnachten/ (in world/datapacks/ kopieren)
set -euo pipefail
zip="${1:?Aufruf: pack-bauen.sh <original.zip> <ziel-ordner>}"
ziel="${2:?Zielordner fehlt}"; mkdir -p "$ziel"; ziel="$(cd "$ziel" && pwd)"
echo "20b268bc4ad37def5bc7aa9b919cf5687fa745e1  $zip" | sha1sum -c -
rm -rf "$ziel/winter-weihnachten" && mkdir -p "$ziel/winter-weihnachten"
unzip -q "$zip" -d "$ziel/winter-weihnachten"
cd "$ziel/winter-weihnachten/data/minecraft/worldgen/biome"
[ "${OHNE_MEER:-0}" = 1 ] && rm -f ocean.json deep_ocean.json cold_ocean.json deep_cold_ocean.json lukewarm_ocean.json deep_lukewarm_ocean.json warm_ocean.json river.json
cd "$ziel/winter-weihnachten"
cat > pack.mcmeta <<'JSON'
{
  "pack": {
    "description": "Winter für Weihnachten 2026 – auf Basis von Kinda Winter Mode (asapacey2, CC-BY-4.0)",
    "min_format": 121,
    "max_format": 121
  }
}
JSON
printf '%s\n' "Kinda Winter Mode von asapacey2, https://modrinth.com/datapack/kinda-winter-mode, Lizenz CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/)." \
  "Geändert für den Weihnachtsserver 2026: Beschreibung angepasst$([ "${OHNE_MEER:-0}" = 1 ] && echo ", Ozean- und Fluss-Biome entfernt")." > NAMENSNENNUNG.txt
echo "fertig: $ziel/winter-weihnachten ($(ls data/minecraft/worldgen/biome | wc -l) Biome kalt)"
