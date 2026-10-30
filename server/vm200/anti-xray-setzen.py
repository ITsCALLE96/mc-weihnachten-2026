#!/usr/bin/env python3
"""Anti-Xray nach server/paper/anti-xray.md auf dem SMP setzen (Werte werden aus den drei YAML-Blöcken der Doku gelesen, eine Quelle):
  Overworld → config/paper-world-defaults.yml (Abschnitt anticheat.anti-xray ersetzt)
  Nether/End → world/dimensions/minecraft/{the_nether,the_end}/paper-world.yml (anticheat-Abschnitt angehängt bzw. ersetzt)
Aufruf als root auf VM200, SMP GESTOPPT:  python3 anti-xray-setzen.py <Minecraft-Ordner> <anti-xray.md>
"""
import re
import subprocess
import sys

mc, doku = sys.argv[1], sys.argv[2]
bloecke = re.findall(r"```yaml\n(.*?)```", open(doku, encoding="utf-8").read(), flags=re.S)
if len(bloecke) != 3:
    sys.exit(f"anti-xray.md: 3 YAML-Blöcke erwartet, {len(bloecke)} gefunden")
overworld, nether, end = bloecke


def abschnitt_ersetzen(text, neu):
    """ersetzt den Block „anticheat:“ (Ebene 0) samt Inhalt bzw. hängt ihn an"""
    zeilen = text.split("\n")
    try:
        start = next(i for i, z in enumerate(zeilen) if z.rstrip() == "anticheat:")
    except StopIteration:
        return text.rstrip("\n") + "\n" + neu
    ende = start + 1
    while ende < len(zeilen) and (zeilen[ende].startswith(" ") or zeilen[ende] == ""):
        ende += 1
    return "\n".join(zeilen[:start] + neu.rstrip("\n").split("\n") + zeilen[ende:])


def antixray_in_defaults(text, neu):
    """ersetzt in paper-world-defaults.yml nur anticheat.anti-xray (Rest von anticheat bleibt)"""
    zeilen = text.split("\n")
    start = next(i for i, z in enumerate(zeilen) if z.rstrip() == "  anti-xray:")
    ende = start + 1
    while ende < len(zeilen) and (zeilen[ende].startswith("    ") or zeilen[ende] == ""):
        ende += 1
    teil = [z for z in neu.rstrip("\n").split("\n") if z.rstrip() != "anticheat:"]
    return "\n".join(zeilen[:start] + teil + zeilen[ende:])


ziele = [
    (f"{mc}/config/paper-world-defaults.yml", lambda t: antixray_in_defaults(t, overworld)),
    (f"{mc}/world/dimensions/minecraft/the_nether/paper-world.yml", lambda t: abschnitt_ersetzen(t, nether)),
    (f"{mc}/world/dimensions/minecraft/the_end/paper-world.yml", lambda t: abschnitt_ersetzen(t, end)),
]
for pfad, f in ziele:
    alt = open(pfad, encoding="utf-8", newline="").read()
    open(pfad, "w", encoding="utf-8", newline="").write(f(alt))
    if sys.platform != "win32":
        subprocess.run(["chown", "amp:amp", pfad], check=True)
    print("Anti-Xray gesetzt:", pfad)
