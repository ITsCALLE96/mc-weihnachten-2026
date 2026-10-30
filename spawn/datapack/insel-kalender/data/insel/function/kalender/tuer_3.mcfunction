execute unless score #tag insel_kalender matches 3.. run return run tellraw @s {"text":"Türchen 3 ist noch zu – es öffnet an Kalendertag 3.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_3] run return run tellraw @s {"text":"Türchen 3 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_3
give @s minecraft:paper[minecraft:item_model="weihnachten:kugel_rot",minecraft:item_name={text:"Christbaumkugel (rot)"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 3",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.deko",fallback:"Deko: in einen Rahmen hängen",color:"gray",italic:true},{translate:"item.weihnachten.kalender.hinweis.deko2",fallback:"oder einem Rüstungsständer aufsetzen",color:"gray",italic:true}]] 1
give @s minecraft:experience_bottle 4
tellraw @s [{"text":"Türchen 3 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 2.5 156.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
