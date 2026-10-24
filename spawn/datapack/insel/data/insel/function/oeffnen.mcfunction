# Ausgänge nacheinander öffnen, dann große Weltgrenze und Begrüßung
scoreboard players set #offen insel_zustand 1
bossbar remove insel:eroeffnung
schedule function insel:ausgang_0 1t
schedule function insel:ausgang_1 16t
schedule function insel:ausgang_2 31t
schedule function insel:ausgang_3 46t
schedule function insel:willkommen 80t
