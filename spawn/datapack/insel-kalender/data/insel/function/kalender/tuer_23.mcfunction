execute unless score #tag insel_kalender matches 23.. run return run tellraw @s {"text":"Türchen 23 ist noch zu – es öffnet an Kalendertag 23.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_23] run return run tellraw @s {"text":"Türchen 23 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_23
give @s minecraft:paper[minecraft:item_model="weihnachten:stern",minecraft:item_name={text:"Weihnachtsstern"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 23",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.deko",fallback:"Deko: in einen Rahmen hängen",color:"gray",italic:true},{translate:"item.weihnachten.kalender.hinweis.deko2",fallback:"oder einem Rüstungsständer aufsetzen",color:"gray",italic:true}]] 1
give @s minecraft:cookie[minecraft:item_model="weihnachten:christstollen",minecraft:item_name={text:"Christstollen"},minecraft:lore=[{text:"Winterkalender 2026",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.stollen",fallback:"Essbar: Absorption und kurz Regeneration",color:"gray",italic:true}],minecraft:food={nutrition:6,saturation:14.4},minecraft:consumable={consume_seconds:1.6,animation:"eat",sound:"minecraft:entity.generic.eat",has_consume_particles:true,on_consume_effects:[{type:"minecraft:apply_effects",effects:[{id:"minecraft:absorption",duration:1200,amplifier:0},{id:"minecraft:regeneration",duration:100,amplifier:0}]}]}] 4
give @s minecraft:experience_bottle 16
tellraw @s [{"text":"Türchen 23 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 1.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
