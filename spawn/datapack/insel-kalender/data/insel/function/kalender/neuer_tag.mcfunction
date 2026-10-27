execute if score #tag insel_kalender > #zuletzt insel_kalender if score #tag insel_kalender matches 1..24 run tellraw @a [{"text":"Winterkalender: ","color":"gold","bold":true},{"text":"Ein neues Türchen ist offen – am Spawn!","color":"white"}]
scoreboard players operation #zuletzt insel_kalender = #tag insel_kalender
function insel:kalender/anzeigen
