#!/usr/bin/env python3
"""Verschiebt die festen Koordinaten der SMP-Serverwahl-Config um den Insel-Versatz (Pascal 30.10.: Insel am natürlichen Spawn des Seeds).
Aufruf: python3 versatz.py <plugins/Serverwahl/config.yml> <spawn/smp-versatz.json>
  (JSON: {"dx": <int>, "dy": <int>, "dz": <int>, "hoch": <int>, "ab": <int>}; dy, hoch (0) und ab (80) optional)
Betroffen (sonst enthält die SMP-Konfig keine Weltkoordinaten; DimensionControl, Prism, XaeroFairPlay, Voice, ArmorPoser haben keine):
  spawn-elytra.mitte "x z", spawn-elytra.weitere-zonen[].mitte / von / bis "x z", kisten[].x / y / z, portale[].von / bis "x y z"
Höhen (Spawn & Welt 31.10., Inseln höher): jede Höhe ab „ab“ der Bau-Lage bekommt dy + hoch, darunter nur dy. Das gilt für kisten[].y,
portale[]-y und spawn-elytra y-ab (oben und je Zone): Ender-Kiste 156 und y-ab 150 gehören zur Insel und wandern mit.
Läuft beim Einspielen (einspielen.sh smp) automatisch, wenn spawn/smp-versatz.json existiert.
"""
import json
import re
import sys

pfad, versatz = sys.argv[1], sys.argv[2]
v = json.load(open(versatz, encoding="utf-8"))
dx, dy, dz = int(v["dx"]), int(v.get("dy", 0)), int(v["dz"])
hoch, ab = int(v.get("hoch", 0)), int(v.get("ab", 80))
if dx == 0 and dy == 0 and dz == 0 and hoch == 0:
    sys.exit(0)

zeilen = open(pfad, encoding="utf-8", newline="").read().split("\n")
abschnitt = None
geaendert = 0


def xz(m):
    """„x z“ → verschoben"""
    x, z = int(m.group(2)), int(m.group(3))
    return f'{m.group(1)}"{x + dx} {z + dz}"'


def hy(y):
    """Höhe der Bau-Lage → Welt: ab „ab“ mit der Inselhöhe"""
    return y + dy + (hoch if y >= ab else 0)


def xyz(m):
    x, y, z = int(m.group(2)), int(m.group(3)), int(m.group(4))
    return f'{m.group(1)}"{x + dx} {hy(y)} {z + dz}"'


def plus(d):
    return lambda m: f"{m.group(1)}{int(m.group(2)) + d}"


def hoehe(m):
    return f"{m.group(1)}{hy(int(m.group(2)))}"


for i, z in enumerate(zeilen):
    if re.match(r"^[a-z-]+:", z):
        abschnitt = z.split(":")[0]
    if z.lstrip().startswith("#"):
        continue
    alt = z
    if abschnitt == "spawn-elytra":
        z = re.sub(r'((?:mitte|von|bis):\s*)"(-?\d+) (-?\d+)"', xz, z)
        z = re.sub(r"(\by-ab:\s*)(-?\d+)", hoehe, z)
    elif abschnitt == "kisten":
        z = re.sub(r"(\bx:\s*)(-?\d+)", plus(dx), z)
        z = re.sub(r"(\by:\s*)(-?\d+)", hoehe, z)
        z = re.sub(r"(\bz:\s*)(-?\d+)", plus(dz), z)
    elif abschnitt == "portale":
        z = re.sub(r'((?:von|bis):\s*)"(-?\d+) (-?\d+) (-?\d+)"', xyz, z)
    if z != alt:
        zeilen[i] = z
        geaendert += 1

open(pfad, "w", encoding="utf-8", newline="").write("\n".join(zeilen))
print(f"Versatz dx={dx} dy={dy} dz={dz} hoch={hoch} ab y {ab}: {geaendert} Zeilen in {pfad}")
