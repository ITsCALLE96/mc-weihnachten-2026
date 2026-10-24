execute if entity @s[tag=hub_hat_22] run tellraw @s {"text":"Geschenk 22 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_22] run function hub:advent/neu_22
