# Wer unter y 190 fällt (Insel verlassen), kommt zurück zum Brunnen
execute as @a[y=-64,dy=253] at @s run function hub:zurueck
# Beim Betreten (nach dem Verlassen) zum Brunnen
execute as @a[scores={hub_weg=1..}] run function hub:ankommen
# Klicks auf Info-Stände, Voice-Ecke und Adventsgeschenke (Interaction-Entities)
execute as @e[type=interaction,tag=hub_klick] if data entity @s interaction run function hub:klick
