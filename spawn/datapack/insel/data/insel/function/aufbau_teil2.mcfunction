# Spawn-Bau als Struktur (untere Nordwest-Ecke 24/64/-9)
place template spawn:ca12v2 24 64 -9
# Rückweg-Plattform
function insel:plattform
# Unsichtbare Lichter im Oval (spawn/standort.mjs lichter)
function insel:lichter
setworldspawn 64 179 29 0 0
gamerule respawn_radius 0
# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)
worldborder center 64 37
worldborder set 10000
forceload remove 8 -24 136 72
say Spawn eingerichtet: Bau, Plattform, Lichter, Weltspawn 64/179/29, Weltgrenze (Nether/End per Konsole sperren)
