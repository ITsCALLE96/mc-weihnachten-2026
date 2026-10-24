# Beim Setzen abgefallene Gegenstände entfernen (Blumen des Geländes, deren Boden der Bau ersetzt hat), dann Chunks freigeben
kill @e[type=item,x=-128,y=-64,z=-160,dx=224,dy=384,dz=240]
forceload remove -120 -152 88 72
say Spawn eingerichtet: Bau, Weltspawn -16/76/-33, Weltgrenze, geschlossen (Nether/End per Konsole sperren)
