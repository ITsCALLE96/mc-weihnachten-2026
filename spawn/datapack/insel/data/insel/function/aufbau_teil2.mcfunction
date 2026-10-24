# Rückweg-Plattform unter der Inselmitte, direkt unter dem zweiten Kristall-Anhänger (Entwurf im Stil der Insel)
function insel:plattform
# Unsichtbare Lichter unter der Insel (erzeugt mit tools/schem-licht.mjs aus der Testwelt, gleicher Seed)
function insel:lichter
setworldspawn 64 179 29 0 0
gamerule respawn_radius 0
forceload remove 8 -24 136 72
say Spawn-Insel eingerichtet: Plattform, Lichter, Weltspawn 64/179/29
