# Zähler und Merker der Spawn-Technik
scoreboard objectives add insel_zustand dummy
execute unless score #offen insel_zustand matches 0.. run scoreboard players set #offen insel_zustand 0
