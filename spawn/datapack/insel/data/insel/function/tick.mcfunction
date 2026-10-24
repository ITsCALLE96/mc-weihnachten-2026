# Rückweg: Wer auf der runden Plattform unter der Inselmitte steht (Mitte 64/62/29, Radius 4), kommt zurück auf den Spawn direkt darüber.
# Auf der Insel startet ein Doppelsprung wieder den Elytra-Flug (Plugin Spawn Elytra). Wirkt ohne OP, Datapacks laufen mit Serverrechten.
execute as @a[x=64.5,y=63,z=29.5,distance=..4,gamemode=!spectator] at @s run function insel:zurueck
