# Minecraft Weihnachtsprojekt 2026

Serverseitige Bausteine für ein Vanilla-Weihnachtsprojekt: Questbuch-Datapack (`datapack/leitfaden`), Weihnachts-Resourcepack, optionales Modrinth-Pack.

Prüfen: `node --test tools/*.test.mjs` · `node tools/pruefen.mjs datapack|resourcepack`

Questbuch bauen: `node tools/questbuch.mjs` (Quelle `datapack/questbuch.json`, Vanilla-Bedingungen aus der Server-Jar) · nur Abdeckung prüfen: `node tools/questbuch.mjs --pruefen` · Vorschau: `node tools/questbuch-vorschau.mjs` → `build/questbuch-vorschau.html`

Versionen: siehe `VERSION.md`.
