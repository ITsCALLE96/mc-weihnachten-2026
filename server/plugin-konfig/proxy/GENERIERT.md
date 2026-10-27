# Generierte Datei – nicht von Hand ändern

`plugins/Geyser-Velocity/locales/overrides/de_de.json` schreibt `node tools/questbuch.mjs` (Questbuch-Session). Sie enthält alle deutschen
Texte des Resourcepacks (`resourcepack/assets/*/lang/de_de.json`, z. B. Questbuch und Winterkalender) und gibt sie Bedrock-Spielern über
Geyser. Ohne sie sehen Bedrock-Spieler die englischen `fallback`-Texte. `node tools/pruefen.mjs geyser` prüft, ob sie aktuell ist.

Nach jeder Änderung an einer deutschen Sprachdatei im Resourcepack: `node tools/questbuch.mjs` laufen lassen, Datei mit
`einspielen.sh <proxy-ordner> proxy` einspielen, Geyser (Proxy) neu starten.
