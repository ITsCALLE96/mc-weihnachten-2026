# Testwelt: Weihnachtsinsel auf „Leer (vor der Mission)“ umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Leer (vor der Mission) wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_0_setzen 20t
