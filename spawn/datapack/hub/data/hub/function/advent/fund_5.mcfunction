execute if entity @s[tag=hub_hat_5] run tellraw @s {"text":"Geschenk 5 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_5] run function hub:advent/neu_5
