# Klicks auf Türchen; alle 5 s die Zahlen nach dem Tag einfärben (nur wenn die Wand geladen ist)
execute as @e[type=interaction,tag=insel_kal_klick] if data entity @s interaction run function insel:kalender/klick
scoreboard players add #takt insel_kalender 1
execute if score #takt insel_kalender matches 100.. run function insel:kalender/anzeigen
