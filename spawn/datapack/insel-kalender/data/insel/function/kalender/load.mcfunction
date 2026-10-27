scoreboard objectives add insel_kalender dummy
execute unless score #tag insel_kalender matches 0.. run scoreboard players set #tag insel_kalender 0
execute unless score #zuletzt insel_kalender matches 0.. run scoreboard players operation #zuletzt insel_kalender = #tag insel_kalender
