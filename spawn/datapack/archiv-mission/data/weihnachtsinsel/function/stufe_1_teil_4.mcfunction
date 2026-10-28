# Bauabschnitt 4/10 der Stufe 1 „Die Insel taucht auf“ (serverwahl je 10 % Fortschritt). Doppelaufruf macht nichts.
execute if score #t1_4 wi_mission matches 1 run return fail
execute unless score #stufe wi_mission matches 0.. run return fail
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_1_teil_4/setzen 40t
