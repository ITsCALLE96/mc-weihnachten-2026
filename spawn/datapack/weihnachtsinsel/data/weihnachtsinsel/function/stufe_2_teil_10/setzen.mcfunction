execute if score #t2_10 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_10 -11 155 -45
particle minecraft:happy_villager 0 177 -34 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a 0 177 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_10 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
