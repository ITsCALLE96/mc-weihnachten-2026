execute unless score #tag insel_kalender matches 21.. run return run tellraw @s {"text":"Türchen 21 öffnet am 21. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_21] run return run tellraw @s {"text":"Türchen 21 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_21
give @s minecraft:paper[minecraft:item_model="weihnachten:rentier",minecraft:item_name="Mini-Rentier",minecraft:lore=[{text:"Winterkalender 2026 – Tag 21",italic:false,color:"aqua"}],minecraft:max_stack_size=1] 1
tellraw @s [{"text":"Türchen 21 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -0.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
