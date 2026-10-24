# Muss zum Weltspawn passen (setworldspawn 64 179 29 0 0). Ankommen: Reise-Geräusch, umgekehrte Portal-Partikel, kurz Blindheit als Einblendung
scoreboard players reset @s insel_tp
stopsound @s block minecraft:block.portal.trigger
tp @s 64.5 179 29.5 0 0
effect give @s minecraft:blindness 1 0 true
playsound minecraft:block.portal.travel block @s ~ ~ ~ 0.35 1
particle minecraft:reverse_portal ~ ~1 ~ 0.6 1 0.6 0.05 60 normal
title @s actionbar {"text":"Zurück auf der Insel – zweimal springen zum Fliegen","color":"aqua"}
