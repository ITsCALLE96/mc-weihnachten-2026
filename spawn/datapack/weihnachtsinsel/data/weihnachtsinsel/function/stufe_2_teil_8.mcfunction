# Bauabschnitt 8/10 der Stufe 2 „Der Baum wächst“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t2_8 wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches 1.. run return fail
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_2_teil_8/setzen 40t
