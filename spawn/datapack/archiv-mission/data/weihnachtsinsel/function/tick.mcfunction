scoreboard players add #takt wi_mission 1
execute if score #takt wi_mission matches 60.. run scoreboard players set #takt wi_mission 0
execute if score #takt wi_mission matches 0 as @e[type=block_display,tag=wi_kerze,tag=!wi_oben] at @s run tp @s ~ ~0.2 ~
execute if score #takt wi_mission matches 0 run tag @e[type=block_display,tag=wi_kerze] add wi_oben
execute if score #takt wi_mission matches 30 as @e[type=block_display,tag=wi_kerze,tag=wi_oben] at @s run tp @s ~ ~-0.2 ~
execute if score #takt wi_mission matches 30 run tag @e[type=block_display,tag=wi_kerze] remove wi_oben
execute if score #stufe wi_mission matches 4.. if score #takt wi_mission matches 0..59 run scoreboard players operation #m wi_mission = #takt wi_mission
execute if score #stufe wi_mission matches 4.. run scoreboard players operation #m wi_mission %= #fuenf wi_mission
execute if score #stufe wi_mission matches 4.. if score #m wi_mission matches 0 as @e[type=block_display,tag=wi_kerze] at @s run particle minecraft:small_flame ~ ~0.72 ~ 0 0 0 0 1 normal
