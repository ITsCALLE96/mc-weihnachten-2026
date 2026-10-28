execute if score #t3_5 wi_mission matches 1 run return fail
place template weihnachtsinsel:s3_teil_5 -5 182 -38
particle minecraft:wax_on -1 188 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.resonate master @a -1 188 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t3_5 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
