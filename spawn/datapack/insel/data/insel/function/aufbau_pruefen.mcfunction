# Erst weiter, wenn alle 16 Chunks wirklich geladen sind (frische Welt erzeugt sie erst), sonst in 1 s erneut
scoreboard objectives add insel_tp dummy
execute store success score #geladen insel_tp if loaded -24 67 24 if loaded -24 67 40 if loaded -24 67 56 if loaded -24 67 72 if loaded -8 67 24 if loaded -8 67 40 if loaded -8 67 56 if loaded -8 67 72 if loaded 8 67 24 if loaded 8 67 40 if loaded 8 67 56 if loaded 8 67 72 if loaded 24 67 24 if loaded 24 67 40 if loaded 24 67 56 if loaded 24 67 72
execute if score #geladen insel_tp matches 1 run function insel:aufbau_teil2
execute unless score #geladen insel_tp matches 1 run schedule function insel:aufbau_pruefen 20t
