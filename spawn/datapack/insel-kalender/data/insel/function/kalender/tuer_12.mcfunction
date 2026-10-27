execute unless score #tag insel_kalender matches 12.. run return run tellraw @s {"text":"Türchen 12 öffnet am 12. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_12] run return run tellraw @s {"text":"Türchen 12 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_12
give @s minecraft:paper[minecraft:item_model="weihnachten:lichterkette",minecraft:item_name={translate:"item.weihnachten.lichterkette",fallback:"Fairy Lights"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 12",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.deko",fallback:"Deko: in einen Rahmen hängen",color:"gray",italic:true},{translate:"item.weihnachten.kalender.hinweis.deko2",fallback:"oder einem Rüstungsständer aufsetzen",color:"gray",italic:true}]] 1
tellraw @s [{"text":"Türchen 12 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 0.5 157.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
