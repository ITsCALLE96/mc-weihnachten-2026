# Feier am Ende von Stufe 4: Titel, Glocken, ~2 min Feuerwerk. Einzeln auslösbar (Test).
forceload add -24 -58 23 29
scoreboard players set #feuer wi_mission 0
title @a times 10 70 20
title @a subtitle {"text":"Die Weihnachtsinsel leuchtet – danke fürs Spenden!","color":"white"}
title @a title {"text":"Frohe Weihnachten!","color":"gold","bold":true}
playsound minecraft:block.bell.use master @a -1 154 -34 8 0.7
schedule function weihnachtsinsel:feier/schritt 20t
