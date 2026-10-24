# Nur Angebote, bei denen der Spieler mit Smaragden zahlt. Ankäufe (Händler zahlt Smaragde) bleiben unverändert
data modify entity @s Offers.Recipes[{buy:{id:"minecraft:emerald"}}].buy.count set value 1
data remove entity @s Offers.Recipes[{buy:{id:"minecraft:emerald"}}].buyB
# Preis steigt weder durch Nachfrage noch durch Rabatte/Ruf
data modify entity @s Offers.Recipes[].priceMultiplier set value 0.0f
data modify entity @s Offers.Recipes[].demand set value 0
data modify entity @s Offers.Recipes[].specialPrice set value 0
tag @s add wh_rabatt
tag @s add wh_neu
