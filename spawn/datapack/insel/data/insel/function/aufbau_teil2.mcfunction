# Spawn-Bau als Struktur (untere Nordwest-Ecke -150/80/-158)
gamerule random_tick_speed 0
place template spawn:fantasy_village_0_0 -150 80 -158
place template spawn:fantasy_village_1_0 -86 80 -158
place template spawn:fantasy_village_2_0 -22 80 -158
place template spawn:fantasy_village_3_0 42 80 -158
place template spawn:fantasy_village_0_1 -150 80 -94
place template spawn:fantasy_village_1_1 -86 80 -94
place template spawn:fantasy_village_2_1 -22 80 -94
place template spawn:fantasy_village_3_1 42 80 -94
place template spawn:fantasy_village_0_2 -150 80 -30
place template spawn:fantasy_village_1_2 -86 80 -30
place template spawn:fantasy_village_2_2 -22 80 -30
place template spawn:fantasy_village_3_2 42 80 -30
place template spawn:fantasy_village_0_3 -150 80 34
place template spawn:fantasy_village_1_3 -86 80 34
place template spawn:fantasy_village_2_3 -22 80 34
place template spawn:fantasy_village_3_3 42 80 34
# Pilzland-Biom (keine Monster) über die ganze Höhe
function insel:pilzland
# Infotafeln (Namensnennung des Erbauers)
function insel:tafeln
setworldspawn 0 235 16 180 0
gamerule respawn_radius 0
# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)
worldborder center 0 0
worldborder set 10000
# Vor dem Start geschlossen (Eröffnungs-Event)
function insel:schliessen
# In 5 s aufräumen und fertig melden
schedule function insel:aufbau_ende 100t
