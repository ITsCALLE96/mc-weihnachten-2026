# Freigeschaltet: sichtbar (Anzeige) bzw. klickbar (Interaktion)
tag @s remove hub_advent_zu
execute if entity @s[type=item_display] run data modify entity @s transformation.scale set value [0.5f,0.5f,0.5f]
