# Kompletter Spawn-Aufbau in einer frischen Welt (Konsole: function insel:aufbau), NACH function aufschuettung:start („Aufschüttung fertig“).
# Braucht lokal das Datapack spawn-insel mit der Struktur spawn:ca12v2 (aus spawn/quellen, nicht im Repo). Lädt die Chunks und wartet, bis sie da sind.
forceload add 8 -24 136 72
schedule function insel:aufbau_pruefen 20t
