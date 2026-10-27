# Nach dem Tod: nur ohne eigenen Respawnpunkt zurück auf den Spawn
scoreboard players reset @s insel_tod
execute unless data entity @s respawn run tp @s 0.5 156 48.5 0 0
