execute if score #t2_1 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_1 -5 155 -56
particle minecraft:happy_villager -1 158 -51 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a -1 158 -51 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_1 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
