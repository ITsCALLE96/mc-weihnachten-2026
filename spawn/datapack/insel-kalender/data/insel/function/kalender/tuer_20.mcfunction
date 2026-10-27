execute unless score #tag insel_kalender matches 20.. run return run tellraw @s {"text":"Türchen 20 öffnet am 20. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_20] run return run tellraw @s {"text":"Türchen 20 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_20
give @s minecraft:firework_rocket[minecraft:item_name={text:"Winterfeuerwerk"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 20",italic:false,color:"aqua"}],minecraft:fireworks={flight_duration:2,explosions:[{shape:"star",colors:[I;16777215,12245247],fade_colors:[I;8439039],has_twinkle:true},{shape:"large_ball",colors:[I;11393254,16777215],has_trail:true}]}] 16
tellraw @s [{"text":"Türchen 20 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 1.5 156.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
