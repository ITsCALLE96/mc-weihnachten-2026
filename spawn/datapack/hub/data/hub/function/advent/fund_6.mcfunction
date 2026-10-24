execute if entity @s[tag=hub_hat_6] run tellraw @s {"text":"Geschenk 6 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_6] run function hub:advent/neu_6
