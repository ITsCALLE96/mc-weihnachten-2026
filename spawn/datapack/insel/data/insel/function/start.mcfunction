# Beginn des Übergangs: Portal-Geräusch, Bildschirm wabert (Übelkeit), Hinweis
playsound minecraft:block.portal.trigger block @s ~ ~ ~ 0.7 1
effect give @s minecraft:nausea 6 0 true
title @s actionbar {"text":"Stehen bleiben – gleich geht es zurück auf die Insel …","color":"light_purple"}
