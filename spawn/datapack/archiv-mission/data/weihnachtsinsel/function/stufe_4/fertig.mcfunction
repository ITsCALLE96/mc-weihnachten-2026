# Alle Abschnitte der Stufe 4 setzen (Abschluss bzw. Wiederaufnahme nach Neustart)
fill -16 3 -49 14 7 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 8 -49 14 12 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 13 -49 14 17 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 18 -49 14 22 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 23 -49 14 27 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 28 -49 14 32 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 33 -49 14 37 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 38 -49 14 42 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 43 -49 14 45 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
place template weihnachtsinsel:s4_teil_10 -9 3 -42
fill -16 48 -49 14 45 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
kill @e[tag=wi_e_s4_10]
summon mannequin -0.50 3 -53.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann"],Rotation:[0f,0f],CustomName:{text:"Weihnachtsmann",color:"red",bold:true},CustomNameVisible:1b,description:{text:"Händler · Rechtsklick",color:"gold"},immovable:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,profile:{texture:"weihnachten:entity/weihnachtsmann",model:"wide"}}
summon interaction -0.50 3 -53.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann_klick"],Rotation:[270f,0f],width:0.9f,height:2f,response:1b}
scoreboard players set #t4_1 wi_mission 1
scoreboard players set #t4_2 wi_mission 1
scoreboard players set #t4_3 wi_mission 1
scoreboard players set #t4_4 wi_mission 1
scoreboard players set #t4_5 wi_mission 1
scoreboard players set #t4_6 wi_mission 1
scoreboard players set #t4_7 wi_mission 1
scoreboard players set #t4_8 wi_mission 1
scoreboard players set #t4_9 wi_mission 1
scoreboard players set #t4_10 wi_mission 1
kill @e[type=item,x=-24,y=-52,z=-58,dx=47,dy=105,dz=87]
