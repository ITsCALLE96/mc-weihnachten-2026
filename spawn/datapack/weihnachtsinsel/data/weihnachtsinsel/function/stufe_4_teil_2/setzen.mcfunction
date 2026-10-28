execute if score #t4_2 wi_mission matches 1 run return fail
fill -16 160 -49 14 164 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
particle minecraft:end_rod -1 162 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.copper_bulb.turn_on master @a -1 162 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t4_2 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
