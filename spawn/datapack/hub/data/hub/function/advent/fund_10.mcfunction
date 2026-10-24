execute if entity @s[tag=hub_hat_10] run tellraw @s {"text":"Geschenk 10 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_10] run function hub:advent/neu_10
