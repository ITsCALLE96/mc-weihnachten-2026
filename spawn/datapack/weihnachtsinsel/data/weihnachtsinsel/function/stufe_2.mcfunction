# Stufe 2 „Der Baum wächst“ (ruft serverwahl auf, sobald die Wunschliste voll ist). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches 2.. run return fail
execute unless score #stufe wi_mission matches 1.. run return fail
scoreboard players set #stufe wi_mission 2
scoreboard players set #laeuft wi_mission 2
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_2/start 40t
