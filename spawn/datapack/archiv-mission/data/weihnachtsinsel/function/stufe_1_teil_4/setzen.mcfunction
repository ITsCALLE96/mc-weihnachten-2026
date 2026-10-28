execute if score #t1_4 wi_mission matches 1 run return fail
place template weihnachtsinsel:s1_teil_4 -23 -19 -56
particle minecraft:snowflake 0 -13 -33 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.chime master @a 0 -13 -33 3 1
kill @e[type=item,x=-24,y=-52,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t1_4 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
