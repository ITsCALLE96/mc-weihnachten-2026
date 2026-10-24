# Rückweg: Wer auf der Plattform am Strand unter der Insel steht (x 72–76, z 20–24, Oberkante y 62), kommt zurück auf den Spawn.
# Auf der Insel startet ein Doppelsprung wieder den Elytra-Flug (Plugin Spawn Elytra). Wirkt ohne OP, Datapacks laufen mit Serverrechten.
execute as @a[x=72,y=63,z=20,dx=4,dy=1,dz=4,gamemode=!spectator] at @s run function insel:zurueck
