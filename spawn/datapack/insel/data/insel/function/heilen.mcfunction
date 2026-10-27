scoreboard players set #takt insel_satt 0
execute as @a[x=-29,y=150,z=19,dx=56,dy=169,dz=56,gamemode=!spectator] at @s positioned -1 ~ 47 if entity @s[distance=..28] run function insel:heilen_spieler
