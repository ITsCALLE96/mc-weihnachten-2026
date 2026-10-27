# Generierte Datei – nicht von Hand ändern

`plugins/Geyser-Velocity/locales/overrides/de_de.json` schreibt `node tools/questbuch.mjs` (Questbuch-Session) aus den deutschen
Questbuch-Texten (Quelle `datapack/questbuch.json`, `datapack/schritte.json`). Sie gibt Bedrock-Spielern über Geyser die deutschen Texte,
ohne sie sehen sie die englischen `fallback`-Texte. `node tools/pruefen.mjs geyser` prüft, ob sie aktuell ist.

Nach jeder Textänderung: Generator laufen lassen, Datei mit `einspielen.sh <proxy-ordner> proxy` einspielen, Geyser (Proxy) neu starten.
