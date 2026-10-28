execute if score #t3_2 wi_mission matches 1 run return fail
kill @e[tag=wi_e_s3_2]
summon item_display 15.50 155.80 -27.63 {Tags:["wi_insel","wi_e_s3_2"],Rotation:[90f,0f],item:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:schlitten_gross"}},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
particle minecraft:wax_on -1 157 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.resonate master @a -1 157 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t3_2 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
