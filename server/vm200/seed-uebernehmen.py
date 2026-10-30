#!/usr/bin/env python3
"""Seed einer fertig gelieferten SMP-Welt in die AMP-Einstellung übernehmen (Pascal 30.10.: neuer Zufalls-Seed, nie ausgeben, nie ins Repo).
AMP schreibt level-seed bei jedem Start aus Minecraft.WorldSeed (Standard „CubeCodersPowered“). Für eine bestehende Welt zählt zwar level.dat,
der Wert soll aber nicht irreführen und nicht verraten werden. Liest den Seed aus
world/dimensions/minecraft/overworld/data/minecraft/world_gen_settings.dat (Minecraft 26.x) und schreibt ihn ohne Ausgabe in
MinecraftModule.kvp (Minecraft.WorldSeed) und Minecraft/server.properties (level-seed).
Als root auf VM200, AMP-Hülle von MinecraftSMP01 GESTOPPT (ampinstmgr -q MinecraftSMP01), danach -s. nbt.py im selben Ordner.
"""
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nbt  # noqa: E402

I = "/home/amp/.ampdata/instances/MinecraftSMP01"
WGS = f"{I}/Minecraft/world/dimensions/minecraft/overworld/data/minecraft/world_gen_settings.dat"


def ersetzen(pfad, muster, neu):
    s = open(pfad, encoding="utf-8").read()
    s2, n = re.subn(muster, neu, s, count=1, flags=re.M)
    if n != 1:
        sys.exit(f"Schlüssel nicht gefunden in {pfad}")
    open(pfad, "w", encoding="utf-8").write(s2)


if not os.path.exists(WGS):
    sys.exit(f"Keine Welt bzw. kein {WGS}")
_, w = nbt.lesen(WGS)
seed = w["data"]["seed"][1]
ersetzen(f"{I}/MinecraftModule.kvp", r"^Minecraft\.WorldSeed=.*$", f"Minecraft.WorldSeed={seed}")
ersetzen(f"{I}/Minecraft/server.properties", r"^level-seed=.*$", f"level-seed={seed}")
subprocess.run(["chown", "amp:amp", f"{I}/MinecraftModule.kvp", f"{I}/Minecraft/server.properties"], check=True)
del seed
print("Seed aus der gelieferten Welt übernommen (nicht angezeigt)")
