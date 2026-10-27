execute unless score #tag insel_kalender matches 10.. run return run tellraw @s {"text":"Türchen 10 öffnet am 10. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_10] run return run tellraw @s {"text":"Türchen 10 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_10
give @s minecraft:snowball 16
tellraw @s [{"text":"Türchen 10 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 2.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
