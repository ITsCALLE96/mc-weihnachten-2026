execute if entity @s[tag=hub_hat_1] run tellraw @s {"text":"Geschenk 1 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_1] run function hub:advent/neu_1
