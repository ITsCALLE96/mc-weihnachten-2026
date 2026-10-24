# Ausgänge nacheinander öffnen, dann große Weltgrenze und Begrüßung
scoreboard players set #offen insel_zustand 1
bossbar remove insel:eroeffnung
schedule function insel:ausgang_0 1t
schedule function insel:ausgang_1 5t
schedule function insel:ausgang_2 9t
schedule function insel:ausgang_3 13t
schedule function insel:ausgang_4 17t
schedule function insel:ausgang_5 21t
schedule function insel:ausgang_6 25t
schedule function insel:ausgang_7 29t
schedule function insel:willkommen 52t
