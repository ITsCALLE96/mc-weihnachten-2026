# Alle Abschnitte der Stufe 2 setzen (Abschluss bzw. Wiederaufnahme nach Neustart)
place template weihnachtsinsel:s2_teil_1 -5 155 -56
place template weihnachtsinsel:s2_teil_2 -14 155 -24
kill @e[tag=wi_e_s2_2]
summon item_display -11.50 156.25 -24.50 {Tags:["wi_insel","wi_e_s2_2"],Rotation:[270f,0f],item:{id:"minecraft:iron_axe",count:1},transformation:{left_rotation:[0f,0f,0.38f,0.92f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.8f,0.8f,0.8f]}}
place template weihnachtsinsel:s2_teil_3 -4 155 -37
place template weihnachtsinsel:s2_teil_4 10 155 -23
place template weihnachtsinsel:s2_teil_5 -7 155 -40
place template weihnachtsinsel:s2_teil_6 -12 155 -49
kill @e[tag=wi_e_s2_6]
summon block_display -12.00 157.00 -49.00 {Tags:["wi_insel","wi_e_s2_6"],Rotation:[270f,0f],block_state:{id:"minecraft:carved_pumpkin",properties:{facing:"south"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0.1f,0f,0.1f],scale:[0.8f,0.8f,0.8f]}}
place template weihnachtsinsel:s2_teil_7 -8 155 -40
place template weihnachtsinsel:s2_teil_8 -21 155 -36
place template weihnachtsinsel:s2_teil_9 -9 155 -43
place template weihnachtsinsel:s2_teil_10 -11 155 -45
scoreboard players set #t2_1 wi_mission 1
scoreboard players set #t2_2 wi_mission 1
scoreboard players set #t2_3 wi_mission 1
scoreboard players set #t2_4 wi_mission 1
scoreboard players set #t2_5 wi_mission 1
scoreboard players set #t2_6 wi_mission 1
scoreboard players set #t2_7 wi_mission 1
scoreboard players set #t2_8 wi_mission 1
scoreboard players set #t2_9 wi_mission 1
scoreboard players set #t2_10 wi_mission 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
