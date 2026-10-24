execute if entity @s[tag=hub_hat_14] run tellraw @s {"text":"Geschenk 14 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_14] run function hub:advent/neu_14
