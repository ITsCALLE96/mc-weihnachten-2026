# Jede Sekunde: Abenteuermodus (außer Kreativ/Zuschauer für OPs) und satt
gamemode adventure @a[gamemode=survival]
effect give @a[gamemode=adventure] minecraft:saturation infinite 0 true
# Adventsgeschenke freischalten, sobald ihr Tag erreicht ist (nur in geladenen Chunks, also wo Spieler sind)
execute as @e[tag=hub_advent_zu] if score @s hub_advent <= #tag hub_advent run function hub:advent/zeigen
# Leichte Partikel an den Klickpunkten (Stände, Voice-Ecke, Dorfbewohner)
execute at @e[type=text_display,tag=hub_hinweis] run particle minecraft:end_rod ~ ~-0.4 ~ 0.25 0.2 0.25 0.005 1 normal
schedule function hub:sekunde 20t replace
