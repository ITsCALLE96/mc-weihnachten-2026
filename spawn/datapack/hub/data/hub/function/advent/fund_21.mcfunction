execute if entity @s[tag=hub_hat_21] run tellraw @s {"text":"Geschenk 21 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_21] run function hub:advent/neu_21
