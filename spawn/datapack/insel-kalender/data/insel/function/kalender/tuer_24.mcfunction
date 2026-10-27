execute unless score #tag insel_kalender matches 24.. run return run tellraw @s {"text":"Türchen 24 öffnet am 24. Dezember.","color":"gray"}
execute if entity @s[tag=insel_kal_hat_24] run return run tellraw @s {"text":"Türchen 24 hast du schon geöffnet.","color":"gray"}
tag @s add insel_kal_hat_24
give @s minecraft:paper[minecraft:item_model="weihnachten:lichterkrone",minecraft:item_name={text:"Krone aus Lichtern · Winter 2026",color:"gold"},minecraft:lore=[{text:"Winterkalender 2026 – Tag 24",italic:false,color:"aqua"},{translate:"item.weihnachten.kalender.hinweis.kopf",fallback:"Aufsetzen: in den Helm-Platz ziehen",color:"gray",italic:true},{translate:"item.weihnachten.kalender.hinweis.andenken",fallback:"Andenken an den Winter 2026",color:"gray",italic:true}],minecraft:max_stack_size=1,minecraft:equippable={slot:"head",swappable:true},minecraft:enchantment_glint_override=true,minecraft:rarity="epic"] 1
tellraw @s [{"text":"Türchen 24 ","color":"gold","bold":true},{"text":"ist offen – frohe Weihnachtszeit!","color":"white"}]
playsound minecraft:entity.player.levelup master @s ~ ~ ~ 0.8 1.6
particle minecraft:firework -1.5 156.8 65.4 0.25 0.25 0.05 0.03 25 normal @s
