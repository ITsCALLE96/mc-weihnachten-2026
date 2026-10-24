# Zustand und Zähler des Hubs
scoreboard objectives add insel_zustand dummy
execute unless score #offen insel_zustand matches 0.. run scoreboard players set #offen insel_zustand 0
scoreboard objectives add hub_weg minecraft.custom:minecraft.leave_game
scoreboard objectives add hub_advent dummy
execute unless score #tag hub_advent matches 0.. run scoreboard players set #tag hub_advent 0
scoreboard objectives add hub_funde dummy
schedule function hub:sekunde 20t replace
