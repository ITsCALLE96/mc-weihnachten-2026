execute unless score #tag insel_kalender matches 5.. run return run tellraw @s {"text":"Türchen 5 öffnet am 5. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_5] run return run tellraw @s {"text":"Türchen 5 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_5
give @s minecraft:cookie[minecraft:item_model="weihnachten:plaetzchen_teller",minecraft:item_name={text:"Plätzchen-Teller"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 5",italic:false,color:"aqua"}],minecraft:food={nutrition:4,saturation:4.8}] 64
tellraw @s [{"text":"Türchen 5 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -1.5 155.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
