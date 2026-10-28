function weihnachtsinsel:stufe_2/fertig
title @a times 10 70 20
title @a subtitle {"text":"Stufe 2 geschafft: Der Baum wächst","color":"white"}
title @a title {"text":"Weihnachtsinsel","color":"gold","bold":true}
playsound minecraft:block.bell.use master @a -1 2 -34 6 0.8
particle minecraft:firework -1 14 -34 10 10 10 0.05 400 force @a
particle minecraft:snowflake -1 8 -34 14 6 14 0.02 400 force @a
scoreboard players set #laeuft wi_mission 0
schedule function weihnachtsinsel:entladen 100t
