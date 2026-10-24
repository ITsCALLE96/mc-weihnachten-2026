execute if entity @s[tag=hub_hat_15] run tellraw @s {"text":"Geschenk 15 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_15] run function hub:advent/neu_15
