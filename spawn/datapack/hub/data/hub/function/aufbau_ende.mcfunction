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
kill @e[tag=hub_stand]
kill @e[tag=hub,tag=!hub_stand,type=!player,x=42.5,y=236,z=-18.5,distance=..2.5]
summon villager 42.5 235 -18.5 {Tags:["hub","hub_stand","hub_stand_1"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[64f,0f],CustomName:{"text":"Ratsherrin Holla","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:cleric",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_weihnachtsmuetze"}}},drop_chances:{head:0f}}
summon text_display 42.5 238.05 -18.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Regeln\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 48.83 239.6 -20.83 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"⚖ Regeln","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 45 237 -22 #minecraft:wall_signs run setblock 45 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 45 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 49 237 -22 #minecraft:wall_signs run setblock 49 237 -22 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -22 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
execute unless block 51 237 -20 #minecraft:wall_signs run setblock 51 237 -20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 -20 {is_waxed:1b,front_text:{messages:["","Regeln","",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=39.5,y=236,z=-14.5,distance=..2.5]
summon villager 39.5 235 -14.5 {Tags:["hub","hub_stand","hub_stand_2"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[45f,0f],CustomName:{"text":"Tüftler Tobi","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:toolsmith",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_strickmuetze"}}},drop_chances:{head:0f}}
summon text_display 39.5 238.05 -14.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Modpack\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 41.5 239.6 -15.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"⚙ Modpack","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 41 237 -18 #minecraft:wall_signs run setblock 41 237 -18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -18 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
execute unless block 41 237 -14 #minecraft:wall_signs run setblock 41 237 -14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 -14 {is_waxed:1b,front_text:{messages:["","Modpack","",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=42.5,y=236,z=-10.5,distance=..2.5]
summon villager 42.5 235 -10.5 {Tags:["hub","hub_stand","hub_stand_3"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[72f,0f],CustomName:{"text":"Glöckner Gustav","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:shepherd",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_ohrenschuetzer"}}},drop_chances:{head:0f}}
summon text_display 42.5 238.05 -10.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Voice-Chat\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 44.5 239.6 -10.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"♪ Voice-Chat","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 43 237 -12 #minecraft:wall_signs run setblock 43 237 -12 minecraft:spruce_wall_sign[facing=south]
data merge block 43 237 -12 {is_waxed:1b,front_text:{messages:["","Voice-Chat","",""]}}
execute unless block 45 237 -10 #minecraft:wall_signs run setblock 45 237 -10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 -10 {is_waxed:1b,front_text:{messages:["","Voice-Chat","",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=46.5,y=236,z=-6.5,distance=..2.5]
summon villager 46.5 235 -6.5 {Tags:["hub","hub_stand","hub_stand_4"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[72f,0f],CustomName:{"text":"Bibliothekarin Liesel","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:librarian",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_lichterkrone"}}},drop_chances:{head:0f}}
summon text_display 46.5 238.05 -6.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Questbuch & Leitfaden\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 48.5 239.6 -6.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"✎ Questbuch & Leitfaden","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 47 237 -8 #minecraft:wall_signs run setblock 47 237 -8 minecraft:spruce_wall_sign[facing=south]
data merge block 47 237 -8 {is_waxed:1b,front_text:{messages:["","Questbuch &","Leitfaden",""]}}
execute unless block 48 237 -6 #minecraft:wall_signs run setblock 48 237 -6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 -6 {is_waxed:1b,front_text:{messages:["","Questbuch &","Leitfaden",""]}}
execute unless block 49 237 -7 #minecraft:wall_signs run setblock 49 237 -7 minecraft:spruce_wall_sign[facing=north]
data merge block 49 237 -7 {is_waxed:1b,front_text:{messages:["","Questbuch &","Leitfaden",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=46.5,y=236,z=7.5,distance=..2.5]
summon villager 46.5 235 7.5 {Tags:["hub","hub_stand","hub_stand_5"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[72f,0f],CustomName:{"text":"Kartograf Kasimir","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:cartographer",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_rentiergeweih"}}},drop_chances:{head:0f}}
summon text_display 46.5 238.05 7.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Termine\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 48.5 239.6 7.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"⌛ Termine","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 47 237 8 #minecraft:wall_signs run setblock 47 237 8 minecraft:spruce_wall_sign[facing=north]
data merge block 47 237 8 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 48 237 6 #minecraft:wall_signs run setblock 48 237 6 minecraft:spruce_wall_sign[facing=west]
data merge block 48 237 6 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
execute unless block 49 237 7 #minecraft:wall_signs run setblock 49 237 7 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 7 {is_waxed:1b,front_text:{messages:["","Termine","",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=42.5,y=236,z=11.5,distance=..2.5]
summon villager 42.5 235 11.5 {Tags:["hub","hub_stand","hub_stand_6"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[72f,0f],CustomName:{"text":"Postbotin Paula","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:fletcher",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_strickmuetze"}}},drop_chances:{head:0f}}
summon text_display 42.5 238.05 11.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Discord & Anmeldung\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 44.5 239.6 11.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"✉ Discord & Anmeldung","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 45 237 10 #minecraft:wall_signs run setblock 45 237 10 minecraft:spruce_wall_sign[facing=west]
data merge block 45 237 10 {is_waxed:1b,front_text:{messages:["","Discord &","Anmeldung",""]}}
execute unless block 43 237 12 #minecraft:wall_signs run setblock 43 237 12 minecraft:spruce_wall_sign[facing=north]
data merge block 43 237 12 {is_waxed:1b,front_text:{messages:["","Discord &","Anmeldung",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=39.5,y=236,z=15.5,distance=..2.5]
summon villager 39.5 235 15.5 {Tags:["hub","hub_stand","hub_stand_7"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[108f,0f],CustomName:{"text":"Wegweiser Willi","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:mason",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_ohrenschuetzer"}}},drop_chances:{head:0f}}
summon text_display 39.5 238.05 15.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Bedrock & Hilfe\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 41.5 239.6 16.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"⚑ Bedrock & Hilfe","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 41 237 14 #minecraft:wall_signs run setblock 41 237 14 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 14 {is_waxed:1b,front_text:{messages:["","Bedrock & Hilfe","",""]}}
execute unless block 41 237 18 #minecraft:wall_signs run setblock 41 237 18 minecraft:spruce_wall_sign[facing=west]
data merge block 41 237 18 {is_waxed:1b,front_text:{messages:["","Bedrock & Hilfe","",""]}}
kill @e[tag=hub,tag=!hub_stand,type=!player,x=42.5,y=236,z=19.5,distance=..2.5]
summon villager 42.5 235 19.5 {Tags:["hub","hub_stand","hub_stand_8"],NoAI:1b,Invulnerable:1b,PersistenceRequired:1b,Silent:1b,Rotation:[107f,0f],CustomName:{"text":"Plätzchenbäckerin Frieda","color":"gold"},CustomNameVisible:1b,VillagerData:{type:"minecraft:snow",profession:"minecraft:farmer",level:5},Offers:{Recipes:[]},equipment:{head:{id:"minecraft:paper",count:1,components:{"minecraft:item_model":"weihnachten:dorf_weihnachtsmuetze"}}},drop_chances:{head:0f}}
summon text_display 42.5 238.05 19.5 {Tags:["hub","hub_stand","hub_hinweis"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Winterkalender & Weihnachtsinsel\n","color":"yellow","bold":true},{"text":"Rechtsklick","color":"gray"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display 48.83 239.6 21.83 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"❄ Winterkalender & Weihnachtsinsel","color":"gold","bold":true}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.6f,1.6f,1.6f]}}
execute unless block 45 237 22 #minecraft:wall_signs run setblock 45 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 45 237 22 {is_waxed:1b,front_text:{messages:["","Winterkalender","&","Weihnachtsinsel"]}}
execute unless block 49 237 22 #minecraft:wall_signs run setblock 49 237 22 minecraft:spruce_wall_sign[facing=south]
data merge block 49 237 22 {is_waxed:1b,front_text:{messages:["","Winterkalender","&","Weihnachtsinsel"]}}
execute unless block 51 237 20 #minecraft:wall_signs run setblock 51 237 20 minecraft:spruce_wall_sign[facing=east]
data merge block 51 237 20 {is_waxed:1b,front_text:{messages:["","Winterkalender","&","Weihnachtsinsel"]}}
summon text_display 0.5 241 0.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Statistik\n","color":"gold","bold":true},{"text":"Spielzeit, Bestenlisten und mehr auf der Statistikseite – Link folgt","color":"white"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.9f,0.9f,0.9f]}}
summon text_display -2.5 237.3 15.5 {Tags:["hub","hub_stand"],billboard:"center",alignment:"center",line_width:240,background:1073741824,text:[{"text":"Danke!\n","color":"gold","bold":true},{"text":"„Fantasy Village“ von LavaBuilds (BuiltByBit) · Danke an alle Mod-Autoren und an euch fürs Mitspielen","color":"white"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.9f,0.9f,0.9f]}}
summon text_display -103.5 240.7 10.5 {text:[{"text":"Voice-Chat-Ecke\n","color":"light_purple","bold":true},{"text":"Rechtsklick","color":"gray"}],billboard:"center",alignment:"center",line_width:200,background:1073741824,Tags:["hub","hub_hinweis"]}
summon interaction -103.5 239 10.5 {width:1.2f,height:2f,response:1b,Tags:["hub","hub_klick","hub_f_stand_voice"]}
function hub:schliessen
forceload remove -152 -152 88 88
say Hub eingerichtet: Bau, Kirschhain, Spawn 0/237/0, Weltgrenze, 13 Info-Dorfbewohner, 8 Stände, SMP gesperrt
