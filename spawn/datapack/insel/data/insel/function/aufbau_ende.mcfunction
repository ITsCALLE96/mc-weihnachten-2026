# Beim Setzen abgefallene Gegenstände entfernen (Blumen des Geländes, deren Boden der Bau ersetzt hat), dann Chunks freigeben
kill @e[type=item,x=-32,y=-64,z=16,dx=64,dy=384,dz=64]
forceload remove -24 24 24 72
gamerule random_tick_speed 3
say Spawn eingerichtet: Bau, Plattform, Lichter, Weltspawn 0/156/48, Weltgrenze (Nether/End per Konsole sperren)
