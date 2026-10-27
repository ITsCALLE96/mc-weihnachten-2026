# Rückweg wie ein Netherportal: auf der runden Plattform (Mitte 0/65/48, Radius 4) stehen bleiben,
# nach 70 Ticks (3.5 s) geht es auf den Spawn. Wer vorher runtergeht, bricht ab. Wirkt ohne OP (Datapack).
scoreboard players add @a[x=0.5,y=66,z=48.5,distance=..4,gamemode=!spectator] insel_tp 1
execute as @a[scores={insel_tp=1..}] unless entity @s[x=0.5,y=66,z=48.5,distance=..4,gamemode=!spectator] run function insel:abbruch
execute as @a[scores={insel_tp=1}] at @s run function insel:start
execute as @a[scores={insel_tp=2..69}] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal
execute as @a[scores={insel_tp=70..}] at @s run function insel:zurueck

# Erstes Betreten und Respawn ohne Bett: auf den geplanten Spawn (@e wählt nur lebende Spieler, also nach dem Wiederbeleben)
execute as @a[tag=!insel_da] run function insel:erstbesuch
execute as @e[type=player,scores={insel_tod=1..}] run function insel:respawn
