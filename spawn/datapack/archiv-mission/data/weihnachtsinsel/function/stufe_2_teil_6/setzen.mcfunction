execute if score #t2_6 wi_mission matches 1 run return fail
place template weihnachtsinsel:s2_teil_6 -12 3 -49
kill @e[tag=wi_e_s2_6]
summon block_display -11.50 5 -48.50 {Tags:["wi_insel","wi_e_s2_6"],Rotation:[0f,0f],block_state:{id:"minecraft:carved_pumpkin",properties:{facing:"south"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[-0.4f,0f,-0.4f],scale:[0.8f,0.8f,0.8f]}}
particle minecraft:happy_villager -12 4 -49 4 2 4 0.02 120 force @a
playsound minecraft:item.bone_meal.use master @a -12 4 -49 3 1
kill @e[type=item,x=-24,y=-52,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t2_6 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
