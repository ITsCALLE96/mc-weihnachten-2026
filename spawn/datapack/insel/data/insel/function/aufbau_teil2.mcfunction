# Plattform am Strand unter der Insel: schlicht zum Testen, Aussehen entscheidet Pascal.
fill 72 62 20 76 62 24 minecraft:polished_andesite
setblock 74 62 22 minecraft:sea_lantern
# Unsichtbare Lichter unter der Insel (erzeugt mit tools/schem-licht.mjs aus der Testwelt, gleicher Seed)
function insel:lichter
setworldspawn 60 179 22 0 0
gamerule respawn_radius 0
forceload remove 8 -24 136 72
say Spawn-Insel eingerichtet: Plattform, Lichter, Weltspawn 60/179/22
