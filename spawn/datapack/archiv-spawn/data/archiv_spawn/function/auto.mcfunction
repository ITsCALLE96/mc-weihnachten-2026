# Automatik an/aus: alle 2 s ein Abschnitt
scoreboard objectives add wi_test dummy
execute if score #auto wi_test matches 1 run return run function archiv_spawn:auto_aus
scoreboard players set #auto wi_test 1
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Automatik an (alle 2 s ein Abschnitt)","color":"gold"}
function archiv_spawn:auto_takt
