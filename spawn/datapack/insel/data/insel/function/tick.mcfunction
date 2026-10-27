# Rückweg wie ein Netherportal: auf der runden Plattform (Mitte 0/64/84, Radius 4) stehen bleiben,
# nach 70 Ticks (3.5 s) geht es auf den Spawn. Wer vorher runtergeht, bricht ab. Wirkt ohne OP (Datapack).
scoreboard players add @a[x=0.5,y=65,z=84.5,distance=..4,gamemode=!spectator] insel_tp 1
execute as @a[scores={insel_tp=1..}] unless entity @s[x=0.5,y=65,z=84.5,distance=..4,gamemode=!spectator] run function insel:abbruch
execute as @a[scores={insel_tp=1}] at @s run function insel:start
execute as @a[scores={insel_tp=2..69}] at @s run particle minecraft:portal ~ ~1 ~ 0.4 0.9 0.4 0.6 6 normal
execute as @a[scores={insel_tp=70..}] at @s run function insel:zurueck

# Sättigung: beim Betreten des Spawns oben (Kasten -29/150/19 bis 27/319/75) einmal kurz Sättigung I für 1 s,
# danach 5 min Abklingzeit, damit Rein- und Rausspringen nichts bringt
scoreboard players remove @a[scores={insel_satt=1..}] insel_satt 1
execute as @a[tag=insel_oben] at @s unless entity @s[x=-29,y=150,z=19,dx=56,dy=169,dz=56] run tag @s remove insel_oben
execute as @a[tag=insel_oben] at @s positioned -1 ~ 47 unless entity @s[distance=..28] run tag @s remove insel_oben
execute as @a[x=-29,y=150,z=19,dx=56,dy=169,dz=56,tag=!insel_oben] at @s positioned -1 ~ 47 if entity @s[distance=..28] run function insel:betreten

# Erstes Betreten und Respawn ohne Bett: auf den geplanten Spawn (@e wählt nur lebende Spieler, also nach dem Wiederbeleben)
execute as @a[tag=!insel_da] run function insel:erstbesuch
execute as @e[type=player,scores={insel_tod=1..}] run function insel:respawn
