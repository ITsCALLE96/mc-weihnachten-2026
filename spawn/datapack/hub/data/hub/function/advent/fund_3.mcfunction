execute if entity @s[tag=hub_hat_3] run tellraw @s {"text":"Geschenk 3 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_3] run function hub:advent/neu_3
