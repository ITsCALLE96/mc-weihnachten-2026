# Chunks wieder freigeben, wenn nichts mehr läuft
execute if score #laeuft wi_mission matches 1.. run return fail
execute if score #feuer wi_mission matches 1..239 run return fail
forceload remove -24 -58 23 29
