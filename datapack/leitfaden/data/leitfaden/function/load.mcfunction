scoreboard objectives add lf_phase dummy
scoreboard objectives add lf_stand dummy
execute unless score #phase lf_phase matches 0.. run scoreboard players set #phase lf_phase 0
# Nach Serverstart oder /reload alle Spieler einmal abgleichen (neue Quests, Vanilla-Stand)
scoreboard players reset * lf_stand
# Altes Leitfaden-Buch gibt es nicht mehr
scoreboard objectives remove lf_buch
