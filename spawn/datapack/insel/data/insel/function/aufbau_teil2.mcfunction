# Spawn-Bau als Struktur (untere Nordwest-Ecke -126/63/-150)
place template spawn:weltenbaum -126 63 -150
# Pilzland-Biom (keine Monster) über die ganze Höhe
function insel:pilzland
setworldspawn -16 76 -33 180 0
gamerule respawn_radius 0
# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)
worldborder center -16 -40
worldborder set 10000
# Vor dem Start geschlossen (Eröffnungs-Event)
function insel:schliessen
forceload remove -120 -152 88 72
say Spawn eingerichtet: Bau, Weltspawn -16/76/-33, Weltgrenze, geschlossen (Nether/End per Konsole sperren)
