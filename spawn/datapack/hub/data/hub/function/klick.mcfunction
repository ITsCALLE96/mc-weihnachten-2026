# Ausgelöst als das Interaction-Entity: Funktion nach Tag, ausgeführt als der klickende Spieler, dann Klick löschen
execute if entity @s[tag=hub_f_stand_1,tag=!hub_advent_zu] on target at @s run function hub:stand/1
execute if entity @s[tag=hub_f_stand_2,tag=!hub_advent_zu] on target at @s run function hub:stand/2
execute if entity @s[tag=hub_f_stand_3,tag=!hub_advent_zu] on target at @s run function hub:stand/3
execute if entity @s[tag=hub_f_stand_4,tag=!hub_advent_zu] on target at @s run function hub:stand/4
execute if entity @s[tag=hub_f_stand_5,tag=!hub_advent_zu] on target at @s run function hub:stand/5
execute if entity @s[tag=hub_f_stand_6,tag=!hub_advent_zu] on target at @s run function hub:stand/6
execute if entity @s[tag=hub_f_stand_7,tag=!hub_advent_zu] on target at @s run function hub:stand/7
execute if entity @s[tag=hub_f_stand_8,tag=!hub_advent_zu] on target at @s run function hub:stand/8
execute if entity @s[tag=hub_f_stand_voice,tag=!hub_advent_zu] on target at @s run function hub:stand/voice
data remove entity @s interaction
