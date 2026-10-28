# Feier am Ende von Stufe 4: Titel, Glocken, ~2 min Feuerwerk. Läuft nur einmal (#gefeiert), nur nach Stufe 4.
execute unless score #stufe wi_mission matches 4 run return fail
execute if score #gefeiert wi_mission matches 1 run return fail
scoreboard players set #gefeiert wi_mission 1
forceload add -24 -58 23 29
scoreboard players set #feuer wi_mission 0
title @a times 10 70 20
title @a subtitle {"text":"Die Weihnachtsinsel leuchtet – danke fürs Spenden!","color":"white"}
title @a title {"text":"Frohe Weihnachten!","color":"gold","bold":true}
playsound minecraft:block.bell.use master @a -1 154 -34 8 0.7
schedule function weihnachtsinsel:feier/schritt 20t
