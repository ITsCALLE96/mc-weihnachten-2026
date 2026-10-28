# Stufe 4 „Heiligabend“ (ruft serverwahl auf, sobald die Wunschliste voll ist). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches 4.. run return fail
execute unless score #stufe wi_mission matches 3.. run return fail
scoreboard players set #stufe wi_mission 4
scoreboard players set #laeuft wi_mission 4
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_4/start 40t
