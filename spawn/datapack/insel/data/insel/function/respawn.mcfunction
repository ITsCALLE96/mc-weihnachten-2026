# Nach dem Tod: nur ohne eigenen Respawnpunkt zurück auf den Spawn
scoreboard players reset @s insel_tod
execute unless data entity @s respawn run tp @s -15.5 76 -32.5 180 0
