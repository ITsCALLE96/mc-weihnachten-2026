execute unless score #tag insel_kalender matches 7.. run return run tellraw @s {"text":"Türchen 7 öffnet am 7. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_7] run return run tellraw @s {"text":"Türchen 7 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_7
give @s minecraft:cookie[minecraft:item_model="weihnachten:heisse_schokolade",minecraft:item_name={text:"Heiße Schokolade"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 7",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.schokolade",fallback:"Trinken: kurz Regeneration",color:"gray",italic:true}],minecraft:food={nutrition:4,saturation:4.8},minecraft:consumable={consume_seconds:1.6,animation:"drink",sound:"minecraft:entity.generic.drink",has_consume_particles:false,on_consume_effects:[{type:"minecraft:apply_effects",effects:[{id:"minecraft:regeneration",duration:100,amplifier:0}]}]}] 64
tellraw @s [{"text":"Türchen 7 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -2.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
