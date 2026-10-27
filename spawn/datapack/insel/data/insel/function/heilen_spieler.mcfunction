# Nur wenn Hunger oder Leben fehlen: kurz Sättigung I (kleinste Stufe)
execute unless score @s insel_hunger matches 20.. run return run effect give @s minecraft:saturation 1 0 true
execute unless score @s insel_leben matches 20.. run effect give @s minecraft:saturation 1 0 true
