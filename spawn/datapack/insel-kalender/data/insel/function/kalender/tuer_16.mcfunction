execute unless score #tag insel_kalender matches 16.. run return run tellraw @s {"text":"Türchen 16 öffnet am 16. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_16] run return run tellraw @s {"text":"Türchen 16 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_16
give @s minecraft:paper[minecraft:item_model="weihnachten:kugel_blau",minecraft:item_name={text:"Christbaumkugel (blau)"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 16",italic:false,color:"aqua"}]] 1
tellraw @s [{"text":"Türchen 16 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -2.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
