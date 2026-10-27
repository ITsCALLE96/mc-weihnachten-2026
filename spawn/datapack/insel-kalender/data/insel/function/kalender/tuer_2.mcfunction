execute unless score #tag insel_kalender matches 2.. run return run tellraw @s {"text":"Türchen 2 öffnet am 2. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_2] run return run tellraw @s {"text":"Türchen 2 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_2
give @s minecraft:cookie[minecraft:item_model="weihnachten:zuckerstange",minecraft:item_name={text:"Zuckerstange"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 2",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.essen",fallback:"Essbar",color:"gray",italic:true}],minecraft:food={nutrition:2,saturation:1.2}] 64
tellraw @s [{"text":"Türchen 2 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -0.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
