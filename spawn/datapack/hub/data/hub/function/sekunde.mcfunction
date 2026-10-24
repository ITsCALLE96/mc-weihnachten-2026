# Jede Sekunde: Abenteuermodus (außer Kreativ/Zuschauer für OPs) und satt
gamemode adventure @a[gamemode=survival]
effect give @a[gamemode=adventure] minecraft:saturation infinite 0 true
# Adventsgeschenke freischalten, sobald ihr Tag erreicht ist (nur in geladenen Chunks, also wo Spieler sind)
execute as @e[tag=hub_advent_zu] if score @s hub_advent <= #tag hub_advent run function hub:advent/zeigen
schedule function hub:sekunde 20t replace
