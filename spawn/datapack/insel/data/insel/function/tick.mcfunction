
# Erstes Betreten und Respawn ohne Bett: auf den geplanten Spawn (@e wählt nur lebende Spieler, also nach dem Wiederbeleben)
execute as @a[tag=!insel_da] run function insel:erstbesuch
execute as @e[type=player,scores={insel_tod=1..}] run function insel:respawn
