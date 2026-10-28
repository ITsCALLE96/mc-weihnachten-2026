# Ausgelöst als das Interaction-Entity: Funktion nach Tag, ausgeführt als der klickende Spieler, dann Klick löschen
execute if entity @s[tag=hub_f_stand_voice,tag=!hub_advent_zu] on target at @s run function hub:stand/voice
data remove entity @s interaction
