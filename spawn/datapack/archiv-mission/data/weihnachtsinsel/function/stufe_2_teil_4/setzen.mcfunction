execute if score #t2_4 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_4 10 3 -23
particle minecraft:happy_villager 12 4 -21 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a 12 4 -21 3 1
kill @e[type=item,x=-24,y=-52,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_4 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
