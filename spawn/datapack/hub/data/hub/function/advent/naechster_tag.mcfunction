# Täglich um 00:00 ab 01.12. (AMP-Aufgabe): nächstes Geschenk freischalten
scoreboard players add #tag hub_advent 1
execute if score #tag hub_advent matches 25.. run scoreboard players set #tag hub_advent 24
tellraw @a [{"text":"Adventskalender: ","color":"red","bold":true},{"text":"Ein neues Geschenk ist auf der Insel versteckt!","color":"white"}]
