# Plugin-Konfigs (fertige Dateien)

Hintergrund (Leitung, 24.10.): Auf dem lokalen Testserver stand bei Right click harvester `Require_Hoe: true`, die Doku sagte `false`.
Einstellungen, die nur als Text in `plugins.md` stehen, kommen also nicht verlässlich auf den Server. Deshalb liegen alle Abweichungen
vom Standard hier als vollständige Dateien, und ein Skript kopiert sie.

| Datei (unter `plugins/`) | Was abweicht | Begründung |
|---|---|---|
| `DimensionControl/config.yml` | Texte deutsch | „Der Nether ist noch geschlossen!“ statt Englisch |
| `XaeroFairPlay/xaero-fair-play.json` | Höhlenansicht im Nether erlaubt (Minimap und Weltkarte) | `../plugins.md` → Fair Play, im Test 24.10. bestätigt |
| `ArmorPoser/config.yml` | keine (Standard, festgehalten) | Spieler ohne Rechte dürfen posieren, Größe ändern für alle (`restrictResizeToOP: false`) |
| `bStats/config.yml` | `enabled: false` | gilt für alle Plugins |
| `voicechat/voicechat-server.properties` | `port=24455`, `bind_address=127.0.0.1` | nur VM200: Velocity belegt 24454 und leitet weiter (`../velocity/README.md`) |

Dazu kommt `../paper/permissions.yml` in den Server-Hauptordner (`/spark tps` für alle, `../spark.md`).

Nicht hier: WorldGuard-Regionen (`spawn/worldguard/regions.yml`, Spawn-&-Welt-Session), DimensionControl `data.yml` (Zustand, setzen `nether close`/`end close`),
Velocity (`../velocity/`). Right click harvester und Spawn Elytra sind gestrichen (24.10.).

## Einspielen

Server gestoppt, Plugins mindestens einmal gestartet (dann gibt es die Ordner, nötig ist es aber nicht):

```bash
bash server/plugin-konfig/einspielen.sh <paper-ordner> vm200
```

Auf dem lokalen Testserver ohne Proxy `lokal` statt `vm200`: dann bleibt Voice Chat auf 24454. Das Skript überschreibt nur die Dateien aus dieser Tabelle,
listet jede kopierte Datei und warnt, falls noch eine `harvester-*.jar` oder `SpawnElytra-*.jar` im Server liegt. Danach den Server starten.

## Ändern

Einstellung hier in der Datei ändern, nicht auf dem Server. Neue Plugin-Versionen können Schlüssel ergänzen: Nach einem Update die vom Plugin neu
erzeugte Datei mit der hiesigen vergleichen und neue Schlüssel übernehmen.

## Lokaler Testserver: bewusste Abweichungen in `server.properties`

Abgeglichen am 24.10. Ohne Velocity davor sind diese Werte lokal richtig und bleiben so: `online-mode=true`, `server-port=25565`, `enable-rcon=true`,
`white-list=false`, `max-players=10`, `network-compression-threshold=256`, MOTD mit „(lokaler Test)“. Angeglichen wurde `sync-chunk-writes=false`.
Alles andere (Seed, Sichtweite 8, Simulationsweite 6, `enforce-secure-profile=false`, Resourcepack, `spawn-protection=0`) stimmt mit `../server.properties.md`.
