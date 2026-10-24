# Eröffnung auslösen (Konsole oder AMP-Aufgabe). Läuft nur einmal, solange der Spawn offen ist (#offen = 1).
execute if score #offen insel_zustand matches 1 run say Spawn ist schon offen – nichts zu tun
execute if score #offen insel_zustand matches 0 if score #countdown insel_zustand matches 0.. run say Eröffnung läuft schon
execute if score #offen insel_zustand matches 0 unless score #countdown insel_zustand matches 0.. run function insel:eroeffnung_start
