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
X0, Y, Z0 = (int(v) for v in sys.argv[3:6]) if len(sys.argv) >= 6 else (40, -60, -55)
BREITE = 100                      # Zeilenumbruch in x (kompakt, Pascal 28.10.)

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


# Pascal 28.10.: drei Bereiche zum Abgehen, je mit Wegweiser und eigener Bodenfarbe
BOSSE = {"ender_dragon", "wither", "warden", "elder_guardian", "giant"}
FEINDLICH = {"blaze", "bogged", "breeze", "camel_husk", "cave_spider", "creaking", "creeper", "drowned", "enderman", "endermite", "evoker",
             "ghast", "guardian", "hoglin", "husk", "illusioner", "magma_cube", "parched", "phantom", "piglin", "piglin_brute", "pillager",
             "ravager", "shulker", "silverfish", "skeleton", "slime", "spider", "stray", "sulfur_cube", "vex", "vindicator", "witch",
             "wither_skeleton", "zoglin", "zombie", "zombie_nautilus", "zombie_villager", "zombified_piglin"}
BEREICHE = [
    ("Friedlich", "Tiere, Helfer und Dorfbewohner", "green", "minecraft:lime_concrete", lambda m: m not in BOSSE and m not in FEINDLICH),
    ("Feindlich", "Monster aus Oberwelt, Nether und End", "red", "minecraft:red_concrete", lambda m: m in FEINDLICH),
    ("Bosse", "Drache, Wither, Warden, Großer Wächter, Riese", "dark_purple", "minecraft:purple_concrete", lambda m: m in BOSSE),
]


# ---------- Aufbau (Pascal 28.10. nachmittags: offen, kompakt, ohne Hallen und ohne Seitenbereiche) ----------
ABSTAND_BEREICHE = 8              # Gang zwischen Friedlich, Feindlich und Bosse


def mitte(v):
    """Blockmitte – als Zahl rechnen, nicht als Text „{v}.5“ (bei negativen Koordinaten wäre das der Nachbarblock, Fehler vom 28.10.)"""
    return v + 0.5


# Angriffspose (Pascal 28.10.): diese Mobs bekommen den Tag zoo_angriff, serverwahl (zoo-posen) hält sie angriffslustig
ANGRIFF = FEINDLICH | BOSSE | {"iron_golem", "wolf", "polar_bear", "bee", "goat", "llama", "trader_llama", "snow_golem", "dolphin", "panda"}
# zusätzliche NBT für die Pose: geladene Armbrust zeigt den Zielanschlag, Creeper als „geladen“ (blauer Schimmer)
POSE_NBT = {
    "pillager": 'equipment:{mainhand:{id:"minecraft:crossbow",count:1,components:{"minecraft:charged_projectiles":[{id:"minecraft:arrow",count:1}]}}}',
    "piglin": 'equipment:{mainhand:{id:"minecraft:crossbow",count:1,components:{"minecraft:charged_projectiles":[{id:"minecraft:arrow",count:1}]}}}',
}

aufbau, abbau = [], []
z = Z0
eintraege = []
wegweiser = []
for titel, unter, farbe, boden, gehoert in BEREICHE:
    wegweiser.append((titel, unter, farbe, X0 - 3, z + 1))
    z += 4
    x, zeilen_tiefe = X0, 0
    for mob in [m for m in mobs if gehoert(m)]:
        abstand, hoehe = GROESSE.get(mob, (4, 2.6))
        for bez, nbt in varianten(mob):
            if x + abstand > X0 + BREITE:
                x, z, zeilen_tiefe = X0, z + zeilen_tiefe + 3, 0
            eintraege.append((mob, bez, nbt, x + abstand // 2, z, hoehe, boden))
            x += abstand
            zeilen_tiefe = max(zeilen_tiefe, abstand)
    z += zeilen_tiefe + ABSTAND_BEREICHE
z_ende = z

x1, x2 = X0 - 6, X0 + BREITE + 3
z1, z2 = Z0 - 3, z_ende

# Kleine Kampf-Ecke (Pascal 28.10.: statt großer Arena und Geschoss-Galerie) – 24 × 24 nördlich vom Zoo, klar beschildert
ax, ay, az = X0 + 12, Y, Z0 - 20
R = 12


def kasten_leeren(xa, xb, za, zb, ya, yb):
    """Bereich in fill-tauglichen Scheiben leeren (≤ 32.768 Blöcke)"""
    zeilen = []
    tiefe = max(1, 32000 // ((xb - xa + 1) * (yb - ya + 1)))
    for zs in range(za, zb + 1, tiefe):
        zeilen.append(f"fill {xa} {ya} {zs} {xb} {yb} {min(zs + tiefe - 1, zb)} minecraft:air")
    return zeilen


# Plattform (Streifen à 60: fill ≤ 32.768 Blöcke, forceload ≤ 256 Chunks je Befehl)
for zs in range(min(z1, az - R - 1), z2 + 1, 60):
    ze = min(zs + 59, z2)
    aufbau.append(f"forceload add {x1} {zs} {x2} {ze}")
for zs in range(z1, z2 + 1, 60):
    ze = min(zs + 59, z2)
    aufbau.append(f"fill {x1} {Y - 1} {zs} {x2} {Y - 1} {ze} minecraft:smooth_quartz")
    abbau.append(f"fill {x1} {Y - 1} {zs} {x2} {Y - 1} {ze} minecraft:grass_block")
abbau += kasten_leeren(x1, x2, z1, z2, Y, Y + 14)

for titel, unter, farbe, wx, wz in wegweiser:
    t = json.dumps({"text": titel, "color": farbe, "bold": True, "extra": [{"text": chr(10) + unter, "color": "gray", "bold": False}]}, ensure_ascii=False)
    trafo = "transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2f,2f,2f]}"
    aufbau.append(f"fill {wx - 1} {Y - 1} {wz - 1} {wx + 1} {Y - 1} {wz + 1} minecraft:gold_block")
    aufbau.append(f'summon minecraft:text_display {mitte(wx)} {Y + 3} {mitte(wz)} {{Tags:["zoo"],billboard:"vertical",text:{t},background:1073741824,{trafo}}}')

gemeinsam = "NoAI:1b,PersistenceRequired:1b,Invulnerable:1b,Rotation:[0f,0f]"
for mob, bez, nbt, ex, ez, hoehe, boden in eintraege:
    if mob in WASSER:
        aufbau.append(f"fill {ex - 1} {Y} {ez - 1} {ex + 1} {Y + 2} {ez + 1} minecraft:glass hollow")
        aufbau.append(f"fill {ex} {Y} {ez} {ex} {Y + 1} {ez} minecraft:water")
    else:
        aufbau.append(f"setblock {ex} {Y - 1} {ez} {boden}")
    # ohne NBT beschwören (dann wählt Vanilla Ausrüstung und Grundwerte), danach unsere Werte setzen
    aufbau.append(f"summon minecraft:{mob} {mitte(ex)} {Y} {mitte(ez)}")
    tags = '["zoo","zoo_angriff"]' if mob in ANGRIFF else '["zoo"]'
    zusatz = f"Tags:{tags}," + gemeinsam + ("," + POSE_NBT[mob] if mob in POSE_NBT else "") + ("," + nbt if nbt else "")
    aufbau.append(f"execute positioned {mitte(ex)} {Y} {mitte(ez)} run data merge entity @e[type=minecraft:{mob},tag=!zoo,distance=..1,limit=1,sort=nearest] {{{zusatz}}}")
    text = name(mob) + (f" – {bez}" if bez else "")
    aufbau.append(f"summon minecraft:text_display {mitte(ex)} {Y + hoehe} {mitte(ez)} {{Tags:[\"zoo\"],billboard:\"center\",text:{json.dumps(text, ensure_ascii=False)},background:1073741824}}")

kampf_text = json.dumps({"text": "Kampf-Ecke", "color": "red", "bold": True,
                         "extra": [{"text": chr(10) + "/function zoo:menue – Mob live beschwören und angreifen lassen", "color": "gray", "bold": False}]},
                        ensure_ascii=False)
aufbau += [
    f"fill {ax - R} {ay - 1} {az - R} {ax + R} {ay - 1} {az + R} minecraft:snow_block",
    f"fill {ax - R} {ay} {az - R} {ax + R} {ay + 1} {az - R} minecraft:packed_ice",
    f"fill {ax - R} {ay} {az + R} {ax + R} {ay + 1} {az + R} minecraft:packed_ice",
    f"fill {ax - R} {ay} {az - R} {ax - R} {ay + 1} {az + R} minecraft:packed_ice",
    f"fill {ax + R} {ay} {az - R} {ax + R} {ay + 1} {az + R} minecraft:packed_ice",
    f"fill {ax - R} {ay + 2} {az - R} {ax + R} {ay + 20} {az - R} minecraft:barrier",
    f"fill {ax - R} {ay + 2} {az + R} {ax + R} {ay + 20} {az + R} minecraft:barrier",
    f"fill {ax - R} {ay + 2} {az - R} {ax - R} {ay + 20} {az + R} minecraft:barrier",
    f"fill {ax + R} {ay + 2} {az - R} {ax + R} {ay + 20} {az + R} minecraft:barrier",
    f"fill {ax - R} {ay + 21} {az - R} {ax + R} {ay + 21} {az + R} minecraft:barrier",
    f'summon minecraft:text_display {mitte(ax)} {ay + 4} {mitte(az + R + 1)} {{Tags:["zoo"],billboard:"vertical",text:{kampf_text},background:1073741824,'
    "transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2f,2f,2f]}}",
    "tellraw @a {\"text\":\"Zoo aufgebaut: zoo:menue (Kampf-Ecke), zoo:pruefen, zoo:neu\",\"color\":\"gold\"}",
]
# Entfernen ohne Tod-Effekte (kill ließ Slimes/Magmawürfel sich teilen, dazu Drops und XP): Größe 0, dann in den Void
WEG = ["execute as @e[tag={t},type=minecraft:slime] run data merge entity @s {{Size:0}}",
       "execute as @e[tag={t},type=minecraft:magma_cube] run data merge entity @s {{Size:0}}",
       "execute as @e[tag={t}] at @s run tp @s ~ -500 ~",
       # kill gleich hinterher: Drache, Warden, Wither … überleben den Void sonst Sekunden lang und bleiben beim Entladen bei y −500 gespeichert
       # (Offline-Scan 28.10.: 14 Stück). Beute und Erfahrung fallen dort ins Nichts
       "kill @e[tag={t}]"]


def weg(tag):
    return [w.format(t=tag) for w in WEG]


abbau = weg("zoo") + weg("zoo_live") + kasten_leeren(ax - R, ax + R, az - R, az + R, ay, ay + 21) + abbau + \
        [f"fill {ax - R} {ay - 1} {az - R} {ax + R} {ay - 1} {az + R} minecraft:grass_block"]
for zs in range(min(z1, az - R - 1), z2 + 1, 60):
    abbau.append(f"forceload remove {x1} {zs} {x2} {min(zs + 59, z2)}")

# Einmalig: alte Zoo-Lagen wegräumen (Leitung 28.10.: 104 Ausreißer). Die Entities dort müssen erst GELADEN sein – ein tp im selben Tick wie
# forceload add erwischt nichts (so blieben die alten Mobs stehen). Deshalb: laden, nach 5 s Mobs in den Void und Flächen leeren, nach weiteren 5 s entladen.
#  - Fassung 1 (vormittags): Zoo-Ecke 1984/−140 (x 1980…2108, z −146…−19), Arena 1984/−200 (±31)
#  - Fassung 2 (mittags): Ecke 120/−100 (x 106…270, z −110…116, Hallen bis y −34), Arena 120/−160 (±31)
ALT = [(1950, 2110, -235, -15, 42), (88, 270, -195, 116, 42)]
alt, alt2 = [], weg("zoo") + weg("zoo_live")
for xa, xb, za, zb, hoehe in ALT:
    for zs in range(za, zb + 1, 60):
        ze = min(zs + 59, zb)
        alt.append(f"forceload add {xa} {zs} {xb} {ze}")
        alt2.append(f"fill {xa} {Y - 1} {zs} {xb} {Y - 1} {ze} minecraft:grass_block")
    alt2 += kasten_leeren(xa, xb, za, zb, Y, Y + hoehe)
alt += ["tellraw @a {\"text\":\"Alte Zoo-Lagen werden geladen, Räumen in 5 s …\",\"color\":\"gray\"}", "schedule function zoo:alt_weg2 100t"]
# Reste der Hallen-Hülle von Spawn & Welt räumt ihr eigener Tag-Eintrag ab (einmalig, solange ihr Datapack zoo-halle noch liegt)
alt2.append("function #zoo:halle")
# Entladen erst 5 s später: in den Void geschickte Mobs sterben nur in geladenen Chunks (sonst bleiben sie bei y −500 gespeichert)
alt2.append("schedule function zoo:alt_weg3 100t")
alt3 = [f"forceload remove {xa} {zs} {xb} {min(zs + 59, zb)}" for xa, xb, za, zb, _ in ALT for zs in range(za, zb + 1, 60)]
alt3 += ["tellraw @a {\"text\":\"Alte Zoo-Lagen geräumt – jetzt function archiv:aufbau\",\"color\":\"gray\"}"]

pack = ZIEL / "zoo"
if pack.exists():
    shutil.rmtree(pack)
f = pack / "data" / "zoo" / "function"
(f / "live").mkdir(parents=True)
(pack / "pack.mcmeta").write_text(json.dumps({"pack": {"description": "Mob-Zoo – NUR Testwelt (Pascal 28.10.)", "min_format": 121, "max_format": 121}},
                                             ensure_ascii=False, indent=2), encoding="utf-8")
# Untote brennen in der Testwelt nicht (Pascal 28.10.: offen, ohne Dach, ohne Feuer): Entity-Tag burn_in_daylight leer ersetzen.
# Gilt nur in Welten mit diesem Datapack (Testwelt), nie auf dem SMP
(pack / "data" / "minecraft" / "tags" / "entity_type").mkdir(parents=True)
(pack / "data" / "zoo" / "tags" / "function").mkdir(parents=True)
(pack / "data" / "zoo" / "tags" / "function" / "halle.json").write_text('{"values": []}' + chr(10), encoding="utf-8")
(pack / "data" / "minecraft" / "tags" / "entity_type" / "burn_in_daylight.json").write_text('{"replace": true, "values": []}' + chr(10), encoding="utf-8")


def schreiben(name, zeilen):
    (f / f"{name}.mcfunction").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


# forceload lädt die Chunks erst in den nächsten Ticks → erst laden, dann nach 5 s bauen (sonst „Position nicht geladen“)
laden = [b for b in aufbau if b.startswith("forceload")]
schreiben("aufbau", laden + ["tellraw @a {\"text\":\"Zoo: Chunks werden geladen, Aufbau in 5 s …\",\"color\":\"gray\"}", "schedule function zoo:aufbau2 100t"])
schreiben("aufbau2", ["gamerule mob_griefing false"] + weg("zoo") + weg("zoo_live") + [b for b in aufbau if not b.startswith("forceload")])
schreiben("abbau", abbau)
schreiben("alt_weg", alt)
schreiben("alt_weg2", alt2)
schreiben("alt_weg3", alt3)
schreiben("neu", ["function zoo:abbau", "function zoo:aufbau"])
schreiben("hin", [f"execute in minecraft:overworld run tp @s {X0 - 8} {Y} {mitte(Z0 + 2)} -90 0", "gamemode creative @s"])
schreiben("nacht", ["time set 18000", "gamerule advance_time false", "tellraw @s {\"text\":\"Zoo: Nacht, Zeit angehalten (zoo:tag hebt das auf)\",\"color\":\"gray\"}"])
schreiben("tag", ["time set 6000", "gamerule advance_time true"])
# Kampf-Ecke: Pascal im Überleben mit Schutz, damit Mobs ihn angreifen (im Kreativ greifen Mobs nicht an)
schreiben("schutz", ["gamemode survival @s", "effect give @s minecraft:resistance infinite 4 true", "effect give @s minecraft:regeneration infinite 4 true",
                     "effect give @s minecraft:saturation infinite 0 true", "effect give @s minecraft:fire_resistance infinite 0 true",
                     "effect give @s minecraft:water_breathing infinite 0 true",
                     "tellraw @s {\"text\":\"Schutz an (Überleben, Resistenz V): Mobs greifen dich an, Schaden kommt nicht durch. zoo:schutz_aus beendet\",\"color\":\"gray\"}"])
schreiben("schutz_aus", ["effect clear @s", "gamemode creative @s"])
schreiben("arena", [f"execute in minecraft:overworld run tp @s {mitte(ax)} {ay} {mitte(az + R - 3)} 180 0", "function zoo:schutz"])
schreiben("arena_leeren", weg("zoo_live") + ["tellraw @s {\"text\":\"Kampf-Ecke geleert\",\"color\":\"gray\"}"])
menue = ["tellraw @s {\"text\":\"Kampf-Ecke – Mob anklicken zum Beschwören (mit KI, greift an). zoo:arena_leeren räumt auf.\",\"color\":\"gold\"}"]
for mob in LIVE + ["ender_dragon"]:
    if mob not in mobs:
        continue
    if mob == "ender_dragon":
        # Der Drache fliegt nur um den Brunnen bei 0/0 seiner Dimension → im End, mit eigener Phase
        schreiben("live/ender_dragon", [
            "execute in minecraft:the_end unless entity @e[type=minecraft:ender_dragon,distance=0..] run summon minecraft:ender_dragon 0 128 0 {DragonPhase:0,Tags:[\"zoo_live\"]}",
            "execute in minecraft:the_end run tp @s 0 90 40 180 20", "function zoo:schutz",
            "tellraw @s {\"text\":\"End: Drache aktiv. Zurück: function zoo:hin\",\"color\":\"gray\"}"])
    else:
        schreiben(f"live/{mob}", ["function zoo:arena",
                                  f"summon minecraft:{mob} {mitte(ax)} {ay + (8 if mob in ('ghast', 'happy_ghast', 'phantom', 'vex', 'wither') else 0)} {mitte(az - 6)} {{Tags:[\"zoo_live\"],PersistenceRequired:1b}}"])
    menue.append("tellraw @s {\"text\":\"  ▶ " + name(mob) + "\",\"color\":\"aqua\",\"click_event\":{\"action\":\"run_command\",\"command\":\"/function zoo:live/" + mob + "\"}}")
schreiben("menue", menue)
# Nachmessen (Fehler vom 28.10.: Mobs neben dem Podest): zählt Zoo-Mobs, die weder auf einem Podest (Beton) noch im Wasserwürfel stehen
schreiben("pruefen", [
    "scoreboard objectives add zoo_pruef dummy",
    "execute store result score #mobs zoo_pruef if entity @e[tag=zoo,type=!minecraft:text_display]",
    "execute store result score #falsch zoo_pruef run execute as @e[tag=zoo,type=!minecraft:text_display] at @s "
    "unless block ~ ~-1 ~ minecraft:lime_concrete unless block ~ ~-1 ~ minecraft:red_concrete unless block ~ ~-1 ~ minecraft:purple_concrete "
    "unless block ~ ~ ~ minecraft:water",
    "tellraw @a [{\"text\":\"Zoo-Prüfung: \",\"color\":\"gold\"},{\"score\":{\"name\":\"#mobs\",\"objective\":\"zoo_pruef\"}},{\"text\":\" Mobs, davon nicht auf Podest/Wasser: \"},"
    "{\"score\":{\"name\":\"#falsch\",\"objective\":\"zoo_pruef\"},\"color\":\"red\"}]",
    "execute as @e[tag=zoo,type=!minecraft:text_display] at @s unless block ~ ~-1 ~ minecraft:lime_concrete "
    "unless block ~ ~-1 ~ minecraft:red_concrete unless block ~ ~-1 ~ minecraft:purple_concrete unless block ~ ~ ~ minecraft:water run say Nicht auf dem Podest",
])

print(f"zoo: {len(mobs)} Mobs, {len(eintraege)} Podeste, Fläche x {x1}…{x2}, z {z1}…{z2}, Kampf-Ecke {ax}/{az} ±{R} → {pack}")
