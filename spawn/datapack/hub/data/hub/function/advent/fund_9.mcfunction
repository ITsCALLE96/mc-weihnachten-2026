execute if entity @s[tag=hub_hat_9] run tellraw @s {"text":"Geschenk 9 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_9] run function hub:advent/neu_9
