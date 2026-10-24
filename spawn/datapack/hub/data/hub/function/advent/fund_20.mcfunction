execute if entity @s[tag=hub_hat_20] run tellraw @s {"text":"Geschenk 20 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_20] run function hub:advent/neu_20
