# Spawn schließen (vor dem Start, auch zum Proben): Ausgänge zu, kleine Weltgrenze, Merker zurück
fill -19 76 -52 -13 76 -51 minecraft:dark_oak_wood[axis=y]
fill -19 76 -53 -13 76 -53 minecraft:barrier
fill -19 77 -52 -13 77 -51 minecraft:dark_oak_wood[axis=y]
fill -19 77 -53 -13 77 -53 minecraft:barrier
fill -19 78 -52 -13 78 -51 minecraft:dark_oak_wood[axis=y]
fill -19 78 -53 -13 78 -53 minecraft:barrier
fill -19 79 -52 -13 79 -51 minecraft:dark_oak_wood[axis=y]
fill -19 79 -53 -13 79 -53 minecraft:barrier
fill -19 80 -52 -13 80 -51 minecraft:dark_oak_wood[axis=y]
fill -19 80 -53 -13 80 -53 minecraft:barrier
fill -19 81 -52 -13 81 -51 minecraft:dark_oak_wood[axis=y]
fill -19 81 -53 -13 81 -53 minecraft:barrier
fill -18 82 -52 -14 82 -51 minecraft:dark_oak_wood[axis=y]
fill -18 82 -53 -14 82 -53 minecraft:barrier
fill -17 83 -52 -15 83 -51 minecraft:dark_oak_wood[axis=y]
fill -17 83 -53 -15 83 -53 minecraft:barrier
worldborder center -16 -40
worldborder set 128
scoreboard players set #offen insel_zustand 0
scoreboard players set #countdown insel_zustand -1
bossbar remove insel:eroeffnung
say Spawn geschlossen – bereit für die Eröffnung (function insel:eroeffnung)
