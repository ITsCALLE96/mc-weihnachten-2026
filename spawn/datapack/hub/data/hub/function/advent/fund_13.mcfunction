execute if entity @s[tag=hub_hat_13] run tellraw @s {"text":"Geschenk 13 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_13] run function hub:advent/neu_13
