execute if score #t3_4 wi_mission matches 1 run return fail
kill @e[tag=wi_e_s3_4]
summon item_display 15.05 155.55 -31.20 {Tags:["wi_insel","wi_e_s3_4"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:rentier_gross"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
summon item_display 15.95 155.55 -31.20 {Tags:["wi_insel","wi_e_s3_4"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:rentier_gross"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
summon item_display 15.05 155.55 -33.50 {Tags:["wi_insel","wi_e_s3_4"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:rentier_gross"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
summon item_display 15.95 155.55 -33.50 {Tags:["wi_insel","wi_e_s3_4"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:rentier_gross"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
summon item_display 15.50 155.55 -35.80 {Tags:["wi_insel","wi_e_s3_4"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:rentier_gross_nase"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.1f,1.1f,1.1f]}}
particle minecraft:wax_on -1 157 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.resonate master @a -1 157 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t3_4 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
