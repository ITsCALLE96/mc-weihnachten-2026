bossbar add insel:eroeffnung {"text":"Das Dorf öffnet sich …","color":"light_purple"}
bossbar set insel:eroeffnung max 10
bossbar set insel:eroeffnung color purple
bossbar set insel:eroeffnung players @a
scoreboard players set #countdown insel_zustand 10
playsound minecraft:block.beacon.activate master @a ~ ~ ~ 1 0.8
function insel:eroeffnung_tick
