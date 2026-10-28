# Geschenk aus Türchen 19 ausgepackt (Fortschritt insel:kalender/geschenk): ein Zufallsgewinn
advancement revoke @s only insel:kalender/geschenk
execute store result score #geschenk insel_kalender run random value 1..5
execute if score #geschenk insel_kalender matches 1 run give @s minecraft:golden_apple 2
execute if score #geschenk insel_kalender matches 2 run give @s minecraft:golden_carrot 8
execute if score #geschenk insel_kalender matches 3 run give @s minecraft:name_tag 1
execute if score #geschenk insel_kalender matches 3 run give @s minecraft:saddle 1
execute if score #geschenk insel_kalender matches 4 run give @s minecraft:experience_bottle 16
execute if score #geschenk insel_kalender matches 5 run function insel:kalender/geschenk_5
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.6 1.8
particle minecraft:happy_villager ~ ~1.2 ~ 0.4 0.4 0.4 0 15 normal @s
tellraw @s {"text":"Frohe Weihnachten! Dein Geschenk ist ausgepackt.","color":"gold"}
