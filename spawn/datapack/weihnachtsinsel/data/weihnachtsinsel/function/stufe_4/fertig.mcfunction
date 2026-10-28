# Alle Abschnitte der Stufe 4 setzen (Abschluss bzw. Wiederaufnahme nach Neustart)
fill -16 155 -49 14 159 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 160 -49 14 164 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 165 -49 14 169 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 170 -49 14 174 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 175 -49 14 179 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 180 -49 14 184 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 185 -49 14 189 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 190 -49 14 194 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
fill -16 195 -49 14 197 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
place template weihnachtsinsel:s4_teil_10 -9 155 -42
fill -16 200 -49 14 197 -19 minecraft:waxed_copper_bulb[lit=true] replace minecraft:waxed_copper_bulb[lit=false]
kill @e[tag=wi_e_s4_10]
summon mannequin -0.50 155.00 -54.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann"],Rotation:[0f,0f],CustomName:{text:"Weihnachtsmann",color:"red",bold:true},CustomNameVisible:1b,description:{text:"Händler · Rechtsklick",color:"gold"},immovable:1b,Invulnerable:1b,Silent:1b,PersistenceRequired:1b,profile:{texture:"weihnachten:entity/weihnachtsmann"}}
summon interaction -0.50 155.00 -54.50 {Tags:["wi_insel","wi_e_s4_10","wi_weihnachtsmann_klick"],Rotation:[270f,0f],width:0.9f,height:2f,response:1b}
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
kill @e[type=item,x=-24,y=100,z=-58,dx=47,dy=105,dz=87]
