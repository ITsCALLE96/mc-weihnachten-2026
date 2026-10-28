execute if score #t1_9 wi_mission matches 1 run return fail
place template weihnachtsinsel:s1_teil_9 -4 154 -1
particle minecraft:snowflake -1 159 4 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.chime master @a -1 159 4 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t1_9 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
