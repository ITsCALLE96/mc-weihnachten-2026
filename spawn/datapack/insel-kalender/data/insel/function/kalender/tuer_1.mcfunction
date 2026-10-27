execute unless score #tag insel_kalender matches 1.. run return run tellraw @s {"text":"Türchen 1 öffnet am 1. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_1] run return run tellraw @s {"text":"Türchen 1 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_1
give @s minecraft:cookie 64
tellraw @s [{"text":"Türchen 1 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 1.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
