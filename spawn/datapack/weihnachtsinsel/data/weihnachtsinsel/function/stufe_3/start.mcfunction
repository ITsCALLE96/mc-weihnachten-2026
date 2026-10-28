title @a times 10 70 20
title @a subtitle {"text":"Stufe 3: Der Baum wird geschmückt","color":"white"}
title @a title {"text":"Weihnachtsinsel","color":"gold","bold":true}
playsound minecraft:block.bell.use master @a -1 154 -34 6 0.8
schedule function weihnachtsinsel:stufe_3/schritt_0 20t
schedule function weihnachtsinsel:stufe_3/schritt_1 60t
schedule function weihnachtsinsel:stufe_3/schritt_2 100t
schedule function weihnachtsinsel:stufe_3/schritt_3 140t
schedule function weihnachtsinsel:stufe_3/ende 200t
