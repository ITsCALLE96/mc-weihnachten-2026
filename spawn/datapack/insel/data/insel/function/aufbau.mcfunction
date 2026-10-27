# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau), braucht lokal die Struktur spawn:spark_insel.
# Lädt die Chunks und wartet, bis sie da sind. Erzeugt aus spawn/standort-smp-spark.json mit spawn/standort.mjs.
forceload add -24 24 24 72
schedule function insel:aufbau_pruefen 20t
