# Abschluss der Stufe 3 „Der Baum wird geschmückt“ (serverwahl nach 100 %, nach den Abschnitten). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches 3.. run return fail
execute unless score #stufe wi_mission matches 2.. run return fail
scoreboard players set #stufe wi_mission 3
scoreboard players set #laeuft wi_mission 3
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_3/abschluss 40t
