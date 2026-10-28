#!/usr/bin/env python3
"""Bauarchiv der Testwelt (Pascal 28.10.): baut das Datapack „archiv“ – Platz am Spawn mit Menü-Kiste, „Säle“ je Thema mit Schild und Startpunkt,
und erzeugt den Menü-Abschnitt für serverwahl (Teleport per Klick). Inhalte liefern andere Datapacks über Funktions-Tags:
    data/archiv/tags/function/saal/<name>.json  → {"values": ["weihnachtsinsel:archiv"]}
Jede eingetragene Funktion läuft beim Aufbau des Saals mit `execute positioned <Saal-Ursprung>` (relativ bauen, ~ ~ ~ = Saalmitte am Boden).
Fremde Bauten (Spark, Fantasy Village, CA12) kommen nur aus spawn/quellen in ein git-ignoriertes Datapack der Testwelt, nie ins Repo.
NUR Testwelt (Testnetz, später ggf. Admin-Instanz auf VM200).

Aufruf: python -I server/testwelt/archiv.py <testwelt-ordner>
  schreibt <testwelt>/world/datapacks/archiv und ergänzt plugins/Serverwahl/config.yml um kisten/kategorien „archiv“"""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
TW = Path(sys.argv[1])
BODEN = -60          # Superflat: Gras auf −61, stehen auf −60
ABSTAND = 512        # Säle liegen in einer Reihe nach Osten, je 512 Blöcke (32 Chunks) auseinander

# Neue Säle einfach anhängen (Name ist auch der Tag-Name). Reihenfolge = Position.
SAELE = [
    ("spark", "Spark-Insel (Spawn)", "Spawn-Insel mit Deko und Kalenderwand", "SPRUCE_SAPLING"),
    ("weihnachtsinsel", "Weihnachtsinsel", "Stufen 1–4 nebeneinander und die fertige Insel mit Iglu und Weihnachtsmann", "NETHER_STAR"),
    ("hub", "Hub-Ausschnitt", "Fantasy Village rund um die Kisten", "ENDER_CHEST"),
    ("zoo", "Mob-Zoo und Arena", "alle Mobs mit Varianten, Arena zum Live-Schalten", "SPAWNER"),
    ("deko", "Deko und Kalender-Items", "Deko-Modelle, Kalender-Items in Rahmen und auf Rüstungsständern", "ITEM_FRAME"),
]


def ursprung(i):
    return (ABSTAND * (i + 1), BODEN, 0)


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
    return f'summon minecraft:text_display {x}.5 {y} {z}.5 {{Tags:["archiv"],billboard:"vertical",text:{t},background:1073741824,transformation:{{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[2f,2f,2f]}}}}'


# Platz am Spawn: Quarzfläche, Menü-Kiste (serverwahl), Schild
platz = ["kill @e[type=minecraft:text_display,tag=archiv]",
         f"fill -8 {BODEN - 1} -8 8 {BODEN - 1} 8 minecraft:smooth_quartz",
         f"setblock 0 {BODEN} 3 minecraft:ender_chest[facing=north]",
         schild(0, BODEN + 2, 3, "Bauarchiv", "Ender-Kiste: Säle · /hub zurück"),
         f"setworldspawn 0 {BODEN} 0"]
for i, (name, titel, unter, _) in enumerate(SAELE):
    x, y, z = ursprung(i)
    # Chunks um Ursprung und Startpunkt bleiben geladen (forceload in archiv:aufbau); größere Bauten laden ihre Fläche selbst
    schreiben(f"saal/{name}", [
        f"fill {x - 3} {y - 1} {z + 20} {x + 3} {y - 1} {z + 26} minecraft:polished_andesite",
        schild(x, y + 3, z + 23, titel, unter),
        f"execute positioned {x} {y} {z} run function #archiv:saal/{name}"])
    tag = pack / "data" / "archiv" / "tags" / "function" / "saal" / f"{name}.json"
    if not tag.exists():
        tag.write_text(json.dumps({"values": []}, indent=2), encoding="utf-8")
# forceload lädt erst in den nächsten Ticks → laden, nach 5 s bauen
schreiben("aufbau", [f"forceload add {ursprung(i)[0] - 32} {ursprung(i)[2] - 32} {ursprung(i)[0] + 32} {ursprung(i)[2] + 32}" for i in range(len(SAELE))]
          + ["forceload add -16 -16 16 16", 'tellraw @a {"text":"Bauarchiv: Chunks werden geladen, Aufbau in 5 s …","color":"gray"}',
             "schedule function archiv:aufbau2 100t"])
schreiben("aufbau2", platz + [f"function archiv:saal/{n}" for n, *_ in SAELE] +
          ['tellraw @a {"text":"Bauarchiv aufgebaut – Ender-Kiste am Spawn öffnet die Säle","color":"gold"}'])

# serverwahl: Menü-Kiste am Spawn mit Teleport je Saal (ort: x y z yaw – Blick nach Norden auf den Saal)
cfg = TW / "plugins" / "Serverwahl" / "config.yml"
text = cfg.read_text(encoding="utf-8")
text = re.sub(r"(?ms)^# >>> archiv.*?^# <<< archiv\n", "", text)
text = re.sub(r"(?m)^kisten: \[\]\n", "", text)
text = re.sub(r"(?m)^kategorien: \{\}\n", "", text)
eintraege = []
for i, (name, titel, unter, mat) in enumerate(SAELE):
    x, y, z = ursprung(i)
    eintraege.append(f'      - {{name: {name}, anzeige: "<gold>{titel}", material: {mat}, ort: "{x} {y} {z + 24} 180 0", '
                     f'beschreibung: ["<gray>{unter}", "", "<yellow>Klicken zum Hinfliegen"]}}')
text += ("# >>> archiv (erzeugt von server/testwelt/archiv.py, nicht von Hand ändern)\n"
         f"kisten:\n  - {{welt: world, x: 0, y: {BODEN}, z: 3, kategorie: archiv}}\n"
         "kategorien:\n  archiv:\n    titel: \"<gold>Bauarchiv\"\n    server:\n" + "\n".join(eintraege) + "\n# <<< archiv\n")
cfg.write_text(text, encoding="utf-8")
print(f"archiv: {len(SAELE)} Säle → {pack}; Menü in {cfg}")
for i, (name, titel, *_ ) in enumerate(SAELE):
    print(f"  {name:16} Ursprung {ursprung(i)}  Tag #archiv:saal/{name}")
