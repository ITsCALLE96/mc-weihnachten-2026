# Spawn schließen (vor dem Start, auch zum Proben): Ausgänge zu, kleine Weltgrenze, Merker zurück
worldborder center 0 0
worldborder set 80
scoreboard players set #offen insel_zustand 0
scoreboard players set #countdown insel_zustand -1
bossbar remove insel:eroeffnung
say Spawn geschlossen – bereit für die Eröffnung (function insel:eroeffnung)
