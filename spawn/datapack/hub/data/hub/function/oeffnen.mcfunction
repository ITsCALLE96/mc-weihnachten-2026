scoreboard players set #offen insel_zustand 1
bossbar remove hub:eroeffnung
title @a times 10 70 20
title @a subtitle {"text":"Rechtsklick auf die SMP-Kiste","color":"green"}
title @a title {"text":"Der SMP ist offen!","color":"gold","bold":true}
execute as @a at @s run playsound minecraft:ui.toast.challenge_complete master @s ~ ~ ~ 1 1
particle minecraft:firework 25.5 237.5 -8.5 0.6 0.8 0.6 0.05 120 force
particle minecraft:totem_of_undying 25.5 237.5 -8.5 0.6 0.8 0.6 0.4 80 force
