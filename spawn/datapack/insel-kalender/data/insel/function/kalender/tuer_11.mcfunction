execute unless score #tag insel_kalender matches 11.. run return run tellraw @s {"text":"Türchen 11 ist noch zu – es öffnet an Kalendertag 11.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_11] run return run tellraw @s {"text":"Türchen 11 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_11
give @s minecraft:snowball[minecraft:item_name={text:"Winterkalender-Schneeball"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 11",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.werfen",fallback:"Zum Werfen",color:"gray",italic:true}]] 32
give @s minecraft:experience_bottle 8
tellraw @s [{"text":"Türchen 11 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework 0.5 155.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
