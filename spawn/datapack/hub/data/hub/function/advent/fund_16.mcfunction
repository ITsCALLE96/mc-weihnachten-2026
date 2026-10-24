execute if entity @s[tag=hub_hat_16] run tellraw @s {"text":"Geschenk 16 hast du schon gefunden.","color":"gray"}
execute unless entity @s[tag=hub_hat_16] run function hub:advent/neu_16
