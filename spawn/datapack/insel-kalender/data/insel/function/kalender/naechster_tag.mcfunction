# Täglich 00:00 ab 01.12. (AMP-Aufgabe): nächstes Türchen freigeben
scoreboard players add #tag insel_kalender 1
execute if score #tag insel_kalender matches 25.. run scoreboard players set #tag insel_kalender 24
function insel:kalender/anzeigen
tellraw @a [{"text":"Winterkalender: ","color":"gold","bold":true},{"text":"Ein neues Türchen ist offen – am Spawn!","color":"white"}]
