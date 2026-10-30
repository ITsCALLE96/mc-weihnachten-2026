execute unless score #tag insel_kalender matches 13.. run return run tellraw @s {"text":"Türchen 13 ist noch zu – es öffnet an Kalendertag 13.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_13] run return run tellraw @s {"text":"Türchen 13 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_13
give @s minecraft:cookie[minecraft:item_model="weihnachten:bratapfel",minecraft:item_name={text:"Bratapfel"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 13",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.bratapfel",fallback:"Essbar: zwei Extra-Herzen für 30 s",color:"gray",italic:true}],minecraft:food={nutrition:6,saturation:7.2},minecraft:consumable={consume_seconds:1.6,animation:"eat",sound:"minecraft:entity.generic.eat",has_consume_particles:true,on_consume_effects:[{type:"minecraft:apply_effects",effects:[{id:"minecraft:absorption",duration:600,amplifier:0}]}]}] 64
tellraw @s [{"text":"Türchen 13 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -2.5 155.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
