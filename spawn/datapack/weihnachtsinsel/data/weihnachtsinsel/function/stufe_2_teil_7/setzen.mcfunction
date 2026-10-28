execute if score #t2_7 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_7 -8 155 -40
particle minecraft:happy_villager -1 170 -33 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a -1 170 -33 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_7 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
