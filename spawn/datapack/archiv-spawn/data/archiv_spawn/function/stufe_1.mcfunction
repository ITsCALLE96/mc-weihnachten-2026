# Testwelt: Weihnachtsinsel auf „Die Insel taucht auf“ umschalten
forceload add -24 -58 23 29
tellraw @a[distance=..200] {"text":"Weihnachtsinsel: Die Insel taucht auf wird gebaut …","color":"gray"}
schedule function archiv_spawn:stufe_1_setzen 20t
