# Bauabschnitt 4/10 der Stufe 3 „Der Baum wird geschmückt“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t3_4 wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches 2.. run return fail
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_3_teil_4/setzen 40t
