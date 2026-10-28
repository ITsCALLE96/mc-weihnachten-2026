# Testwelt: Weihnachtsinsel auf „Heiligabend (fertig)“ umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Heiligabend (fertig) wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_4_setzen 20t
