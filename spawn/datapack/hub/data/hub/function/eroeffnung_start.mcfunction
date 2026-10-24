bossbar add hub:eroeffnung {"text":"Der Weihnachtsserver öffnet …","color":"gold"}
bossbar set hub:eroeffnung max 10
bossbar set hub:eroeffnung color yellow
bossbar set hub:eroeffnung players @a
scoreboard players set #countdown insel_zustand 10
playsound minecraft:block.beacon.activate master @a ~ ~ ~ 1 0.8
function hub:eroeffnung_tick
