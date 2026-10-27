# Herausgefallene Gegenstände weg, Dorfbewohner markieren, Hub-Inhalte setzen, Chunks freigeben
kill @e[type=item,x=-150,y=80,z=-158,dx=240,dy=215,dz=244]
tag @e[type=villager,x=-51.5,y=235,z=-98.5,distance=..1.5,limit=1] add hub_npc_1
summon text_display -51.5 237.4 -98.5 {text:[{"text":"Schwarzmarkt\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-54.5,y=234,z=0.5,distance=..1.5,limit=1] add hub_npc_2
summon text_display -54.5 236.4 0.5 {text:[{"text":"Fischer\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-51.5,y=234,z=25.5,distance=..1.5,limit=1] add hub_npc_3
summon text_display -51.5 236.4 25.5 {text:[{"text":"Blumenhändlerin\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-39.5,y=234,z=25.5,distance=..1.5,limit=1] add hub_npc_4
summon text_display -39.5 236.4 25.5 {text:[{"text":"Bauer\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-17.5,y=234,z=-54.5,distance=..1.5,limit=1] add hub_npc_5
summon text_display -17.5 236.4 -54.5 {text:[{"text":"Trankmeister\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-24.5,y=234,z=-54.5,distance=..1.5,limit=1] add hub_npc_6
summon text_display -24.5 236.4 -54.5 {text:[{"text":"Waffenschmied\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=-1,y=234,z=50.5,distance=..1.5,limit=1] add hub_npc_7
summon text_display -1 236.4 50.5 {text:[{"text":"Wegweiser\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=6.5,y=235,z=-33.5,distance=..1.5,limit=1] add hub_npc_8
summon text_display 6.5 237.4 -33.5 {text:[{"text":"Bibliothekar\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=33.5,y=236,z=30.5,distance=..1.5,limit=1] add hub_npc_9
summon text_display 33.5 238.4 30.5 {text:[{"text":"Bankier\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=51.5,y=236,z=-41.5,distance=..1.5,limit=1] add hub_npc_10
summon text_display 51.5 238.4 -41.5 {text:[{"text":"Priesterin\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=58.5,y=237,z=-4.5,distance=..1.5,limit=1] add hub_npc_11
summon text_display 58.5 239.4 -4.5 {text:[{"text":"Auktionator\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=58.5,y=237,z=0.5,distance=..1.5,limit=1] add hub_npc_12
summon text_display 58.5 239.4 0.5 {text:[{"text":"Auktionator\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
tag @e[type=villager,x=58.5,y=237,z=5.5,distance=..1.5,limit=1] add hub_npc_13
summon text_display 58.5 239.4 5.5 {text:[{"text":"Auktionator\n","color":"green","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
setblock -50 234 11 minecraft:air
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
summon text_display 42.5 236.7 -18.5 {text:[{"text":"Regeln\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 42.5 235 -18.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_1"]}
execute unless block 45 237 -22 #minecraft:wall_signs run setblock 45 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 45 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 49 237 -22 #minecraft:wall_signs run setblock 49 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 51 237 -20 #minecraft:wall_signs run setblock 51 237 -20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 -20 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
summon text_display 39.5 236.7 -14.5 {text:[{"text":"Modpack\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 39.5 235 -14.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_2"]}
execute unless block 41 237 -18 #minecraft:wall_signs run setblock 41 237 -18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -18 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
execute unless block 41 237 -14 #minecraft:wall_signs run setblock 41 237 -14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -14 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
summon text_display 42.5 236.7 -10.5 {text:[{"text":"Voice Chat\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 42.5 235 -10.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_3"]}
execute unless block 43 237 -12 #minecraft:wall_signs run setblock 43 237 -12 minecraft:spruce_wall_sign[facing=south]
data merge block 43 237 -12 {is_waxed:1b,front_text:{messages:["","Voice Chat","",""]}}
execute unless block 45 237 -10 #minecraft:wall_signs run setblock 45 237 -10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 -10 {is_waxed:1b,front_text:{messages:["","Voice Chat","",""]}}
summon text_display 46.5 236.7 -6.5 {text:[{"text":"Questbuch\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 46.5 235 -6.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_4"]}
execute unless block 47 237 -8 #minecraft:wall_signs run setblock 47 237 -8 minecraft:spruce_wall_sign[facing=south]
data merge block 47 237 -8 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
execute unless block 48 237 -6 #minecraft:wall_signs run setblock 48 237 -6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 -6 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
execute unless block 49 237 -7 #minecraft:wall_signs run setblock 49 237 -7 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -7 {is_waxed:1b,front_text:{messages:["","Questbuch","",""]}}
summon text_display 46.5 236.7 7.5 {text:[{"text":"Termine\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 46.5 235 7.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_5"]}
execute unless block 47 237 8 #minecraft:wall_signs run setblock 47 237 8 minecraft:spruce_wall_sign[facing=north]
data merge block 47 237 8 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 48 237 6 #minecraft:wall_signs run setblock 48 237 6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 6 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 49 237 7 #minecraft:wall_signs run setblock 49 237 7 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 7 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
summon text_display 42.5 236.7 11.5 {text:[{"text":"Discord\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 42.5 235 11.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_6"]}
execute unless block 45 237 10 #minecraft:wall_signs run setblock 45 237 10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 10 {is_waxed:1b,front_text:{messages:["","Discord","",""]}}
execute unless block 43 237 12 #minecraft:wall_signs run setblock 43 237 12 minecraft:spruce_wall_sign[facing=north]
data merge block 43 237 12 {is_waxed:1b,front_text:{messages:["","Discord","",""]}}
summon text_display 39.5 236.7 15.5 {text:[{"text":"Statistik\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 39.5 235 15.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_7"]}
execute unless block 41 237 14 #minecraft:wall_signs run setblock 41 237 14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 14 {is_waxed:1b,front_text:{messages:["","Statistik","",""]}}
execute unless block 41 237 18 #minecraft:wall_signs run setblock 41 237 18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 18 {is_waxed:1b,front_text:{messages:["","Statistik","",""]}}
summon text_display 42.5 236.7 19.5 {text:[{"text":"Danke\n","color":"gold","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction 42.5 235 19.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_8"]}
execute unless block 45 237 22 #minecraft:wall_signs run setblock 45 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 45 237 22 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
execute unless block 49 237 22 #minecraft:wall_signs run setblock 49 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 22 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
execute unless block 51 237 20 #minecraft:wall_signs run setblock 51 237 20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 20 {is_waxed:1b,front_text:{messages:["","Danke","",""]}}
summon text_display -103.5 240.7 10.5 {text:[{"text":"Voice-Chat-Ecke\n","color":"light_purple","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction -103.5 239 10.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_voice"]}
function hub:schliessen
forceload remove -152 -152 88 88
say Hub eingerichtet: Bau, Kirschhain, Spawn 0/237/0, Weltgrenze, 13 Info-Dorfbewohner, 8 Stände, SMP gesperrt
