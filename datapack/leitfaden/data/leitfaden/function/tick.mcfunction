# Spätankömmlinge: Buch und alle bereits offenen Kapitel nachreichen
execute if score #phase lf_phase matches 1.. as @a unless score @s lf_buch matches 1 run function leitfaden:buch/geben
execute if score #phase lf_phase matches 1.. run advancement grant @a[advancements={leitfaden:kapitel1/start=false}] only leitfaden:kapitel1/start
execute if score #phase lf_phase matches 2.. run advancement grant @a[advancements={leitfaden:kapitel2/start=false}] only leitfaden:kapitel2/start
execute if score #phase lf_phase matches 4.. run advancement grant @a[advancements={leitfaden:kapitel3/start=false}] only leitfaden:kapitel3/start
