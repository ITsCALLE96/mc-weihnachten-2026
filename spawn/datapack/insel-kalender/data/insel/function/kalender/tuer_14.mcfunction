execute unless score #tag insel_kalender matches 14.. run return run tellraw @s {"text":"Türchen 14 öffnet am 14. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_14] run return run tellraw @s {"text":"Türchen 14 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_14
give @s minecraft:paper[minecraft:item_model="weihnachten:rentiergeweih",minecraft:item_name="Rentiergeweih",minecraft:lore=[{text:"Winterkalender 2026 – Tag 14",italic:false,color:"aqua"}],minecraft:max_stack_size=1,minecraft:equippable={slot:"head",swappable:true}] 1
tellraw @s [{"text":"Türchen 14 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 0.5 158.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
