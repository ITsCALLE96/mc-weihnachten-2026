# Stufe 1 „Die Insel taucht auf“ (ruft serverwahl auf, sobald die Wunschliste voll ist). Ein zweiter Aufruf macht nichts.
execute if score #stufe wi_mission matches 1.. run return fail
execute unless score #stufe wi_mission matches 0.. run return fail
scoreboard players set #stufe wi_mission 1
scoreboard players set #laeuft wi_mission 1
forceload add -24 -58 23 29
schedule function weihnachtsinsel:stufe_1/start 40t
