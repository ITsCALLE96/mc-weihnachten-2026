#!/usr/bin/env python3
"""Bauarchiv der Testwelt (Pascal 28.10.): eine begehbare Welt, in der alles schon gebaut steht – wie im SMP: unten die Flachwelt, darüber an
derselben Stelle wie im SMP die schwebende Spark-Insel mit Deko und Kalenderwand, daneben die Weihnachtsinsel; Hub-Ausschnitt, Deko und Mob-Zoo
in Sichtweite. Das Datapack „archiv“ baut Platz und Schilder und ruft die Inhalte; das Menü an der Ender-Kiste teleportiert nur als Abkürzung.
Inhalte liefern andere Datapacks über Funktions-Tags:
    data/archiv/tags/function/saal/<name>.json  → {"values": ["weihnachtsinsel:archiv"]}
Jede eingetragene Funktion läuft mit `execute positioned <Ursprung>`; Bauten an Original-Koordinaten (Spark, Weihnachtsinsel) dürfen absolut bauen.
Fremde Bauten (Spark, Fantasy Village, CA12) kommen nur aus spawn/quellen in ein git-ignoriertes Datapack der Testwelt, nie ins Repo.
NUR Testwelt (Testnetz, später ggf. Admin-Instanz auf VM200).

Aufruf: python -I server/testwelt/archiv.py <testwelt-ordner>
  schreibt <testwelt>/world/datapacks/archiv und ergänzt plugins/Serverwahl/config.yml um kisten/kategorien „archiv“"""
import json
import math
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
TW = Path(sys.argv[1])
BODEN = -60          # Superflat: Gras auf −61, stehen auf −60

# Bereiche (Name = Tag-Name): Ursprung (x, y, z) für die Inhalte und Startpunkt fürs Menü „x y z yaw pitch“ (Schild steht 2 Blöcke davor).
# Spark und Weihnachtsinsel stehen an ihren SMP-Koordinaten (Spark um 0/48 ab y 150, Weihnachtsinsel am Nordweg um −1/−34),
# damit dieselben Bau-Funktionen passen. Neue Bereiche anhängen und so legen, dass man alles zu Fuß bzw. im Flug sieht.
SAELE = [
    # Spawn & Welt 28.10. (45859c8): beide Inseln 152 Blöcke tiefer als im SMP (Laufhöhe y 4…5), Glas-Treppenturm östlich der Brücke (Eingang 4/−60/3),
    # nur noch eine Weihnachtsinsel, Stufen 1–4 per Schalter oben am Turm-Absatz
    ("spark", "Spark-Insel (Spawn)", "Spawn-Insel mit Deko und Kalenderwand", "SPRUCE_SAPLING", (0, 4, 48), "0 5 48 180 0"),
    ("weihnachtsinsel", "Weihnachtsinsel", "Insel am Nordweg, Stufen 1–4 per Schalter am Turm-Absatz", "NETHER_STAR", (-1, 4, -34), "-1 3 -20 180 0"),
    ("hub", "Hub-Ausschnitt", "Fantasy Village rund um die Kisten", "ENDER_CHEST", (-250, BODEN, 150), "-250 -60 180 180 0"),
    ("zoo", "Mob-Zoo", "Friedlich · Feindlich · Bosse, offen, in Angriffspose; Kampf-Ecke", "SPAWNER", (90, BODEN, 25), "30 -60 -53 -90 0"),  # Ursprung = Mitte (Wegweiser), Ecke 40/−55
    ("deko", "Deko und Kalender-Items", "Deko-Modelle, Kalender-Items in Rahmen und auf Rüstungsständern", "ITEM_FRAME", (0, BODEN, 150), "0 -60 180 180 0"),
]

# Wegweiser-Text am Spawn (Standard: Himmelsrichtung und Entfernung)
HINWEIS = {
    "spark": "Süden, 48 m · Treppenturm 6 m östlich",
    "weihnachtsinsel": "Norden · über den Treppenturm",
}

pack = TW / "world" / "datapacks" / "archiv"
f = pack / "data" / "archiv" / "function"
(f / "saal").mkdir(parents=True, exist_ok=True)
(pack / "data" / "archiv" / "tags" / "function" / "saal").mkdir(parents=True, exist_ok=True)
(pack / "pack.mcmeta").write_text(json.dumps({"pack": {"description": "Bauarchiv der Testwelt (Pascal 28.10.)", "min_format": 121, "max_format": 121}},
                                             ensure_ascii=False, indent=2), encoding="utf-8")


def schreiben(name, zeilen):
    (f / f"{name}.mcfunction").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


def schild(x, y, z, text, unter=""):
    t = json.dumps({"text": text, "color": "gold", "bold": True, "extra": [{"text": ("\n" + unter) if unter else "", "color": "gray", "bold": False}]},
                   ensure_ascii=False)
    return (f'summon minecraft:text_display {x + 0.5} {y} {z + 0.5} {{Tags:["archiv"],billboard:"vertical",text:{t},background:1073741824,'
            f'transformation:{{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2f,2f,2f]}}}}')


def startpunkt(tp):
    return tuple(int(float(v)) for v in tp.split()[:3])


# Platz am Boden südlich unter der Insel: Quarzfläche, Menü-Kiste, Schild.
# Menü-Kisten generell mit der Vorderseite nach SÜDEN (Pascal 28.10.): wer sie öffnet, steht davor und schaut nach Norden
platz = ["kill @e[type=minecraft:text_display,tag=archiv]",
         f"fill -8 {BODEN - 1} -8 8 {BODEN - 1} 8 minecraft:smooth_quartz",
         f"setblock 0 {BODEN} -3 minecraft:ender_chest[facing=south]",
         schild(0, BODEN + 2, -4, "Bauarchiv", "Ender-Kiste: Bereiche · /hub zurück"),
         f"setworldspawn 0 {BODEN} 0"]
# Wegweiser am Spawn (Pascal 28.10.): je Bereich ein Schild im Kreis um den Spawn, in Richtung des Bereichs, mit Himmelsrichtung, Entfernung, Höhe
belegt = set()
for name, titel, _, _, (tx, ty, tz), _ in SAELE:
    dist = math.hypot(tx, tz)
    r = 6
    wx, wz = round(tx / dist * r), round(tz / dist * r)
    # gleiche Richtung (z. B. Spark und Deko im Süden) oder im Glas-Treppenturm (Kern 6/0, Spawn & Welt): weiter außen
    while (wx, wz) in belegt or (1 <= wx <= 11 and -5 <= wz <= 5):
        r += 4
        wx, wz = round(tx / dist * r), round(tz / dist * r)
    belegt.add((wx, wz))
    winkel = (math.degrees(math.atan2(tx, -tz)) + 360) % 360          # 0 = Norden, 90 = Osten
    richtung = ["Norden", "Nordosten", "Osten", "Südosten", "Süden", "Südwesten", "Westen", "Nordwesten"][round(winkel / 45) % 8]
    zusatz = HINWEIS.get(name, f"{richtung}, {round(dist)} m")
    platz.append(schild(wx, BODEN + 2, wz, f"{titel} →", zusatz))

for name, titel, unter, _, (x, y, z), tp in SAELE:
    tx, ty, tz = startpunkt(tp)
    schreiben(f"saal/{name}", [
        # Schild 3 Blöcke vor dem Startpunkt in Blickrichtung (yaw 0 = Süden, 180 = Norden, −90 = Osten)
        schild(tx + round(-math.sin(math.radians(float(tp.split()[3]))) * 3), ty + 3,
               tz + round(math.cos(math.radians(float(tp.split()[3]))) * 3), titel, unter),
        f"execute positioned {x} {y} {z} run function #archiv:saal/{name}"])
    tag = pack / "data" / "archiv" / "tags" / "function" / "saal" / f"{name}.json"
    if not tag.exists():
        tag.write_text(json.dumps({"values": []}, indent=2), encoding="utf-8")

# forceload lädt erst in den nächsten Ticks → laden, nach 5 s bauen. Ursprung und Startpunkt bleiben geladen; große Bauten laden ihre Fläche selbst
laden = ["forceload add -16 -16 16 16"]
for *_, (x, y, z), tp in SAELE:
    tx, _, tz = startpunkt(tp)
    laden += [f"forceload add {x - 32} {z - 32} {x + 32} {z + 32}", f"forceload add {tx - 8} {tz - 8} {tx + 8} {tz + 8}"]
schreiben("aufbau", laden + ['tellraw @a {"text":"Bauarchiv: Chunks werden geladen, Aufbau in 5 s …","color":"gray"}',
                             "schedule function archiv:aufbau2 100t"])
schreiben("aufbau2", platz + [f"function archiv:saal/{n}" for n, *_ in SAELE] +
          ['tellraw @a {"text":"Bauarchiv aufgebaut – Ender-Kiste am Spawn: Abkürzungen zu den Bereichen","color":"gold"}'])

# Einmalig nach dem Umbau 28.10.: altes Layout (Säle auf x 512…2560, Zoo bei 1984/−140) wegräumen. forceload all entfernen, neu laden macht aufbau
# ohne kill (Slimes teilen sich, Drops): in den Void teleportieren
alt = [f"execute as @e[tag={t},type=minecraft:{m}] run data merge entity @s {{Size:0}}" for t in ("zoo", "zoo_live") for m in ("slime", "magma_cube")]
alt += [f"execute as @e[tag={t}] at @s run tp @s ~ -500 ~" for t in ("zoo", "zoo_live", "archiv")]
for zs in range(-146, -18, 60):
    ze = min(zs + 59, -19)
    alt += [f"forceload add 1980 {zs} 2108 {ze}", f"fill 1980 {BODEN} {zs} 2108 {BODEN + 2} {ze} minecraft:air",
            f"fill 1980 {BODEN - 1} {zs} 2108 {BODEN - 1} {ze} minecraft:grass_block"]
alt += [f"forceload add 1953 -231 2015 -169"] + [f"fill 1953 {yy} -231 2015 {min(yy + 7, BODEN + 41)} -169 minecraft:air" for yy in range(BODEN, BODEN + 42, 8)]
alt += [f"fill 1953 {BODEN - 1} -231 2015 {BODEN - 1} -169 minecraft:grass_block"]
alt += [f"fill {x - 3} {BODEN - 1} 20 {x + 3} {BODEN - 1} 26 minecraft:grass_block" for x in (512, 1024, 1536, 2048, 2560)]
alt += ["forceload remove all", 'tellraw @a {"text":"Altes Archiv-Layout weggeräumt – jetzt function archiv:aufbau","color":"gray"}']
schreiben("umzug_aufraeumen", alt)

# serverwahl: Menü-Kiste am Spawn mit Teleport je Bereich (Abkürzung)
cfg = TW / "plugins" / "Serverwahl" / "config.yml"
text = cfg.read_text(encoding="utf-8")
text = re.sub(r"(?ms)^# >>> archiv.*?^# <<< archiv\n", "", text)
text = re.sub(r"(?m)^kisten: \[\]\n", "", text)
text = re.sub(r"(?m)^kategorien: \{\}\n", "", text)
eintraege = [f'      - {{name: {name}, anzeige: "<gold>{titel}", material: {mat}, ort: "{tp}", '
             f'beschreibung: ["<gray>{unter}", "", "<yellow>Klicken zum Hinfliegen"]}}' for name, titel, unter, mat, _, tp in SAELE]
text += ("# >>> archiv (erzeugt von server/testwelt/archiv.py, nicht von Hand ändern)\n"
         "# jeder Beitritt landet am Spawn vor der Ender-Kiste, Blick nach Norden (Pascal 28.10.: nicht an der letzten Position)\n"
         f"beitritt-ort: \"0 {BODEN} 0 180 0\"\n"
         "# jede Ender-Kiste (auch die auf der Spark-Insel) öffnet das Bauarchiv-Menü, nie das leere Vanilla-Ender-Inventar\n"
         "alle-enderkisten: archiv\n"
         "# Mob-Zoo: Angriffsposen (Tag zoo_angriff) halten\n"
         "zoo-posen: true\n"
         "# Weihnachtsmann im Iglu handelt auch hier (Ware aus weihnachtsmann.json, kopiert von testnetz/testwelt.sh)\n"
         "inselhaendler:\n  aktiv: true\n  datei: weihnachtsmann.json\n  zeitzone: Europe/Berlin\n  jukebox-radius: 48\n"
         f"kisten:\n  - {{welt: world, x: 0, y: {BODEN}, z: -3, kategorie: archiv}}\n"
         "kategorien:\n  archiv:\n    titel: \"<gold>Bauarchiv\"\n    server:\n" + "\n".join(eintraege) + "\n# <<< archiv\n")
cfg.write_text(text, encoding="utf-8")
print(f"archiv: {len(SAELE)} Bereiche → {pack}; Menü in {cfg}")
for name, titel, _, _, u, tp in SAELE:
    print(f"  {name:16} Ursprung {u}  Startpunkt {tp}  Tag #archiv:saal/{name}")
