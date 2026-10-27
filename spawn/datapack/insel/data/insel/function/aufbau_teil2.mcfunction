# Früher gesetzte Bauteile entfernen
fill -3 154 29 1 158 29 minecraft:air
fill 1 155 30 1 155 30 minecraft:air
fill -1 156 52 -1 156 52 minecraft:air
# Spawn-Bau als Struktur (untere Nordwest-Ecke -26/89/22)
gamerule random_tick_speed 0
place template spawn:spark_insel -26 89 22
# Rückweg-Plattform
function insel:plattform
# Unsichtbare Lichter im Oval (spawn/standort.mjs lichter)
function insel:lichter
# Infotafeln (Namensnennung des Erbauers)
function insel:tafeln
# Zusätzliche Bauteile
fill -1 156 47 -1 156 47 minecraft:ender_chest[facing=south]
fill -9 153 29 -9 153 29 minecraft:light[level=15] keep
fill -4 155 29 -4 155 29 minecraft:light[level=15] keep
fill 6 154 29 6 154 29 minecraft:light[level=15] keep
fill -4 155 34 -4 155 34 minecraft:light[level=15] keep
fill 1 155 34 1 155 34 minecraft:light[level=15] keep
fill 11 155 34 11 155 34 minecraft:light[level=15] keep
fill -19 154 39 -19 154 39 minecraft:light[level=15] keep
fill -14 155 39 -14 155 39 minecraft:light[level=15] keep
fill -4 155 39 -4 155 39 minecraft:light[level=15] keep
fill 1 155 39 1 155 39 minecraft:light[level=15] keep
fill 6 155 39 6 155 39 minecraft:light[level=15] keep
fill -19 155 44 -19 155 44 minecraft:light[level=15] keep
fill -9 155 44 -9 155 44 minecraft:light[level=15] keep
fill -4 155 44 -4 155 44 minecraft:light[level=15] keep
fill 1 156 44 1 156 44 minecraft:light[level=15] keep
fill 6 155 44 6 155 44 minecraft:light[level=15] keep
fill 11 155 44 11 155 44 minecraft:light[level=15] keep
fill 16 155 44 16 155 44 minecraft:light[level=15] keep
fill -19 155 49 -19 155 49 minecraft:light[level=15] keep
fill -14 155 49 -14 155 49 minecraft:light[level=15] keep
fill -9 155 49 -9 155 49 minecraft:light[level=15] keep
fill -4 156 49 -4 156 49 minecraft:light[level=15] keep
fill 1 156 49 1 156 49 minecraft:light[level=15] keep
fill 6 155 49 6 155 49 minecraft:light[level=15] keep
fill 11 155 49 11 155 49 minecraft:light[level=15] keep
fill 16 155 49 16 155 49 minecraft:light[level=15] keep
fill -19 154 54 -19 154 54 minecraft:light[level=15] keep
fill -14 155 54 -14 155 54 minecraft:light[level=15] keep
fill -4 155 54 -4 155 54 minecraft:light[level=15] keep
fill 1 155 54 1 155 54 minecraft:light[level=15] keep
fill 6 155 54 6 155 54 minecraft:light[level=15] keep
fill 11 155 54 11 155 54 minecraft:light[level=15] keep
fill -14 155 59 -14 155 59 minecraft:light[level=15] keep
fill -9 155 59 -9 155 59 minecraft:light[level=15] keep
fill -4 155 59 -4 155 59 minecraft:light[level=15] keep
fill 1 155 59 1 155 59 minecraft:light[level=15] keep
fill 6 155 59 6 155 59 minecraft:light[level=15] keep
fill 11 175 59 11 175 59 minecraft:light[level=15] keep
fill -9 166 64 -9 166 64 minecraft:light[level=15] keep
fill -4 155 64 -4 155 64 minecraft:light[level=15] keep
fill 1 155 64 1 155 64 minecraft:light[level=15] keep
fill 6 155 64 6 155 64 minecraft:light[level=15] keep
setworldspawn 0 156 48 0 0
gamerule respawn_radius 0
# Weltgrenze (Vorgenerierung mit Chunky macht die Server-Session)
worldborder center 0 48
worldborder set 10000
# In 5 s aufräumen und fertig melden
schedule function insel:aufbau_ende 100t
