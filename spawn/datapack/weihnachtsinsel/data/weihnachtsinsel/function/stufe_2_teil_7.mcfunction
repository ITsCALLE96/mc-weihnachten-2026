# Bauabschnitt 7/10 der Stufe 2 „Der Baum wächst“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t2_7 wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches 1.. run return fail
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_2_teil_7/setzen 40t
