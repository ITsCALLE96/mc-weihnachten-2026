execute if entity @s[tag=hub_hat_18] run tellraw @s {"text":"Geschenk 18 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_18] run function hub:advent/neu_18
