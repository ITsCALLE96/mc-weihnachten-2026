execute if entity @s[tag=hub_hat_8] run tellraw @s {"text":"Geschenk 8 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_8] run function hub:advent/neu_8
