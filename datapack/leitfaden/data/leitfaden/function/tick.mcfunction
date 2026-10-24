# Nur Spieler, deren Stand nicht zur Phase passt (Neuling, Phasenwechsel, Serverstart). Sonst passiert hier nichts.
execute as @a unless score @s lf_stand = #phase lf_phase run function leitfaden:questbuch/aktualisieren
