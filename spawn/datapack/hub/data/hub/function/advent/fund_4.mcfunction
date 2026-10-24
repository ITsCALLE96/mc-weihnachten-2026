execute if entity @s[tag=hub_hat_4] run tellraw @s {"text":"Geschenk 4 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_4] run function hub:advent/neu_4
