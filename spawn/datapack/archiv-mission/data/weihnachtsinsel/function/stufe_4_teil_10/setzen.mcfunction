execute if score #t4_10 wi_mission matches 1 run return fail
place template weihnachtsinsel:s4_teil_10 -9 3 -42
fill -16 48 -49 14 45 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
kill @e[tag=wi_e_s4_10]
summon mannequin -0.50 3 -53.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann"],Rotation:[0f,0f],CustomName:{text:"Weihnachtsmann",color:"red",bold:true},CustomNameVisible:1b,description:{text:"Händler · Rechtsklick",color:"gold"},immovable:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,profile:{texture:"weihnachten:entity/weihnachtsmann",model:"wide"}}
summon interaction -0.50 3 -53.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann_klick"],Rotation:[270f,0f],width:0.9f,height:2f,response:1b}
particle minecraft:end_rod -1 50 -34 4 2 4 0.02 120 force @a
playsound minecraft:block.copper_bulb.turn_on master @a -1 50 -34 3 1
kill @e[type=item,x=-24,y=-52,z=-58,dx=47,dy=105,dz=87]
scoreboard players set #t4_10 wi_mission 1
schedule function weihnachtsinsel:entladen 200t
