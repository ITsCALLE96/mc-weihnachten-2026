# Spendenkiste und Tafel am Brückenkopf auf der Spark-Insel (vor dem Missionsstart)
fill 2 155 31 2 157 31 minecraft:air
setblock 2 154 31 minecraft:spruce_planks
setblock 2 155 31 minecraft:chest[facing=south]
kill @e[type=text_display,tag=wi_tafel]
summon text_display -3.5 158.5 31.5 {Tags:["wi_tafel"],Rotation:[0f,0f],billboard:"fixed",alignment:"center",line_width:260,background:1140850688,text:[{"text":"Weihnachtsinsel\n","color":"gold","bold":true},{"text":"Spende an der Kiste – gemeinsam\nlassen wir die Insel entstehen!","color":"white"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1.2f,1.2f,1.2f]}}
