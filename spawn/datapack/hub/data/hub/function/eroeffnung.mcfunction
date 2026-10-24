# Eröffnung auslösen (Konsole oder AMP-Aufgabe), läuft nur einmal (#offen = 1 heißt offen)
execute if score #offen insel_zustand matches 1 run say SMP ist schon offen – nichts zu tun
execute if score #offen insel_zustand matches 0 if score #countdown insel_zustand matches 0.. run say Eröffnung läuft schon
execute if score #offen insel_zustand matches 0 unless score #countdown insel_zustand matches 0.. run function hub:eroeffnung_start
