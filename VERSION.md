# Versionen (eingefroren ab 2026-10-20)

**Seit 30.10. (Pascal/Leitung):** Eingefroren ist nur noch die **Minecraft-Version 26.3**. Auf VM200 holt AMP die Jars selbst: Paper fest auf 26.3 („Update“ bringt nur neue Builds von 26.3), Velocity stabil. Eine neue Minecraft-Version ist eine bewusste Entscheidung (Modpack, Plugins, Datapacks müssen passen), Regel und AMP-Einstellungen: `server/vm200/README.md` und Administration-Doku im Vault.

Maschinenlesbare Quelle: `versions.json`. Werte aus der offiziellen `server.jar` (`version.json`) und den APIs von PaperMC/Modrinth ermittelt.

| Was | Wert | Quelle |
|---|---|---|
| Minecraft | 26.3 | Mojang, `stable: true` |
| Paper | 26.3, **Build folgt AMP-Updates** (neuester STABLE-Build von 26.3; Testnetz lokal Build 207, `paper_build` in `versions.json`) | fill.papermc.io, AMP |
| Velocity | **stabil über AMP** (neueste Nicht-SNAPSHOT-Version; Testnetz lokal 4.3.0-44) | fill.papermc.io, AMP |
| Java | 25 | `version.json` |
| Datapack-Format | 121.0 | `version.json` → `data_major/minor` |
| Resourcepack-Format | 97.1 | `version.json` → `resource_major/minor` |

## Verfügbarkeit Kern-Mods/Plugins für 26.3 (Stand 2026-10-20)

| Projekt | 26.3 verfügbar |
|---|---|
| Fabric API | ja |
| Sodium | ja |
| Iris | ja |
| Mod Menu | ja |
| Xaero's Minimap | ja (die Fair-Play-Variante endet bei 1.21 → Fairplay wird serverseitig erzwungen, siehe Modpack) |
| WorldEdit (Paper) | ja |
| WorldGuard (Paper) | ja |

Keine Minecraft-Updates während des Projekts.
