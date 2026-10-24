# Spieler hat einen Wanderhändler angesprochen. Erst jetzt erzeugt das Spiel dessen Angebote (auf dem Testserver geprüft),
# deshalb sofort rabattieren statt auf die 5-s-Schleife zu warten. Das offene Fenster zeigt noch die alten Preise.
advancement revoke @s only wh_rabatt:handel
execute as @e[type=minecraft:wandering_trader,tag=!wh_rabatt,distance=..8] if data entity @s Offers.Recipes[0] run function wh_rabatt:anwenden
execute if entity @e[type=minecraft:wandering_trader,tag=wh_neu,distance=..8] run tellraw @s {"text":"🎄 Weihnachtsrabatt: Handelsfenster einmal schließen und neu öffnen – dann kostet alles 1 Smaragd.","color":"green"}
tag @e[type=minecraft:wandering_trader,tag=wh_neu] remove wh_neu
