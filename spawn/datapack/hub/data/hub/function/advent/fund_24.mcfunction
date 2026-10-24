execute if entity @s[tag=hub_hat_24] run tellraw @s {"text":"Geschenk 24 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_24] run function hub:advent/neu_24
