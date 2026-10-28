# Testwelt: Weihnachtsinsel auf Stufe 1 (Die Insel taucht auf) umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Stufe 1 wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_1_setzen 20t
