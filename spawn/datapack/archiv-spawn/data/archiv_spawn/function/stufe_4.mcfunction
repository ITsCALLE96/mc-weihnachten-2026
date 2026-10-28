# Testwelt: Weihnachtsinsel auf Stufe 4 (Heiligabend (fertig)) umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 4 wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_4_setzen 20t
