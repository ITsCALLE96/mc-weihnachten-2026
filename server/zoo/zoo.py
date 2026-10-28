#!/usr/bin/env python3
"""Mob-Zoo fürs TESTNETZ (Pascal 28.10.): baut ein Datapack „zoo“, das jeden lebenden Mob der 26.3-Jar zeigt – mit Varianten und Babys –
still (NoAI, unverwundbar) auf Podesten mit Namensschild, dazu eine Arena, in der Pascal einzelne Mobs „live“ schaltet.
NIE auf VM200: das Datapack gehört nur in die Testwelt des Testnetzes (testnetz/testwelt/world/datapacks).

Aufruf: python -I server/zoo/zoo.py <paper-jar> <ziel: …/world/datapacks>
Die Mob-Liste kommt aus dem Jar (data/minecraft/loot_table/entities/*.json = alle Mobs, die sterben können), Varianten aus den
Varianten-Registries im Jar (cat_variant, wolf_variant, …); Berufe/Biomtypen und alte Zahl-Varianten (Pferd, Lama, Papagei …) stehen hier fest."""
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

JAR, ZIEL = Path(sys.argv[1]), Path(sys.argv[2])
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
# Zoo-Ecke und Arena: Standard für die eigene Testwelt (Superflat, Boden y −61 → stehen auf y −60), Pascal 28.10.
# Andere Lage: python zoo.py <jar> <ziel> <x> <y> <z>
X0, Y, Z0 = (int(v) for v in sys.argv[3:6]) if len(sys.argv) >= 6 else (16, -60, 16)
BREITE = 120                      # Zeilenumbruch in x
ARENA = (X0, Y, Z0 - 60)          # Arena-Mitte (60 × 60, Barrieren, Grundgestein-Boden), nördlich vom Zoo

KEIN_MOB = {"player", "armor_stand", "mannequin"}
WASSER = {"cod", "salmon", "pufferfish", "tropical_fish", "squid", "glow_squid", "dolphin", "axolotl", "tadpole",
          "guardian", "elder_guardian", "nautilus", "zombie_nautilus"}
# Platz (Abstand in x) und Höhe des Schilds je Mob, Standard 4 / 2.6
GROESSE = {"ender_dragon": (26, 9), "giant": (10, 13), "ghast": (8, 5), "happy_ghast": (8, 5.5), "wither": (6, 4.2),
           "warden": (5, 3.6), "ravager": (6, 3), "iron_golem": (5, 3.4), "elder_guardian": (5, 3), "sniffer": (6, 3),
           "camel": (5, 3.2), "camel_husk": (5, 3.2), "polar_bear": (5, 2.8), "hoglin": (5, 2.6), "zoglin": (5, 2.6),
           "horse": (5, 2.8), "skeleton_horse": (5, 2.8), "zombie_horse": (5, 2.8), "donkey": (5, 2.6), "mule": (5, 2.7),
           "llama": (5, 2.9), "trader_llama": (5, 2.9), "enderman": (4, 3.6), "strider": (4, 2.8), "creaking": (4, 3.4)}
# Mobs mit Baby-Form (Age bei Tieren, IsBaby bei Zombies & Co.)
BABY_AGE = {"armadillo", "axolotl", "bee", "camel", "cat", "chicken", "cow", "dolphin", "donkey", "fox", "frog", "goat", "hoglin",
            "horse", "llama", "mooshroom", "mule", "ocelot", "panda", "pig", "polar_bear", "rabbit", "sheep", "skeleton_horse",
            "sniffer", "strider", "trader_llama", "turtle", "villager", "wolf", "zombie_horse", "camel_husk", "happy_ghast",
            "nautilus", "zombie_nautilus"}
BABY_FLAG = {"zombie", "husk", "drowned", "zombie_villager", "piglin", "zombified_piglin", "zoglin"}
BERUFE = ["none", "armorer", "butcher", "cartographer", "cleric", "farmer", "fisherman", "fletcher", "leatherworker",
          "librarian", "mason", "nitwit", "shepherd", "toolsmith", "weaponsmith"]
BIOMTYPEN = ["plains", "desert", "jungle", "savanna", "snow", "swamp", "taiga"]
FARBEN = ["white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray", "light_gray", "cyan", "purple",
          "blue", "brown", "green", "red", "black"]
# Mobs, die in der Arena „live“ gezeigt werden sollen (Pascal: Angriffe, Geschosse)
LIVE = ["wither", "ghast", "happy_ghast", "blaze", "skeleton", "stray", "bogged", "parched", "pillager", "piglin", "shulker", "warden",
        "evoker", "vindicator", "ravager", "breeze", "creeper", "witch", "guardian", "elder_guardian", "llama", "snow_golem",
        "iron_golem", "phantom", "vex", "zombie", "drowned", "spider", "enderman", "hoglin", "piglin_brute", "magma_cube", "slime",
        "creaking", "silverfish", "endermite", "wither_skeleton", "zoglin", "sulfur_cube"]

with zipfile.ZipFile(JAR) as z:
    namen = z.namelist()
    mobs = sorted({m.group(1) for n in namen if (m := re.fullmatch(r"data/minecraft/loot_table/entities/([a-z_]+)\.json", n))} - KEIN_MOB)
    def registry(r):
        return sorted({m.group(1) for n in namen if (m := re.fullmatch(rf"data/minecraft/{r}/([a-z_]+)\.json", n))})
    REG = {r: registry(r + "_variant") for r in ["cat", "wolf", "pig", "cow", "chicken", "frog", "zombie_nautilus"]}


def varianten(mob):
    """Liste (Bezeichnung, NBT-Zusatz) – erste ist die Grundform"""
    v = [("", "")]
    if mob in REG:
        v = [(n, f'variant:"minecraft:{n}"') for n in REG[mob]]
    elif mob == "villager" or mob == "zombie_villager":
        v = [(b, f'VillagerData:{{profession:"minecraft:{b}",type:"minecraft:plains",level:5}}') for b in BERUFE]
        v += [(t, f'VillagerData:{{profession:"minecraft:farmer",type:"minecraft:{t}",level:1}}') for t in BIOMTYPEN if t != "plains"]
    elif mob == "horse":
        v = [(f"Farbe {c}", f"Variant:{c}") for c in range(7)] + [(f"Abzeichen {m}", f"Variant:{m * 256}") for m in range(1, 5)]
    elif mob in ("llama", "trader_llama"):
        v = [(n, f"Variant:{i}") for i, n in enumerate(["creamy", "white", "brown", "gray"])]
    elif mob == "parrot":
        v = [(n, f"Variant:{i}") for i, n in enumerate(["red_blue", "blue", "green", "yellow_blue", "gray"])]
    elif mob == "rabbit":
        v = [(n, f"RabbitType:{i}") for i, n in [(0, "brown"), (1, "white"), (2, "black"), (3, "white_splotched"), (4, "gold"),
                                                (5, "salt"), (99, "killer")]]
    elif mob == "axolotl":
        v = [(n, f"Variant:{i}") for i, n in enumerate(["lucy", "wild", "gold", "cyan", "blue"])]
    elif mob == "fox":
        v = [("red", 'Type:"red"'), ("snow", 'Type:"snow"')]
    elif mob == "mooshroom":
        v = [("red", 'Type:"red"'), ("brown", 'Type:"brown"')]
    elif mob == "panda":
        v = [(g, f'MainGene:"{g}",HiddenGene:"{g}"') for g in ["normal", "lazy", "worried", "playful", "brown", "weak", "aggressive"]]
    elif mob == "sheep":
        v = [(c, f"Color:{i}b") for i, c in enumerate(FARBEN)] + [("jeb_", 'CustomName:"jeb_"')]
    elif mob == "shulker":
        v = [("Standard", "Color:16b")] + [(c, f"Color:{i}b") for i, c in enumerate(FARBEN)]
    elif mob == "salmon":
        v = [(s, f'type:"{s}"') for s in ["small", "medium", "large"]]
    elif mob in ("slime", "magma_cube"):
        v = [(f"Größe {s}", f"Size:{s - 1}") for s in (1, 2, 4)]
    elif mob == "creeper":
        v = [("", ""), ("geladen", "powered:1b")]
    elif mob == "snow_golem":
        v = [("", ""), ("ohne Kürbis", "Pumpkin:0b")]
    elif mob == "goat":
        v = [("", ""), ("schreiend", "IsScreamingGoat:1b")]
    elif mob == "tropical_fish":
        v = [(f"Muster {i}", f"Variant:{val}") for i, val in enumerate([65536, 917504, 918273, 117441025, 50660352, 67764993,
                                                                          17236224, 16778497, 101253888, 50726144, 67371265])]
    if mob in BABY_AGE:
        v.append(("Baby", (v[0][1] + "," if v[0][1] else "") + "Age:-2000000000"))
    elif mob in BABY_FLAG:
        v.append(("Baby", (v[0][1] + "," if v[0][1] else "") + "IsBaby:1b"))
    return v


def name(mob):
    return mob.replace("_", " ").title()


aufbau, abbau = [], []
x, z, zeilen_tiefe = X0, Z0, 0
eintraege = []
for mob in mobs:
    abstand, hoehe = GROESSE.get(mob, (4, 2.6))
    for bez, nbt in varianten(mob):
        if x + abstand > X0 + BREITE:
            x, z, zeilen_tiefe = X0, z + zeilen_tiefe + 4, 0
        eintraege.append((mob, bez, nbt, x + abstand // 2, z, hoehe))
        x += abstand
        zeilen_tiefe = max(zeilen_tiefe, abstand)
z_ende = z + zeilen_tiefe + 4

# Plattform in Streifen (fill höchstens 32.768 Blöcke)
x1, x2 = X0 - 4, X0 + BREITE + 4
z1, z2 = Z0 - 6, z_ende
# Streifen à 60 Blöcke: fill ≤ 32.768 Blöcke, forceload ≤ 256 Chunks je Befehl
for zs in range(z1, z2 + 1, 60):
    ze = min(zs + 59, z2)
    aufbau.append(f"forceload add {x1} {zs} {x2} {ze}")
    aufbau.append(f"fill {x1} {Y - 1} {zs} {x2} {Y - 1} {ze} minecraft:smooth_quartz")
    abbau.append(f"fill {x1} {Y} {zs} {x2} {Y + 2} {ze} minecraft:air")
    abbau.append(f"fill {x1} {Y - 1} {zs} {x2} {Y - 1} {ze} minecraft:grass_block")
    abbau.append(f"forceload remove {x1} {zs} {x2} {ze}")
gemeinsam = "Tags:[\"zoo\"],NoAI:1b,PersistenceRequired:1b,Invulnerable:1b,Rotation:[0f,0f]"
for mob, bez, nbt, ex, ez, hoehe in eintraege:
    if mob in WASSER:
        aufbau.append(f"fill {ex - 1} {Y} {ez - 1} {ex + 1} {Y + 2} {ez + 1} minecraft:glass hollow")
        aufbau.append(f"fill {ex} {Y} {ez} {ex} {Y + 1} {ez} minecraft:water")
    else:
        aufbau.append(f"setblock {ex} {Y - 1} {ez} minecraft:polished_andesite")
    # ohne NBT beschwören (dann wählt Vanilla Ausrüstung und Grundwerte), danach unsere Werte setzen
    aufbau.append(f"summon minecraft:{mob} {ex}.5 {Y} {ez}.5")
    zusatz = gemeinsam + ("," + nbt if nbt else "")
    aufbau.append(f"execute positioned {ex}.5 {Y} {ez}.5 run data merge entity @e[type=minecraft:{mob},tag=!zoo,distance=..1,limit=1,sort=nearest] {{{zusatz}}}")
    text = name(mob) + (f" – {bez}" if bez else "")
    aufbau.append(f"summon minecraft:text_display {ex}.5 {Y + hoehe} {ez}.5 {{Tags:[\"zoo\"],billboard:\"center\",text:{json.dumps(text, ensure_ascii=False)},background:1073741824}}")

ax, ay, az = ARENA
aufbau += [
    f"forceload add {ax - 31} {az - 31} {ax + 31} {az + 31}",
    f"fill {ax - 31} {ay - 1} {az - 31} {ax + 31} {ay - 1} {az + 31} minecraft:bedrock",
    f"fill {ax - 31} {ay} {az - 31} {ax + 31} {ay + 40} {az - 31} minecraft:barrier",
    f"fill {ax - 31} {ay} {az + 31} {ax + 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax - 31} {ay} {az - 31} {ax - 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax + 31} {ay} {az - 31} {ax + 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax - 31} {ay + 41} {az - 31} {ax + 31} {ay + 41} {az + 31} minecraft:barrier",
    f"setblock {ax} {ay - 1} {az + 20} minecraft:gold_block",
    "tellraw @a {\"text\":\"Zoo aufgebaut: function zoo:hin, zoo:menue (Arena), zoo:nacht/zoo:tag, zoo:neu\",\"color\":\"gold\"}",
]
abbau = ["kill @e[tag=zoo]", "kill @e[tag=zoo_live]"] + abbau + [
    f"fill {ax - 31} {yy} {az - 31} {ax + 31} {min(yy + 7, ay + 41)} {az + 31} minecraft:air" for yy in range(ay, ay + 42, 8)
] + [f"fill {ax - 31} {ay - 1} {az - 31} {ax + 31} {ay - 1} {az + 31} minecraft:grass_block"] + [f"forceload remove {ax - 31} {az - 31} {ax + 31} {az + 31}"]

pack = ZIEL / "zoo"
if pack.exists():
    shutil.rmtree(pack)
f = pack / "data" / "zoo" / "function"
(f / "live").mkdir(parents=True)
(pack / "pack.mcmeta").write_text(json.dumps({"pack": {"description": "Mob-Zoo – NUR Testnetz (Pascal 28.10.)", "min_format": 121, "max_format": 121}},
                                             ensure_ascii=False, indent=2), encoding="utf-8")


def schreiben(name, zeilen):
    (f / f"{name}.mcfunction").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


# forceload lädt die Chunks erst in den nächsten Ticks → erst laden, dann nach 5 s bauen (sonst „Position nicht geladen“)
laden = [b for b in aufbau if b.startswith("forceload")]
schreiben("aufbau", laden + ["tellraw @a {\"text\":\"Zoo: Chunks werden geladen, Aufbau in 5 s …\",\"color\":\"gray\"}", "schedule function zoo:aufbau2 100t"])
schreiben("aufbau2", [b for b in aufbau if not b.startswith("forceload")])
schreiben("abbau", abbau)
schreiben("neu", ["function zoo:abbau", "function zoo:aufbau"])
schreiben("hin", [f"execute in minecraft:overworld run tp @s {X0 + 4} {Y} {Z0 - 4} 0 20", "gamemode creative @s"])
schreiben("nacht", ["time set 18000", "gamerule advance_time false", "tellraw @s {\"text\":\"Zoo: Nacht, Zeit angehalten (zoo:tag hebt das auf)\",\"color\":\"gray\"}"])
schreiben("tag", ["time set 6000", "gamerule advance_time true"])
# Arena: Pascal im Überleben mit Schutz, damit Mobs ihn angreifen (im Kreativ greifen Mobs nicht an)
schreiben("schutz", ["gamemode survival @s", "effect give @s minecraft:resistance infinite 4 true", "effect give @s minecraft:regeneration infinite 4 true",
                     "effect give @s minecraft:saturation infinite 0 true", "effect give @s minecraft:fire_resistance infinite 0 true",
                     "effect give @s minecraft:water_breathing infinite 0 true",
                     "tellraw @s {\"text\":\"Schutz an (Überleben, Resistenz V): Mobs greifen dich an, Schaden kommt nicht durch. zoo:schutz_aus beendet\",\"color\":\"gray\"}"])
schreiben("schutz_aus", ["effect clear @s", "gamemode creative @s"])
schreiben("arena", [f"execute in minecraft:overworld run tp @s {ax} {ay} {az + 20} 180 0", "function zoo:schutz"])
schreiben("arena_leeren", ["kill @e[tag=zoo_live]", "gamerule mob_griefing true", "tellraw @s {\"text\":\"Arena geleert, mob_griefing wieder an\",\"color\":\"gray\"}"])
menue = ["tellraw @s {\"text\":\"Arena – Mob anklicken zum Beschwören (Live, mit KI). zoo:arena_leeren räumt auf.\",\"color\":\"gold\"}"]
for mob in LIVE + ["ender_dragon"]:
    if mob not in mobs:
        continue
    if mob == "ender_dragon":
        # Der Drache fliegt nur um den Brunnen bei 0/0 seiner Dimension → im End, mit eigener Phase
        schreiben("live/ender_dragon", [
            "execute in minecraft:the_end unless entity @e[type=minecraft:ender_dragon,distance=0..] run summon minecraft:ender_dragon 0 128 0 {DragonPhase:0,Tags:[\"zoo_live\"]}",
            "execute in minecraft:the_end run tp @s 0 90 40 180 20", "function zoo:schutz",
            "tellraw @s {\"text\":\"End: Drache aktiv (DimensionControl sperrt das End nur für Nicht-Ops). Zurück: function zoo:hin\",\"color\":\"gray\"}"])
    else:
        schreiben(f"live/{mob}", ["gamerule mob_griefing false", f"function zoo:arena",
                                  f"summon minecraft:{mob} {ax} {ay + (12 if mob in ('ghast', 'happy_ghast', 'phantom', 'vex', 'wither') else 0)} {az - 10} {{Tags:[\"zoo_live\"],PersistenceRequired:1b}}"])
    menue.append("tellraw @s {\"text\":\"  ▶ " + name(mob) + "\",\"color\":\"aqua\",\"click_event\":{\"action\":\"run_command\",\"command\":\"/function zoo:live/" + mob + "\"}}")
schreiben("menue", menue)

print(f"zoo: {len(mobs)} Mobs, {len(eintraege)} Podeste, Fläche x {x1}…{x2}, z {z1}…{z2}, Arena {ARENA} → {pack}")
print("Mobs:", " ".join(mobs))
