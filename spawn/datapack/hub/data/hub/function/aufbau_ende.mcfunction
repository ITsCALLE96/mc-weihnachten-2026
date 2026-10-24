# Herausgefallene Gegenstände weg, Dorfbewohner markieren, Hub-Inhalte setzen, Chunks freigeben
kill @e[type=item,x=-150,y=80,z=-158,dx=240,dy=215,dz=244]
tag @e[type=villager,x=-51.5,y=235,z=-98.5,distance=..1.5,limit=1] add hub_npc_1
tag @e[type=villager,x=-54.5,y=234,z=0.5,distance=..1.5,limit=1] add hub_npc_2
tag @e[type=villager,x=-51.5,y=234,z=25.5,distance=..1.5,limit=1] add hub_npc_3
tag @e[type=villager,x=-39.5,y=234,z=25.5,distance=..1.5,limit=1] add hub_npc_4
tag @e[type=villager,x=-17.5,y=234,z=-54.5,distance=..1.5,limit=1] add hub_npc_5
tag @e[type=villager,x=-24.5,y=234,z=-54.5,distance=..1.5,limit=1] add hub_npc_6
tag @e[type=villager,x=-1,y=234,z=50.5,distance=..1.5,limit=1] add hub_npc_7
tag @e[type=villager,x=6.5,y=235,z=-33.5,distance=..1.5,limit=1] add hub_npc_8
tag @e[type=villager,x=33.5,y=236,z=30.5,distance=..1.5,limit=1] add hub_npc_9
tag @e[type=villager,x=51.5,y=236,z=-41.5,distance=..1.5,limit=1] add hub_npc_10
tag @e[type=villager,x=58.5,y=237,z=-4.5,distance=..1.5,limit=1] add hub_npc_11
tag @e[type=villager,x=58.5,y=237,z=0.5,distance=..1.5,limit=1] add hub_npc_12
tag @e[type=villager,x=58.5,y=237,z=5.5,distance=..1.5,limit=1] add hub_npc_13
setblock -3 235 15 minecraft:spruce_sign[rotation=0]{is_waxed:1b,front_text:{messages:["Spawn","Fantasy Village","gebaut von","LavaBuilds"]}}
summon text_display 25.5 237.2 -8.5 {text:[{"text":"SMP\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon text_display 27.5 237.2 -4.5 {text:[{"text":"Testwelt – bald\n","color":"gray","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon text_display 28.5 237.2 0.5 {text:[{"text":"Alle Server\n","color":"aqua","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon text_display 27.5 237.2 5.5 {text:[{"text":"Minigames – bald\n","color":"gray","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon text_display 25.5 237.2 9.5 {text:[{"text":"Bald\n","color":"gray","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon text_display 0.5 237.5 -10 {text:[{"text":"Bestenliste 1\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_1"]}
summon text_display 7.5 237.5 -6.5 {text:[{"text":"Bestenliste 2\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_2"]}
summon text_display 11 237.5 0.5 {text:[{"text":"Bestenliste 3\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_3"]}
summon text_display 7.5 237.5 7.5 {text:[{"text":"Bestenliste 4\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_4"]}
summon text_display 0.5 237.5 11 {text:[{"text":"Bestenliste 5\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_5"]}
summon text_display -6.5 237.5 7.5 {text:[{"text":"Bestenliste 6\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_6"]}
summon text_display -10 237.5 0.5 {text:[{"text":"Bestenliste 7\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_7"]}
summon text_display -6.5 237.5 -6.5 {text:[{"text":"Bestenliste 8\n","color":"gold","bold":true},{"text":"folgt","color":"gray","italic":true}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_bestenliste","hub_bestenliste_8"]}
summon text_display 42.5 237.2 -18.5 {text:[{"text":"Regeln\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 42.5 235 -18.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_1"]}
execute unless block 45 237 -22 #minecraft:wall_signs run setblock 45 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 45 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 49 237 -22 #minecraft:wall_signs run setblock 49 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 51 237 -20 #minecraft:wall_signs run setblock 51 237 -20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 -20 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
summon text_display 39.5 237.2 -14.5 {text:[{"text":"Modpack\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 39.5 235 -14.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_2"]}
execute unless block 41 237 -18 #minecraft:wall_signs run setblock 41 237 -18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -18 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
execute unless block 41 237 -14 #minecraft:wall_signs run setblock 41 237 -14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -14 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
summon text_display 42.5 237.2 -10.5 {text:[{"text":"Voice Chat\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 42.5 235 -10.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_3"]}
execute unless block 43 237 -12 #minecraft:wall_signs run setblock 43 237 -12 minecraft:spruce_wall_sign[facing=south]
data merge block 43 237 -12 {is_waxed:1b,front_text:{messages:["","Voice Chat","",""]}}
execute unless block 45 237 -10 #minecraft:wall_signs run setblock 45 237 -10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 -10 {is_waxed:1b,front_text:{messages:["","Voice Chat","",""]}}
summon text_display 46.5 237.2 -6.5 {text:[{"text":"Questbuch\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 46.5 235 -6.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_4"]}
execute unless block 47 237 -8 #minecraft:wall_signs run setblock 47 237 -8 minecraft:spruce_wall_sign[facing=south]
data merge block 47 237 -8 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
execute unless block 48 237 -6 #minecraft:wall_signs run setblock 48 237 -6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 -6 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
execute unless block 49 237 -7 #minecraft:wall_signs run setblock 49 237 -7 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -7 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
summon text_display 46.5 237.2 7.5 {text:[{"text":"Termine\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 46.5 235 7.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_5"]}
execute unless block 47 237 8 #minecraft:wall_signs run setblock 47 237 8 minecraft:spruce_wall_sign[facing=north]
data merge block 47 237 8 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 48 237 6 #minecraft:wall_signs run setblock 48 237 6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 6 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 49 237 7 #minecraft:wall_signs run setblock 49 237 7 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 7 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
summon text_display 42.5 237.2 11.5 {text:[{"text":"Discord\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 42.5 235 11.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_6"]}
execute unless block 45 237 10 #minecraft:wall_signs run setblock 45 237 10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 10 {is_waxed:1b,front_text:{messages:["","Discord","",""]}}
execute unless block 43 237 12 #minecraft:wall_signs run setblock 43 237 12 minecraft:spruce_wall_sign[facing=north]
data merge block 43 237 12 {is_waxed:1b,front_text:{messages:["","Discord","",""]}}
summon text_display 39.5 237.2 15.5 {text:[{"text":"Statistik\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 39.5 235 15.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_7"]}
execute unless block 41 237 14 #minecraft:wall_signs run setblock 41 237 14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 14 {is_waxed:1b,front_text:{messages:["","Statistik","",""]}}
execute unless block 41 237 18 #minecraft:wall_signs run setblock 41 237 18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 18 {is_waxed:1b,front_text:{messages:["","Statistik","",""]}}
summon text_display 42.5 237.2 19.5 {text:[{"text":"Danke\n","color":"gold","bold":true},{"text":"Klick für Infos","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction 42.5 235 19.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_8"]}
execute unless block 45 237 22 #minecraft:wall_signs run setblock 45 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 45 237 22 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
execute unless block 49 237 22 #minecraft:wall_signs run setblock 49 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 22 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
execute unless block 51 237 20 #minecraft:wall_signs run setblock 51 237 20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 20 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
summon text_display -103.5 241.2 10.5 {text:[{"text":"Voice-Chat-Ecke\n","color":"light_purple","bold":true},{"text":"Taste V: Einstellungen und Mikrofontest","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub"]}
summon interaction -103.5 239 10.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_voice"]}
summon item_display -115.5 272.3 -80.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_1"]}
summon interaction -115.5 272 -80.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_1","hub_f_advent_fund_1"]}
scoreboard players set @e[tag=hub_g_1] hub_advent 1
summon item_display -41.5 234.3 63.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_2"]}
summon interaction -41.5 234 63.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_2","hub_f_advent_fund_2"]}
scoreboard players set @e[tag=hub_g_2] hub_advent 2
summon item_display -49.5 235.3 33.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_3"]}
summon interaction -49.5 235 33.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_3","hub_f_advent_fund_3"]}
scoreboard players set @e[tag=hub_g_3] hub_advent 3
summon item_display 8.5 244.3 46.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_4"]}
summon interaction 8.5 244 46.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_4","hub_f_advent_fund_4"]}
scoreboard players set @e[tag=hub_g_4] hub_advent 4
summon item_display 32.5 244.3 26.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_5"]}
summon interaction 32.5 244 26.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_5","hub_f_advent_fund_5"]}
scoreboard players set @e[tag=hub_g_5] hub_advent 5
summon item_display 61.5 241.3 -43.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_6"]}
summon interaction 61.5 241 -43.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_6","hub_f_advent_fund_6"]}
scoreboard players set @e[tag=hub_g_6] hub_advent 6
summon item_display -56.5 243.3 -118.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_7"]}
summon interaction -56.5 243 -118.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_7","hub_f_advent_fund_7"]}
scoreboard players set @e[tag=hub_g_7] hub_advent 7
summon item_display 50.5 247.3 5.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_8"]}
summon interaction 50.5 247 5.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_8","hub_f_advent_fund_8"]}
scoreboard players set @e[tag=hub_g_8] hub_advent 8
summon item_display 60.5 247.3 -6.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_9"]}
summon interaction 60.5 247 -6.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_9","hub_f_advent_fund_9"]}
scoreboard players set @e[tag=hub_g_9] hub_advent 9
summon item_display -34.5 237.3 24.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_10"]}
summon interaction -34.5 237 24.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_10","hub_f_advent_fund_10"]}
scoreboard players set @e[tag=hub_g_10] hub_advent 10
summon item_display -54.5 235.3 7.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_11"]}
summon interaction -54.5 235 7.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_11","hub_f_advent_fund_11"]}
scoreboard players set @e[tag=hub_g_11] hub_advent 11
summon item_display -68.5 257.3 -79.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_12"]}
summon interaction -68.5 257 -79.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_12","hub_f_advent_fund_12"]}
scoreboard players set @e[tag=hub_g_12] hub_advent 12
summon item_display -115.5 239.3 13.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_13"]}
summon interaction -115.5 239 13.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_13","hub_f_advent_fund_13"]}
scoreboard players set @e[tag=hub_g_13] hub_advent 13
summon item_display -78.5 235.3 -32.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_14"]}
summon interaction -78.5 235 -32.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_14","hub_f_advent_fund_14"]}
scoreboard players set @e[tag=hub_g_14] hub_advent 14
summon item_display -88.5 264.3 -64.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_15"]}
summon interaction -88.5 264 -64.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_15","hub_f_advent_fund_15"]}
scoreboard players set @e[tag=hub_g_15] hub_advent 15
summon item_display 18.5 242.3 -26.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_16"]}
summon interaction 18.5 242 -26.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_16","hub_f_advent_fund_16"]}
scoreboard players set @e[tag=hub_g_16] hub_advent 16
summon item_display -53.5 247.3 -64.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_17"]}
summon interaction -53.5 247 -64.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_17","hub_f_advent_fund_17"]}
scoreboard players set @e[tag=hub_g_17] hub_advent 17
summon item_display -30.5 234.3 -60.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_18"]}
summon interaction -30.5 234 -60.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_18","hub_f_advent_fund_18"]}
scoreboard players set @e[tag=hub_g_18] hub_advent 18
summon item_display 24.5 242.3 -40.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_19"]}
summon interaction 24.5 242 -40.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_19","hub_f_advent_fund_19"]}
scoreboard players set @e[tag=hub_g_19] hub_advent 19
summon item_display 37.5 237.3 -70.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_20"]}
summon interaction 37.5 237 -70.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_20","hub_f_advent_fund_20"]}
scoreboard players set @e[tag=hub_g_20] hub_advent 20
summon item_display 24.5 249.3 -79.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_21"]}
summon interaction 24.5 249 -79.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_21","hub_f_advent_fund_21"]}
scoreboard players set @e[tag=hub_g_21] hub_advent 21
summon item_display 27.5 237.3 -100.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_22"]}
summon interaction 27.5 237 -100.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_22","hub_f_advent_fund_22"]}
scoreboard players set @e[tag=hub_g_22] hub_advent 22
summon item_display 44.5 244.3 -17.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_23"]}
summon interaction 44.5 244 -17.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_23","hub_f_advent_fund_23"]}
scoreboard players set @e[tag=hub_g_23] hub_advent 23
summon item_display -107.5 240.3 26.5 {item:{id:"minecraft:red_shulker_box",count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0f,0f,0f]},Tags:["hub","hub_advent","hub_advent_zu","hub_g_24"]}
summon interaction -107.5 240 26.5 {width:0.7f,height:0.7f,response:1b,Tags:["hub","hub_klick","hub_advent","hub_advent_zu","hub_g_24","hub_f_advent_fund_24"]}
scoreboard players set @e[tag=hub_g_24] hub_advent 24
function hub:schliessen
forceload remove -152 -152 88 88
say Hub eingerichtet: Bau, Kirschhain, Spawn 0/235/16, Weltgrenze, 13 Info-Dorfbewohner, 8 Stände, Adventskalender, SMP gesperrt
