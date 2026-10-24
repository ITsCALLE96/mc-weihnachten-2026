execute if entity @s[tag=hub_hat_19] run tellraw @s {"text":"Geschenk 19 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_19] run function hub:advent/neu_19
