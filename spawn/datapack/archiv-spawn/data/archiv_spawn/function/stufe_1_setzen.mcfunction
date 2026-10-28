place template archiv_spawn:wi_stufe_1 -24 -52 -58
kill @e[tag=wi_archiv_insel]
kill @e[tag=wi_insel]
summon text_display -0.5 58 -33.5 {Tags:["wi_archiv","wi_archiv_insel","wi_archiv_titel"],billboard:"vertical",text:{"text":"Weihnachtsinsel – Stufe 1 von 4","color":"gold","bold":true,"extra":[{"text":"\nDie Insel taucht auf","color":"white","bold":false}]},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[5f,5f,5f]}}
kill @e[type=item,x=-24,y=-52,z=-58,dx=48,dy=106,dz=88]
execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}
data merge entity @e[type=text_display,tag=wi_schalter_text_1,limit=1] {background:-1064674800}
scoreboard objectives add wi_mission dummy
scoreboard objectives add wi_test dummy
scoreboard players set #stufe wi_mission 1
scoreboard players set #laeuft wi_mission 0
scoreboard players set #t1_1 wi_mission 1
scoreboard players set #t1_2 wi_mission 1
scoreboard players set #t1_3 wi_mission 1
scoreboard players set #t1_4 wi_mission 1
scoreboard players set #t1_5 wi_mission 1
scoreboard players set #t1_6 wi_mission 1
scoreboard players set #t1_7 wi_mission 1
scoreboard players set #t1_8 wi_mission 1
scoreboard players set #t1_9 wi_mission 1
scoreboard players set #t1_10 wi_mission 1
scoreboard players reset #t2_1 wi_mission
scoreboard players reset #t2_2 wi_mission
scoreboard players reset #t2_3 wi_mission
scoreboard players reset #t2_4 wi_mission
scoreboard players reset #t2_5 wi_mission
scoreboard players reset #t2_6 wi_mission
scoreboard players reset #t2_7 wi_mission
scoreboard players reset #t2_8 wi_mission
scoreboard players reset #t2_9 wi_mission
scoreboard players reset #t2_10 wi_mission
scoreboard players reset #t3_1 wi_mission
scoreboard players reset #t3_2 wi_mission
scoreboard players reset #t3_3 wi_mission
scoreboard players reset #t3_4 wi_mission
scoreboard players reset #t3_5 wi_mission
scoreboard players reset #t3_6 wi_mission
scoreboard players reset #t3_7 wi_mission
scoreboard players reset #t3_8 wi_mission
scoreboard players reset #t3_9 wi_mission
scoreboard players reset #t3_10 wi_mission
scoreboard players reset #t4_1 wi_mission
scoreboard players reset #t4_2 wi_mission
scoreboard players reset #t4_3 wi_mission
scoreboard players reset #t4_4 wi_mission
scoreboard players reset #t4_5 wi_mission
scoreboard players reset #t4_6 wi_mission
scoreboard players reset #t4_7 wi_mission
scoreboard players reset #t4_8 wi_mission
scoreboard players reset #t4_9 wi_mission
scoreboard players reset #t4_10 wi_mission
scoreboard players reset #gefeiert wi_mission
scoreboard players set #pos wi_test 11
scoreboard players set #auto wi_test 0
schedule function archiv_spawn:insel_entladen 300t
