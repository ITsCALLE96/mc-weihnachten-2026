execute if entity @s[tag=hub_hat_11] run tellraw @s {"text":"Geschenk 11 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_11] run function hub:advent/neu_11
