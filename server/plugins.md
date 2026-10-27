# Plugins und Proxy (Minecraft 26.3, Paper Build 207)

Stand 2026-10-23, Versionen über die APIs von Modrinth, Hangar und PaperMC (fill) abgefragt.
**Ungetestet**: hier steht nur, was ausgewählt ist. Getestet wird in Task 4, sobald die Instanz läuft.
**Konfigs:** Alle Plugin-Einstellungen, die von den Standards abweichen, liegen als fertige Dateien in `plugin-konfig/{gemeinsam,smp,hub}/plugins/` und kommen per
`plugin-konfig/einspielen.sh <server-ordner> smp|hub [vm200|lokal]` auf den Server (`plugin-konfig/README.md`). Was hier im Text steht, ist die Begründung, die Dateien gelten.
Bezugsquelle immer die genannte offizielle Seite. Jede `.jar` erst in einen eigenen leeren Ordner laden und dort mit SHA1/SHA256 vergleichen,
dann in `plugins/` kopieren.

## Paper-Instanz `MinecraftWeihnachten01` (SMP, Backend)

| Plugin | Version | Quelle | Lizenz | Datei, Prüfsumme (SHA1) | Zweck |
|---|---|---|---|---|---|
| WorldEdit | 7.4.6 (release, 15.10.) | Modrinth `worldedit` | GPL-3.0 | `worldedit-bukkit-7.4.6.jar`, `4de34cb32f338a7727f0c1cc4a0f7ebff3fcc3a3` | Spawn einfügen, für WorldGuard nötig |
| WorldGuard | 7.0.20 (release, 17.10.) | Modrinth `worldguard` | LGPL-3.0 | `worldguard-bukkit-7.0.20.jar`, `dd5fa9be6f5faf8a053a597491d194f2de8963ec` | Regionen aus `spawn/worldguard/regions.yml` (`vorgenerierung.md` → Spawn-Aufbau): nur Region `spawn`, Oval um die Insel (Mitte 71/25, Halbachsen 62/46). Seit 24.10. (Pascal) kein Bauverbot-Radius mehr, die Ebene drumherum ist frei bebaubar |
| DimensionControl | 3.0m (release, 17.09.) | Modrinth `dimension-control` | MIT | `dimensioncontrol-3.0m.jar`, `e3ed86c53229f42360b3308961607d2f3db833ee` | Nether/End zu bis zur Phase |
| Fair Play for Xaero's Maps | 0.1.7 (release, 22.09.) | Modrinth `fair-play-for-xaeros-maps` | ARR (Nutzung frei) | `xaero-fair-play-0.1.7.jar`, `9f9f32ec7ab6fe80f7d42ffc6c262d2fd2c80b72` | Höhlenansicht und Entity-Radar in Xaero aus |
| Armor Poser Plugin | 3.0.0 (release, 17.09.) | Modrinth `armor-poser-plugin` | MIT | `ArmorPoser-Plugin-3.0.0.jar`, `cc1f347fdef37ad3320dbba07555299d8b657a81` | Server-Teil zur Mod Armor Poser im Pack. Öffnen mit **Strg + Rechtsklick** auf einen Rüstungsständer (bestätigt im Test 24.10.) |
| Simple Voice Chat (Bukkit) | bukkit-2.6.25 (release, 22.10.) | Modrinth `simple-voice-chat` | ARR (Nutzung frei) | `voicechat-bukkit-2.6.25.jar`, `7e1113545d931e5a188a21d0ef806371f13813ea` | Sprachchat |
| Chunky | 1.5.3 (release, 04.05.) | Modrinth `chunky` | GPL-3.0 | `Chunky-Bukkit-1.5.3.jar`, `7ff47ee3afec89a1725e6eef393f373c549eff3b` | Welt vorgenerieren (`kapazitaet.md`) |
| Serverwahl (eigenes) | 1.0.0 | dieses Repo, `serverwahl/` | eigenes | `serverwahl-1.0.0.jar`, selbst gebaut (`serverwahl/README.md`) | nur `/hub` (bzw. `/lobby`) zurück in den Hub |
| spark | in Paper eingebaut | – | – | – | Profiler: `/spark tps`, `/spark health`, `/spark profiler` |

Alle sind auf Modrinth als 26.3-kompatibel markiert (Filter `game_versions=26.3`, Loader paper/bukkit).

### Auswahl und verworfene Kandidaten

- **Dimensionssperre → DimensionControl**: als einziger Kandidat mit 26.3-Version, aktiv gepflegt (26.000 Downloads), MIT,
  keine Konfiguration nötig. Verworfen: *Disable Nether*, *Portal Lock: Dimension Control* (beide ohne 26.3),
  *Dimension Date Lock* (letzte Version Januar 2025).
  - Befehle (Konsole): `nether close` · `nether open` · `end close` · `end open`. Diese ersetzen die Platzhalter
    `nether_oeffnen` und `end_oeffnen` aus dem Plan, die AMP-Aufgaben in Task 9 senden also `nether open` bzw. `end open`.
  - **Portale (seit 26.10., Pascal):** Solange eine Dimension zu ist, lässt sich kein Netherportal anzünden und kein Enderauge in einen Endportalrahmen setzen.
    Das macht `serverwahl` auf dem SMP, es liest dafür `plugins/DimensionControl/data.yml` (`serverwahl/README.md`)
  - **Achtung:** Operatoren und die Rechte `dimensioncontrol.bypass[.end|.nether]` umgehen die Sperre. Die Tests aus Task 4
    deshalb nur mit einem Account ohne OP machen (oder vorher `deop`).
  - **Neustart (lokaler Testserver, 24.10.):** `nether close`/`end close` aus der Konsole gehen. Der Zustand steht in `plugins/DimensionControl/data.yml`
    (`closed-dimensions: [nether, end]`) und ist nach dem Neustart noch drin. **Bestätigt (lokaler Testserver, 24.10.):** Nether und End blieben nach einem Neustart geschlossen (`nether status`). Pascal ohne OP:
    Netherportal lässt sich bauen und anzünden, teleportiert aber nicht. Auf VM200 in Task 4 Schritt 4
    noch einmal kurz prüfen. Falls es dort doch nicht hält:
    AMP-Aufgabe „nach dem Start“ sendet je nach Phase `nether close` bzw. `end close` (Phase steht in `#phase lf_phase`).
- ~~Rechtsklick-Ernte → Right click harvester~~ → **gestrichen 24.10.** (Pascal nach dem Test: „die Mod kommt weg“). Kein Ersatz. Jar und `plugins/Harvester/` kommen nicht auf den Server
- **Fair Play**: Das Plugin läuft auch auf Velocity. Wir setzen es nur aufs SMP-Backend: Im Hub gibt es nichts zu verstecken, und weitere SMP-Server bekommen es einzeln. Standard
  (Radar und Höhlenansicht aus) passt. Ausnahme für den Nether **erlauben**, so wie es Xaeros eigener Fair-Play-Modus
  macht: Ohne Höhlenansicht zeigt die Minimap dort nur die Bedrock-Decke und ist nutzlos. Antiker Schrott bleibt trotzdem
  verborgen, weil Anti-Xray ihn im Nether versteckt (siehe `paper/anti-xray.md`).
  - **Konfiguration (lokaler Testserver, 24.10., Datei in `plugin-konfig/`):** `plugins/XaeroFairPlay/xaero-fair-play.json`, dort `allowMinimapCaveModeInNether: true` und
    `allowWorldMapCaveModeInNether: true` (beide standardmäßig `false`)
  - Die Log-Meldung „Legacy plugin … does not specify an api-version“ ist harmlos, das Plugin läuft
- **Kein VeinMiner** (Pascal, 23.10.)
- ~~Spawn Elytra – like in Craft Attack~~ → **gestrichen 24.10.** (Pascal, neuer Spawn im Weltenbaum: Spawn unten im Stamm, kein Gleitflug vom Spawn). Jar, Konfig und `plugins/SpawnElytra/` kommen nicht auf den Server
- **bStats aus:** `enabled: false` in `plugins/bStats/config.yml` (gilt für alle Plugins, `plugin-konfig/`)

## Paper-Instanz `MinecraftHub01` (Hub, seit 24.10.)

Kleiner Server vor dem SMP: Fantasy Village (LavaBuilds, Aufbau Spawn-&-Welt-Session), Abenteuermodus, Velocity schickt jeden Beitritt hierher.
Nur was der Hub braucht, sonst nichts:

| Plugin | Version | Datei | Zweck |
|---|---|---|---|
| Serverwahl (eigenes) | 1.0.0 | `serverwahl-1.0.0.jar` | Rechtsklick auf die 5 Crate-Kisten öffnet das Menü, Klick auf einen Server wechselt über Velocity (`serverwahl/README.md`) |
| WorldEdit | 7.4.6 | wie SMP | Hub-Welt einfügen, für WorldGuard nötig |
| WorldGuard | 7.0.20 | wie SMP | ganze Welt geschützt über `__global__` (`plugin-konfig/hub/plugins/WorldGuard/worlds/world/regions.yml`): Kisten nicht plünderbar, Rahmen nicht drehbar, kein PvP, unverwundbar. Bewusst ohne `mob-spawning deny` (würde beim Einfügen Dorfbewohner und Fische der Struktur verhindern), Mobs verhindern `peaceful` + `spawn_mobs false` |
| Simple Voice Chat (Bukkit) | bukkit-2.6.25 | wie SMP | Sprachchat auch im Hub, lokal auf UDP 24456 (Velocity leitet weiter) |
| spark | eingebaut | – | `/spark tps` |

**Nicht auf dem Hub:** DimensionControl (Nether/End gibt es im Hub nicht, `allow-nether=false`), Fair Play, Armor Poser, Chunky, Datapacks (Leitfaden, Händler-Rabatt usw.).
Das Skript warnt, falls eins davon im Hub-Ordner liegt.

## Velocity-Instanz `MinecraftProxy01`

| Was | Version | Quelle | Datei, Prüfsumme |
|---|---|---|---|
| Velocity | 4.3.0, Build 44 (STABLE, 18.10.) | fill.papermc.io, Projekt `velocity` | `velocity-4.3.0-44.jar`, SHA256 `85be73b90f295acd8d5d45a00ad10bac791d4b72b7554172612a89565ebaaa8f` |
| Simple Voice Chat (Velocity) | velocity-2.6.18 (**alpha**, 28.05., für 26.1.1–26.3 markiert) | Modrinth `simple-voice-chat` | `voicechat-velocity-2.6.18.jar`, SHA1 `accac5cacdd46e9feff5c1c5418f4964b481e471` |

- Die Velocity-Version von Simple Voice Chat erscheint nur als „alpha“, auch die älteren. Das ist beim Entwickler so
  üblich, die Velocity-Version wird offiziell unterstützt. Falls sie hakt: Backup-Weg ist, das Plugin vom Proxy zu
  nehmen und UDP direkt auf den Backend-Voice-Port freizugeben (siehe `velocity/README.md`).
- Konfiguration: `velocity/README.md` und `velocity/velocity.toml.auszug`
- **bStats aus** auch auf dem Proxy: `plugins/bStats/config.txt` → `enabled=false` (Velocity nutzt eine eigene Datei, nicht die Paper-`config.yml`)
- Neuere Velocity-Version von Simple Voice Chat: velocity-2.6.26 (Stand 24.10.). Beim Einrichten (Task 2) die aktuelle nehmen und hier mit SHA1 eintragen

## Vorbereitet, nicht entschieden (27.10.)

| Thema | Datei | Kurz |
|---|---|---|
| Server-LOD (Fernsicht) | `lod-server.md` | DH Support (kein 26.3-Release, Nightly testen) oder LSS 0.20.0 + Voxy im Pack |
| Bedrock/PlayStation | `bedrock.md` | Geyser 2.12.1 + Floodgate 2.2.5 auf Velocity, Floodgate auf Hub/SMP, MCXboxBroadcast für PlayStation |
| Anti-Cheat | `anticheat.md` | GrimAC 2.3.75 nur auf dem SMP, nur Meldungen und Setbacks, keine Kicks |

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
3. Jars in `.../MinecraftWeihnachten01/Minecraft/plugins/`, `.../MinecraftHub01/Minecraft/plugins/` (nur die Hub-Liste) bzw. `.../MinecraftProxy01/velocity/plugins/` kopieren,
   Besitzer `amp:amp`
4. Instanz in AMP neu starten (Pascal), Konsole auf Fehler prüfen, `/plugins` bzw. `/velocity plugins`
