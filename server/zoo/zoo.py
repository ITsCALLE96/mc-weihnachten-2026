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


# Eigene schlichte Hallen (Wände, Fenster, Schneedach). Baut Spawn & Welt die weihnachtliche Hülle über den Tag #zoo:halle, hier auf False setzen
EIGENE_HALLEN = True
# Hallenhöhe je Bereich (Innenraum bis zur Decke): Bosse brauchen Platz für Riese (12) und Drache
HALLENHOEHE = {"Friedlich": 7, "Feindlich": 8, "Bosse": 16}


def mitte(v):
    """Blockmitte – als Zahl rechnen, nicht als Text „{v}.5“ (bei negativen Koordinaten wäre das der Nachbarblock, Fehler vom 28.10.)"""
    return v + 0.5


aufbau, abbau = [], []
z = Z0
eintraege = []
wegweiser = []
hallen = []                       # (titel, farbe, z_anfang, z_ende, hoehe)
for titel, unter, farbe, boden, gehoert in BEREICHE:
    z_anfang = z
    wegweiser.append((titel, unter, farbe, X0 - 1, z + 2))
    z += 6
    x, zeilen_tiefe = X0, 0
    for mob in [m for m in mobs if gehoert(m)]:
        abstand, hoehe = GROESSE.get(mob, (4, 2.6))
        for bez, nbt in varianten(mob):
            if x + abstand > X0 + BREITE:
                x, z, zeilen_tiefe = X0, z + zeilen_tiefe + 4, 0
            eintraege.append((mob, bez, nbt, x + abstand // 2, z, hoehe, boden))
            x += abstand
            zeilen_tiefe = max(zeilen_tiefe, abstand)
    hallen.append((titel, farbe, z_anfang - 3, z + zeilen_tiefe + 3, HALLENHOEHE[titel]))
    z += zeilen_tiefe + 14
z_ende = z

x1, x2 = X0 - 4, X0 + BREITE + 4
z1 = Z0 - 6

# ---------- Geschoss-Galerie (Pascal 28.10.): Schützen als Statuen, per Klick schießen sie auf eine Zielscheibe – ohne Kampf ----------
GZ = z_ende + 4                   # Statuenreihe; Ziele 18 Blöcke südlich
# (Mob als Statue, Bezeichnung, Befehle: {x} {y} {z} = Mündung, {y0} = Boden, {zk} = Punkte auf der Linie zum Ziel, {w} = Verzögerung, {nr} = Station)
SCHUESSE = [
    ("skeleton", "Skelett – Pfeil", ["summon minecraft:arrow {x} {y} {z} {{Motion:[0.0,0.15,2.0],pickup:0b}}"]),
    ("stray", "Eiswanderer – Langsamkeitspfeil",
     ['summon minecraft:arrow {x} {y} {z} {{Motion:[0.0,0.15,2.0],pickup:0b,item:{{id:"minecraft:tipped_arrow",count:1,components:{{"minecraft:potion_contents":{{potion:"minecraft:slowness"}}}}}}}}']),
    ("bogged", "Sumpfskelett – Giftpfeil",
     ['summon minecraft:arrow {x} {y} {z} {{Motion:[0.0,0.15,2.0],pickup:0b,item:{{id:"minecraft:tipped_arrow",count:1,components:{{"minecraft:potion_contents":{{potion:"minecraft:poison"}}}}}}}}']),
    ("pillager", "Plünderer – Armbrust/Feuerwerk",
     ["summon minecraft:arrow {x} {y} {z} {{Motion:[0.0,0.1,2.5],pickup:0b}}",
      'summon minecraft:firework_rocket {x} {y} {z} {{ShotAtAngle:1b,Motion:[0.0,0.05,1.5],FireworksItem:{{id:"minecraft:firework_rocket",count:1,'
      'components:{{"minecraft:fireworks":{{explosions:[{{shape:"burst",colors:[I;16711680,16777215]}}]}}}}}}}}']),
    ("piglin", "Piglin – Armbrust", ["summon minecraft:arrow {x} {y} {z} {{Motion:[0.0,0.1,2.5],pickup:0b}}"]),
    ("drowned", "Ertrunkener – Dreizack", ["summon minecraft:trident {x} {y} {z} {{Motion:[0.0,0.15,2.0],pickup:0b}}"]),
    ("blaze", "Lohe – 3 Feuerkugeln", ["summon minecraft:small_fireball {x} {y} {z} {{Motion:[0.0,0.0,1.0],acceleration_power:0.1d}}",
                                       "summon minecraft:small_fireball {x} {y_plus} {z} {{Motion:[0.05,0.0,1.0],acceleration_power:0.1d}}",
                                       "summon minecraft:small_fireball {x} {y} {z} {{Motion:[-0.05,0.0,1.0],acceleration_power:0.1d}}"]),
    ("ghast", "Ghast – Feuerball", ["summon minecraft:fireball {x} {y} {z} {{Motion:[0.0,0.0,1.0],acceleration_power:0.1d,ExplosionPower:1b}}"]),
    ("wither", "Wither – schwarzer und blauer Schädel", ["summon minecraft:wither_skull {x} {y} {z} {{Motion:[0.0,0.0,1.0],acceleration_power:0.1d}}",
                                                       "summon minecraft:wither_skull {x} {y_plus} {z} {{Motion:[0.0,0.0,0.6],acceleration_power:0.05d,dangerous:1b}}"]),
    ("ender_dragon", "Enderdrache – Drachenatem", ["summon minecraft:dragon_fireball {x} {y} {z} {{Motion:[0.0,0.0,1.0],acceleration_power:0.1d}}"]),
    ("breeze", "Breeze – Windladung", ["summon minecraft:breeze_wind_charge {x} {y} {z} {{Motion:[0.0,0.0,1.0],acceleration_power:0.1d}}"]),
    ("shulker", "Shulker – Lenkgeschoss", ["summon minecraft:shulker_bullet {x} {y} {z} {{Tags:[\"zoo_kugel\"]}}",
                                          "data modify entity @e[type=minecraft:shulker_bullet,tag=zoo_kugel,limit=1,sort=nearest] Target set from entity @e[tag=zoo_ziel_{nr},limit=1] UUID",
                                          "tag @e[type=minecraft:shulker_bullet,tag=zoo_kugel] remove zoo_kugel"]),
    ("evoker", "Magier – Fangzähne", ["summon minecraft:evoker_fangs {x} {y0} {zk} {{Warmup:{w}}}"]),
    ("witch", "Hexe – Wurftrank", ['summon minecraft:splash_potion {x} {y} {z} {{Motion:[0.0,0.3,1.0],Item:{{id:"minecraft:splash_potion",count:1,'
                                   'components:{{"minecraft:potion_contents":{{potion:"minecraft:harming"}}}}}}}}']),
    ("llama", "Lama – Spucke", ["summon minecraft:llama_spit {x} {y} {z} {{Motion:[0.0,0.1,1.5]}}"]),
    ("snow_golem", "Schneegolem – Schneeball", ["summon minecraft:snowball {x} {y} {z} {{Motion:[0.0,0.2,1.5]}}"]),
    ("warden", "Warden – Schallschlag", ["particle minecraft:sonic_boom {x} {y} {zk} 0 0 0 0 1 force",
                                         "playsound minecraft:entity.warden.sonic_boom hostile @a {x} {y} {z} 2"]),
]
STATION = 8
gx1 = X0 - 4
schuesse = {}
for nr, (mob, bez, befehle) in enumerate(SCHUESSE):
    sx = X0 + 4 + nr * STATION
    mx, my, mz = mitte(sx), Y + 1.5, mitte(GZ) + 1.2
    zz = GZ + 18
    zeilen = []
    for b in befehle:
        if "{zk}" in b:                                        # Linie von der Mündung bis zum Ziel (Fangzähne, Schallschlag)
            for k in range(2, 18):
                zeilen.append(b.format(x=mx, y=my, y0=Y, z=mz, zk=mitte(GZ + k), w=k * 2, nr=nr, y_plus=my + 0.5))
                if "playsound" in b:
                    break
        else:
            zeilen.append(b.format(x=mx, y=my, y0=Y, z=mz, nr=nr, y_plus=my + 0.5))
    schuesse[mob] = (bez, zeilen)
    if mob == "ender_dragon":
        aufbau.append(f"setblock {sx} {Y} {GZ} minecraft:dragon_head[rotation=0]")
    else:
        aufbau.append(f"summon minecraft:{mob} {mitte(sx)} {Y} {mitte(GZ)}")
        aufbau.append(f"execute positioned {mitte(sx)} {Y} {mitte(GZ)} run data merge entity @e[type=minecraft:{mob},tag=!zoo,distance=..1,limit=1,sort=nearest] "
                      "{Tags:[\"zoo\",\"zoo_galerie\"],NoAI:1b,PersistenceRequired:1b,Invulnerable:1b,Silent:1b,Rotation:[0f,0f]}")
    # Ziel: Zielscheiben-Block auf Heuballen, davor ein unverwundbarer Rüstungsständer (Shulker-Kugel braucht ein Ziel-Entity)
    aufbau += [f"setblock {sx} {Y} {zz} minecraft:hay_block", f"setblock {sx} {Y + 1} {zz} minecraft:target",
               f"summon minecraft:armor_stand {mitte(sx)} {Y} {mitte(zz - 1)} {{Tags:[\"zoo\",\"zoo_ziel_{nr}\"],Invulnerable:1b,NoGravity:1b,Rotation:[180f,0f]}}",
               f"summon minecraft:text_display {mitte(sx)} {Y + 3.2} {mitte(GZ)} {{Tags:[\"zoo\"],billboard:\"center\",text:{json.dumps(bez, ensure_ascii=False)},background:1073741824}}"]
gx2 = X0 + 4 + STATION * len(SCHUESSE)
GALERIE_ENDE = GZ + 22
z2 = GALERIE_ENDE + 2

# ---------- Plattform (Streifen à 60: fill ≤ 32.768 Blöcke, forceload ≤ 256 Chunks je Befehl) ----------
xr = max(x2, gx2 + 4)
for zs in range(z1, z2 + 1, 60):
    ze = min(zs + 59, z2)
    aufbau.insert(0, f"forceload add {x1} {zs} {xr} {ze}")
    aufbau.insert(1, f"fill {x1} {Y - 1} {zs} {xr} {Y - 1} {ze} minecraft:smooth_quartz")
    abbau.append(f"fill {x1} {Y - 1} {zs} {xr} {Y - 1} {ze} minecraft:grass_block")
    abbau.append(f"forceload remove {x1} {zs} {xr} {ze}")


def kasten_leeren(xa, xb, za, zb, ya, yb):
    """Bereich in fill-tauglichen Scheiben leeren (≤ 32.768 Blöcke)"""
    zeilen = []
    tiefe = max(1, 32000 // ((xb - xa + 1) * (yb - ya + 1)))
    for zs in range(za, zb + 1, tiefe):
        zeilen.append(f"fill {xa} {ya} {zs} {xb} {yb} {min(zs + tiefe - 1, zb)} minecraft:air")
    return zeilen


# ---------- Ausstellungshallen (Pascal 28.10.): je Bereich ein Flügel mit Dach (Untote brennen nicht mehr), weihnachtlich ----------
for titel, farbe, za, zb, h in (hallen if EIGENE_HALLEN else []):
    oben = Y + h
    aufbau += [
        # Wände: Fichtenholz, Fensterband aus Glasscheiben, rotes Band (Weihnachten) unter dem Dach
        f"fill {x1} {Y} {za} {x2} {oben} {za} minecraft:spruce_planks", f"fill {x1} {Y} {zb} {x2} {oben} {zb} minecraft:spruce_planks",
        f"fill {x1} {Y} {za} {x1} {oben} {zb} minecraft:spruce_planks", f"fill {x2} {Y} {za} {x2} {oben} {zb} minecraft:spruce_planks",
        f"fill {x1} {Y + 2} {za} {x2} {oben - 2} {za} minecraft:glass_pane replace minecraft:spruce_planks",
        f"fill {x1} {Y + 2} {zb} {x2} {oben - 2} {zb} minecraft:glass_pane replace minecraft:spruce_planks",
        f"fill {x2} {Y + 2} {za} {x2} {oben - 2} {zb} minecraft:glass_pane replace minecraft:spruce_planks",
        f"fill {x1} {oben - 1} {za} {x2} {oben - 1} {za} minecraft:red_wool", f"fill {x1} {oben - 1} {zb} {x2} {oben - 1} {zb} minecraft:red_wool",
        f"fill {x1} {oben - 1} {za} {x1} {oben - 1} {zb} minecraft:red_wool", f"fill {x2} {oben - 1} {za} {x2} {oben - 1} {zb} minecraft:red_wool",
        # Eingang im Westen (zum Spawn), 5 breit, 4 hoch
        f"fill {x1} {Y} {za + 2} {x1} {Y + 3} {za + 6} minecraft:air",
    ]
    # Dach in Streifen: Fichtenholz, darauf Schnee; Deckenlicht (Seelaterne) alle 6 Blöcke
    for zs in range(za, zb + 1, 40):
        ze = min(zs + 39, zb)
        aufbau += [f"fill {x1} {oben + 1} {zs} {x2} {oben + 1} {ze} minecraft:spruce_planks",
                   f"fill {x1} {oben + 2} {zs} {x2} {oben + 2} {ze} minecraft:snow[layers=2]"]
    for lx in range(x1 + 3, x2 - 1, 6):
        for lz in range(za + 3, zb - 1, 6):
            aufbau.append(f"setblock {lx} {oben + 1} {lz} minecraft:sea_lantern")
    abbau += kasten_leeren(x1, x2, za, zb, Y, oben + 2)

for titel, unter, farbe, wx, wz in wegweiser:
    t = json.dumps({"text": titel, "color": farbe, "bold": True, "extra": [{"text": chr(10) + unter, "color": "gray", "bold": False}]}, ensure_ascii=False)
    trafo = "transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2f,2f,2f]}"
    aufbau.append(f"fill {wx - 1} {Y - 1} {wz - 1} {wx + 1} {Y - 1} {wz + 1} minecraft:gold_block")
    aufbau.append(f'summon minecraft:text_display {mitte(wx)} {Y + 3} {mitte(wz)} {{Tags:["zoo"],billboard:"vertical",text:{t},background:1073741824,{trafo}}}')
    # Wegweiser draußen vor dem Eingang
    aufbau.append(f'summon minecraft:text_display {mitte(x1 - 3)} {Y + 3} {mitte(wz + 2)} {{Tags:["zoo"],billboard:"vertical",text:{t},background:1073741824,{trafo}}}')

gemeinsam = "Tags:[\"zoo\"],NoAI:1b,PersistenceRequired:1b,Invulnerable:1b,Rotation:[0f,0f]"
for mob, bez, nbt, ex, ez, hoehe, boden in eintraege:
    if mob in WASSER:
        aufbau.append(f"fill {ex - 1} {Y} {ez - 1} {ex + 1} {Y + 2} {ez + 1} minecraft:glass hollow")
        aufbau.append(f"fill {ex} {Y} {ez} {ex} {Y + 1} {ez} minecraft:water")
    else:
        aufbau.append(f"setblock {ex} {Y - 1} {ez} {boden}")
    # ohne NBT beschwören (dann wählt Vanilla Ausrüstung und Grundwerte), danach unsere Werte setzen
    aufbau.append(f"summon minecraft:{mob} {mitte(ex)} {Y} {mitte(ez)}")
    zusatz = gemeinsam + ("," + nbt if nbt else "")
    aufbau.append(f"execute positioned {mitte(ex)} {Y} {mitte(ez)} run data merge entity @e[type=minecraft:{mob},tag=!zoo,distance=..1,limit=1,sort=nearest] {{{zusatz}}}")
    text = name(mob) + (f" – {bez}" if bez else "")
    aufbau.append(f"summon minecraft:text_display {mitte(ex)} {Y + hoehe} {mitte(ez)} {{Tags:[\"zoo\"],billboard:\"center\",text:{json.dumps(text, ensure_ascii=False)},background:1073741824}}")

# ---------- Arena (Pascal 28.10.: erkennbar machen): Schneeboden, sichtbarer Rand aus Packeis, Schild; Barrieren als unsichtbare Wand bleiben ----------
ax, ay, az = ARENA
arena_text = json.dumps({"text": "Kampf-Arena", "color": "red", "bold": True,
                         "extra": [{"text": chr(10) + "/function zoo:menue – Mob live beschwören", "color": "gray", "bold": False}]}, ensure_ascii=False)
aufbau += [
    f"forceload add {ax - 31} {az - 31} {ax + 31} {az + 31}",
    f"fill {ax - 31} {ay - 1} {az - 31} {ax + 31} {ay - 1} {az + 31} minecraft:snow_block",
    f"fill {ax - 31} {ay} {az - 31} {ax + 31} {ay + 1} {az - 31} minecraft:packed_ice",
    f"fill {ax - 31} {ay} {az + 31} {ax + 31} {ay + 1} {az + 31} minecraft:packed_ice",
    f"fill {ax - 31} {ay} {az - 31} {ax - 31} {ay + 1} {az + 31} minecraft:packed_ice",
    f"fill {ax + 31} {ay} {az - 31} {ax + 31} {ay + 1} {az + 31} minecraft:packed_ice",
    f"fill {ax - 31} {ay + 2} {az - 31} {ax + 31} {ay + 40} {az - 31} minecraft:barrier",
    f"fill {ax - 31} {ay + 2} {az + 31} {ax + 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax - 31} {ay + 2} {az - 31} {ax - 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax + 31} {ay + 2} {az - 31} {ax + 31} {ay + 40} {az + 31} minecraft:barrier",
    f"fill {ax - 31} {ay + 41} {az - 31} {ax + 31} {ay + 41} {az + 31} minecraft:barrier",
    f"setblock {ax} {ay - 1} {az + 20} minecraft:gold_block",
    f'summon minecraft:text_display {mitte(ax)} {ay + 5} {mitte(az + 33)} {{Tags:["zoo"],billboard:"vertical",text:{arena_text},background:1073741824,'
    "transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[3f,3f,3f]}}",
    "tellraw @a {\"text\":\"Zoo aufgebaut: zoo:menue (Arena), zoo:galerie (Geschosse), zoo:nacht/zoo:tag, zoo:neu\",\"color\":\"gold\"}",
]
# Entfernen ohne Tod-Effekte (Leitung 28.10.: kill ließ Slimes/Magmawürfel sich teilen, dazu Drops und XP): in den Void teleportieren,
# dort sterben sie sofort; was dabei entsteht, fällt ebenfalls ins Nichts. Erst Größe 0, damit wirklich nichts mehr aufteilt
WEG = ["execute as @e[tag={t},type=minecraft:slime] run data merge entity @s {{Size:0}}",
       "execute as @e[tag={t},type=minecraft:magma_cube] run data merge entity @s {{Size:0}}",
       "execute as @e[tag={t}] at @s run tp @s ~ -500 ~"]


def weg(tag):
    return [w.format(t=tag) for w in WEG]


abbau = weg("zoo") + weg("zoo_live") + kasten_leeren(ax - 31, ax + 31, az - 31, az + 31, ay, ay + 41) + \
        kasten_leeren(gx1, xr, GZ - 2, GALERIE_ENDE, Y, Y + 4) + abbau + \
        [f"fill {ax - 31} {ay - 1} {az - 31} {ax + 31} {ay - 1} {az + 31} minecraft:grass_block", f"forceload remove {ax - 31} {az - 31} {ax + 31} {az + 31}"]

pack = ZIEL / "zoo"
if pack.exists():
    shutil.rmtree(pack)
f = pack / "data" / "zoo" / "function"
(f / "live").mkdir(parents=True)
(f / "schuss").mkdir(parents=True)
(pack / "pack.mcmeta").write_text(json.dumps({"pack": {"description": "Mob-Zoo – NUR Testnetz (Pascal 28.10.)", "min_format": 121, "max_format": 121}},
                                             ensure_ascii=False, indent=2), encoding="utf-8")


def schreiben(name, zeilen):
    (f / f"{name}.mcfunction").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


# forceload lädt die Chunks erst in den nächsten Ticks → erst laden, dann nach 5 s bauen (sonst „Position nicht geladen“)
laden = [b for b in aufbau if b.startswith("forceload")]
schreiben("aufbau", laden + ["tellraw @a {\"text\":\"Zoo: Chunks werden geladen, Aufbau in 5 s …\",\"color\":\"gray\"}", "schedule function zoo:aufbau2 100t"])
# Hülle von außen (Spawn & Welt): Funktions-Tag #zoo:halle läuft nach dem Aufbau; Maße stehen in README → Ausstellungshallen
schreiben("aufbau2", ["gamerule mob_griefing false"] + [b for b in aufbau if not b.startswith("forceload")] + ["function #zoo:halle"])
(pack / "data" / "zoo" / "tags" / "function").mkdir(parents=True, exist_ok=True)
(pack / "data" / "zoo" / "tags" / "function" / "halle.json").write_text('{"values": []}
', encoding="utf-8")
schreiben("abbau", abbau)
schreiben("neu", ["function zoo:abbau", "function zoo:aufbau"])
schreiben("hin", [f"execute in minecraft:overworld run tp @s {X0 - 8} {Y} {mitte(Z0 + 4)} -90 0", "gamemode creative @s"])
schreiben("nacht", ["time set 18000", "gamerule advance_time false", "tellraw @s {\"text\":\"Zoo: Nacht, Zeit angehalten (zoo:tag hebt das auf)\",\"color\":\"gray\"}"])
schreiben("tag", ["time set 6000", "gamerule advance_time true"])
# Arena: Pascal im Überleben mit Schutz, damit Mobs ihn angreifen (im Kreativ greifen Mobs nicht an)
schreiben("schutz", ["gamemode survival @s", "effect give @s minecraft:resistance infinite 4 true", "effect give @s minecraft:regeneration infinite 4 true",
                     "effect give @s minecraft:saturation infinite 0 true", "effect give @s minecraft:fire_resistance infinite 0 true",
                     "effect give @s minecraft:water_breathing infinite 0 true",
                     "tellraw @s {\"text\":\"Schutz an (Überleben, Resistenz V): Mobs greifen dich an, Schaden kommt nicht durch. zoo:schutz_aus beendet\",\"color\":\"gray\"}"])
schreiben("schutz_aus", ["effect clear @s", "gamemode creative @s"])
schreiben("arena", [f"execute in minecraft:overworld run tp @s {ax} {ay} {az + 20} 180 0", "function zoo:schutz"])
schreiben("arena_leeren", weg("zoo_live") + ["tellraw @s {\"text\":\"Arena geleert\",\"color\":\"gray\"}"])
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
        schreiben(f"live/{mob}", [f"function zoo:arena",
                                  f"summon minecraft:{mob} {ax} {ay + (12 if mob in ('ghast', 'happy_ghast', 'phantom', 'vex', 'wither') else 0)} {az - 10} {{Tags:[\"zoo_live\"],PersistenceRequired:1b}}"])
    menue.append("tellraw @s {\"text\":\"  ▶ " + name(mob) + "\",\"color\":\"aqua\",\"click_event\":{\"action\":\"run_command\",\"command\":\"/function zoo:live/" + mob + "\"}}")
schreiben("menue", menue)
# Nachmessen (Fehler vom 28.10.: Mobs neben dem Podest): zählt Zoo-Mobs, die weder auf einem Podest (Beton) noch im Wasserwürfel stehen
schreiben("pruefen", [
    "scoreboard objectives add zoo_pruef dummy",
    "execute store result score #mobs zoo_pruef if entity @e[tag=zoo,tag=!zoo_galerie,type=!minecraft:text_display,type=!minecraft:armor_stand]",
    "execute store result score #falsch zoo_pruef run execute as @e[tag=zoo,tag=!zoo_galerie,type=!minecraft:text_display,type=!minecraft:armor_stand] at @s "
    "unless block ~ ~-1 ~ minecraft:lime_concrete unless block ~ ~-1 ~ minecraft:red_concrete unless block ~ ~-1 ~ minecraft:purple_concrete "
    "unless block ~ ~ ~ minecraft:water",
    "tellraw @a [{\"text\":\"Zoo-Prüfung: \",\"color\":\"gold\"},{\"score\":{\"name\":\"#mobs\",\"objective\":\"zoo_pruef\"}},{\"text\":\" Mobs, davon nicht auf Podest/Wasser: \"},"
    "{\"score\":{\"name\":\"#falsch\",\"objective\":\"zoo_pruef\"},\"color\":\"red\"}]",
    "execute as @e[tag=zoo,tag=!zoo_galerie,type=!minecraft:text_display,type=!minecraft:armor_stand] at @s unless block ~ ~-1 ~ minecraft:lime_concrete "
    "unless block ~ ~-1 ~ minecraft:red_concrete unless block ~ ~-1 ~ minecraft:purple_concrete unless block ~ ~ ~ minecraft:water run say Nicht auf dem Podest",
])

# Geschoss-Galerie: je Schütze eine Funktion, Menü im Chat, Dauerfeuer an/aus (alle 4 s alle Stationen)
galerie = [f"tellraw @s {{\"text\":\"Geschoss-Galerie – anklicken zum Schießen, zoo:galerie_dauer schaltet Dauerfeuer an/aus\",\"color\":\"gold\"}}",
           "tellraw @s {\"text\":\"  ▶ hinfliegen\",\"color\":\"yellow\",\"click_event\":{\"action\":\"run_command\",\"command\":\"/function zoo:galerie_hin\"}}"]
for mob, (bez, zeilen) in schuesse.items():
    schreiben(f"schuss/{mob}", zeilen)
    galerie.append("tellraw @s {\"text\":\"  ▶ " + bez + "\",\"color\":\"aqua\",\"click_event\":{\"action\":\"run_command\",\"command\":\"/function zoo:schuss/" + mob + "\"}}")
schreiben("galerie", galerie)
schreiben("galerie_hin", [f"execute in minecraft:overworld run tp @s {mitte(gx1 + 2)} {Y} {mitte(GZ + 9)} -90 0"])
schreiben("galerie_runde", [f"function zoo:schuss/{m}" for m in schuesse] + ["execute if score #dauer zoo_galerie matches 1 run schedule function zoo:galerie_runde 80t"])
schreiben("galerie_dauer", ["scoreboard objectives add zoo_galerie dummy",
                            "execute if score #dauer zoo_galerie matches 1 run return run function zoo:galerie_dauer_aus",
                            "scoreboard players set #dauer zoo_galerie 1", "function zoo:galerie_runde",
                            "tellraw @s {\"text\":\"Dauerfeuer an (alle 4 s); zoo:galerie_dauer schaltet aus\",\"color\":\"gray\"}"])
schreiben("galerie_dauer_aus", ["scoreboard players set #dauer zoo_galerie 0", "schedule clear zoo:galerie_runde",
                                "tellraw @s {\"text\":\"Dauerfeuer aus\",\"color\":\"gray\"}"])

print(f"zoo: {len(mobs)} Mobs, {len(eintraege)} Podeste, Hallen {[(h[0], h[2], h[3]) for h in hallen]}, Galerie z {GZ}…{GALERIE_ENDE} "
      f"({len(SCHUESSE)} Schützen), Fläche x {x1}…{xr}, z {z1}…{z2}, Arena {ARENA} → {pack}")
