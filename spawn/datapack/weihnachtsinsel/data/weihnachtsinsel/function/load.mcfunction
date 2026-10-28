scoreboard objectives add wi_mission dummy
scoreboard players set #fuenf wi_mission 5
execute unless score #stufe wi_mission matches 0.. run scoreboard players set #stufe wi_mission 0
execute if score #laeuft wi_mission matches 1.. run schedule function weihnachtsinsel:wiederaufnahme 100t
