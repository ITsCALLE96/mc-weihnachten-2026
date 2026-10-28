execute if score #t2_2 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_2 -14 155 -24
kill @e[tag=wi_e_s2_2]
summon item_display -11.50 156.25 -23.50 {Tags:["wi_insel","wi_e_s2_2"],Rotation:[270f,0f],item:{id:"minecraft:iron_axe",count:1},transformation:{left_rotation:[0f,0f,0.38f,0.92f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.8f,0.8f,0.8f]}}
particle minecraft:happy_villager -13 156 -21 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a -13 156 -21 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_2 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
