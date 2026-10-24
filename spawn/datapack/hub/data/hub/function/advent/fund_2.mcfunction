execute if entity @s[tag=hub_hat_2] run tellraw @s {"text":"Geschenk 2 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_2] run function hub:advent/neu_2
