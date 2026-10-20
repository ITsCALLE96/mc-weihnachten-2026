scoreboard objectives add lf_phase dummy
scoreboard objectives add lf_buch dummy
execute unless score #phase lf_phase matches 0.. run scoreboard players set #phase lf_phase 0
