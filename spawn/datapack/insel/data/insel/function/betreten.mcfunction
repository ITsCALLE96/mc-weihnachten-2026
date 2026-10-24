# Insel oben betreten: Sättigung nur, wenn die Abklingzeit abgelaufen ist
tag @s add insel_oben
execute unless score @s insel_satt matches 1.. run effect give @s minecraft:saturation 2 0 true
execute unless score @s insel_satt matches 1.. run scoreboard players set @s insel_satt 6000
