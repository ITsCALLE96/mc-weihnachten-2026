# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau), braucht lokal die Struktur spawn:ca12v2.
# Lädt die Chunks und wartet, bis sie da sind. Erzeugt aus spawn/standort-testserver.json mit spawn/standort.mjs.
forceload add 8 -24 136 72
schedule function insel:aufbau_pruefen 20t
