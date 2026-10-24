# Plugins und Proxy (Minecraft 26.3, Paper Build 207)

Stand 2026-10-23, Versionen über die APIs von Modrinth, Hangar und PaperMC (fill) abgefragt.
**Ungetestet**: hier steht nur, was ausgewählt ist. Getestet wird in Task 4, sobald die Instanz läuft.
Bezugsquelle immer die genannte offizielle Seite. Jede `.jar` erst in einen eigenen leeren Ordner laden und dort mit SHA1/SHA256 vergleichen,
dann in `plugins/` kopieren.

## Paper-Instanz `MinecraftWeihnachten01` (SMP, Backend)

| Plugin | Version | Quelle | Lizenz | Datei, Prüfsumme (SHA1) | Zweck |
|---|---|---|---|---|---|
| WorldEdit | 7.4.6 (release, 15.10.) | Modrinth `worldedit` | GPL-3.0 | `worldedit-bukkit-7.4.6.jar`, `4de34cb32f338a7727f0c1cc4a0f7ebff3fcc3a3` | Spawn einfügen, für WorldGuard nötig |
| WorldGuard | 7.0.20 (release, 17.10.) | Modrinth `worldguard` | LGPL-3.0 | `worldguard-bukkit-7.0.20.jar`, `dd5fa9be6f5faf8a053a597491d194f2de8963ec` | Bauverbot ~150 Blöcke um den Spawn |
| DimensionControl | 3.0m (release, 17.09.) | Modrinth `dimension-control` | MIT | `dimensioncontrol-3.0m.jar`, `e3ed86c53229f42360b3308961607d2f3db833ee` | Nether/End zu bis zur Phase |
| Fair Play for Xaero's Maps | 0.1.7 (release, 22.09.) | Modrinth `fair-play-for-xaeros-maps` | ARR (Nutzung frei) | `xaero-fair-play-0.1.7.jar`, `9f9f32ec7ab6fe80f7d42ffc6c262d2fd2c80b72` | Höhlenansicht und Entity-Radar in Xaero aus |
| Armor Poser Plugin | 3.0.0 (release, 17.09.) | Modrinth `armor-poser-plugin` | MIT | `ArmorPoser-Plugin-3.0.0.jar`, `cc1f347fdef37ad3320dbba07555299d8b657a81` | Server-Teil zur Mod Armor Poser im Pack |
| Simple Voice Chat (Bukkit) | bukkit-2.6.25 (release, 22.10.) | Modrinth `simple-voice-chat` | ARR (Nutzung frei) | `voicechat-bukkit-2.6.25.jar`, `7e1113545d931e5a188a21d0ef806371f13813ea` | Sprachchat |
| Right click harvester | 1.1 (release, 22.06.) | Modrinth `right-click-harvester` | GPL-3.0 | `harvester-1.1.jar`, `73530a00b32a7a789f632df22d8f1ba6cdc3c0ca` | Rechtsklick-Ernte mit Neupflanzen |
| Chunky | 1.5.3 (release, 04.05.) | Modrinth `chunky` | GPL-3.0 | `Chunky-Bukkit-1.5.3.jar`, `7ff47ee3afec89a1725e6eef393f373c549eff3b` | Welt vorgenerieren (`kapazitaet.md`) |
| Spawn Elytra – like in Craft Attack | 2.6.1 (release, 06.09.) | Modrinth `spawnelytra` | MIT | `SpawnElytra-2.6.1.jar`, `4942f2bec4d4ea612a91b1e443745dcaf278d2ee` | Elytra-Flug per Doppelsprung am Spawn wie in Craft Attack |
| spark | in Paper eingebaut | – | – | – | Profiler: `/spark tps`, `/spark health`, `/spark profiler` |

Alle sind auf Modrinth als 26.3-kompatibel markiert (Filter `game_versions=26.3`, Loader paper/bukkit).

### Auswahl und verworfene Kandidaten

- **Dimensionssperre → DimensionControl**: als einziger Kandidat mit 26.3-Version, aktiv gepflegt (26.000 Downloads), MIT,
  keine Konfiguration nötig. Verworfen: *Disable Nether*, *Portal Lock: Dimension Control* (beide ohne 26.3),
  *Dimension Date Lock* (letzte Version Januar 2025).
  - Befehle (Konsole): `nether close` · `nether open` · `end close` · `end open`. Diese ersetzen die Platzhalter
    `nether_oeffnen` und `end_oeffnen` aus dem Plan, die AMP-Aufgaben in Task 9 senden also `nether open` bzw. `end open`.
  - **Achtung:** Operatoren und die Rechte `dimensioncontrol.bypass[.end|.nether]` umgehen die Sperre. Die Tests aus Task 4
    deshalb nur mit einem Account ohne OP machen (oder vorher `deop`).
  - **Neustart (lokaler Testserver, 24.10.):** `nether close`/`end close` aus der Konsole gehen. Der Zustand steht in `plugins/DimensionControl/data.yml`
    (`closed-dimensions: [nether, end]`) und ist nach dem Neustart noch drin. Die Sperre sollte also halten. Der Test im Spiel ohne OP (Task 4 Schritt 4) steht noch aus. Falls nicht:
    AMP-Aufgabe „nach dem Start“ sendet je nach Phase `nether close` bzw. `end close` (Phase steht in `#phase lf_phase`).
- **Rechtsklick-Ernte → Right click harvester**: HarvestMaster (Hangar `Imperialroma10/HarvestMaster`) endet bei 1.21.8
  und fällt deshalb raus. Right click harvester ist GPL, für Paper/Folia und deckt Weizen, Karotten, Kartoffeln,
  Rote Bete, Netherwarze und Kakao ab. Ersatz, falls der Test scheitert: *Right Click Harvest* (Modrinth
  `right-click-harvest-asdesteve`, 1.0.0, 26.3, ARR, kaum verbreitet).
  - Konfig `plugins/harvester/harvester.json`: `Drop_Seeds: true`, `DropTo: "ground"`, `Require_Hoe: false`,
    `Use_Durability: false`. So bleibt es nah an Vanilla.
  - **Offen:** ob Glück (Fortune) wirkt. Falls nicht, ist der Ertrag kleiner als beim Abbauen. Das ist kein Spielvorteil
    und für uns in Ordnung, steht aber im Testprotokoll.
- **Fair Play**: Das Plugin läuft auch auf Velocity. Wir setzen es aufs Backend, weil es nur einen Server gibt. Standard
  (Radar und Höhlenansicht aus) passt. Ausnahme für den Nether **erlauben**, so wie es Xaeros eigener Fair-Play-Modus
  macht: Ohne Höhlenansicht zeigt die Minimap dort nur die Bedrock-Decke und ist nutzlos. Antiker Schrott bleibt trotzdem
  verborgen, weil Anti-Xray ihn im Nether versteckt (siehe `paper/anti-xray.md`).
  - **Konfiguration (lokaler Testserver, 24.10.):** `plugins/XaeroFairPlay/xaero-fair-play.json`, dort `allowMinimapCaveModeInNether: true` und
    `allowWorldMapCaveModeInNether: true` (beide standardmäßig `false`)
  - Die Log-Meldung „Legacy plugin … does not specify an api-version“ ist harmlos, das Plugin läuft
- **Kein VeinMiner** (Pascal, 23.10.)
- **Spawn Elytra → „Spawn Elytra – like in Craft Attack“** (Leitung 24.10., Ersatz für die CA-Spawn-Elytra). Quelle: github.com/Knabbiii/SpawnElytra.
  Verworfen: das gleichnamige *Spawn Elytra* (Modrinth `spawn-elytra`, MPL-2.0), weil die Leitung das Craft-Attack-Plugin festgelegt hat.
  - Doppelsprung startet den Gleitflug ohne echte Elytra, F gibt einen Schub, Landen ohne Fallschaden
  - **Flugbereich = Spawn-Insel:** Standard ist ein Kreis mit Radius 50 um den Weltspawn, Welt `world`. Die Insel reicht vom Spawn 64/37 aus ±47 × ±34,
    **das passt ohne Setup** (lokaler Testserver, 24.10.). Voraussetzung: `setworldspawn 64 179 37` ist gesetzt. Mit `/spawnelytra visualize` prüfen.
    Nur falls nötig: `/spawnelytra setup` (Rechteck, gespeichert in `plugins/SpawnElytra/area.yml`)
  - **bStats aus:** `enableMetrics: false` in `plugins/SpawnElytra/config.yml` und zusätzlich `enabled: false` in `plugins/bStats/config.yml` (gilt für alle Plugins)
  - `messages.yml` ist englisch → auf Deutsch übersetzen. Optional Flugzeit begrenzen, falls jemand vom Spawn aus endlos fliegt
  - Rechte: `spawnelytra.use`, `spawnelytra.useboost` (beim Einrichten prüfen, dass Spieler sie ohne Rechte-Plugin haben), `spawnelytra.admin` nur OP
  - **Prüfen (Task 4, Pascal im Spiel):** Spieler ohne OP fliegt per Doppelsprung auf der Insel, außerhalb nicht. Schub mit F, kein Fallschaden. Brustpanzer bleibt erhalten.
    Verträgt sich mit WorldGuard-Spawnschutz und Fair Play

## Velocity-Instanz `MinecraftProxy01`

| Was | Version | Quelle | Datei, Prüfsumme |
|---|---|---|---|
| Velocity | 4.3.0, Build 44 (STABLE, 18.10.) | fill.papermc.io, Projekt `velocity` | `velocity-4.3.0-44.jar`, SHA256 `85be73b90f295acd8d5d45a00ad10bac791d4b72b7554172612a89565ebaaa8f` |
| Simple Voice Chat (Velocity) | velocity-2.6.18 (**alpha**, 28.05., für 26.1.1–26.3 markiert) | Modrinth `simple-voice-chat` | `voicechat-velocity-2.6.18.jar`, SHA1 `accac5cacdd46e9feff5c1c5418f4964b481e471` |

- Die Velocity-Version von Simple Voice Chat erscheint nur als „alpha“, auch die älteren. Das ist beim Entwickler so
  üblich, die Velocity-Version wird offiziell unterstützt. Falls sie hakt: Backup-Weg ist, das Plugin vom Proxy zu
  nehmen und UDP direkt auf den Backend-Voice-Port freizugeben (siehe `velocity/README.md`).
- Konfiguration: `velocity/README.md` und `velocity/velocity.toml.auszug`

## Datapacks (Task 4 Schritt 11, nach `world/datapacks/`, danach Neustart)

| Datapack | Version | Quelle | Lizenz | Ins Repo? |
|---|---|---|---|---|
| Leitfaden (unser eigenes) | aus `datapack/` | dieses Repo | eigenes | ja |
| Wind Boost Enchantment | 2.3 | Modrinth `wind_boost_enchant` | MIT | nein, nur Quelle notiert |
| Craftable Light Blocks | v1 | Modrinth `v-datapack-archive` | vorbehalten | **nein** (Lizenz) |

Reihenfolge nach dem Neustart mit `/datapack list` prüfen.

## Einspielen (sobald die Instanz steht)

1. Auf VM200 einen leeren Ordner anlegen (`/root/mc-downloads/<datum>/`), die Jars dort herunterladen
2. `sha1sum *.jar` bzw. `sha256sum velocity-*.jar` mit den Werten oben vergleichen, bei Abweichung abbrechen
3. Jars in `.../MinecraftWeihnachten01/Minecraft/plugins/` bzw. `.../MinecraftProxy01/velocity/plugins/` kopieren,
   Besitzer `amp:amp`
4. Instanz in AMP neu starten (Pascal), Konsole auf Fehler prüfen, `/plugins` bzw. `/velocity plugins`
