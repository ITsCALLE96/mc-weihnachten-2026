# Beim Setzen abgefallene Gegenstände entfernen (Blumen des Geländes, deren Boden der Bau ersetzt hat), dann Chunks freigeben
kill @e[type=item,x=-160,y=-64,z=-160,dx=256,dy=384,dz=256]
forceload remove -152 -152 88 88
gamerule random_tick_speed 3
say Spawn eingerichtet: Bau, Weltspawn 0/235/16, Weltgrenze, geschlossen (Nether/End per Konsole sperren)
