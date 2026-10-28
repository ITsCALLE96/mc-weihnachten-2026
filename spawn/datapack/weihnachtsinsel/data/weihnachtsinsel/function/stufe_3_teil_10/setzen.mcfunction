execute if score #t3_10 wi_mission matches 1 run return fail
kill @e[tag=wi_e_s3_10]
summon allay 5.95 166.00 -46.72 {Tags:["wi_insel","wi_e_s3_10"],Rotation:[28.64788975654119f,0f],NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:red_candle",count:1}}}
summon allay 11.52 172.00 -26.68 {Tags:["wi_insel","wi_e_s3_10"],Rotation:[120.32113697747286f,0f],NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:cookie",count:1}}}
summon allay -8.15 178.00 -22.55 {Tags:["wi_insel","wi_e_s3_10"],Rotation:[211.99438419840453f,0f],NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:glow_berries",count:1}}}
summon allay -10.99 184.00 -40.65 {Tags:["wi_insel","wi_e_s3_10"],Rotation:[303.6676314193363f,0f],NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:snowball",count:1}}}
summon allay -3.50 158.20 -45.50 {Tags:["wi_insel","wi_e_s3_10"],Rotation:[0f,0f],NoAI:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,NoGravity:1b,CanPickUpLoot:0b,equipment:{mainhand:{id:"minecraft:gold_nugget",count:1}}}
particle minecraft:wax_on -1 157 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.amethyst_block.resonate master @a -1 157 -34 3 1
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t3_10 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
