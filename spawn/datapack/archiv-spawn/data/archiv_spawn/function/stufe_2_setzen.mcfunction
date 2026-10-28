place template archiv_spawn:wi_stufe_2 -24 -52 -58
kill @e[tag=wi_archiv_insel]
summon item_display -11.50 4.25 -24.50 {Tags:["wi_archiv","wi_archiv_insel"],Rotation:[270f,0f],item:{id:"minecraft:iron_axe",count:1},transformation:{left_rotation:[0f,0f,0.38f,0.92f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.8f,0.8f,0.8f]}}
summon block_display -12.00 5.00 -49.00 {Tags:["wi_archiv","wi_archiv_insel"],Rotation:[270f,0f],block_state:{id:"minecraft:carved_pumpkin",properties:{facing:"south"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0.1f,0f,0.1f],scale:[0.8f,0.8f,0.8f]}}
summon text_display -0.5 58 -33.5 {Tags:["wi_archiv","wi_archiv_insel"],billboard:"center",text:{"text":"Weihnachtsinsel – Stufe 2 von 4","color":"gold","bold":true,"extra":[{"text":"\nDer Baum wächst","color":"white","bold":false}]},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[5f,5f,5f]}}
kill @e[type=item,x=-24,y=-52,z=-58,dx=48,dy=106,dz=88]
execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}
data merge entity @e[type=text_display,tag=wi_schalter_text_2,limit=1] {background:-1064674800}
forceload remove -24 -58 23 29
