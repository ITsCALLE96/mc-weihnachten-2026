# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau), braucht lokal die Struktur spawn:fantasy_village.
# Lädt die Chunks und wartet, bis sie da sind. Erzeugt aus spawn/standort-fantasy-village-test.json mit spawn/standort.mjs.
forceload add -152 -152 88 88
schedule function insel:aufbau_pruefen 20t
