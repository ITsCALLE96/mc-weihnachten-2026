execute if score #laeuft wi_mission matches 1 run function weihnachtsinsel:stufe_1/fertig
execute if score #laeuft wi_mission matches 2 run function weihnachtsinsel:stufe_2/fertig
execute if score #laeuft wi_mission matches 3 run function weihnachtsinsel:stufe_3/fertig
execute if score #laeuft wi_mission matches 4 run function weihnachtsinsel:stufe_4/fertig
scoreboard players set #laeuft wi_mission 0
forceload remove -24 -58 23 29
