execute unless score #tag insel_kalender matches 8.. run return run tellraw @s {"text":"Türchen 8 öffnet am 8. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_8] run return run tellraw @s {"text":"Türchen 8 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_8
give @s minecraft:paper[minecraft:item_model="weihnachten:kugel_gold",minecraft:item_name="Christbaumkugel (gold)",minecraft:lore=[{text:"Winterkalender 2026 – Tag 8",italic:false,color:"aqua"}],minecraft:max_stack_size=1] 1
tellraw @s [{"text":"Türchen 8 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 2.5 155.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
