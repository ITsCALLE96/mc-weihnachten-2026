# Paper Anti-Xray, engine-mode 2 (Task 4 Schritt 7)

Warum: Freecam und Fullbright sind im Pack erlaubt. Freecam lässt sich serverseitig nicht einschränken. Anti-Xray im Modus 2 schickt dem
Client an Stellen, die er nicht sehen kann, zufällige Erze und Steine. Damit bringt das Durchschauen von Stein mit Freecam keinen Vorteil.
Sichtbar bleiben nur Erze an offenen Höhlenwänden, so wie im normalen Spiel.

Werte nach der von PaperMC empfohlenen Konfiguration („Anti-Xray“ in den Paper-Docs).

## Overworld (Standard für alle Welten) – `config/paper-world-defaults.yml`

```yaml
anticheat:
  anti-xray:
    enabled: true
    engine-mode: 2
    max-block-height: 64
    update-radius: 2
    lava-obscures: false
    use-permission: false
    hidden-blocks:
      - air
      - copper_ore
      - deepslate_copper_ore
      - raw_copper_block
      - diamond_ore
      - deepslate_diamond_ore
      - emerald_ore
      - deepslate_emerald_ore
      - gold_ore
      - deepslate_gold_ore
      - iron_ore
      - deepslate_iron_ore
      - raw_iron_block
      - lapis_ore
      - deepslate_lapis_ore
      - redstone_ore
      - deepslate_redstone_ore
    replacement-blocks:
      - chest
      - amethyst_block
      - andesite
      - budding_amethyst
      - calcite
      - coal_ore
      - deepslate_coal_ore
      - deepslate
      - diorite
      - dirt
      - emerald_ore
      - deepslate_emerald_ore
      - granite
      - gravel
      - oak_planks
      - smooth_basalt
      - stone
      - tuff
```

`air` in `hidden-blocks` versteckt auch Höhlen und Schluchten, die der Spieler nicht sehen kann. Genau das nimmt Freecam den Vorteil.

## Nether – `world/dimensions/minecraft/the_nether/paper-world.yml`

```yaml
anticheat:
  anti-xray:
    enabled: true
    engine-mode: 2
    max-block-height: 128
    update-radius: 2
    lava-obscures: false
    use-permission: false
    hidden-blocks:
      - air
      - ancient_debris
      - bone_block
      - glowstone
      - magma_block
      - nether_bricks
      - nether_gold_ore
      - nether_quartz_ore
      - polished_blackstone_bricks
    replacement-blocks:
      - basalt
      - blackstone
      - gravel
      - netherrack
      - soul_sand
      - soul_soil
```

## End – `world/dimensions/minecraft/the_end/paper-world.yml`

```yaml
anticheat:
  anti-xray:
    enabled: false
```

## Offen / beim Einrichten prüfen

- ~~Pfad der Welt-Konfiguration in 26.x~~ → geklärt (lokaler Testserver, 24.10.): Paper legt sie seit der neuen Weltstruktur unter
  `world/dimensions/minecraft/{overworld,the_nether,the_end}/paper-world.yml` an, nicht mehr in `world_nether/`. Die Overworld nimmt
  `config/paper-world-defaults.yml`, Nether und End bekommen ihren Abschnitt in der jeweiligen `paper-world.yml`.
  **Achtung (Spawn-&-Welt-Session, 24.10.):** Die Ordner `the_nether`/`the_end` nicht vor dem ersten Start anlegen, sonst stürzt Paper 26.3 ab
  („Unable to read … world_gen_settings.dat“). Die beiden Abschnitte also erst nach dem ersten Start eintragen, sie wirken ab dem nächsten Start
- ~~Unbekannte Block-IDs~~ → geprüft 24.10.: Paper bemängelt beim Start keine
- Last: Modus 2 kostet etwas mehr Bandbreite und CPU. Vorher und nachher `/tps` und `/mspt` vergleichen (Prüfschritt im Plan).
