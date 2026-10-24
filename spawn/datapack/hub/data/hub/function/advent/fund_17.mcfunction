execute if entity @s[tag=hub_hat_17] run tellraw @s {"text":"Geschenk 17 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_17] run function hub:advent/neu_17
