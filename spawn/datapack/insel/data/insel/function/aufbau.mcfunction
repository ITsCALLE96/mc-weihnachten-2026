# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau), braucht lokal die Struktur spawn:weltenbaum.
# Lädt die Chunks und wartet, bis sie da sind. Erzeugt aus spawn/standort-weltenbaum-test.json mit spawn/standort.mjs.
forceload add -120 -152 88 72
schedule function insel:aufbau_pruefen 20t
