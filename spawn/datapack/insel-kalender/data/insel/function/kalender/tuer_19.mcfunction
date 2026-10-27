execute unless score #tag insel_kalender matches 19.. run return run tellraw @s {"text":"Türchen 19 öffnet am 19. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_19] run return run tellraw @s {"text":"Türchen 19 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_19
give @s minecraft:paper[minecraft:item_model="weihnachten:geschenk_rot",minecraft:item_name={text:"Geschenk"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 19",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.deko",fallback:"Deko: in einen Rahmen hängen",color:"gray",italic:true},{translate:"item.weihnachten.kalender.hinweis.deko2",fallback:"oder einem Rüstungsständer aufsetzen",color:"gray",italic:true}]] 1
tellraw @s [{"text":"Türchen 19 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -1.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
