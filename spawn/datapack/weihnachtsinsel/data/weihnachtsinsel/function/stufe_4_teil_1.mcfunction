# Bauabschnitt 1/10 der Stufe 4 „Heiligabend“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t4_1 wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches 3.. run return fail
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_4_teil_1/setzen 40t
