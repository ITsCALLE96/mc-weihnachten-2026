# Ausgänge nacheinander öffnen, dann große Weltgrenze und Begrüßung
scoreboard players set #offen insel_zustand 1
bossbar remove insel:eroeffnung
schedule function insel:willkommen 20t
