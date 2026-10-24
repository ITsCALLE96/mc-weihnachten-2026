# Jede Sekunde: Bossbar füllen, letzte 3 Sekunden als Titel, bei 0 öffnen
execute store result bossbar insel:eroeffnung value run scoreboard players get #countdown insel_zustand
execute if score #countdown insel_zustand matches 1..3 run title @a title {"score":{"name":"#countdown","objective":"insel_zustand"},"color":"gold"}
execute if score #countdown insel_zustand matches 1..3 as @a at @s run playsound minecraft:block.note_block.bell master @s ~ ~ ~ 1 1
execute if score #countdown insel_zustand matches 0 run function insel:oeffnen
execute if score #countdown insel_zustand matches 1.. run schedule function insel:eroeffnung_tick 20t
scoreboard players remove #countdown insel_zustand 1
