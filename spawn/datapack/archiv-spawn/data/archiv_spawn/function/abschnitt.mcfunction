# Testwelt: nächsten Bauabschnitt der Server-Mission auslösen (Datapack archiv-mission = Mission, TIEF tiefer)
scoreboard objectives add wi_test dummy
execute unless score #pos wi_test matches 0.. run scoreboard players set #pos wi_test 0
execute if score #pos wi_test matches 44.. run return run tellraw @a[distance=..200] {"text":"Weihnachtsinsel ist fertig – „Leer“ setzt zurück","color":"gray"}
kill @e[tag=wi_archiv_titel]
scoreboard players add #pos wi_test 1
forceload add -24 -58 23 29
schedule function archiv_spawn:insel_entladen 300t
execute if score #pos wi_test matches 1 run function weihnachtsinsel:stufe_1_teil_1
execute if score #pos wi_test matches 2 run function weihnachtsinsel:stufe_1_teil_2
execute if score #pos wi_test matches 3 run function weihnachtsinsel:stufe_1_teil_3
execute if score #pos wi_test matches 4 run function weihnachtsinsel:stufe_1_teil_4
execute if score #pos wi_test matches 5 run function weihnachtsinsel:stufe_1_teil_5
execute if score #pos wi_test matches 6 run function weihnachtsinsel:stufe_1_teil_6
execute if score #pos wi_test matches 7 run function weihnachtsinsel:stufe_1_teil_7
execute if score #pos wi_test matches 8 run function weihnachtsinsel:stufe_1_teil_8
execute if score #pos wi_test matches 9 run function weihnachtsinsel:stufe_1_teil_9
execute if score #pos wi_test matches 10 run function weihnachtsinsel:stufe_1_teil_10
execute if score #pos wi_test matches 11 run function weihnachtsinsel:stufe_1
execute if score #pos wi_test matches 12 run function weihnachtsinsel:stufe_2_teil_1
execute if score #pos wi_test matches 13 run function weihnachtsinsel:stufe_2_teil_2
execute if score #pos wi_test matches 14 run function weihnachtsinsel:stufe_2_teil_3
execute if score #pos wi_test matches 15 run function weihnachtsinsel:stufe_2_teil_4
execute if score #pos wi_test matches 16 run function weihnachtsinsel:stufe_2_teil_5
execute if score #pos wi_test matches 17 run function weihnachtsinsel:stufe_2_teil_6
execute if score #pos wi_test matches 18 run function weihnachtsinsel:stufe_2_teil_7
execute if score #pos wi_test matches 19 run function weihnachtsinsel:stufe_2_teil_8
execute if score #pos wi_test matches 20 run function weihnachtsinsel:stufe_2_teil_9
execute if score #pos wi_test matches 21 run function weihnachtsinsel:stufe_2_teil_10
execute if score #pos wi_test matches 22 run function weihnachtsinsel:stufe_2
execute if score #pos wi_test matches 23 run function weihnachtsinsel:stufe_3_teil_1
execute if score #pos wi_test matches 24 run function weihnachtsinsel:stufe_3_teil_2
execute if score #pos wi_test matches 25 run function weihnachtsinsel:stufe_3_teil_3
execute if score #pos wi_test matches 26 run function weihnachtsinsel:stufe_3_teil_4
execute if score #pos wi_test matches 27 run function weihnachtsinsel:stufe_3_teil_5
execute if score #pos wi_test matches 28 run function weihnachtsinsel:stufe_3_teil_6
execute if score #pos wi_test matches 29 run function weihnachtsinsel:stufe_3_teil_7
execute if score #pos wi_test matches 30 run function weihnachtsinsel:stufe_3_teil_8
execute if score #pos wi_test matches 31 run function weihnachtsinsel:stufe_3_teil_9
execute if score #pos wi_test matches 32 run function weihnachtsinsel:stufe_3_teil_10
execute if score #pos wi_test matches 33 run function weihnachtsinsel:stufe_3
execute if score #pos wi_test matches 34 run function weihnachtsinsel:stufe_4_teil_1
execute if score #pos wi_test matches 35 run function weihnachtsinsel:stufe_4_teil_2
execute if score #pos wi_test matches 36 run function weihnachtsinsel:stufe_4_teil_3
execute if score #pos wi_test matches 37 run function weihnachtsinsel:stufe_4_teil_4
execute if score #pos wi_test matches 38 run function weihnachtsinsel:stufe_4_teil_5
execute if score #pos wi_test matches 39 run function weihnachtsinsel:stufe_4_teil_6
execute if score #pos wi_test matches 40 run function weihnachtsinsel:stufe_4_teil_7
execute if score #pos wi_test matches 41 run function weihnachtsinsel:stufe_4_teil_8
execute if score #pos wi_test matches 42 run function weihnachtsinsel:stufe_4_teil_9
execute if score #pos wi_test matches 43 run function weihnachtsinsel:stufe_4_teil_10
execute if score #pos wi_test matches 44 run function weihnachtsinsel:stufe_4
execute if score #pos wi_test matches 1 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 1/10 (1/44)","color":"gold"}
execute if score #pos wi_test matches 2 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 2/10 (2/44)","color":"gold"}
execute if score #pos wi_test matches 3 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 3/10 (3/44)","color":"gold"}
execute if score #pos wi_test matches 4 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 4/10 (4/44)","color":"gold"}
execute if score #pos wi_test matches 5 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 5/10 (5/44)","color":"gold"}
execute if score #pos wi_test matches 6 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 6/10 (6/44)","color":"gold"}
execute if score #pos wi_test matches 7 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 7/10 (7/44)","color":"gold"}
execute if score #pos wi_test matches 8 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 8/10 (8/44)","color":"gold"}
execute if score #pos wi_test matches 9 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 9/10 (9/44)","color":"gold"}
execute if score #pos wi_test matches 10 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1, Abschnitt 10/10 (10/44)","color":"gold"}
execute if score #pos wi_test matches 11 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1 abgeschlossen (11/44)","color":"gold"}
execute if score #pos wi_test matches 12 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 1/10 (12/44)","color":"gold"}
execute if score #pos wi_test matches 13 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 2/10 (13/44)","color":"gold"}
execute if score #pos wi_test matches 14 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 3/10 (14/44)","color":"gold"}
execute if score #pos wi_test matches 15 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 4/10 (15/44)","color":"gold"}
execute if score #pos wi_test matches 16 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 5/10 (16/44)","color":"gold"}
execute if score #pos wi_test matches 17 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 6/10 (17/44)","color":"gold"}
execute if score #pos wi_test matches 18 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 7/10 (18/44)","color":"gold"}
execute if score #pos wi_test matches 19 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 8/10 (19/44)","color":"gold"}
execute if score #pos wi_test matches 20 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 9/10 (20/44)","color":"gold"}
execute if score #pos wi_test matches 21 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2, Abschnitt 10/10 (21/44)","color":"gold"}
execute if score #pos wi_test matches 22 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 2 abgeschlossen (22/44)","color":"gold"}
execute if score #pos wi_test matches 23 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 1/10 (23/44)","color":"gold"}
execute if score #pos wi_test matches 24 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 2/10 (24/44)","color":"gold"}
execute if score #pos wi_test matches 25 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 3/10 (25/44)","color":"gold"}
execute if score #pos wi_test matches 26 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 4/10 (26/44)","color":"gold"}
execute if score #pos wi_test matches 27 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 5/10 (27/44)","color":"gold"}
execute if score #pos wi_test matches 28 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 6/10 (28/44)","color":"gold"}
execute if score #pos wi_test matches 29 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 7/10 (29/44)","color":"gold"}
execute if score #pos wi_test matches 30 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 8/10 (30/44)","color":"gold"}
execute if score #pos wi_test matches 31 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 9/10 (31/44)","color":"gold"}
execute if score #pos wi_test matches 32 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3, Abschnitt 10/10 (32/44)","color":"gold"}
execute if score #pos wi_test matches 33 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 3 abgeschlossen (33/44)","color":"gold"}
execute if score #pos wi_test matches 34 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 1/10 (34/44)","color":"gold"}
execute if score #pos wi_test matches 35 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 2/10 (35/44)","color":"gold"}
execute if score #pos wi_test matches 36 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 3/10 (36/44)","color":"gold"}
execute if score #pos wi_test matches 37 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 4/10 (37/44)","color":"gold"}
execute if score #pos wi_test matches 38 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 5/10 (38/44)","color":"gold"}
execute if score #pos wi_test matches 39 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 6/10 (39/44)","color":"gold"}
execute if score #pos wi_test matches 40 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 7/10 (40/44)","color":"gold"}
execute if score #pos wi_test matches 41 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 8/10 (41/44)","color":"gold"}
execute if score #pos wi_test matches 42 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 9/10 (42/44)","color":"gold"}
execute if score #pos wi_test matches 43 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4, Abschnitt 10/10 (43/44)","color":"gold"}
execute if score #pos wi_test matches 44 run tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4 abgeschlossen (44/44)","color":"gold"}
execute as @e[type=text_display,tag=wi_schalter_text] run data merge entity @s {background:1073741824}
