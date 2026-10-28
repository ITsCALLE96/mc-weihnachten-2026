execute if score #t3_2 wi_mission matches 1 run return fail
place template weihnachtsinsel:s3_teil_2 14 155 -33
particle minecraft:wax_on 15 157 -29 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.resonate master @a 15 157 -29 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t3_2 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
