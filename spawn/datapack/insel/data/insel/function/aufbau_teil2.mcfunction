# Insel v2 an der Originalposition (untere Nordwest-Ecke 24/64/-9)
place template spawn:ca12v2 24 64 -9
# Rückweg-Plattform unter der Inselmitte, direkt unter dem zweiten Kristall-Anhänger (von Pascal freigegeben)
function insel:plattform
# Unsichtbare Lichter unter der Insel (erzeugt mit tools/schem-licht.mjs aus der Testwelt mit gleichem Aufbau)
function insel:lichter
setworldspawn 64 179 29 0 0
gamerule respawn_radius 0
# Weltgrenze 10.000 × 10.000 um 64/37 (Vorgenerierung mit Chunky macht die Server-Session)
worldborder center 64 37
worldborder set 10000
forceload remove 8 -24 136 72
say Spawn-Insel eingerichtet: Insel, Plattform, Lichter, Weltspawn 64/179/29, Weltgrenze (Nether/End per Konsole sperren)
