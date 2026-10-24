tag @s add hub_hat_21
scoreboard players add @s hub_funde 1
give @s minecraft:sea_lantern[custom_name={"text":"Adventsgeschenk 21","color":"red","italic":false},lore=[{"text":"Weihnachten 2026","color":"gray","italic":false}]]
tellraw @s [{"text":"Geschenk 21 gefunden! ","color":"red","bold":true},{"text":"Gefunden: ","color":"white"},{"score":{"name":"@s","objective":"hub_funde"},"color":"gold"},{"text":" von 24","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 1 1.4
particle minecraft:happy_villager ~ ~1 ~ 0.4 0.6 0.4 0 20 normal @s
