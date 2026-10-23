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

## Nether – eigene `paper-world.yml` im Ordner der Nether-Welt

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

## End – eigene `paper-world.yml` in der End-Welt

```yaml
anticheat:
  anti-xray:
    enabled: false
```

## Offen / beim Einrichten prüfen

- **Pfad der Welt-Konfiguration in 26.x:** Paper legt `paper-world.yml` beim ersten Start je Welt an. Wo genau (z. B. `world_nether/`
  oder ein neuer Ordner seit der geänderten Weltstruktur in 26.1) sehe ich erst auf der Instanz und trage es hier nach.
- Neue Blöcke seit 1.21 sind in den Listen nicht nötig. Prüfen, ob Paper beim Start unbekannte Block-IDs bemängelt.
- Last: Modus 2 kostet etwas mehr Bandbreite und CPU. Vorher und nachher `/tps` und `/mspt` vergleichen (Prüfschritt im Plan).
