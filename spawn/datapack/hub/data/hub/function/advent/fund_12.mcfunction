execute if entity @s[tag=hub_hat_12] run tellraw @s {"text":"Geschenk 12 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_12] run function hub:advent/neu_12
