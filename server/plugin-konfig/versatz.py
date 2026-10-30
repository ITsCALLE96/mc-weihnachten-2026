#!/usr/bin/env python3
"""Verschiebt die festen x/z-Koordinaten der SMP-Serverwahl-Config um den Insel-Versatz (Pascal 30.10.: Insel am natürlichen Spawn des Seeds).
Aufruf: python3 versatz.py <plugins/Serverwahl/config.yml> <spawn/smp-versatz.json>   (JSON: {"dx": <int>, "dz": <int>})
Betroffen (sonst enthält die SMP-Konfig keine Weltkoordinaten; DimensionControl, Prism, XaeroFairPlay, Voice, ArmorPoser haben keine):
  spawn-elytra.mitte "x z", spawn-elytra.weitere-zonen[].mitte / von / bis "x z", kisten[].x / z, portale[].von / bis "x y z"
y bleibt. Läuft beim Einspielen (einspielen.sh smp) automatisch, wenn spawn/smp-versatz.json existiert.
"""
import json
import re
import sys

pfad, versatz = sys.argv[1], sys.argv[2]
v = json.load(open(versatz, encoding="utf-8"))
dx, dz = int(v["dx"]), int(v["dz"])
if dx == 0 and dz == 0:
    sys.exit(0)

zeilen = open(pfad, encoding="utf-8", newline="").read().split("\n")
abschnitt = None
geaendert = 0


def xz(m):
    """„x z“ → verschoben"""
    x, z = int(m.group(2)), int(m.group(3))
    return f'{m.group(1)}"{x + dx} {z + dz}"'


def xyz(m):
    x, y, z = int(m.group(2)), m.group(3), int(m.group(4))
    return f'{m.group(1)}"{x + dx} {y} {z + dz}"'


for i, z in enumerate(zeilen):
    if re.match(r"^[a-z-]+:", z):
        abschnitt = z.split(":")[0]
    if z.lstrip().startswith("#"):
        continue
    alt = z
    if abschnitt == "spawn-elytra":
        z = re.sub(r'((?:mitte|von|bis):\s*)"(-?\d+) (-?\d+)"', xz, z)
    elif abschnitt == "kisten":
        z = re.sub(r"(\bx:\s*)(-?\d+)", lambda m: f"{m.group(1)}{int(m.group(2)) + dx}", z)
        z = re.sub(r"(\bz:\s*)(-?\d+)", lambda m: f"{m.group(1)}{int(m.group(2)) + dz}", z)
    elif abschnitt == "portale":
        z = re.sub(r'((?:von|bis):\s*)"(-?\d+) (-?\d+) (-?\d+)"', xyz, z)
    if z != alt:
        zeilen[i] = z
        geaendert += 1

open(pfad, "w", encoding="utf-8", newline="").write("\n".join(zeilen))
print(f"Versatz dx={dx} dz={dz}: {geaendert} Zeilen in {pfad}")
