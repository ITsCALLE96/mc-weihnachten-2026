# Spawn schließen (vor dem Start, auch zum Proben): Ausgänge zu, kleine Weltgrenze, Merker zurück
fill 15 76 -30 15 79 -28 minecraft:mangrove_roots
fill 14 76 -30 14 79 -28 minecraft:barrier
fill -51 76 -36 -51 79 -34 minecraft:mangrove_roots
fill -50 76 -36 -50 79 -34 minecraft:barrier
fill -12 76 -74 -10 79 -73 minecraft:mangrove_roots
fill -12 76 -73 -10 79 -72 minecraft:barrier
fill 12 76 -57 13 79 -55 minecraft:mangrove_roots
fill 12 76 -56 13 79 -55 minecraft:barrier
worldborder center -16 -40
worldborder set 128
scoreboard players set #offen insel_zustand 0
scoreboard players set #countdown insel_zustand -1
bossbar remove insel:eroeffnung
say Spawn geschlossen – bereit für die Eröffnung (function insel:eroeffnung)
