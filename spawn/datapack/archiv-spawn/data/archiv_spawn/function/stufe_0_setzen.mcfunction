place template archiv_spawn:wi_stufe_0 -24 -52 -58
place template archiv_fremd:spark_insel -26 -63 22
kill @e[tag=wi_archiv_insel]
summon text_display -0.5 58 -33.5 {Tags:["wi_archiv","wi_archiv_insel"],billboard:"vertical",text:{"text":"Weihnachtsinsel – leer","color":"gold","bold":true,"extra":[{"text":"\nSchalter auf der Spark-Insel","color":"white","bold":false}]},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[5f,5f,5f]}}
kill @e[type=item,x=-24,y=-52,z=-58,dx=48,dy=106,dz=88]
execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}
data merge entity @e[type=text_display,tag=wi_schalter_text_0,limit=1] {background:-1064674800}
forceload remove -24 -58 23 29
