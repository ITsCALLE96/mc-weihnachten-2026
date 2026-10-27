execute unless score #tag insel_kalender matches 18.. run return run tellraw @s {"text":"Türchen 18 öffnet am 18. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_18] run return run tellraw @s {"text":"Türchen 18 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_18
give @s minecraft:snowball 16
tellraw @s [{"text":"Türchen 18 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 2.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
