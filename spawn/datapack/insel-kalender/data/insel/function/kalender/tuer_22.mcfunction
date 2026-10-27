execute unless score #tag insel_kalender matches 22.. run return run tellraw @s {"text":"Türchen 22 öffnet am 22. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_22] run return run tellraw @s {"text":"Türchen 22 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_22
give @s minecraft:paper[minecraft:item_model="weihnachten:schal",minecraft:item_name="Schal",minecraft:lore=[{text:"Winterkalender 2026 – Tag 22",italic:false,color:"aqua"}],minecraft:max_stack_size=1,minecraft:equippable={slot:"head",swappable:true}] 1
tellraw @s [{"text":"Türchen 22 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -0.5 155.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
