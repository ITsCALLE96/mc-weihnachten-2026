# Alle 5 s: neue Wanderhändler mit erzeugten Angeboten rabattieren
execute as @e[type=minecraft:wandering_trader,tag=!wh_rabatt] if data entity @s Offers.Recipes[0] run function wh_rabatt:anwenden
tag @e[type=minecraft:wandering_trader,tag=wh_neu] remove wh_neu
schedule function wh_rabatt:pruefen 5s replace
