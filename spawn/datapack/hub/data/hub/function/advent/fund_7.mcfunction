execute if entity @s[tag=hub_hat_7] run tellraw @s {"text":"Geschenk 7 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_7] run function hub:advent/neu_7
